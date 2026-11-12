"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask, PageViewport, TextLayer } from "pdfjs-dist";
import { carregarBibliotecaPdf, obterWorkerBibliotecaPdf, raizPdfBiblioteca } from "@/lib/biblioteca-pdf-client";
import { localizarTermoPdf } from "@/lib/biblioteca-busca-pdf";
import { areasSelecaoPdf, type AreaAnotacaoLeitor } from "@/lib/biblioteca-anotacoes-leitor";
import { CORES_MARCACOES, pintarMarcacoesPdf } from "@/lib/biblioteca-cores-marcacoes";
import { textosMarcadoresPdf } from "@/lib/documentos-docentes/i18n-marcadores-pdf";
import styles from "./LeitorPdfDocumento.module.css";
import type { AreaVisualPdf } from "@/lib/documentos-docentes/operacoes-visuais-pdf";

export type PontoPdf = { x: number; y: number };

type Props = {
  url: string;
  pagina?: number;
  onPagina?: (pagina: number) => void;
  onPonto?: (ponto: PontoPdf) => void;
  onArea?: (area: AreaVisualPdf | null) => void;
  area?: AreaVisualPdf | null;
  ponto?: PontoPdf | null;
  onPdfPronto?: (pdf: PDFDocumentProxy | null) => void;
  permitirMarcacoes?: boolean;
};

type Destaque = { cor: string; areas: AreaAnotacaoLeitor[] };
type PaginaRenderizada = {
  canvas: HTMLCanvasElement;
  viewport: PageViewport;
  paginaPdf: PDFPageProxy;
  original?: HTMLCanvasElement;
};

const coresExtras = ["#ff8a26", "#2ea8ff", "#a56bff", "#ff3b3b", "#bdff00", "#00efc4"];

export const botaoLeitorPdf = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-600";

export default function LeitorPdfDocumento({ url, pagina, onPagina, onPonto, ponto, onArea, area, onPdfPronto, permitirMarcacoes = false }: Props) {
  const t = useTranslations("ReaderLibrary");
  const textosMarcacao = textosMarcadoresPdf(useLocale());
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
  const arraste = useRef<{ id: number; inicio: PontoPdf } | null>(null);
  const [areaArrastada, setAreaArrastada] = useState<AreaVisualPdf | null>(null);
  const folha = useRef<HTMLDivElement>(null);
  const camadaTexto = useRef<HTMLDivElement>(null);
  const paginaRenderizada = useRef<PaginaRenderizada | null>(null);
  const [viewportAtual, setViewportAtual] = useState<PageViewport | null>(null);
  const numero = Math.min(pagina ?? pagInterna, pdf?.numPages ?? 1);
  const [marcaTexto, setMarcaTexto] = useState(false);
  const [cor, setCor] = useState(CORES_MARCACOES.AMARELO);
  const [destaques, setDestaques] = useState<Record<number, Destaque[]>>({});
  const [selecao, setSelecao] = useState<AreaAnotacaoLeitor[]>([]);
  const [textoPronto, setTextoPronto] = useState<boolean | null>(null);
  const selecionandoArea = Boolean(onArea);
  const podeMarcar = permitirMarcacoes && !onPonto && !selecionandoArea;
  const selecionarTexto = podeMarcar && marcaTexto;
  const destaquesPagina = destaques[numero];

  useEffect(() => {
    setDestaques({});
    setMarcaTexto(false);
  }, [url]);

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
    arraste.current = null;
    setAreaArrastada(null);
  }, [selecionandoArea, numero, url, zoom, largura]);

  useEffect(() => {
    onPdfPronto?.(pdf);
    return () => onPdfPronto?.(null);
  }, [pdf, onPdfPronto]);

  useEffect(() => {
    const elemento = quadro.current;
    if (!elemento) return;
    const observador = new ResizeObserver(() => setLargura(elemento.clientWidth));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const elemento = folha.current;
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
        paginaRenderizada.current = { canvas, viewport, paginaPdf };
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
    const atual = paginaRenderizada.current;
    if (!atual || atual.viewport !== viewportAtual) return;
    const marcacoes = podeMarcar ? destaquesPagina ?? [] : [];
    if (!atual.original && !marcacoes.length) return;
    const ctx = atual.canvas.getContext("2d");
    if (!ctx) return;
    if (!atual.original) {
      const original = document.createElement("canvas");
      original.width = atual.canvas.width;
      original.height = atual.canvas.height;
      const ctxOriginal = original.getContext("2d");
      if (!ctxOriginal) return;
      ctxOriginal.drawImage(atual.canvas, 0, 0);
      atual.original = original;
    }
    pintarMarcacoesPdf(ctx, atual.original, { x: 0, y: 0, w: 1, h: 1 }, marcacoes);
  }, [viewportAtual, podeMarcar, destaquesPagina]);

  useEffect(() => {
    setSelecao([]);
    setTextoPronto(null);
    const atual = paginaRenderizada.current;
    const camada = camadaTexto.current;
    if (!selecionarTexto || !camada || !atual || atual.viewport !== viewportAtual) return;
    const { paginaPdf, viewport, canvas } = atual;
    let ativo = true;
    let layer: TextLayer | null = null;

    async function montarTexto() {
      const lib = await carregarBibliotecaPdf();
      if (!ativo || !camada) return;
      camada.style.setProperty("--total-scale-factor", String(viewport.scale * paginaPdf.userUnit));
      layer = new lib.TextLayer({ textContentSource: paginaPdf.streamTextContent(), container: camada, viewport });
      await layer.render();
      if (ativo) setTextoPronto(Boolean(camada.textContent?.trim()));
    }

    function capturarSelecao() {
      const selecionado = window.getSelection();
      if (!selecionado || selecionado.isCollapsed || !selecionado.rangeCount || !selecionado.toString().trim()) {
        setSelecao([]);
        return;
      }
      const trecho = selecionado.getRangeAt(0);
      setSelecao(camada?.contains(trecho.commonAncestorContainer) ? areasSelecaoPdf(trecho, canvas) : []);
    }

    void montarTexto().catch(() => { if (ativo) setTextoPronto(false); });
    document.addEventListener("selectionchange", capturarSelecao);
    return () => {
      ativo = false;
      layer?.cancel();
      camada.replaceChildren();
      document.removeEventListener("selectionchange", capturarSelecao);
    };
  }, [viewportAtual, selecionarTexto]);

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

  function destacar() {
    if (!selecao.length) return;
    setDestaques(atuais => ({ ...atuais, [numero]: [...(atuais[numero] ?? []), { cor, areas: selecao }] }));
    setSelecao([]);
    window.getSelection()?.removeAllRanges();
  }

  function desfazerDestaque() {
    setDestaques(atuais => ({ ...atuais, [numero]: atuais[numero]?.slice(0, -1) ?? [] }));
  }

  function pontoNaArea(e: PointerEvent<HTMLDivElement>): PontoPdf | null {
    const borda = paginaRenderizada.current?.canvas.getBoundingClientRect();
    if (!borda?.width || !borda.height) return null;
    return {
      x: Math.max(0, Math.min(1, (e.clientX - borda.left) / borda.width)),
      y: Math.max(0, Math.min(1, (e.clientY - borda.top) / borda.height)),
    };
  }

  function calcularArea(e: PointerEvent<HTMLDivElement>): AreaVisualPdf | null {
    const inicio = arraste.current;
    const fim = pontoNaArea(e);
    if (!inicio || inicio.id !== e.pointerId || !fim) return null;
    return {
      x: Math.min(inicio.inicio.x, fim.x),
      y: Math.min(inicio.inicio.y, fim.y),
      largura: Math.abs(inicio.inicio.x - fim.x),
      altura: Math.abs(inicio.inicio.y - fim.y),
    };
  }

  function iniciarArea(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || e.target !== paginaRenderizada.current?.canvas) return;
    const inicio = pontoNaArea(e);
    if (!inicio) return;
    arraste.current = { id: e.pointerId, inicio };
    e.currentTarget.setPointerCapture(e.pointerId);
    onArea?.(null);
  }

  function finalizarArea(e: PointerEvent<HTMLDivElement>) {
    const resultado = calcularArea(e);
    arraste.current = null;
    setAreaArrastada(null);
    if (resultado && resultado.largura > 0 && resultado.altura > 0) onArea?.(resultado);
  }

  const retangulo = selecionandoArea ? areaArrastada ?? area : null;
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
            {podeMarcar && <button type="button" className={botaoLeitorPdf} aria-pressed={marcaTexto}
              onClick={() => setMarcaTexto(ativo => !ativo)}>{textosMarcacao.marcaTexto}</button>}
          </div>
          {selecionarTexto && <div className="space-y-2 rounded-lg border border-slate-300 p-2 dark:border-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1" role="group" aria-label={textosMarcacao.marcaTexto}>
                {[
                  ...Object.entries(CORES_MARCACOES).map(([codigo, valor]) => ({ valor, nome: t(`highlightColors.${codigo}`) })),
                  ...coresExtras.map((valor, indice) => ({ valor, nome: textosMarcacao.cores[indice] })),
                ].map(({ valor, nome }) => (
                  <button type="button" key={valor} className={`grid h-9 w-9 place-items-center rounded-md border ${cor === valor ? "border-blue-600 ring-1 ring-blue-600" : "border-transparent"}`}
                    aria-label={t("annotationTools.penColor", { color: nome })} aria-pressed={cor === valor} title={nome}
                    onMouseDown={e => e.preventDefault()} onClick={() => setCor(valor)}>
                    <span aria-hidden className="h-5 w-5 rounded-sm border border-slate-500" style={{ backgroundColor: valor }} />
                  </button>
                ))}
              </div>
              <button type="button" className={botaoLeitorPdf} disabled={!textoPronto || !selecao.length}
                onMouseDown={e => e.preventDefault()} onClick={destacar}>{t("highlightSelection")}</button>
              <button type="button" className={botaoLeitorPdf} disabled={!destaquesPagina?.length}
                onClick={desfazerDestaque}>{textosMarcacao.desfazer}</button>
            </div>
            <p className="text-sm" role="status">{textoPronto === false ? textosMarcacao.semTexto : textosMarcacao.selecione}</p>
          </div>}
          {!onPonto && !selecionandoArea && <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setBusca(termo.trim()); }}>
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
        <div ref={quadro} className="relative min-h-40 py-2">
          <div ref={folha}
            className={selecionandoArea ? "touch-none cursor-crosshair select-none" : onPonto ? "cursor-crosshair" : undefined}
            onPointerDown={selecionandoArea ? iniciarArea : undefined}
            onPointerMove={selecionandoArea ? e => { if (arraste.current) setAreaArrastada(calcularArea(e)); } : undefined}
            onPointerUp={selecionandoArea ? finalizarArea : undefined}
            onLostPointerCapture={selecionandoArea ? () => { arraste.current = null; setAreaArrastada(null); } : undefined}
            onClick={onPonto ? e => {
            const atual = paginaRenderizada.current;
            if (!atual || e.target !== atual.canvas) return;
            const borda = atual.canvas.getBoundingClientRect();
            const [x, y] = atual.viewport.convertToPdfPoint(e.clientX - borda.left, e.clientY - borda.top);
            onPonto({ x, y });
          } : undefined} />
          {selecionarTexto && viewportAtual && <div ref={camadaTexto} className={styles.camadaTexto}
            style={{ top: 8, left: Math.max(0, (largura - viewportAtual.width) / 2) }} />}
          {retangulo && viewportAtual && <div aria-hidden data-pdf-area="true"
            className="pointer-events-none absolute z-10 border-2 border-blue-600 bg-blue-400/20"
            style={{
              left: Math.max(0, (largura - viewportAtual.width) / 2) + retangulo.x * viewportAtual.width,
              top: 8 + retangulo.y * viewportAtual.height,
              width: retangulo.largura * viewportAtual.width,
              height: retangulo.altura * viewportAtual.height,
            }} />}
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
