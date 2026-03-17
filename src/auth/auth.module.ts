import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt-strategy';
import { GqlJwtAuthGuard } from './jwt-guard';
import { AuthResolver } from './auth.resolver';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const privateKey = config.get<string>('JWT_PRIVATE_KEY_BASE64');
        const publicKey = config.get<string>('JWT_PUBLIC_KEY_BASE64');

        if (!privateKey || !publicKey) {
          throw new Error(
            'JWT keys missing. Check JWT_PRIVATE_KEY_BASE64 and JWT_PUBLIC_KEY_BASE64',
          );
        }

        return {
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '10m',
          },
        };
      },
    }),
  ],
  providers: [JwtStrategy, GqlJwtAuthGuard, AuthResolver],
  exports: [GqlJwtAuthGuard],
})
export class AuthModule {}
