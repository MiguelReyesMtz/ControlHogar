import bcrypt from 'bcryptjs';
import { entorno } from '../configuracion/entorno.js';
import { Hogar } from '../modelos/Hogar.js';
import { Usuario } from '../modelos/Usuario.js';
import { Dispositivo } from '../modelos/Dispositivo.js';
import { plantillaDispositivoInicial } from './dispositivos.js';

export async function sembrarDatosIniciales() {
  const hogar = await Hogar.findOneAndUpdate(
    { codigo: entorno.codigoHogar },
    { nombre: entorno.nombreHogar, codigo: entorno.codigoHogar },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await asegurarSuperadmin(hogar);
  await asegurarDispositivosBase(hogar);

  console.log(`Hogar listo: ${hogar.nombre} (${hogar.codigo})`);
}

async function asegurarSuperadmin(hogar) {
  const correo = 'admin@hogar.com';
  const existente = await Usuario.findOne({ correo });

  if (existente) {
    if (existente.rol !== 'superadmin' || String(existente.hogar) !== String(hogar._id)) {
      existente.rol = 'superadmin';
      existente.hogar = hogar._id;
      await existente.save();
    }
    return;
  }

  const contrasenaHash = await bcrypt.hash('admin123', 12);
  await Usuario.create({
    correo,
    contrasenaHash,
    rol: 'superadmin',
    hogar: hogar._id
  });
}

async function asegurarDispositivosBase(hogar) {
  const total = await Dispositivo.countDocuments({ hogar: hogar._id });
  if (total > 0) return;

  const iniciales = [
    plantillaDispositivoInicial('Luz sala', 'luz', 'Sala'),
    plantillaDispositivoInicial('Luz cocina', 'luz', 'Cocina'),
    plantillaDispositivoInicial('Luz habitacion', 'luz', 'Habitacion'),
    plantillaDispositivoInicial('Ventilador sala', 'ventilador', 'Sala'),
    plantillaDispositivoInicial('Sensor temperatura', 'temperatura', 'Sala'),
    plantillaDispositivoInicial('Sensor movimiento', 'movimiento', 'Entrada')
  ];

  await Dispositivo.insertMany(iniciales.map((dispositivo) => ({ ...dispositivo, hogar: hogar._id })));
}
