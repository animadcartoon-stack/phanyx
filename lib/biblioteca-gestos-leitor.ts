export function limitarZoomLeitor(valor: number) {
  return Number.isFinite(valor) ? Math.max(.5, Math.min(4, valor)) : 1;
}

export function zoomPorPincaLeitor(zoom: number, distanciaInicial: number, distancia: number) {
  return distanciaInicial > 0 ? limitarZoomLeitor(zoom * distancia / distanciaInicial) : limitarZoomLeitor(zoom);
}

export function viradaPorGestoLeitor(dx: number, dy: number, zoom: number, duracao: number) {
  if (zoom > 1.05 || duracao > 1200 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}
