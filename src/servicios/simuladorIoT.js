import { entorno } from '../configuracion/entorno.js';
import { Dispositivo } from '../modelos/Dispositivo.js';
import { LecturaSensor } from '../modelos/LecturaSensor.js';
import { generarLecturaTemperatura } from '../simuladores/sensorTemperatura.js';
import { generarLecturaMovimiento } from '../simuladores/sensorMovimiento.js';
import { emitirLecturaSensor } from './sockets.js';

let temporizador = null;

export function iniciarSimuladorIoT() {
  if (temporizador) return;

  temporizador = setInterval(async () => {
    try {
      await generarLecturasSensores();
    } catch (error) {
      console.error('Error del simulador IoT:', error.message);
    }
  }, entorno.intervaloSimuladorMs);

  console.log(`Simulador IoT activo cada ${entorno.intervaloSimuladorMs} ms`);
}

async function generarLecturasSensores() {
  const sensores = await Dispositivo.find({ categoria: 'sensor' });

  for (const sensor of sensores) {
    const lecturaGenerada = generarLectura(sensor);
    if (!lecturaGenerada) continue;

    sensor.lecturaActual = lecturaGenerada;
    await sensor.save();

    const lectura = await LecturaSensor.create({
      hogar: sensor.hogar,
      dispositivo: sensor._id,
      tipoSensor: sensor.tipo,
      valor: lecturaGenerada,
      unidad: sensor.unidad || lecturaGenerada.unidad || ''
    });

    await emitirLecturaSensor(sensor, lectura);
  }
}

function generarLectura(sensor) {
  if (sensor.tipo === 'temperatura') {
    return generarLecturaTemperatura(sensor.lecturaActual);
  }

  if (sensor.tipo === 'movimiento') {
    return generarLecturaMovimiento(sensor.lecturaActual);
  }

  return null;
}
