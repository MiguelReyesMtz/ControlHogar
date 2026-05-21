export function generarLecturaMovimiento(lecturaActual) {
  const estabaActivo = Boolean(lecturaActual?.movimiento);
  const cambia = Math.random() < (estabaActivo ? 0.45 : 0.18);
  const movimiento = cambia ? !estabaActivo : estabaActivo;

  return {
    movimiento,
    descripcion: movimiento ? 'movimiento detectado' : 'inactivo'
  };
}
