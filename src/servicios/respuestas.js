export function serializarUsuario(usuario) {
  return {
    id: usuario._id.toString(),
    correo: usuario.correo,
    rol: usuario.rol,
    hogar: usuario.hogar?._id?.toString?.() || usuario.hogar?.toString?.()
  };
}

export function serializarDispositivo(dispositivo, permiso = {}) {
  return {
    id: dispositivo._id.toString(),
    nombre: dispositivo.nombre,
    tipo: dispositivo.tipo,
    categoria: dispositivo.categoria,
    ubicacion: dispositivo.ubicacion,
    estado: dispositivo.estado || {},
    lecturaActual: dispositivo.lecturaActual || null,
    unidad: dispositivo.unidad || '',
    capacidades: dispositivo.capacidades || [],
    simulado: dispositivo.simulado,
    permiso: {
      puedeVer: Boolean(permiso.puedeVer),
      puedeControlar: Boolean(permiso.puedeControlar)
    }
  };
}

export function serializarLectura(lectura) {
  return {
    id: lectura._id.toString(),
    dispositivo: lectura.dispositivo.toString(),
    tipoSensor: lectura.tipoSensor,
    valor: lectura.valor,
    unidad: lectura.unidad || '',
    creadaEn: lectura.createdAt
  };
}
