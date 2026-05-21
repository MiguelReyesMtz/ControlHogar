import mongoose from 'mongoose';
import { entorno } from './entorno.js';

export async function conectarBaseDatos() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(entorno.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log(`Base de datos conectada: ${entorno.mongoUri}`);
}
