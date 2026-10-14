"use client";

import pacotePdf from "pdfjs-dist/package.json";

export type BibliotecaPdf = typeof import("pdfjs-dist");
export const raizPdfBiblioteca = `/biblioteca/pdfjs/${pacotePdf.version}`;
export const workerPdfBiblioteca = `${raizPdfBiblioteca}/pdf.worker.min.mjs`;
let biblioteca: Promise<BibliotecaPdf> | null = null;
let preparo: Promise<void> | null = null;
let worker: Promise<InstanceType<BibliotecaPdf["PDFWorker"]>> | null = null;

/** Reutiliza só o worker público; cada documento autorizado é destruído ao sair. */
export function obterWorkerBibliotecaPdf(): Promise<InstanceType<BibliotecaPdf["PDFWorker"]>> {
  if (!worker) {
    worker = carregarBibliotecaPdf().then(async (lib) => {
      lib.GlobalWorkerOptions.workerSrc = workerPdfBiblioteca;
      const instancia = new lib.PDFWorker();
      try { await instancia.promise; return instancia; }
      catch (erro) { instancia.destroy(); throw erro; }
    }).catch((erro) => { worker = null; throw erro; });
  }
  return worker;
}

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
      obterWorkerBibliotecaPdf(),
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
