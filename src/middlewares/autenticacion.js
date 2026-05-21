import { verificarToken } from '../servicios/tokens.js';
import { Usuario } from '../modelos/Usuario.js';
import { esAdministrador, esSuperadmin } from '../servicios/permisos.js';

export async function validarToken(req, res, next) {
  try {
    const encabezado = req.headers.authorization || '';
    const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado.' });
    }

    const datos = verificarToken(token);
    const usuario = await Usuario.findById(datos.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Usuario no autorizado.' });
    }

    req.usuario = usuario;
    next();
  } catch {
    res.status(401).json({ mensaje: 'Sesion invalida o expirada.' });
  }
}

export function requerirAdmin(req, res, next) {
  if (!esAdministrador(req.usuario)) {
    return res.status(403).json({ mensaje: 'Se requiere rol de administrador.' });
  }

  next();
}

export function requerirSuperadmin(req, res, next) {
  if (!esSuperadmin(req.usuario)) {
    return res.status(403).json({ mensaje: 'Se requiere rol de superadmin.' });
  }

  next();
}
