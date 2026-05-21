import { Server } from 'socket.io';
import { Usuario } from '../modelos/Usuario.js';
import { PermisoDispositivo } from '../modelos/PermisoDispositivo.js';
import { verificarToken } from './tokens.js';
import { esAdministrador } from './permisos.js';
import { serializarDispositivo, serializarLectura } from './respuestas.js';

let servidorIo = null;

export function configurarSockets(servidorHttp) {
  servidorIo = new Server(servidorHttp, {
    cors: {
      origin: '*'
    }
  });

  servidorIo.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const datos = verificarToken(token);
      const usuario = await Usuario.findById(datos.id);

      if (!usuario || !usuario.activo) {
        return next(new Error('No autorizado'));
      }

      socket.usuario = usuario;
      next();
    } catch {
      next(new Error('No autorizado'));
    }
  });

  servidorIo.on('connection', (socket) => {
    const hogarId = socket.usuario.hogar.toString();
    socket.join(salaUsuario(socket.usuario._id));
    socket.join(salaHogar(hogarId));

    if (esAdministrador(socket.usuario)) {
      socket.join(salaAdmins(hogarId));
    }
  });

  return servidorIo;
}

export async function emitirDispositivoActualizado(dispositivo) {
  if (!servidorIo) return;

  const permisoAdmin = {
    puedeVer: true,
    puedeControlar: dispositivo.categoria === 'actuador'
  };

  servidorIo.to(salaAdmins(dispositivo.hogar)).emit('dispositivo:actualizado', {
    dispositivo: serializarDispositivo(dispositivo, permisoAdmin)
  });

  const permisos = await PermisoDispositivo.find({
    dispositivo: dispositivo._id,
    puedeVer: true
  });

  for (const permiso of permisos) {
    servidorIo.to(salaUsuario(permiso.usuario)).emit('dispositivo:actualizado', {
      dispositivo: serializarDispositivo(dispositivo, {
        puedeVer: permiso.puedeVer,
        puedeControlar: dispositivo.categoria === 'actuador' && permiso.puedeControlar
      })
    });
  }
}

export async function emitirLecturaSensor(dispositivo, lectura) {
  if (!servidorIo) return;

  const evento = {
    dispositivo: serializarDispositivo(dispositivo, { puedeVer: true, puedeControlar: false }),
    lectura: serializarLectura(lectura)
  };

  servidorIo.to(salaAdmins(dispositivo.hogar)).emit('lectura:sensor', evento);

  const permisos = await PermisoDispositivo.find({
    dispositivo: dispositivo._id,
    puedeVer: true
  });

  for (const permiso of permisos) {
    servidorIo.to(salaUsuario(permiso.usuario)).emit('lectura:sensor', evento);
  }
}

export async function emitirPermisosActualizados(usuarioId) {
  if (!servidorIo) return;
  servidorIo.to(salaUsuario(usuarioId)).emit('permisos:actualizados');
}

export async function emitirDispositivoEliminado(hogarId, dispositivoId) {
  if (!servidorIo) return;
  servidorIo.to(salaHogar(hogarId)).emit('dispositivo:eliminado', { id: dispositivoId });
}

export async function emitirAdminActualizado(hogarId) {
  if (!servidorIo) return;
  servidorIo.to(salaAdmins(hogarId)).emit('admin:actualizado');
  servidorIo.to(salaHogar(hogarId)).emit('sesion:actualizar');
}

function salaUsuario(usuarioId) {
  return `usuario:${usuarioId.toString()}`;
}

function salaHogar(hogarId) {
  return `hogar:${hogarId.toString()}`;
}

function salaAdmins(hogarId) {
  return `admins:${hogarId.toString()}`;
}
