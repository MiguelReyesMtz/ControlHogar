import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { conectarBaseDatos } from './configuracion/baseDatos.js';
import { entorno } from './configuracion/entorno.js';
import rutasAuth from './rutas/auth.js';
import rutasDispositivos from './rutas/dispositivos.js';
import rutasAdmin from './rutas/admin.js';
import { configurarSockets } from './servicios/sockets.js';
import { sembrarDatosIniciales } from './servicios/semillas.js';
import { iniciarSimuladorIoT } from './servicios/simuladorIoT.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const carpetaPublica = path.join(__dirname, '..', 'public');

async function iniciarServidor() {
  await conectarBaseDatos();
  await sembrarDatosIniciales();

  const app = express();
  const servidorHttp = http.createServer(app);

  configurarSockets(servidorHttp);

  app.use(cors());
  app.use(express.json());
  app.use(express.static(carpetaPublica));

  app.get('/api/salud', (req, res) => {
    res.json({ estado: 'ok', servicio: 'control-hogar' });
  });

  app.use('/api/auth', rutasAuth);
  app.use('/api/dispositivos', rutasDispositivos);
  app.use('/api/admin', rutasAdmin);

  app.get('*', (req, res) => {
    res.sendFile(path.join(carpetaPublica, 'index.html'));
  });

  iniciarSimuladorIoT();

  servidorHttp.listen(entorno.puerto, () => {
    console.log(`Servidor disponible en http://localhost:${entorno.puerto}`);
  });
}

iniciarServidor().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
