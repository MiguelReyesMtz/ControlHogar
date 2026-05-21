import mongoose from 'mongoose';

const esquemaDispositivo = new mongoose.Schema(
  {
    hogar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hogar',
      required: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    tipo: {
      type: String,
      enum: ['luz', 'ventilador', 'temperatura', 'movimiento', 'otro'],
      required: true
    },
    categoria: {
      type: String,
      enum: ['actuador', 'sensor'],
      required: true
    },
    ubicacion: {
      type: String,
      default: 'General',
      trim: true
    },
    estado: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lecturaActual: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    unidad: {
      type: String,
      default: ''
    },
    capacidades: {
      type: [String],
      default: []
    },
    simulado: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

esquemaDispositivo.index({ hogar: 1, categoria: 1, tipo: 1 });

export const Dispositivo = mongoose.model('Dispositivo', esquemaDispositivo);
