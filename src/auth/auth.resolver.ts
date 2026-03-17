import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthPayload, User } from './auth.model';
import { CurrentUser } from './decorator/current-user.decorator';
import { GqlJwtAuthGuard } from './jwt-guard';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: { userId: string }) {
    return await this.prisma.user.findUnique({
      where: { id: user.userId },
    });
  }

  // LOGIN
  @Mutation(() => AuthPayload)
  async login(@Args('email') email: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        tokenVersion: true,
        isBlocked: true,
        refreshToken: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          emailVerified: new Date(),
        },
        select: {
          refreshToken: true,
          id: true,
          tokenVersion: true,
          isBlocked: true,
        },
      });
    }

    if (user.isBlocked) {
      throw new UnauthorizedException();
    }

    const accessToken = this.jwt.sign({
      sub: user.id,
      ver: user.tokenVersion,
    });

    const refreshToken = crypto.randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  // REFRESH
  @Mutation(() => AuthPayload)
  async refresh(@Args('refreshToken') refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { refreshToken },
      select: {
        id: true,
        tokenVersion: true,
        isBlocked: true,
      },
    });

    if (!user || user.isBlocked) {
      throw new UnauthorizedException();
    }

    const accessToken = this.jwt.sign({
      sub: user.id,
      ver: user.tokenVersion,
    });

    const newRefreshToken = crypto.randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 }, refreshToken: newRefreshToken },
      // increment tokenVersion instead of setting refreshToken (assume no refreshToken col)
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  async logout(@CurrentUser() user: { userId: string }) {
    await this.prisma.user.update({
      where: { id: user.userId },
      data: {
        tokenVersion: { increment: 1 },
        refreshToken: null,
      },
    });

    return true;
  }
}
