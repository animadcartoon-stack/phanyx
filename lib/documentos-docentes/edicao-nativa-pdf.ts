export type CaixaNativaPdf = { esquerda: number; baixo: number; direita: number; alto: number };
export type SelecaoNativaPdf = { texto: string; cor: string | null };

export type OperacaoNativaPdf =
  | { tipo: "selecionar"; caixa: CaixaNativaPdf }
  | { tipo: "editar"; caixa: CaixaNativaPdf; texto: string; cor: string | null };

export type PedidoEdicaoNativaPdf = { bytes: ArrayBuffer; pagina: number; operacao: OperacaoNativaPdf };
export type RespostaEdicaoNativaPdf = { selecao: SelecaoNativaPdf } | { bytes: ArrayBuffer } | { erro: string };

export async function executarEdicaoNativaPdf(
  bytes: Uint8Array<ArrayBuffer>, pagina: number, operacao: OperacaoNativaPdf,
): Promise<RespostaEdicaoNativaPdf> {
  const worker = new Worker(new URL("./edicao-nativa-pdf.worker.ts", import.meta.url));
  let prazo: number | undefined;
  try {
    return await new Promise<RespostaEdicaoNativaPdf>((resolve, reject) => {
      prazo = window.setTimeout(() => reject(new Error("PDFIUM")), 45000);
      worker.onmessage = (evento: MessageEvent<RespostaEdicaoNativaPdf>) => resolve(evento.data);
      worker.onerror = () => reject(new Error("PDFIUM"));
      const copia = bytes.slice().buffer;
      const pedido: PedidoEdicaoNativaPdf = { bytes: copia, pagina, operacao };
      worker.postMessage(pedido, [copia]);
    });
  } finally {
    window.clearTimeout(prazo);
    worker.terminate();
  }
}
