import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTL_DAYS = 30;
const DEFAULT_GRACE_SECONDS = 10;
/** How long a spent (rotated/revoked) row is kept so reuse detection still fires. */
const RETENTION_MS = 30 * DAY_MS;

type FamilyRef = { familyId: string; userId: string };

/**
 * Refresh-token rotation with reuse detection.
 *
 * Only hashes are stored. Every login starts a token *family*; each refresh
 * rotates the current token and adds a row to the same family. Presenting a
 * token that was already rotated (past the grace window) or revoked means the
 * family is compromised — the whole family is revoked and the user's
 * `tokenVersion` is bumped, which also invalidates every outstanding access
 * token.
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get ttlMs(): number {
    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? DEFAULT_TTL_DAYS);
    return days * DAY_MS;
  }

  private get graceMs(): number {
    const seconds = Number(
      process.env.REFRESH_TOKEN_GRACE_SECONDS ?? DEFAULT_GRACE_SECONDS,
    );
    return seconds * 1000;
  }

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private newRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /** Start a fresh token family for a new login. Returns the raw token. */
  async issue(userId: string): Promise<string> {
    const raw = this.newRawToken();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(raw),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
    });

    return raw;
  }

  /**
   * Verify `rawToken` and rotate it. Returns the owning `userId` and the new
   * raw token. Throws `UnauthorizedException` for unknown / expired / reused
   * tokens; a reused token additionally revokes its family and bumps
   * `tokenVersion`.
   */
  async rotate(rawToken: string): Promise<{ userId: string; raw: string }> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });

    if (!current) {
      throw new UnauthorizedException();
    }

    const now = Date.now();

    if (current.revokedAt) {
      await this.compromiseFamily(current);
      throw new UnauthorizedException();
    }

    if (current.expiresAt.getTime() < now) {
      throw new UnauthorizedException();
    }

    if (current.rotatedAt && now - current.rotatedAt.getTime() > this.graceMs) {
      await this.compromiseFamily(current);
      throw new UnauthorizedException();
    }

    const raw = this.newRawToken();

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: current.id },
        // keep the original rotation time so grace is measured from the first
        // concurrent refresh, not extended by each one
        data: { rotatedAt: current.rotatedAt ?? new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: current.userId,
          tokenHash: this.hash(raw),
          familyId: current.familyId,
          expiresAt: new Date(now + this.ttlMs),
        },
      }),
    ]);

    void this.gc();

    return { userId: current.userId, raw };
  }

  /** Sign out everywhere — revoke every live token for the user. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async compromiseFamily(token: FamilyRef): Promise<void> {
    this.logger.warn(
      `Refresh-token reuse detected for user ${token.userId}; revoking family ${token.familyId}`,
    );

    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { familyId: token.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: token.userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
  }

  private async gc(): Promise<void> {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date(Date.now() - RETENTION_MS) } },
      });
    } catch (error) {
      this.logger.warn(`Refresh-token GC failed: ${String(error)}`);
    }
  }
}
