import mongoose from 'mongoose';

const esquemaUsuario = new mongoose.Schema(
  {
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    contrasenaHash: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: ['usuario', 'admin', 'superadmin'],
      default: 'usuario'
    },
    hogar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hogar',
      required: true
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Usuario = mongoose.model('Usuario', esquemaUsuario);
