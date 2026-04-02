import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const publicKey = config.get<string>('JWT_PUBLIC_KEY_BASE64');

    if (!publicKey) {
      throw new Error('Missing JWT_PUBLIC_KEY_BASE64');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: { sub: string; ver: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tokenVersion: true,
        isBlocked: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('User is blocked');
    }
    if (user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException(
        'Token version mismatch. Please sign in again.',
      );
    }

    return {
      userId: user.id,
      tokenVersion: user.tokenVersion,
    };
  }
}
