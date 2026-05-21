import mongoose from 'mongoose';

const esquemaPermisoDispositivo = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    dispositivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispositivo',
      required: true
    },
    puedeVer: {
      type: Boolean,
      default: false
    },
    puedeControlar: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

esquemaPermisoDispositivo.index({ usuario: 1, dispositivo: 1 }, { unique: true });

export const PermisoDispositivo = mongoose.model('PermisoDispositivo', esquemaPermisoDispositivo);
