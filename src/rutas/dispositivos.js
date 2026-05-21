import { Router } from 'express';
import { Dispositivo } from '../modelos/Dispositivo.js';
import { LecturaSensor } from '../modelos/LecturaSensor.js';
import { validarToken } from '../middlewares/autenticacion.js';
import {
  obtenerDispositivosVisibles,
  puedeControlarDispositivo,
  puedeVerDispositivo
} from '../servicios/permisos.js';
import { serializarDispositivo, serializarLectura } from '../servicios/respuestas.js';
import { emitirDispositivoActualizado } from '../servicios/sockets.js';

const router = Router();

router.use(validarToken);

router.get('/', async (req, res) => {
  const elementos = await obtenerDispositivosVisibles(req.usuario);
  const dispositivos = elementos.map(({ dispositivo, permiso }) => serializarDispositivo(dispositivo, permiso));
  res.json({ dispositivos });
});

router.put('/:id/estado', async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findOne({
      _id: req.params.id,
      hogar: req.usuario.hogar
    });

    if (!dispositivo) {
      return res.status(404).json({ mensaje: 'Dispositivo no encontrado.' });
    }

    const autorizado = await puedeControlarDispositivo(req.usuario, dispositivo);
    if (!autorizado) {
      return res.status(403).json({ mensaje: 'No tienes permiso para controlar este dispositivo.' });
    }

    const nuevoEstado = prepararEstadoActuador(dispositivo, req.body.estado || {});
    dispositivo.estado = { ...(dispositivo.estado || {}), ...nuevoEstado };
    await dispositivo.save();

    await emitirDispositivoActualizado(dispositivo);
    res.json({ dispositivo: serializarDispositivo(dispositivo, { puedeVer: true, puedeControlar: true }) });
  } catch (error) {
    res.status(400).json({ mensaje: 'No se pudo actualizar el dispositivo.', detalle: error.message });
  }
});

router.get('/:id/lecturas', async (req, res) => {
  const limite = Math.min(Number(req.query.limite || 30), 100);
  const dispositivo = await Dispositivo.findOne({
    _id: req.params.id,
    hogar: req.usuario.hogar
  });

  if (!dispositivo) {
    return res.status(404).json({ mensaje: 'Dispositivo no encontrado.' });
  }

  const autorizado = await puedeVerDispositivo(req.usuario, dispositivo);
  if (!autorizado) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver este dispositivo.' });
  }

  const lecturas = await LecturaSensor.find({ dispositivo: dispositivo._id })
    .sort({ createdAt: -1 })
    .limit(limite);

  res.json({ lecturas: lecturas.reverse().map(serializarLectura) });
});

function prepararEstadoActuador(dispositivo, estadoSolicitado) {
  if (dispositivo.categoria !== 'actuador') {
    throw new Error('El dispositivo no es un actuador.');
  }

  const estado = {};

  if (Object.prototype.hasOwnProperty.call(estadoSolicitado, 'encendido')) {
    estado.encendido = Boolean(estadoSolicitado.encendido);
  }

  if (dispositivo.tipo === 'ventilador' && Object.prototype.hasOwnProperty.call(estadoSolicitado, 'intensidad')) {
    const intensidad = Number(estadoSolicitado.intensidad);
    if (!Number.isFinite(intensidad) || intensidad < 0 || intensidad > 100) {
      throw new Error('La intensidad debe estar entre 0 y 100.');
    }
    estado.intensidad = Math.round(intensidad);
  }

  if (Object.keys(estado).length === 0) {
    throw new Error('No se recibio un estado valido.');
  }

  return estado;
}

export default router;
