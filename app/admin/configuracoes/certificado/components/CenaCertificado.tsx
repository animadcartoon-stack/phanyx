"use client";

import { memo, useState, type ReactNode, type UIEvent } from "react";

type Elemento = { id: number };
type Propriedades<T extends Elemento> = {
  elemento: T;
  indice?: number;
  dependencias: readonly unknown[];
  renderizar: (elemento: T, indice: number) => ReactNode;
};

function ItemCena<T extends Elemento>({ elemento, indice = 0, renderizar }: Propriedades<T>) {
  return <>{renderizar(elemento, indice)}</>;
}

// A identidade do elemento muda somente quando suas propriedades mudam.
// Selecao e preferencias visuais sao dependencias explicitas por elemento.
export const ElementoCenaCertificado = memo(ItemCena, (antes, depois) =>
  antes.elemento === depois.elemento && antes.indice === depois.indice &&
  antes.renderizar === depois.renderizar &&
  antes.dependencias.length === depois.dependencias.length &&
  antes.dependencias.every((valor, indice) => Object.is(valor, depois.dependencias[indice])),
) as typeof ItemCena;

const ALTURA_LINHA = 28;
const ALTURA_LISTA = 190;
const MARGEM_LINHAS = 6;

export function ListaCamadasCertificado<T extends Elemento>({ elementos, renderizar, dependencias }: {
  elementos: T[];
  renderizar: (elemento: T, indice: number) => ReactNode;
  dependencias: (elemento: T) => readonly unknown[];
}) {
  const [primeiraLinha, setPrimeiraLinha] = useState(0);
  const primeiraVisivel = Math.min(primeiraLinha, Math.max(0, elementos.length - Math.ceil(ALTURA_LISTA / ALTURA_LINHA)));
  const inicio = Math.max(0, primeiraVisivel - MARGEM_LINHAS);
  const fim = Math.min(elementos.length, primeiraVisivel + Math.ceil(ALTURA_LISTA / ALTURA_LINHA) + MARGEM_LINHAS);
  function aoRolar(evento: UIEvent<HTMLDivElement>) {
    const linha = Math.floor(evento.currentTarget.scrollTop / ALTURA_LINHA);
    setPrimeiraLinha((anterior) => anterior === linha ? anterior : linha);
  }
  return (
    <div className="max-h-[190px] overflow-y-auto overflow-x-hidden" onScroll={aoRolar}>
      <div aria-hidden="true" style={{ height: inicio * ALTURA_LINHA }} />
      {elementos.slice(inicio, fim).map((elemento, deslocamento) => (
        <ElementoCenaCertificado key={elemento.id} elemento={elemento} indice={inicio + deslocamento}
          dependencias={dependencias(elemento)} renderizar={renderizar} />
      ))}
      <div aria-hidden="true" style={{ height: (elementos.length - fim) * ALTURA_LINHA }} />
    </div>
  );
}
