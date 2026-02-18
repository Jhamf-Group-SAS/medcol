import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'secreto_super_seguro';
    console.log('🔑 JwtStrategy inicializado. Secret prefix:', secret.substring(0, 3) + '...');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /*async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }*/

  async validate(payload: any) {
    console.log('🔑 Validando token, payload:', payload);
    return {
      id: payload.sub, // ✅ ahora estará disponible como req.user.id
      username: payload.username,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      cargo: payload.cargo,
    };
  }
}
