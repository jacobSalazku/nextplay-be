import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthResolver } from './auth.resolver';
import { CoachGuard } from './guards/coach-guard';
import { GqlJwtAuthGuard } from './guards/jwt-guard';
import { JwtStrategy } from './jwt-strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const privateKey = config.get<string>('JWT_PRIVATE_KEY_BASE64');
        const publicKey = config.get<string>('JWT_PUBLIC_KEY_BASE64');
        const accessTokenExpiresIn = Number(
          config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS') ?? 3600,
        );

        if (!privateKey || !publicKey) {
          throw new Error(
            'JWT keys missing. Check JWT_PRIVATE_KEY_BASE64 and JWT_PUBLIC_KEY_BASE64',
          );
        }
        if (
          !Number.isFinite(accessTokenExpiresIn) ||
          accessTokenExpiresIn <= 0
        ) {
          throw new Error('JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS must be > 0');
        }

        return {
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: accessTokenExpiresIn,
          },
        };
      },
    }),
  ],
  providers: [
    JwtStrategy,
    GqlJwtAuthGuard,
    AuthResolver,
    CoachGuard,
    // Enforce authentication on every resolver by default.
    // Opt out per handler with @Public().
    { provide: APP_GUARD, useClass: GqlJwtAuthGuard },
  ],
  exports: [GqlJwtAuthGuard, JwtModule, CoachGuard],
})
export class AuthModule {}
