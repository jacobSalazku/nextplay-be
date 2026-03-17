import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64!, 'base64'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: { sub: string; ver: number }) {
    return {
      userId: payload.sub,
      tokenVersion: payload.ver,
    };
  }
}
