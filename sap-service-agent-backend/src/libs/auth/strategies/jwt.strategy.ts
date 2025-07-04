import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export interface JwtPayload {
  sub: string;
  username: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hasAccess = await this.authService.verifyUserTenantAccess(
      user.id,
      payload.tenantId,
    );
    if (!hasAccess) {
      throw new UnauthorizedException(
        'User does not have access to this tenant',
      );
    }

    return {
      id: user.id,
      username: user.username,
      tenantId: payload.tenantId,
    };
  }
}
