"use client";

import pacotePdf from "pdfjs-dist/package.json";

export type BibliotecaPdf = typeof import("pdfjs-dist");
export const raizPdfBiblioteca = `/biblioteca/pdfjs/${pacotePdf.version}`;
export const workerPdfBiblioteca = `${raizPdfBiblioteca}/pdf.worker.min.mjs`;
let biblioteca: Promise<BibliotecaPdf> | null = null;
let preparo: Promise<void> | null = null;

export function carregarBibliotecaPdf(): Promise<BibliotecaPdf> {
  if (!biblioteca) {
    const fonte = `${raizPdfBiblioteca}/pdf.min.mjs`;
    // O ESM nativo mantém a compatibilidade do PDF.js com o webpack do Next 14.
    biblioteca = (import(/* webpackIgnore: true */ fonte) as Promise<BibliotecaPdf>).catch((erro) => {
      biblioteca = null;
      throw erro;
    });
  }
  return biblioteca;
}

/** Prepara apenas o motor público. O PDF privado continua sujeito à autorização. */
export function prepararBibliotecaPdf(): Promise<void> {
  if (!preparo) {
    preparo = Promise.all([
      carregarBibliotecaPdf(),
      fetch(workerPdfBiblioteca, { cache: "force-cache", credentials: "same-origin" }).then(async (resposta) => {
        if (!resposta.ok) throw new Error("PDF_WORKER_INDISPONIVEL");
        await resposta.arrayBuffer();
      }),
    ]).then(() => {}).catch((erro) => {
      preparo = null;
      throw erro;
    });
  }
  return preparo;
}
