import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from 'src/constants/environment.constant';
import { ISignTokenPayload } from 'src/modules/auth/interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!env.jwt.accessTokenSecret) {
      throw new Error('JWT_ACCESS_TOKEN_SECRET must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.jwt.accessTokenSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: ISignTokenPayload) {
    // Return the user data that will be available in the request
    return {
      id: payload.id,
      email: payload.email,
      isAdmin: payload.isAdmin,
    };
  }
}
