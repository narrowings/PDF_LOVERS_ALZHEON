import mongoose from 'mongoose';

const nivelSchema = new mongoose.Schema({
  completado: { type: Boolean, default: false },
  tiempoSegundos: { type: Number, default: null },
  errores: { type: Number, default: 0 },
}, { _id: false });

const memoramaSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true,
  },
  fecha: { type: Date, default: Date.now },
  nivel1: { type: nivelSchema, default: () => ({}) },
  nivel2: { type: nivelSchema, default: () => ({}) },
  nivel3: { type: nivelSchema, default: () => ({}) },
  tiempoTotal: { type: Number, default: null },
  completadoTotal: { type: Boolean, default: false },
});

export default mongoose.model('Memorama', memoramaSchema);