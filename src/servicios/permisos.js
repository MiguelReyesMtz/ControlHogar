import { Dispositivo } from '../modelos/Dispositivo.js';
import { PermisoDispositivo } from '../modelos/PermisoDispositivo.js';

export function esAdministrador(usuario) {
  return usuario?.rol === 'admin' || usuario?.rol === 'superadmin';
}

export function esSuperadmin(usuario) {
  return usuario?.rol === 'superadmin';
}

export async function puedeVerDispositivo(usuario, dispositivo) {
  if (!usuario || !dispositivo) return false;
  if (String(usuario.hogar) !== String(dispositivo.hogar)) return false;
  if (esAdministrador(usuario)) return true;

  const permiso = await PermisoDispositivo.findOne({
    usuario: usuario._id,
    dispositivo: dispositivo._id,
    puedeVer: true
  });

  return Boolean(permiso);
}

export async function puedeControlarDispositivo(usuario, dispositivo) {
  if (!usuario || !dispositivo) return false;
  if (String(usuario.hogar) !== String(dispositivo.hogar)) return false;
  if (dispositivo.categoria !== 'actuador') return false;
  if (esAdministrador(usuario)) return true;

  const permiso = await PermisoDispositivo.findOne({
    usuario: usuario._id,
    dispositivo: dispositivo._id,
    puedeVer: true,
    puedeControlar: true
  });

  return Boolean(permiso);
}

export async function obtenerDispositivosVisibles(usuario) {
  if (esAdministrador(usuario)) {
    const dispositivos = await Dispositivo.find({ hogar: usuario.hogar }).sort({ categoria: 1, tipo: 1, nombre: 1 });
    return dispositivos.map((dispositivo) => ({
      dispositivo,
      permiso: {
        puedeVer: true,
        puedeControlar: dispositivo.categoria === 'actuador'
      }
    }));
  }

  const permisos = await PermisoDispositivo.find({
    usuario: usuario._id,
    puedeVer: true
  }).populate('dispositivo');

  return permisos
    .filter((permiso) => permiso.dispositivo && String(permiso.dispositivo.hogar) === String(usuario.hogar))
    .map((permiso) => ({
      dispositivo: permiso.dispositivo,
      permiso: {
        puedeVer: permiso.puedeVer,
        puedeControlar: permiso.dispositivo.categoria === 'actuador' && permiso.puedeControlar
      }
    }));
}
