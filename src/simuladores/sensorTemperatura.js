export function generarLecturaTemperatura(lecturaActual) {
  const valorAnterior = Number(lecturaActual?.valor ?? 23);
  const cambio = (Math.random() - 0.5) * 0.8;
  const valor = limitar(valorAnterior + cambio, 18, 32);

  return {
    valor: Number(valor.toFixed(1)),
    unidad: 'C'
  };
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}
