"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask, PageViewport } from "pdfjs-dist";
import { carregarBibliotecaPdf, obterWorkerBibliotecaPdf, raizPdfBiblioteca } from "@/lib/biblioteca-pdf-client";
import { localizarTermoPdf } from "@/lib/biblioteca-busca-pdf";

export type PontoPdf = { x: number; y: number };

type Props = {
  url: string;
  pagina?: number;
  onPagina?: (pagina: number) => void;
  onPonto?: (ponto: PontoPdf) => void;
  ponto?: PontoPdf | null;
};

export const botaoLeitorPdf = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-600";

export default function LeitorPdfDocumento({ url, pagina, onPagina, onPonto, ponto }: Props) {
  const t = useTranslations("ReaderLibrary");
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pagInterna, setPagInterna] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [tentativa, setTentativa] = useState(0);
  const [falha, setFalha] = useState(false);
  const [largura, setLargura] = useState(0);
  const [termo, setTermo] = useState("");
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<number[] | "erro" | null>(null);
  const quadro = useRef<HTMLDivElement>(null);
  const paginaRenderizada = useRef<{ canvas: HTMLCanvasElement; viewport: PageViewport } | null>(null);
  const [viewportAtual, setViewportAtual] = useState<PageViewport | null>(null);
  const numero = Math.min(pagina ?? pagInterna, pdf?.numPages ?? 1);

  useEffect(() => {
    let ativo = true;
    let tarefa: PDFDocumentLoadingTask | null = null;
    setFalha(false);
    setPdf(null);
    setPagInterna(1);
    setBusca("");
    async function carregar() {
      try {
        const [lib, worker] = await Promise.all([carregarBibliotecaPdf(), obterWorkerBibliotecaPdf()]);
        if (!ativo) return;
        tarefa = lib.getDocument({
          url, worker, withCredentials: true, disableRange: true, isEvalSupported: false,
          cMapUrl: `${raizPdfBiblioteca}/cmaps/`, cMapPacked: true,
          standardFontDataUrl: `${raizPdfBiblioteca}/standard_fonts/`,
          wasmUrl: `${raizPdfBiblioteca}/wasm/`,
        });
        const documento = await tarefa.promise;
        if (ativo) setPdf(documento);
      } catch {
        if (ativo) setFalha(true);
      }
    }
    void carregar();
    return () => {
      ativo = false;
      if (tarefa) void tarefa.destroy().catch(() => undefined);
    };
  }, [url, tentativa]);

  useEffect(() => {
    const elemento = quadro.current;
    if (!elemento) return;
    const observador = new ResizeObserver(() => setLargura(elemento.clientWidth));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const elemento = quadro.current;
    if (!pdf || !elemento || !largura || !numero) return;
    let ativo = true;
    let render: RenderTask | null = null;
    const canvas = document.createElement("canvas");
    canvas.className = "mx-auto block bg-white shadow";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", String(numero));
    paginaRenderizada.current = null;
    setViewportAtual(null);
    elemento.replaceChildren();
    async function desenhar() {
      try {
        const paginaPdf = await pdf!.getPage(numero);
        if (!ativo) return;
        const natural = paginaPdf.getViewport({ scale: 1 });
        const escala = Math.min((Math.min(largura, 1050) - 12) / natural.width * zoom / 100, 3000 / natural.height, 2600 / natural.width);
        const viewport = paginaPdf.getViewport({ scale: escala });
        const dpr = Math.min(window.devicePixelRatio || 1, 2, 4096 / Math.max(viewport.width, viewport.height));
        canvas.width = Math.ceil(viewport.width * dpr);
        canvas.height = Math.ceil(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        render = paginaPdf.render({ canvas, viewport, transform: [dpr, 0, 0, dpr, 0, 0] });
        await render.promise;
        if (!ativo) return;
        elemento!.replaceChildren(canvas);
        paginaRenderizada.current = { canvas, viewport };
        setViewportAtual(viewport);
      } catch {
        if (ativo) setFalha(true);
      }
    }
    if (largura > 24) void desenhar();
    return () => {
      ativo = false;
      render?.cancel();
      canvas.remove();
    };
  }, [pdf, numero, zoom, largura]);

  useEffect(() => {
    setResultado(null);
    if (!pdf || !busca) return;
    let ativo = true;
    async function pesquisar() {
      try {
        const paginas: number[] = [];
        for (let n = 1; ativo && n <= pdf!.numPages; n++) {
          const paginaPdf = await pdf!.getPage(n);
          const { items } = await paginaPdf.getTextContent();
          const texto = items.map(item => "str" in item ? item.str : "").join(" ");
          if (localizarTermoPdf(texto, busca, 1).length) paginas.push(n);
        }
        if (ativo) setResultado(paginas);
      } catch {
        if (ativo) setResultado("erro");
      }
    }
    void pesquisar();
    return () => { ativo = false; };
  }, [pdf, busca]);

  function navegar(valor: number) {
    if (!pdf || !Number.isInteger(valor) || valor < 1 || valor > pdf.numPages) return;
    setPagInterna(valor);
    onPagina?.(valor);
  }

  const marca = ponto && viewportAtual ? viewportAtual.convertToViewportPoint(ponto.x, ponto.y) : null;
  return (
    <section className="min-w-0 space-y-3">
      {falha && <div role="alert" className="flex flex-wrap items-center gap-3">
        <span>{t("documentError")}</span>
        <button type="button" className={botaoLeitorPdf} onClick={() => setTentativa(v => v + 1)}>{t("retry")}</button>
      </div>}
      {!pdf && !falha && <p role="status" className="text-sm">{t("loadingDocument")}</p>}
      {pdf && !falha && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={botaoLeitorPdf} disabled={numero === 1} onClick={() => navegar(numero - 1)} aria-label={t("previousPage")}>‹</button>
            <label className="flex items-center gap-2 text-sm">{t("pageLabel")}
              <input type="number" min={1} max={pdf.numPages} value={numero} onChange={e => navegar(Number(e.target.value))}
                className="w-16 rounded-lg border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600" />
              / {pdf.numPages}
            </label>
            <button type="button" className={botaoLeitorPdf} disabled={numero >= pdf.numPages} onClick={() => navegar(numero + 1)} aria-label={t("nextPage")}>›</button>
            <button type="button" className={botaoLeitorPdf} disabled={zoom <= 50} onClick={() => setZoom(v => v - 25)} aria-label={t("zoomOut")}>−</button>
            <button type="button" className={botaoLeitorPdf} onClick={() => setZoom(100)} aria-label={t("fitPage")}>{zoom}%</button>
            <button type="button" className={botaoLeitorPdf} disabled={zoom >= 200} onClick={() => setZoom(v => v + 25)} aria-label={t("zoomIn")}>+</button>
          </div>
          {!onPonto && <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setBusca(termo.trim()); }}>
            <input type="search" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
              aria-label={t("documentSearch")} placeholder={t("documentSearch")} maxLength={120} value={termo}
              onChange={e => { setTermo(e.target.value); if (!e.target.value) setBusca(""); }} />
            <button className={botaoLeitorPdf}>{t("search")}</button>
          </form>}
          {busca && <div className="flex flex-wrap items-center gap-2 text-sm" role="status">
            {resultado === null ? t("searching") : resultado === "erro" ? t("searchError") :
              resultado.length === 0 ? t("noTextResults") : resultado.map(n => (
                <button type="button" className={botaoLeitorPdf} key={n} onClick={() => navegar(n)}>{t("pageLabel")} {n}</button>
              ))}
          </div>}
        </>
      )}
      <div className="max-h-[72vh] overflow-auto rounded-lg bg-slate-100 dark:bg-slate-950" hidden={falha}>
        <div className="relative min-h-40 py-2">
          <div ref={quadro} className={onPonto ? "cursor-crosshair" : undefined} onClick={onPonto ? e => {
            const atual = paginaRenderizada.current;
            if (!atual || e.target !== atual.canvas) return;
            const borda = atual.canvas.getBoundingClientRect();
            const [x, y] = atual.viewport.convertToPdfPoint(e.clientX - borda.left, e.clientY - borda.top);
            onPonto({ x, y });
          } : undefined} />
          {marca && viewportAtual && <div aria-hidden className="pointer-events-none absolute top-2"
            style={{ width: viewportAtual.width, left: Math.max(0, (largura - viewportAtual.width) / 2) }}>
            <span className="absolute h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white"
              style={{ left: marca[0] - 6, top: marca[1] - 6 }} />
          </div>}
        </div>
      </div>
    </section>
  );
}
