import type { PontoFormaEditavel } from "./edicaoPontosForma";

const INICIO_LINHA: PontoFormaEditavel[] = [
  { id: "p1", x: 0, y: 50, tipo: "reto" },
  { id: "p2", x: 100, y: 50, tipo: "reto" },
];

export function pontosDaLinha(campo: { forma?: string | null; pontosForma?: PontoFormaEditavel[] | null }) {
  return campo.forma === "LINHA" && (campo.pontosForma?.length || 0) < 2 ? INICIO_LINHA : campo.pontosForma || [];
}

export function normalizarLinhaCertificado<T extends { forma?: string | null; pontosForma?: PontoFormaEditavel[] | null }>(campo: T): T {
  return campo.forma === "LINHA" && (campo.pontosForma?.length || 0) < 2
    ? { ...campo, pontosForma: pontosDaLinha(campo), mostrarPreenchimento: false } : campo;
}

/** Insere na curva mais proxima e divide Bezier sem alterar o seu desenho. */
export function inserirPontoNaLinha(pontos: PontoFormaEditavel[], x: number, y: number, largura: number, altura: number, id: string) {
  if (pontos.length < 2) return pontos;
  const sx = Math.max(.001, Math.abs(largura)) / 100, sy = Math.max(.001, Math.abs(altura)) / 100;
  const meio = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  let melhor = { i: -1, t: .5, distancia: Infinity };
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i], b = pontos[i + 1], c1 = { x: a.outX ?? a.x, y: a.outY ?? a.y }, c2 = { x: b.inX ?? b.x, y: b.inY ?? b.y };
    const curva = a.tipo === "curvo" || b.tipo === "curvo" || a.outX !== undefined || b.inX !== undefined;
    const posicao = (t: number) => curva ? meio(meio(meio(a,c1,t),meio(c1,c2,t),t),meio(meio(c1,c2,t),meio(c2,b,t),t),t) : meio(a,b,t);
    const distancia = (t: number) => { const p = posicao(t);return ((p.x-x)*sx)**2 + ((p.y-y)*sy)**2; };
    let amostra = 0;
    for (let n = 0; n <= 64; n++) if (distancia(n/64) < distancia(amostra/64)) amostra = n;
    let min = Math.max(0,(amostra-1)/64), max = Math.min(1,(amostra+1)/64);
    for (let n=0;n<28;n++) { const a=min+(max-min)/3,b=max-(max-min)/3;if(distancia(a)<distancia(b))max=b;else min=a; }
    const t = (min+max)/2, d = distancia(t);
    if (d < melhor.distancia) melhor = { i, t, distancia: d };
  }
  if (melhor.i < 0 || melhor.t < .0001 || melhor.t > .9999) return pontos;
  const resultado = [...pontos], i = melhor.i, a = pontos[i], b = pontos[i+1], t = melhor.t;
  const curva = a.tipo === "curvo" || b.tipo === "curvo" || a.outX !== undefined || b.inX !== undefined;
  let novo: PontoFormaEditavel;
  if (curva) {
    const q0=meio(a,{x:a.outX??a.x,y:a.outY??a.y},t),q1=meio({x:a.outX??a.x,y:a.outY??a.y},{x:b.inX??b.x,y:b.inY??b.y},t),q2=meio({x:b.inX??b.x,y:b.inY??b.y},b,t);
    const r0=meio(q0,q1,t),r1=meio(q1,q2,t),p=meio(r0,r1,t);
    resultado[i]={...a,outX:q0.x,outY:q0.y};resultado[i+1]={...b,inX:q2.x,inY:q2.y};
    novo={id,...p,tipo:"curvo",handleMode:"alinhado",inX:r0.x,inY:r0.y,outX:r1.x,outY:r1.y};
  } else novo={id,...meio(a,b,t),tipo:"reto"};
  resultado.splice(i+1,0,novo);return resultado;
}
