import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { resetDb, testPrisma } from '../../../test/db';
import { makeUser } from '../../../test/factories';
import { RefreshTokenService } from './refresh-token.service';

// Runs against the real test database: the point of this service is the
// rotation / reuse-detection queries, which a mock cannot verify.
describe('RefreshTokenService', () => {
  const service = new RefreshTokenService(
    testPrisma as unknown as PrismaService,
  );

  const sha256 = (raw: string) =>
    createHash('sha256').update(raw).digest('hex');

  const rowFor = (raw: string) =>
    testPrisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) } });

  const tokenVersionOf = (userId: string) =>
    testPrisma.user
      .findUniqueOrThrow({
        where: { id: userId },
        select: { tokenVersion: true },
      })
      .then((u) => u.tokenVersion);

  const ORIGINAL_GRACE = process.env.REFRESH_TOKEN_GRACE_SECONDS;

  beforeEach(() => resetDb());
  afterEach(() => {
    process.env.REFRESH_TOKEN_GRACE_SECONDS = ORIGINAL_GRACE;
  });
  afterAll(() => testPrisma.$disconnect());

  describe('issue', () => {
    it('stores only the hash, in a fresh family', async () => {
      const user = await makeUser();

      const raw = await service.issue(user.id);
      const row = await rowFor(raw);

      expect(row).not.toBeNull();
      expect(row!.userId).toBe(user.id);
      expect(row!.rotatedAt).toBeNull();
      expect(row!.revokedAt).toBeNull();
      // the raw token itself is nowhere in the row
      expect(JSON.stringify(row)).not.toContain(raw);
    });
  });

  describe('rotate', () => {
    it('rotates a valid token: old row marked, new row in the same family', async () => {
      const user = await makeUser();
      const first = await service.issue(user.id);
      const firstFamily = (await rowFor(first))!.familyId;

      const { userId, raw } = await service.rotate(first);

      expect(userId).toBe(user.id);
      expect(raw).not.toBe(first);
      expect((await rowFor(first))!.rotatedAt).toBeInstanceOf(Date);
      expect((await rowFor(raw))!.familyId).toBe(firstFamily);
    });

    it('rejects an unknown token', async () => {
      await expect(service.rotate('nope')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired token', async () => {
      const user = await makeUser();
      const raw = await service.issue(user.id);
      await testPrisma.refreshToken.update({
        where: { tokenHash: sha256(raw) },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await expect(service.rotate(raw)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('tolerates a re-rotation within the grace window', async () => {
      process.env.REFRESH_TOKEN_GRACE_SECONDS = '10';
      const user = await makeUser();
      const first = await service.issue(user.id);

      await service.rotate(first); // rotatedAt = now
      const second = await service.rotate(first); // same token, still within grace

      expect(second.raw).toEqual(expect.any(String));
      expect(await tokenVersionOf(user.id)).toBe(1);
    });

    it('treats reuse past the grace window as theft', async () => {
      process.env.REFRESH_TOKEN_GRACE_SECONDS = '0';
      const user = await makeUser();
      const first = await service.issue(user.id);
      const child = await service.rotate(first);

      // backdate the rotation so the next use is unambiguously past grace
      await testPrisma.refreshToken.update({
        where: { tokenHash: sha256(first) },
        data: { rotatedAt: new Date(Date.now() - 60_000) },
      });

      await expect(service.rotate(first)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      // whole family revoked + every access token invalidated
      expect((await rowFor(child.raw))!.revokedAt).toBeInstanceOf(Date);
      expect(await tokenVersionOf(user.id)).toBe(2);
    });

    it('treats reuse of a revoked token as theft', async () => {
      const user = await makeUser();
      const raw = await service.issue(user.id);
      await service.revokeAllForUser(user.id);

      await expect(service.rotate(raw)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(await tokenVersionOf(user.id)).toBe(2);
    });
  });

  describe('revokeAllForUser', () => {
    it('revokes every live token for the user', async () => {
      const user = await makeUser();
      const a = await service.issue(user.id);
      const b = await service.issue(user.id);

      await service.revokeAllForUser(user.id);

      expect((await rowFor(a))!.revokedAt).toBeInstanceOf(Date);
      expect((await rowFor(b))!.revokedAt).toBeInstanceOf(Date);
    });
  });
});
