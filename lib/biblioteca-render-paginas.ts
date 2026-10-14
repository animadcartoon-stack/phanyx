import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { CachePaginasLeitor } from "./biblioteca-cache-paginas";

export type FacePdfPreparada = {
  canvas: HTMLCanvasElement;
  page: PDFPageProxy;
  viewport: ReturnType<PDFPageProxy["getViewport"]>;
  quadro: { x: number; y: number; w: number; h: number };
};

/** Uma sessão por documento, tamanho e zoom. As páginas próximas são descartáveis. */
export class SessaoPaginasPdf {
  private cache = new CachePaginasLeitor<FacePdfPreparada>();
  private pendentes = new Map<number, Promise<FacePdfPreparada>>();
  private tarefas = new Set<{ cancel(): void }>();
  private ativa = true;
  constructor(readonly pdf: PDFDocumentProxy, readonly largura: number, readonly altura: number, readonly ratio: number) {}

  obter(numero: number): FacePdfPreparada | undefined { return this.cache.obter(numero); }

  preparar(numero: number): Promise<FacePdfPreparada> {
    const pronta = this.obter(numero);
    if (pronta) return Promise.resolve(pronta);
    const pendente = this.pendentes.get(numero);
    if (pendente) return pendente;
    const promessa = this.desenhar(numero).then((face) => {
      if (this.ativa) this.cache.guardar(numero, face, face.canvas.width * face.canvas.height);
      return face;
    }).finally(() => { this.pendentes.delete(numero); });
    this.pendentes.set(numero, promessa);
    return promessa;
  }

  private conferir() {
    if (!this.ativa) { const erro = new Error("RENDER_CANCELADO"); erro.name = "RenderingCancelledException"; throw erro; }
  }

  private async desenhar(numero: number): Promise<FacePdfPreparada> {
    this.conferir();
    const page = await this.pdf.getPage(numero); this.conferir();
    const tamanho = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(this.largura / tamanho.width, this.altura / tamanho.height) });
    const x = (this.largura - viewport.width) / 2, y = (this.altura - viewport.height) / 2;
    const quadro = { x: x / this.largura, y: y / this.altura, w: viewport.width / this.largura, h: viewport.height / this.altura };
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(this.largura * this.ratio)); canvas.height = Math.max(1, Math.floor(this.altura * this.ratio));
    canvas.style.width = `${this.largura}px`; canvas.style.height = `${this.altura}px`;
    canvas.dataset.contentX = String(quadro.x); canvas.dataset.contentY = String(quadro.y);
    canvas.dataset.contentWidth = String(quadro.w); canvas.dataset.contentHeight = String(quadro.h);
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("CANVAS_INDISPONIVEL");
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tarefa = page.render({ canvasContext: ctx, canvas, viewport, transform: [this.ratio, 0, 0, this.ratio, x * this.ratio, y * this.ratio] });
    this.tarefas.add(tarefa);
    try { await tarefa.promise; } finally { this.tarefas.delete(tarefa); }
    this.conferir();
    return { canvas, page, viewport, quadro };
  }

  destruir(): void {
    this.ativa = false; this.tarefas.forEach((tarefa) => tarefa.cancel()); this.tarefas.clear();
    this.pendentes.clear(); this.cache.limpar();
  }
}
