import dotenv from 'dotenv';

dotenv.config();

export const entorno = {
  puerto: Number(process.env.PUERTO || 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/control_hogar',
  jwtSecreto: process.env.JWT_SECRETO || 'cambia-este-secreto-en-produccion',
  codigoHogar: process.env.CODIGO_HOGAR || 'HOGAR-UADY-2026',
  nombreHogar: process.env.NOMBRE_HOGAR || 'Hogar principal',
  intervaloSimuladorMs: Number(process.env.INTERVALO_SIMULADOR_MS || 3500)
};
