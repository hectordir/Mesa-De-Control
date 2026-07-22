import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService, JwtPayload } from './auth.service';
import { PublicUserDto } from './dto/public-user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Se revalida contra la BD para que un usuario desactivado pierda el acceso al instante. */
  async validate(payload: JwtPayload): Promise<PublicUserDto> {
    return this.authService.validateJwtUser(payload.sub);
  }
}
