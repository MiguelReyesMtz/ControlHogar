export function plantillaDispositivoInicial(nombre, tipo, ubicacion) {
  const plantillas = {
    luz: {
      nombre,
      tipo: 'luz',
      categoria: 'actuador',
      ubicacion,
      estado: { encendido: false },
      unidad: '',
      capacidades: ['encendido']
    },
    ventilador: {
      nombre,
      tipo: 'ventilador',
      categoria: 'actuador',
      ubicacion,
      estado: { encendido: false, intensidad: 40 },
      unidad: '',
      capacidades: ['encendido', 'intensidad']
    },
    temperatura: {
      nombre,
      tipo: 'temperatura',
      categoria: 'sensor',
      ubicacion,
      estado: {},
      lecturaActual: { valor: 23, unidad: 'C' },
      unidad: 'C',
      capacidades: ['lectura']
    },
    movimiento: {
      nombre,
      tipo: 'movimiento',
      categoria: 'sensor',
      ubicacion,
      estado: {},
      lecturaActual: { movimiento: false },
      unidad: '',
      capacidades: ['lectura']
    }
  };

  if (!plantillas[tipo]) {
    throw new Error('Tipo de dispositivo no soportado.');
  }

  return plantillas[tipo];
}
