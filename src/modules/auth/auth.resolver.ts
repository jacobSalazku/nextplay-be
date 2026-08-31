import {
  InternalServerErrorException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthPayload, User } from './auth.model';
import { CurrentUser } from './decorator/current-user.decorator';
import { Public } from './decorator/public.decorator';
import { GqlJwtAuthGuard } from './guards/jwt-guard';
import { RefreshTokenService } from './refresh-token.service';

type SessionUser = {
  id: string;
  tokenVersion: number;
  isBlocked: boolean;
  hasOnBoarded: boolean;
};

@Resolver()
export class AuthResolver {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: { userId: string }): Promise<User> {
    return await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isBlocked: true,
        tokenVersion: true,
        hasOnBoarded: true,
      },
    });
  }

  /**
   * Primary login. The client completes Google OAuth and forwards the resulting
   * ID token here. The server verifies the token's signature and audience with
   * Google and trusts the email only if Google reports it verified. A
   * caller-supplied email is never trusted.
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Mutation(() => AuthPayload)
  async loginWithGoogle(
    @Args('idToken') idToken: string,
  ): Promise<AuthPayload> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new InternalServerErrorException('Google login is not configured');
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    const user = await this.findOrCreateUser(payload.email.toLowerCase());
    return this.issueSession(user);
  }

  /**
   * Email-only login for local development. Hard-disabled in production and
   * unless DEV_AUTH_ENABLED is explicitly set to 'true'.
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Mutation(() => AuthPayload)
  async devLogin(@Args('email') email: string): Promise<AuthPayload> {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.DEV_AUTH_ENABLED !== 'true'
    ) {
      throw new UnauthorizedException('Dev login is disabled');
    }

    const user = await this.findOrCreateUser(email.trim().toLowerCase());
    return this.issueSession(user);
  }

  // REFRESH
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Mutation(() => AuthPayload)
  async refresh(
    @Args('refreshToken') refreshToken: string,
  ): Promise<AuthPayload> {
    const { userId, raw } = await this.refreshTokens.rotate(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tokenVersion: true,
        isBlocked: true,
        hasOnBoarded: true,
      },
    });

    if (!user || user.isBlocked) {
      throw new UnauthorizedException();
    }

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: raw,
      hasOnBoarded: user.hasOnBoarded,
      userId: user.id,
    };
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  async logout(@CurrentUser() user: { userId: string }): Promise<boolean> {
    await this.refreshTokens.revokeAllForUser(user.userId);
    await this.prisma.user.update({
      where: { id: user.userId },
      data: { tokenVersion: { increment: 1 } },
    });

    return true;
  }

  private async findOrCreateUser(email: string): Promise<SessionUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        tokenVersion: true,
        isBlocked: true,
        hasOnBoarded: true,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        hasOnBoarded: false,
      },
      select: {
        id: true,
        tokenVersion: true,
        isBlocked: true,
        hasOnBoarded: true,
      },
    });
  }

  private signAccessToken(user: { id: string; tokenVersion: number }): string {
    return this.jwt.sign({ sub: user.id, ver: user.tokenVersion });
  }

  private async issueSession(user: SessionUser): Promise<AuthPayload> {
    if (user.isBlocked) {
      throw new UnauthorizedException();
    }

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: await this.refreshTokens.issue(user.id),
      hasOnBoarded: user.hasOnBoarded,
      userId: user.id,
    };
  }
}
