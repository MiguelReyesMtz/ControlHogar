import mongoose from 'mongoose';

const esquemaHogar = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { timestamps: true }
);

export const Hogar = mongoose.model('Hogar', esquemaHogar);
