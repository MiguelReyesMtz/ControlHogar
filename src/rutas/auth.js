import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { Hogar } from '../modelos/Hogar.js';
import { Usuario } from '../modelos/Usuario.js';
import { validarToken } from '../middlewares/autenticacion.js';
import { crearToken } from '../servicios/tokens.js';
import { serializarUsuario } from '../servicios/respuestas.js';

const router = Router();

function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

router.post('/registro', async (req, res) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');
    const codigoHogar = String(req.body.codigoHogar || '').trim();

    if (!correoValido(correo)) {
      return res.status(400).json({ mensaje: 'Ingresa un correo valido.' });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ mensaje: 'La contrasena debe tener al menos 6 caracteres.' });
    }

    const hogar = await Hogar.findOne({ codigo: codigoHogar });
    if (!hogar) {
      return res.status(400).json({ mensaje: 'Codigo de hogar incorrecto.' });
    }

    const existente = await Usuario.findOne({ correo });
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 12);
    const usuario = await Usuario.create({
      correo,
      contrasenaHash,
      rol: 'usuario',
      hogar: hogar._id
    });

    const token = crearToken(usuario);
    res.status(201).json({ token, usuario: serializarUsuario(usuario) });
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo registrar el usuario.', detalle: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');
    const usuario = await Usuario.findOne({ correo, activo: true });

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasenaHash);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const token = crearToken(usuario);
    res.json({ token, usuario: serializarUsuario(usuario) });
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo iniciar sesion.', detalle: error.message });
  }
});

router.get('/perfil', validarToken, async (req, res) => {
  res.json({ usuario: serializarUsuario(req.usuario) });
});

export default router;
