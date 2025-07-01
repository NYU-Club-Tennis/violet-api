import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from 'src/constants/environment.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.jwt.accessTokenSecret!,
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: any) {
    try {
      const user = await this.getUser(payload);
      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      return null;
    }
  }

  async getUser(payload: any) {
    return payload;
  }
}
