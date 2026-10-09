"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pacotePdf from "pdfjs-dist/package.json";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";
import { LIMITE_TRECHO_BIBLIOTECA, LIMITE_PAGINAS_BIBLIOTECA } from "@/lib/biblioteca-direitos-leitura";
import styles from "./BibliotecaLeitor.module.css";
import "./leitor-print.css";

type Area = { x: number; y: number; largura: number; altura: number };
type Anotacao = { id: string; tipo: "MARCADOR" | "DESTAQUE" | "NOTA"; pagina: number; trecho: string | null; conteudo: string | null; cor: string; areas: Area[] };
const cores: Record<string, string> = { AMARELO: "#fde047", VERDE: "#86efac", AZUL: "#93c5fd", ROSA: "#f9a8d4" };
type PdfLib = typeof import("pdfjs-dist");
// ESM servido pela própria aplicação evita a incompatibilidade do PDF.js com o webpack do Next 14.
function carregarBibliotecaPdf(): Promise<PdfLib> {
  const fonte = `/biblioteca/pdfjs/pdf.min.mjs?v=${pacotePdf.version}`;
  return import(/* webpackIgnore: true */ fonte) as Promise<PdfLib>;
}

export default function LeitorPdfBiblioteca({ arquivoId, titulo, voltar, direitos, downloadId, usuarioId, bloqueado }: {
  arquivoId: number; titulo: string; voltar: string; direitos: { copiarTrecho: boolean; imprimir: boolean };
  downloadId: number | null; usuarioId: number; bloqueado: boolean;
}) {
  const t = useTranslations("ReaderLibrary"); const base = `/api/biblioteca/arquivos/${arquivoId}`;
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null); const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0); const [zoom, setZoom] = useState(1); const [largura, setLargura] = useState(700);
  const [dimensoes, setDimensoes] = useState({ width: 0, height: 0 });
  const [carregando, setCarregando] = useState(true); const [renderizando, setRenderizando] = useState(false);
  const [falhaDocumento, setFalhaDocumento] = useState(false); const [tentativa, setTentativa] = useState(0);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [rascunhos, setRascunhos] = useState<Record<number, string>>({});
  const textoNota = rascunhos[pagina] || "";
  function setTextoNota(valor: string) { setRascunhos((notas) => ({ ...notas, [pagina]: valor })); }
  const [selecao, setSelecao] = useState<{ trecho: string; areas: Area[]; pagina: number } | null>(null);
  const [cor, setCor] = useState("AMARELO"); const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(""); const [tipoMensagem, setTipoMensagem] = useState<"erro" | "info">("erro");
  const [busca, setBusca] = useState(""); const [buscando, setBuscando] = useState(false); const [buscou, setBuscou] = useState(false);
  const [resultados, setResultados] = useState<{ pagina: number; trecho: string }[]>([]);
  const [restricoes, setRestricoes] = useState({ copiar: true, imprimir: true });
  const [estadoProgresso, setEstadoProgresso] = useState("ready");
  const canvas = useRef<HTMLCanvasElement>(null); const texto = useRef<HTMLDivElement>(null);
  const folha = useRef<HTMLDivElement>(null); const documento = useRef<HTMLDivElement>(null);
  const filaProgresso = useRef<Promise<void>>(Promise.resolve()); const numeroBusca = useRef(0);
  const textosPaginas = useRef(new Map<number, string>());
  const podeCopiar = direitos.copiarTrecho && restricoes.copiar;
  const podeImprimir = direitos.imprimir && restricoes.imprimir;

  function avisar(chave: string, erro = true) { setTipoMensagem(erro ? "erro" : "info"); setMensagem(t(chave)); }

  useEffect(() => {
    const controller = new AbortController(); let ativo = true;
    let loading: ReturnType<PdfLib["getDocument"]> | null = null;
    setCarregando(true); setFalhaDocumento(false); setPdf(null); setTotal(0); textosPaginas.current.clear(); numeroBusca.current++;
    async function carregar() {
      try {
        const lib = await carregarBibliotecaPdf(); if (!ativo) return;
        lib.GlobalWorkerOptions.workerSrc = `/biblioteca/pdfjs/pdf.worker.min.mjs?v=${lib.version}`;
        loading = lib.getDocument({ url: `${base}/conteudo`, withCredentials: true, disableRange: true,
          isEvalSupported: false, cMapUrl: "/biblioteca/pdfjs/cmaps/", cMapPacked: true,
          standardFontDataUrl: "/biblioteca/pdfjs/standard_fonts/", wasmUrl: "/biblioteca/pdfjs/wasm/" });
        const [doc, resProgresso, resAnotacoes] = await Promise.all([
          loading.promise,
          fetch(`${base}/progresso`, { cache: "no-store", signal: controller.signal }),
          fetch(`${base}/anotacoes`, { cache: "no-store", signal: controller.signal }),
        ]);
        if (!resProgresso.ok || !resAnotacoes.ok || doc.numPages > LIMITE_PAGINAS_BIBLIOTECA) throw new Error();
        const [p, a, permissoes] = await Promise.all([resProgresso.json(), resAnotacoes.json(), doc.getPermissions()]);
        if (!ativo) return;
        setRestricoes({ copiar: permissoes === null || permissoes.includes(lib.PermissionFlag.COPY),
          imprimir: permissoes === null || permissoes.includes(lib.PermissionFlag.PRINT) || permissoes.includes(lib.PermissionFlag.PRINT_HIGH_QUALITY) });
        setAnotacoes(a.anotacoes); setTotal(doc.numPages); setPagina(Math.min(doc.numPages, Math.max(1, p.progresso?.paginaAtual || 1))); setPdf(doc);
      } catch (erro) {
        if (ativo) {
          if (process.env.NODE_ENV === "development") console.error("Biblioteca PDF:", erro);
          setFalhaDocumento(true);
        }
      }
      finally { if (ativo) setCarregando(false); }
    }
    void carregar();
    return () => { ativo = false; controller.abort(); numeroBusca.current++; void loading?.destroy(); };
  }, [base, tentativa]);

  useEffect(() => {
    if (!documento.current) return;
    const observer = new ResizeObserver((entries) => setLargura(Math.max(200, entries[0].contentRect.width - 32)));
    observer.observe(documento.current); return () => observer.disconnect();
  }, [carregando]);

  useEffect(() => {
    if (!pdf || !canvas.current || !texto.current) return;
    let ativo = true; let render: { cancel(): void; promise: Promise<void> } | undefined;
    let layer: { cancel(): void; render(): Promise<void> } | undefined;
    setRenderizando(true); setSelecao(null);
    async function desenhar() {
      try {
        const [page, lib] = await Promise.all([pdf!.getPage(pagina), carregarBibliotecaPdf()]);
        if (!ativo || !canvas.current || !texto.current) return;
        const original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(3, largura / original.width * zoom) });
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16000000 / (viewport.width * viewport.height)));
        const ctx = canvas.current.getContext("2d"); if (!ctx) throw new Error();
        canvas.current.width = Math.floor(viewport.width * ratio); canvas.current.height = Math.floor(viewport.height * ratio);
        canvas.current.style.width = `${viewport.width}px`; canvas.current.style.height = `${viewport.height}px`;
        setDimensoes({ width: viewport.width, height: viewport.height });
        render = page.render({ canvasContext: ctx, canvas: canvas.current, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
        await render.promise; if (!ativo || !texto.current) return;
        const textContent = await page.getTextContent();
        if (!ativo || !texto.current) return;
        texto.current.replaceChildren(); texto.current.style.setProperty("--scale-factor", String(viewport.scale));
        texto.current.style.setProperty("--total-scale-factor", String(viewport.scale * page.userUnit));
        layer = new lib.TextLayer({ textContentSource: textContent, container: texto.current, viewport });
        await layer.render();
      } catch (erro) { if (ativo && (erro as Error)?.name !== "RenderingCancelledException") setFalhaDocumento(true); }
      finally { if (ativo) setRenderizando(false); }
    }
    void desenhar(); return () => { ativo = false; render?.cancel(); layer?.cancel(); };
  }, [pdf, pagina, zoom, largura]);

  const gravarProgresso = useCallback((atual: number, totalPaginas: number) => {
    if (bloqueado || !totalPaginas) return;
    setEstadoProgresso("saving");
    filaProgresso.current = filaProgresso.current.catch(() => {}).then(async () => {
      try {
        const res = await fetch(`${base}/progresso`, { method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paginaAtual: atual, totalPaginas }), keepalive: true });
        if ([401, 403, 404].includes(res.status)) setFalhaDocumento(true);
        if (!res.ok) throw new Error(); setEstadoProgresso("saved");
      } catch { setEstadoProgresso("failed"); }
    });
  }, [base, bloqueado]);
  useEffect(() => { if (pdf) gravarProgresso(pagina, total); }, [pdf, pagina, total, gravarProgresso]);

  useEffect(() => {
    document.body.dataset.bibliotecaSemImpressao = String(!podeImprimir);
    function atalhos(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "p" && !podeImprimir) evento.preventDefault();
    }
    document.addEventListener("keydown", atalhos);
    return () => { delete document.body.dataset.bibliotecaSemImpressao; document.removeEventListener("keydown", atalhos); };
  }, [podeImprimir]);

  function capturarSelecao() {
    const selected = window.getSelection();
    if (!selected || selected.isCollapsed || !selected.rangeCount || !texto.current || !folha.current) { setSelecao(null); return; }
    const range = selected.getRangeAt(0);
    if (!texto.current.contains(range.commonAncestorContainer)) { setSelecao(null); return; }
    const trecho = selected.toString().trim(); if (!trecho || trecho.length > 2000) { setSelecao(null); return; }
    const bounds = folha.current.getBoundingClientRect();
    const areas = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1).slice(0, 100).map((r) => {
      const x = Math.max(0, Math.min(1, (r.left - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (r.top - bounds.top) / bounds.height));
      return { x, y, largura: Math.min(1 - x, r.width / bounds.width), altura: Math.min(1 - y, r.height / bounds.height) };
    }).filter((r) => r.largura > 0 && r.altura > 0);
    setSelecao({ trecho, areas, pagina });
  }
  function citar(trecho: string) { return `${trecho}\n\n${titulo} — ${t("pageCitation", { page: pagina })}`; }
  async function copiar() {
    if (!podeCopiar || !selecao || selecao.trecho.length > LIMITE_TRECHO_BIBLIOTECA) { avisar("copyRestricted", false); return; }
    try { await navigator.clipboard.writeText(citar(selecao.trecho)); avisar("excerptCopied", false); } catch { avisar("copyError"); }
  }
  async function anotar(tipo: Anotacao["tipo"]) {
    if (bloqueado) return;
    setSalvando(true);
    try {
      const res = await fetch(`${base}/anotacoes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        tipo, pagina, cor, trecho: tipo === "DESTAQUE" ? selecao?.trecho : null,
        areas: tipo === "DESTAQUE" ? selecao?.areas : [], conteudo: tipo === "NOTA" ? textoNota : null,
      }) });
      if (!res.ok) throw new Error(); const data = await res.json();
      setAnotacoes((lista) => [...lista.filter((a) => a.id !== data.anotacao.id), data.anotacao].sort((a, b) => a.pagina - b.pagina));
      if (tipo === "NOTA") setTextoNota(""); setSelecao(null); window.getSelection()?.removeAllRanges();
    } catch { avisar("annotationError"); } finally { setSalvando(false); }
  }
  async function remover(id: string) {
    setSalvando(true);
    try {
      const res = await fetch(`${base}/anotacoes`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error(); setAnotacoes((lista) => lista.filter((a) => a.id !== id));
    } catch { avisar("annotationError"); } finally { setSalvando(false); }
  }
  async function pesquisar() {
    if (!pdf || !busca.trim()) return;
    const numero = ++numeroBusca.current; setBuscando(true); setBuscou(false); setResultados([]);
    const encontrados: { pagina: number; trecho: string }[] = []; const termo = busca.trim().toLocaleLowerCase();
    try {
      for (let p = 1; p <= pdf.numPages && encontrados.length < 100; p++) {
        if (numero !== numeroBusca.current) return;
        let conteudo = textosPaginas.current.get(p);
        if (conteudo === undefined) {
          const page = await pdf.getPage(p); const textoPagina = await page.getTextContent();
          conteudo = textoPagina.items.map((item) => "str" in item ? item.str : "").join(" ");
          if (textosPaginas.current.size < 1000) textosPaginas.current.set(p, conteudo);
        }
        const index = conteudo.toLocaleLowerCase().indexOf(termo);
        if (index >= 0) encontrados.push({ pagina: p, trecho: conteudo.slice(Math.max(0, index - 45), index + termo.length + 75) });
        if (p % 10 === 0) await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      if (numero === numeroBusca.current) { setResultados(encontrados); setBuscou(true); }
    } catch { if (numero === numeroBusca.current) avisar("searchError"); }
    finally { if (numero === numeroBusca.current) setBuscando(false); }
  }
  function ir(p: number) { if (Number.isInteger(p) && p >= 1 && p <= total) { setSelecao(null); setPagina(p); } }

  return <section className={styles.root}>
    <header className={styles.card}><Link className={styles.button} href={voltar}>{t("back")}</Link><h1 style={{ marginTop: 12 }}>{titulo}</h1>
      <p className={styles.muted}>{t("readerIntro")}</p>
      <details className={styles.notice}><summary>{t("rightsTitle")}</summary><p>{t("rightsNotice")}</p><p>{t("readerRights")}</p></details>
    </header>
    {carregando && <p role="status">{t("loadingDocument")}</p>}
    {falhaDocumento && <div className={styles.card}><p className={styles.error} role="alert">{t("documentError")}</p><button className={styles.button} onClick={() => setTentativa((x) => x + 1)}>{t("retry")}</button></div>}
    {pdf && !falhaDocumento && <>
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <button className={styles.button} disabled={pagina === 1 || renderizando} onClick={() => ir(pagina - 1)}>{t("previousPage")}</button>
          <label>{t("pageLabel")}<input className={styles.smallInput} type="number" min={1} max={total} value={pagina} onChange={(e) => ir(Number(e.target.value))} /></label>
          <span>{t("pageTotal", { total })}</span>
          <button className={styles.button} disabled={pagina === total || renderizando} onClick={() => ir(pagina + 1)}>{t("nextPage")}</button>
          <label>{t("zoom")}<select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>{[.75, 1, 1.25, 1.5, 2].map((v) => <option value={v} key={v}>{Math.round(v * 100)}%</option>)}</select></label>
          {downloadId && <a className={styles.button} href={`/api/biblioteca/arquivos/${downloadId}/download`}>{t("downloadPdf")}</a>}
          {podeImprimir && <button className={styles.button} onClick={() => window.print()}>{t("printPage")}</button>}
        </div>
        <p className={styles.muted} role="status">{t(`progressState.${bloqueado ? "readOnly" : estadoProgresso}`)}</p>
        {estadoProgresso === "failed" && <button className={styles.button} onClick={() => gravarProgresso(pagina, total)}>{t("retrySave")}</button>}
        <form className={styles.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); void pesquisar(); }}>
          <label className={styles.hidden} htmlFor="pesquisa-pdf">{t("documentSearch")}</label><input id="pesquisa-pdf" placeholder={t("documentSearch")} value={busca} maxLength={100} onChange={(e) => { numeroBusca.current++; setBuscando(false); setBuscou(false); setBusca(e.target.value); }} />
          <button className={styles.button} disabled={buscando || !busca.trim()}>{t(buscando ? "searching" : "search")}</button>
          {buscando && <button type="button" className={styles.button} onClick={() => { numeroBusca.current++; setBuscando(false); }}>{t("cancel")}</button>}
        </form>
        {buscou && <p role="status">{t(resultados.length ? "searchResults" : "noTextResults", { count: resultados.length })}</p>}
        <div className={styles.results}>{resultados.map((r) => <button className={styles.button} style={{ display: "block", textAlign: "left", width: "100%" }} key={r.pagina} onClick={() => ir(r.pagina)}>{t("pageCitation", { page: r.pagina })}: {r.trecho}</button>)}</div>
      </div>
      <div className={styles.readerLayout}>
        <div className={styles.document} ref={documento} aria-label={t("documentPage", { page: pagina })}>
          {renderizando && <p role="status">{t("renderingPage")}</p>}
          <div className={styles.page} ref={folha} style={{ width: dimensoes.width || undefined, height: dimensoes.height || undefined }} onContextMenu={(e) => e.preventDefault()}>
            <canvas ref={canvas} aria-label={t("documentPage", { page: pagina })} />
            {anotacoes.filter((a) => a.tipo === "DESTAQUE" && a.pagina === pagina).flatMap((a) => a.areas.map((area, i) => <span key={`${a.id}-${i}`} className={styles.highlight} style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.largura * 100}%`, height: `${area.altura * 100}%`, background: cores[a.cor] || cores.AMARELO }} />))}
            <div ref={texto} className={styles.textLayer} onPointerUp={capturarSelecao} onKeyUp={capturarSelecao} onCopy={(e) => {
              e.preventDefault(); const trecho = window.getSelection()?.toString().trim() || "";
              if (podeCopiar && trecho && trecho.length <= LIMITE_TRECHO_BIBLIOTECA) e.clipboardData.setData("text/plain", citar(trecho));
              else avisar("copyRestricted", false);
            }} />
            <span className={styles.watermark}>{t("watermark", { id: usuarioId })}</span>
          </div>
        </div>
        <aside className={`${styles.card} ${styles.side}`}>
          <h2>{t("myAnnotations")}</h2>
          <button className={styles.button} disabled={bloqueado || salvando || renderizando} onClick={() => void anotar("MARCADOR")}>{t("bookmarkPage")}</button>
          <div className={styles.notice}><p>{t("highlightHelp")}</p>{selecao && <p>{t("selectedCharacters", { count: selecao.trecho.length })}</p>}
            <label>{t("highlightColor")}<select value={cor} onChange={(e) => setCor(e.target.value)}>{Object.keys(cores).map((c) => <option key={c} value={c}>{t(`highlightColors.${c}`)}</option>)}</select></label>
            <button className={styles.button} disabled={bloqueado || salvando || !selecao?.areas.length || selecao.pagina !== pagina || renderizando} onClick={() => void anotar("DESTAQUE")}>{t("highlightSelection")}</button>
            {podeCopiar && <button className={styles.button} disabled={!selecao || selecao.trecho.length > LIMITE_TRECHO_BIBLIOTECA || renderizando} onClick={() => void copiar()}>{t("copyExcerpt")}</button>}
            <p className={styles.muted}>{t(podeCopiar ? "excerptLimit" : "copyNotLicensed", { count: LIMITE_TRECHO_BIBLIOTECA })}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void anotar("NOTA"); }}><label>{t("pageNote")}<textarea value={textoNota} onChange={(e) => setTextoNota(e.target.value)} maxLength={10000} disabled={bloqueado || salvando} /></label><button className={`${styles.button} ${styles.primary}`} disabled={bloqueado || salvando || !textoNota.trim()}>{t("saveNote")}</button></form>
          {!anotacoes.length && <p className={styles.muted}>{t("noAnnotations")}</p>}
          {anotacoes.map((a) => <div key={a.id} className={styles.annotation}>
            <button className={styles.button} onClick={() => ir(a.pagina)}>{t(`annotationTypes.${a.tipo}`)} · {t("pageCitation", { page: a.pagina })}</button>
            {a.trecho && <p>{a.trecho}</p>}{a.conteudo && <p>{a.conteudo}</p>}
            <button className={styles.button} disabled={bloqueado || salvando} onClick={() => void remover(a.id)}>{t("removeAnnotation")}</button>
          </div>)}
        </aside>
      </div>
    </>}
    {mensagem && <PhanyxToast tipo={tipoMensagem} mensagem={mensagem} onClose={() => setMensagem("")} />}
  </section>;
}
