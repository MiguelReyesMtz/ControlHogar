import mongoose from 'mongoose';

const esquemaLecturaSensor = new mongoose.Schema(
  {
    hogar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hogar',
      required: true
    },
    dispositivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispositivo',
      required: true
    },
    tipoSensor: {
      type: String,
      required: true
    },
    valor: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    unidad: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

esquemaLecturaSensor.index({ dispositivo: 1, createdAt: -1 });

export const LecturaSensor = mongoose.model('LecturaSensor', esquemaLecturaSensor);
