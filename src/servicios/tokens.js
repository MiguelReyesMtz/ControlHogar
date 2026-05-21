import jwt from 'jsonwebtoken';
import { entorno } from '../configuracion/entorno.js';

export function crearToken(usuario) {
  return jwt.sign(
    {
      id: usuario._id.toString(),
      rol: usuario.rol
    },
    entorno.jwtSecreto,
    { expiresIn: '8h' }
  );
}

export function verificarToken(token) {
  return jwt.verify(token, entorno.jwtSecreto);
}
