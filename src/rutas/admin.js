import { Router } from 'express';
import { Hogar } from '../modelos/Hogar.js';
import { Usuario } from '../modelos/Usuario.js';
import { Dispositivo } from '../modelos/Dispositivo.js';
import { PermisoDispositivo } from '../modelos/PermisoDispositivo.js';
import { LecturaSensor } from '../modelos/LecturaSensor.js';
import { validarToken, requerirAdmin, requerirSuperadmin } from '../middlewares/autenticacion.js';
import { esSuperadmin } from '../servicios/permisos.js';
import { serializarDispositivo, serializarUsuario } from '../servicios/respuestas.js';
import { plantillaDispositivoInicial } from '../servicios/dispositivos.js';
import {
  emitirAdminActualizado,
  emitirDispositivoEliminado,
  emitirPermisosActualizados
} from '../servicios/sockets.js';

const router = Router();

router.use(validarToken, requerirAdmin);

router.get('/hogar', async (req, res) => {
  const hogar = await Hogar.findById(req.usuario.hogar);
  res.json({
    hogar: {
      id: hogar._id.toString(),
      nombre: hogar.nombre,
      codigo: hogar.codigo
    }
  });
});

router.get('/usuarios', async (req, res) => {
  const usuarios = await Usuario.find({ hogar: req.usuario.hogar, activo: true }).sort({ rol: 1, correo: 1 });
  res.json({ usuarios: usuarios.map(serializarUsuario), puedeGestionarRoles: esSuperadmin(req.usuario) });
});

router.patch('/usuarios/:id/rol', requerirSuperadmin, async (req, res) => {
  try {
    const rol = String(req.body.rol || '').trim();
    if (!['usuario', 'admin'].includes(rol)) {
      return res.status(400).json({ mensaje: 'Rol no valido.' });
    }

    const usuario = await Usuario.findOne({ _id: req.params.id, hogar: req.usuario.hogar });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    if (usuario.rol === 'superadmin') {
      return res.status(400).json({ mensaje: 'El superadmin principal no puede cambiar de rol.' });
    }

    usuario.rol = rol;
    await usuario.save();
    await emitirAdminActualizado(req.usuario.hogar);

    res.json({ usuario: serializarUsuario(usuario) });
  } catch (error) {
    res.status(400).json({ mensaje: 'No se pudo cambiar el rol.', detalle: error.message });
  }
});

router.get('/dispositivos', async (req, res) => {
  const dispositivos = await Dispositivo.find({ hogar: req.usuario.hogar }).sort({ categoria: 1, tipo: 1, nombre: 1 });
  res.json({
    dispositivos: dispositivos.map((dispositivo) =>
      serializarDispositivo(dispositivo, {
        puedeVer: true,
        puedeControlar: dispositivo.categoria === 'actuador'
      })
    )
  });
});

router.post('/dispositivos', async (req, res) => {
  try {
    const plantilla = crearPlantillaDispositivo(req.body);
    const dispositivo = await Dispositivo.create({
      ...plantilla,
      hogar: req.usuario.hogar
    });

    await emitirAdminActualizado(req.usuario.hogar);
    res.status(201).json({ dispositivo: serializarDispositivo(dispositivo, { puedeVer: true, puedeControlar: true }) });
  } catch (error) {
    res.status(400).json({ mensaje: 'No se pudo crear el dispositivo.', detalle: error.message });
  }
});

router.delete('/dispositivos/:id', async (req, res) => {
  const dispositivo = await Dispositivo.findOne({ _id: req.params.id, hogar: req.usuario.hogar });
  if (!dispositivo) {
    return res.status(404).json({ mensaje: 'Dispositivo no encontrado.' });
  }

  await Promise.all([
    PermisoDispositivo.deleteMany({ dispositivo: dispositivo._id }),
    LecturaSensor.deleteMany({ dispositivo: dispositivo._id }),
    dispositivo.deleteOne()
  ]);

  await emitirDispositivoEliminado(req.usuario.hogar, dispositivo._id.toString());
  await emitirAdminActualizado(req.usuario.hogar);

  res.json({ mensaje: 'Dispositivo eliminado.' });
});

router.get('/permisos/:usuarioId', async (req, res) => {
  const usuario = await Usuario.findOne({ _id: req.params.usuarioId, hogar: req.usuario.hogar });
  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  const dispositivos = await Dispositivo.find({ hogar: req.usuario.hogar }).sort({ categoria: 1, tipo: 1, nombre: 1 });
  const permisos = await PermisoDispositivo.find({ usuario: usuario._id });
  const permisosPorDispositivo = new Map(permisos.map((permiso) => [permiso.dispositivo.toString(), permiso]));

  res.json({
    usuario: serializarUsuario(usuario),
    permisos: dispositivos.map((dispositivo) => {
      const permiso = permisosPorDispositivo.get(dispositivo._id.toString());
      return {
        dispositivo: serializarDispositivo(dispositivo, {
          puedeVer: permiso?.puedeVer || false,
          puedeControlar: permiso?.puedeControlar || false
        }),
        puedeVer: permiso?.puedeVer || false,
        puedeControlar: permiso?.puedeControlar || false
      };
    })
  });
});

router.patch('/permisos', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ _id: req.body.usuarioId, hogar: req.usuario.hogar });
    const dispositivo = await Dispositivo.findOne({ _id: req.body.dispositivoId, hogar: req.usuario.hogar });

    if (!usuario || !dispositivo) {
      return res.status(404).json({ mensaje: 'Usuario o dispositivo no encontrado.' });
    }

    if (usuario.rol !== 'usuario') {
      return res.status(400).json({ mensaje: 'Los administradores ya tienen acceso completo.' });
    }

    let puedeVer = Boolean(req.body.puedeVer);
    let puedeControlar = dispositivo.categoria === 'actuador' && Boolean(req.body.puedeControlar);

    if (puedeControlar) {
      puedeVer = true;
    }

    if (!puedeVer) {
      puedeControlar = false;
    }

    const permiso = await PermisoDispositivo.findOneAndUpdate(
      { usuario: usuario._id, dispositivo: dispositivo._id },
      { puedeVer, puedeControlar },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await emitirPermisosActualizados(usuario._id.toString());
    res.json({ permiso });
  } catch (error) {
    res.status(400).json({ mensaje: 'No se pudo actualizar el permiso.', detalle: error.message });
  }
});

function crearPlantillaDispositivo(datos) {
  const nombre = String(datos.nombre || '').trim();
  const tipo = String(datos.tipo || '').trim();
  const ubicacion = String(datos.ubicacion || 'General').trim() || 'General';

  if (!nombre) {
    throw new Error('El nombre es obligatorio.');
  }

  return plantillaDispositivoInicial(nombre, tipo, ubicacion);
}

export default router;
