"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as EventoPonteiro } from "react";
import { createPortal } from "react-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";
import FolhaFlexivelBiblioteca from "./FolhaFlexivelBiblioteca";
import { LIMITE_TRECHO_BIBLIOTECA, LIMITE_PAGINAS_BIBLIOTECA } from "@/lib/biblioteca-direitos-leitura";
import { carregarBibliotecaPdf, raizPdfBiblioteca, workerPdfBiblioteca, type BibliotecaPdf } from "@/lib/biblioteca-pdf-client";
import { limitarZoomLeitor, viradaPorGestoLeitor, zoomPorPincaLeitor } from "@/lib/biblioteca-gestos-leitor";
import styles from "./BibliotecaLeitor.module.css";
import "./leitor-print.css";

type Area = { x: number; y: number; largura: number; altura: number };
type Anotacao = { id: string; tipo: "MARCADOR" | "DESTAQUE" | "NOTA"; pagina: number; trecho: string | null; conteudo: string | null; cor: string; areas: Area[] };
const cores: Record<string, string> = { AMARELO: "#fde047", VERDE: "#86efac", AZUL: "#93c5fd", ROSA: "#f9a8d4" };
function IconeTelaCheia() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>; }
function IconeInformacao() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v7M12 6v1" /></svg>; }
export default function LeitorPdfBiblioteca({ arquivoId, titulo, voltar, direitos, downloadId, usuarioId, bloqueado, paginaInicial }: {
  arquivoId: number; titulo: string; voltar: string; direitos: { copiarTrecho: boolean; imprimir: boolean };
  downloadId: number | null; usuarioId: number; bloqueado: boolean; paginaInicial: number;
}) {
  const t = useTranslations("ReaderLibrary"); const base = `/api/biblioteca/arquivos/${arquivoId}`;
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null); const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0); const [zoom, setZoom] = useState(1); const [largura, setLargura] = useState(700);
  const [altura, setAltura] = useState(700); const [zoomDesenhado, setZoomDesenhado] = useState(1);
  const [zoomGesto, setZoomGesto] = useState<number | null>(null);
  const [imersivo, setImersivo] = useState(false);
  const [nativo, setNativo] = useState(false); const [paginaDigitada, setPaginaDigitada] = useState("1");
  const [painel, setPainel] = useState<"notes" | "search" | "rights" | null>(null);
  const [selecionarTexto, setSelecionarTexto] = useState(false);
  const [virada, setVirada] = useState<{ sentido: "next" | "previous"; fase: "waiting" | "turning" } | null>(null);
  const [dimensoes, setDimensoes] = useState({ width: 0, height: 0 });
  const [carregando, setCarregando] = useState(true); const [renderizando, setRenderizando] = useState(false);
  const [falhaDocumento, setFalhaDocumento] = useState(false); const [tentativa, setTentativa] = useState(0);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [carregandoAnotacoes, setCarregandoAnotacoes] = useState(true);
  const [erroAnotacoes, setErroAnotacoes] = useState(false);
  const [tentativaAnotacoes, setTentativaAnotacoes] = useState(0);
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
  const raiz = useRef<HTMLElement>(null); const botaoFullscreen = useRef<HTMLButtonElement>(null);
  const copiaVirada = useRef<HTMLCanvasElement | null>(null);
  const fullscreenAnterior = useRef(false);
  const toques = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ x: number; y: number; inicio: number; zoom: number; distancia: number; scrollX: number; scrollY: number; pinca: boolean } | null>(null);
  const zoomGestoAtual = useRef<number | null>(null);
  const ancoraZoom = useRef<{ x: number; y: number; centroX: number; centroY: number } | null>(null);
  const folha = useRef<HTMLDivElement>(null); const documento = useRef<HTMLDivElement>(null);
  const filaProgresso = useRef<Promise<void>>(Promise.resolve()); const numeroBusca = useRef(0);
  const textosPaginas = useRef(new Map<number, string>());
  const podeCopiar = direitos.copiarTrecho && restricoes.copiar;
  const podeImprimir = direitos.imprimir && restricoes.imprimir;
  const podeAnotar = !bloqueado && !carregandoAnotacoes && !erroAnotacoes;

  function avisar(chave: string, erro = true) { setTipoMensagem(erro ? "erro" : "info"); setMensagem(t(chave)); }
  const restaurarFoco = useCallback(() => botaoFullscreen.current?.focus({ preventScroll: true }), []);
  const cancelarBusca = useCallback(() => { numeroBusca.current++; }, []);
  const concluirVirada = useCallback(() => { setVirada(null); copiaVirada.current = null; }, []);

  const ir = useCallback((p: number) => {
    if (!Number.isInteger(p) || p < 1 || p > total || p === pagina || renderizando || virada) return;
    if (canvas.current && Math.abs(p - pagina) === 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const copia = document.createElement("canvas");
      const ratio = Math.min(1, Math.sqrt(1800000 / (canvas.current.width * canvas.current.height)));
      copia.width = Math.max(1, Math.ceil(canvas.current.width * ratio)); copia.height = Math.max(1, Math.ceil(canvas.current.height * ratio));
      const ctx = copia.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas.current, 0, 0, copia.width, copia.height);
        ctx.save(); ctx.globalAlpha = .45;
        for (const nota of anotacoes.filter((a) => a.tipo === "DESTAQUE" && a.pagina === pagina)) {
          ctx.fillStyle = cores[nota.cor] || cores.AMARELO;
          for (const area of nota.areas) ctx.fillRect(area.x * copia.width, area.y * copia.height, area.largura * copia.width, area.altura * copia.height);
        }
        ctx.restore();
        const escala = copia.width / Number.parseFloat(canvas.current.style.width);
        if (Number.isFinite(escala) && escala > 0) {
          ctx.save(); ctx.scale(escala, escala); ctx.font = "10px sans-serif";
          const marca = t("watermark", { id: usuarioId }); const larguraMarca = ctx.measureText(marca).width;
          const x = copia.width / escala - larguraMarca - 17; const y = copia.height / escala - 22;
          ctx.fillStyle = "#ffffffc9"; ctx.fillRect(x - 5, y, larguraMarca + 10, 14);
          ctx.fillStyle = "#475569"; ctx.fillText(marca, x, y + 10); ctx.restore();
        }
        copiaVirada.current = copia;
        setVirada({ sentido: p > pagina ? "next" : "previous", fase: "waiting" });
      }
    }
    ancoraZoom.current = null; setSelecao(null); setPagina(p);
    if (documento.current) { documento.current.scrollTop = 0; documento.current.scrollLeft = 0; }
  }, [total, pagina, renderizando, virada, anotacoes, t, usuarioId]);

  function iniciarToque(evento: EventoPonteiro<HTMLDivElement>) {
    if (evento.pointerType !== "touch" || selecionarTexto || virada || renderizando ||
        (evento.target as HTMLElement).closest("button")) return;
    const doc = documento.current; if (!doc) return;
    toques.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    evento.currentTarget.setPointerCapture(evento.pointerId);
    if (toques.current.size === 1) {
      gesto.current = { x: evento.clientX, y: evento.clientY, inicio: performance.now(), zoom,
        distancia: 0, scrollX: doc.scrollLeft, scrollY: doc.scrollTop, pinca: false };
    } else if (toques.current.size === 2 && gesto.current && folha.current) {
      const [a, b] = Array.from(toques.current.values());
      const centroX = (a.x + b.x) / 2; const centroY = (a.y + b.y) / 2;
      const bounds = folha.current.getBoundingClientRect();
      gesto.current.pinca = true; gesto.current.zoom = zoom;
      gesto.current.distancia = Math.hypot(a.x - b.x, a.y - b.y);
      ancoraZoom.current = { x: Math.max(0, Math.min(1, (centroX - bounds.left) / bounds.width)),
        y: Math.max(0, Math.min(1, (centroY - bounds.top) / bounds.height)), centroX, centroY };
      window.getSelection()?.removeAllRanges(); setSelecao(null);
    }
  }
  function moverToque(evento: EventoPonteiro<HTMLDivElement>) {
    if (!toques.current.has(evento.pointerId) || !gesto.current || !documento.current) return;
    toques.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    const atual = gesto.current;
    if (toques.current.size >= 2) {
      evento.preventDefault();
      const [a, b] = Array.from(toques.current.values());
      const novo = zoomPorPincaLeitor(atual.zoom, atual.distancia, Math.hypot(a.x - b.x, a.y - b.y));
      if (ancoraZoom.current) { ancoraZoom.current.centroX = (a.x + b.x) / 2; ancoraZoom.current.centroY = (a.y + b.y) / 2; }
      zoomGestoAtual.current = novo; setZoomGesto(novo);
    } else if (atual.zoom > 1.05) {
      evento.preventDefault(); ancoraZoom.current = null;
      documento.current.scrollLeft = atual.scrollX - (evento.clientX - atual.x);
      documento.current.scrollTop = atual.scrollY - (evento.clientY - atual.y);
    }
  }
  function terminarToque(evento: EventoPonteiro<HTMLDivElement>, cancelado = false) {
    if (!toques.current.has(evento.pointerId) || !gesto.current) return;
    const atual = gesto.current;
    toques.current.delete(evento.pointerId);
    if (atual.pinca) {
      if (toques.current.size < 2 && zoomGestoAtual.current !== null) {
        const novo = zoomGestoAtual.current;
        if (!cancelado) { setZoom(novo); atual.zoom = novo; }
        zoomGestoAtual.current = null; setZoomGesto(null);
      }
      if (toques.current.size === 1 && documento.current) {
        const [restante] = Array.from(toques.current.values());
        atual.x = restante.x; atual.y = restante.y;
        atual.scrollX = documento.current.scrollLeft; atual.scrollY = documento.current.scrollTop;
      }
    } else if (!toques.current.size && !cancelado) {
      const sentido = viradaPorGestoLeitor(evento.clientX - atual.x, evento.clientY - atual.y, atual.zoom, performance.now() - atual.inicio);
      if (sentido) ir(pagina + sentido);
    }
    if (!toques.current.size) gesto.current = null;
    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) evento.currentTarget.releasePointerCapture(evento.pointerId);
  }

  function ajustarZoom(valor: number) {
    ancoraZoom.current = null; setZoom(limitarZoomLeitor(valor));
    if (valor === 1 && documento.current) { documento.current.scrollLeft = 0; documento.current.scrollTop = 0; }
  }

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900) setImersivo(true);
    fullscreenAnterior.current = Boolean(document.fullscreenElement);
    setNativo(Boolean(document.fullscreenElement));
    function mudou() {
      setNativo(Boolean(document.fullscreenElement));
      if (document.fullscreenElement) { fullscreenAnterior.current = true; setImersivo(true); }
      else if (fullscreenAnterior.current) { fullscreenAnterior.current = false; setImersivo(false); }
    }
    document.addEventListener("fullscreenchange", mudou);
    return () => {
      document.removeEventListener("fullscreenchange", mudou);
      if (fullscreenAnterior.current && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => { setPaginaDigitada(String(pagina)); }, [pagina]);

  useEffect(() => {
    if (!imersivo) return;
    const overflow = document.body.style.overflow; const scroll = window.scrollY;
    document.body.dataset.bibliotecaTelaCheia = "true"; document.body.style.overflow = "hidden";
    raiz.current?.focus({ preventScroll: true });
    return () => {
      delete document.body.dataset.bibliotecaTelaCheia; document.body.style.overflow = overflow;
      window.scrollTo(0, scroll);
      window.requestAnimationFrame(restaurarFoco);
    };
  }, [imersivo, restaurarFoco]);

  function entrarFullscreen() {
    setImersivo(true);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }
  const sairFullscreen = useCallback(() => {
    setImersivo(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    function teclado(evento: KeyboardEvent) {
      if (evento.key === "Escape" && imersivo) { evento.preventDefault(); sairFullscreen(); return; }
      if (evento.key === "Tab" && imersivo && raiz.current) {
        const focaveis = Array.from(raiz.current.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']")).filter((e) => e.getClientRects().length > 0);
        const primeiro = focaveis[0]; const ultimo = focaveis[focaveis.length - 1];
        if (primeiro && evento.shiftKey && (document.activeElement === primeiro || document.activeElement === raiz.current)) { evento.preventDefault(); ultimo.focus(); }
        else if (primeiro && !evento.shiftKey && (document.activeElement === ultimo || document.activeElement === raiz.current)) { evento.preventDefault(); primeiro.focus(); }
      }
      const alvo = evento.target as HTMLElement | null;
      if (alvo && !raiz.current?.contains(alvo) && alvo !== document.body) return;
      if (alvo?.closest("input, textarea, select, [contenteditable='true']") || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (evento.key === "ArrowRight") { evento.preventDefault(); ir(pagina + 1); }
      if (evento.key === "ArrowLeft") { evento.preventDefault(); ir(pagina - 1); }
    }
    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  }, [imersivo, ir, pagina, sairFullscreen]);

  useLayoutEffect(() => {
    const ancora = ancoraZoom.current;
    if (!ancora || !folha.current || !documento.current) return;
    const bounds = folha.current.getBoundingClientRect();
    documento.current.scrollLeft += bounds.left + ancora.x * bounds.width - ancora.centroX;
    documento.current.scrollTop += bounds.top + ancora.y * bounds.height - ancora.centroY;
  }, [zoomGesto, dimensoes, zoomDesenhado]);

  useEffect(() => {
    let ativo = true;
    let loading: ReturnType<BibliotecaPdf["getDocument"]> | null = null;
    setCarregando(true); setFalhaDocumento(false); setPdf(null); setTotal(0); setSelecao(null); textosPaginas.current.clear(); numeroBusca.current++;
    setVirada(null); copiaVirada.current = null;
    async function carregar() {
      try {
        const lib = await carregarBibliotecaPdf(); if (!ativo) return;
        lib.GlobalWorkerOptions.workerSrc = workerPdfBiblioteca;
        loading = lib.getDocument({ url: `${base}/conteudo`, withCredentials: true, disableRange: true,
          isEvalSupported: false, cMapUrl: `${raizPdfBiblioteca}/cmaps/`, cMapPacked: true,
          standardFontDataUrl: `${raizPdfBiblioteca}/standard_fonts/`, wasmUrl: `${raizPdfBiblioteca}/wasm/` });
        const doc = await loading.promise;
        if (doc.numPages > LIMITE_PAGINAS_BIBLIOTECA) throw new Error();
        const permissoes = await doc.getPermissions();
        if (!ativo) return;
        setRestricoes({ copiar: permissoes === null || permissoes.includes(lib.PermissionFlag.COPY),
          imprimir: permissoes === null || permissoes.includes(lib.PermissionFlag.PRINT) || permissoes.includes(lib.PermissionFlag.PRINT_HIGH_QUALITY) });
        // A posição já foi consultada e autorizada na renderização da página pelo servidor.
        const inicial = Number.isSafeInteger(paginaInicial) ? paginaInicial : 1;
        setTotal(doc.numPages); setPagina(Math.min(doc.numPages, Math.max(1, inicial))); setPdf(doc);
      } catch (erro) {
        if (ativo) {
          if (process.env.NODE_ENV === "development") console.error("Biblioteca PDF:", erro);
          setFalhaDocumento(true);
        }
      }
      finally { if (ativo) setCarregando(false); }
    }
    void carregar();
    return () => { ativo = false; cancelarBusca(); void loading?.destroy(); };
  }, [base, tentativa, paginaInicial, usuarioId, cancelarBusca]);

  useEffect(() => {
    const controller = new AbortController(); let ativo = true;
    setCarregandoAnotacoes(true); setErroAnotacoes(false); setAnotacoes([]);
    async function carregarAnotacoes() {
      try {
        const resposta = await fetch(`${base}/anotacoes`, { cache: "no-store", signal: controller.signal });
        if (!resposta.ok) {
          if (ativo && [401, 403, 404].includes(resposta.status)) setFalhaDocumento(true);
          throw new Error();
        }
        const dados = await resposta.json();
        if (!Array.isArray(dados.anotacoes)) throw new Error();
        if (ativo) setAnotacoes(dados.anotacoes);
      } catch { if (ativo) setErroAnotacoes(true); }
      finally { if (ativo) setCarregandoAnotacoes(false); }
    }
    void carregarAnotacoes();
    return () => { ativo = false; controller.abort(); };
  }, [base, tentativa, tentativaAnotacoes, usuarioId]);

  useEffect(() => {
    if (!documento.current) return;
    const observer = new ResizeObserver((entries) => {
      setLargura(Math.max(120, entries[0].contentRect.width - 32));
      setAltura(Math.max(100, entries[0].contentRect.height - 32));
    });
    observer.observe(documento.current); return () => observer.disconnect();
  }, [carregando, imersivo, painel]);

  useEffect(() => {
    if (!pdf || !canvas.current || !texto.current) return;
    let ativo = true; let render: { cancel(): void; promise: Promise<void> } | undefined;
    let layer: { cancel(): void; render(): Promise<void> } | undefined;
    setRenderizando(true);
    async function desenhar() {
      try {
        const [page, lib] = await Promise.all([pdf!.getPage(pagina), carregarBibliotecaPdf()]);
        if (!ativo || !canvas.current || !texto.current) return;
        const original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(largura / original.width, altura / original.height) * zoom });
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16000000 / (viewport.width * viewport.height)));
        const ctx = canvas.current.getContext("2d"); if (!ctx) throw new Error();
        canvas.current.width = Math.floor(viewport.width * ratio); canvas.current.height = Math.floor(viewport.height * ratio);
        canvas.current.style.width = `${viewport.width}px`; canvas.current.style.height = `${viewport.height}px`;
        setDimensoes({ width: viewport.width, height: viewport.height }); setZoomDesenhado(zoom);
        render = page.render({ canvasContext: ctx, canvas: canvas.current, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
        await render.promise; if (!ativo || !texto.current) return;
        const textContent = await page.getTextContent();
        if (!ativo || !texto.current) return;
        texto.current.replaceChildren(); texto.current.style.setProperty("--scale-factor", String(viewport.scale));
        texto.current.style.setProperty("--total-scale-factor", String(viewport.scale * page.userUnit));
        layer = new lib.TextLayer({ textContentSource: textContent, container: texto.current, viewport });
        await layer.render();
        if (ativo) setVirada((atual) => atual?.fase === "waiting" ? { ...atual, fase: "turning" } : atual);
      } catch (erro) { if (ativo && (erro as Error)?.name !== "RenderingCancelledException") setFalhaDocumento(true); }
      finally { if (ativo) { setRenderizando(false); if (toques.current.size < 2) ancoraZoom.current = null; } }
    }
    void desenhar(); return () => { ativo = false; render?.cancel(); layer?.cancel(); };
  }, [pdf, pagina, zoom, largura, altura, imersivo]);

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

  const capturarSelecao = useCallback(() => {
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
  }, [pagina]);
  useEffect(() => {
    if (!selecionarTexto) return;
    function mudouSelecao() { if (!window.getSelection()?.isCollapsed) capturarSelecao(); }
    document.addEventListener("selectionchange", mudouSelecao);
    return () => document.removeEventListener("selectionchange", mudouSelecao);
  }, [selecionarTexto, capturarSelecao]);
  function citar(trecho: string) { return `${trecho}\n\n${titulo} — ${t("pageCitation", { page: pagina })}`; }
  async function copiar() {
    if (!podeCopiar || !selecao || selecao.trecho.length > LIMITE_TRECHO_BIBLIOTECA) { avisar("copyRestricted", false); return; }
    try { await navigator.clipboard.writeText(citar(selecao.trecho)); avisar("excerptCopied", false); } catch { avisar("copyError"); }
  }
  async function anotar(tipo: Anotacao["tipo"]) {
    if (!podeAnotar) return;
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
    if (!podeAnotar) return;
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

  const fatorVisual = (zoomGesto ?? zoom) / zoomDesenhado;
  const conteudo = <section ref={raiz} id={imersivo ? "biblioteca-leitor-fullscreen" : undefined}
    className={`${styles.root} ${styles.readerRoot} ${imersivo ? styles.immersive : ""}`} tabIndex={-1}
    role={imersivo ? "dialog" : undefined} aria-modal={imersivo ? true : undefined} aria-label={titulo}>
    <div className={styles.readerToolbar}>
      <header className={styles.readerHeading}><Link className={styles.button} href={voltar} aria-label={t("back")} title={t("back")}><span className={styles.shortControl} aria-hidden="true">←</span><span className={styles.longControl}>{t("back")}</span></Link>
        <h1 title={titulo}>{titulo}</h1>
        <button ref={botaoFullscreen} className={styles.button} onClick={imersivo ? sairFullscreen : entrarFullscreen} aria-label={t(imersivo ? "exitFullscreen" : "fullscreen")} title={t(imersivo ? "exitFullscreen" : "fullscreen")}><span className={styles.shortControl} aria-hidden="true">{imersivo ? "×" : <IconeTelaCheia />}</span><span className={styles.longControl}>{t(imersivo ? "exitFullscreen" : "fullscreen")}</span></button>
        {imersivo && !nativo && typeof document !== "undefined" && document.documentElement.requestFullscreen && <button className={styles.button} onClick={entrarFullscreen} aria-label={t("nativeFullscreen")} title={t("nativeFullscreen")}><span className={styles.shortControl} aria-hidden="true"><IconeTelaCheia /></span><span className={styles.longControl}>{t("nativeFullscreen")}</span></button>}
        {pdf && !falhaDocumento && <>
          <button className={styles.button} aria-label={t("documentSearch")} title={t("documentSearch")} aria-expanded={painel === "search"} onClick={() => setPainel(painel === "search" ? null : "search")}><span className={styles.shortControl} aria-hidden="true">⌕</span><span className={styles.longControl}>{t("search")}</span></button>
          <button className={styles.button} aria-label={t("myAnnotations")} title={t("myAnnotations")} aria-expanded={painel === "notes"} onClick={() => setPainel(painel === "notes" ? null : "notes")}><span className={styles.shortControl} aria-hidden="true">☰</span><span className={styles.longControl}>{t("myAnnotations")}</span></button>
          <button className={styles.button} aria-label={t("rightsTitle")} title={t("rightsTitle")} aria-expanded={painel === "rights"} onClick={() => setPainel(painel === "rights" ? null : "rights")}><span className={styles.shortControl} aria-hidden="true"><IconeInformacao /></span><span className={styles.longControl}>{t("rightsTitle")}</span></button>
        </>}
      </header>
      {pdf && !falhaDocumento && <div className={styles.readerControls}>
        <button className={styles.button} disabled={pagina === 1 || renderizando || !!virada} onClick={() => ir(pagina - 1)} aria-label={t("previousPage")} title={t("previousPage")}>‹</button>
        <form className={styles.pageNavigation} onSubmit={(e) => { e.preventDefault(); const p = Number(paginaDigitada); ir(p); if (!Number.isInteger(p) || p < 1 || p > total) setPaginaDigitada(String(pagina)); }}>
          <label className={styles.hidden} htmlFor="pagina-leitor">{t("pageLabel")}</label>
          <input id="pagina-leitor" className={styles.smallInput} type="number" min={1} max={total} value={paginaDigitada} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setPaginaDigitada(e.target.value)} />
          <span>{t("pageTotal", { total })}</span><button className={styles.button} disabled={renderizando || !!virada}>{t("goToPage")}</button>
        </form>
        <button className={styles.button} disabled={pagina === total || renderizando || !!virada} onClick={() => ir(pagina + 1)} aria-label={t("nextPage")} title={t("nextPage")}>›</button>
        <div className={styles.zoomControls} aria-label={t("zoom")}>
          <button className={styles.button} onClick={() => ajustarZoom(zoom - .25)} disabled={zoom <= .5 || !!virada} aria-label={t("zoomOut")}>−</button>
          <span data-reader-zoom={Math.round((zoomGesto ?? zoom) * 100)}>{Math.round((zoomGesto ?? zoom) * 100)}%</span>
          <button className={styles.button} onClick={() => ajustarZoom(zoom + .25)} disabled={zoom >= 4 || !!virada} aria-label={t("zoomIn")}>+</button>
          <button className={styles.button} onClick={() => ajustarZoom(1)}>{t("fitPage")}</button>
        </div>
        {downloadId && <a className={styles.button} href={`/api/biblioteca/arquivos/${downloadId}/download`}>{t("downloadPdf")}</a>}
        {podeImprimir && <button className={styles.button} onClick={() => window.print()}>{t("printPage")}</button>}
      </div>}
      {pdf && !falhaDocumento && <p className={`${styles.muted} ${styles.readerProgress}`} role="status">{t(`progressState.${bloqueado ? "readOnly" : estadoProgresso}`)}
        {estadoProgresso === "failed" && <button className={styles.button} onClick={() => gravarProgresso(pagina, total)}>{t("retrySave")}</button>}
      </p>}
    </div>
    {carregando && <p role="status">{t("loadingDocument")}</p>}
    {falhaDocumento && <div className={styles.card}><p className={styles.error} role="alert">{t("documentError")}</p><button className={styles.button} onClick={() => setTentativa((x) => x + 1)}>{t("retry")}</button></div>}
    {pdf && !falhaDocumento && <>
      <div className={`${styles.readerFrame} ${painel ? styles.withPanel : ""}`}>
        <div className={`${styles.document} ${styles.bookViewport} ${selecionarTexto ? styles.selectionMode : ""}`} ref={documento} aria-label={t("documentPage", { page: pagina })}
          onPointerDown={iniciarToque} onPointerMove={moverToque} onPointerUp={(e) => terminarToque(e)} onPointerCancel={(e) => terminarToque(e, true)}>
          {renderizando && <span className={styles.pageLoading} role="status">{t("renderingPage")}</span>}
          <div className={styles.sheetHolder} style={{ width: dimensoes.width * fatorVisual || undefined, height: dimensoes.height * fatorVisual || undefined }}>
          <div className={styles.page} ref={folha} style={{ width: dimensoes.width || undefined, height: dimensoes.height || undefined, transform: `scale(${fatorVisual})`, transformOrigin: "top left" }} onContextMenu={(e) => e.preventDefault()}>
            <canvas ref={canvas} aria-label={t("documentPage", { page: pagina })} />
            {anotacoes.filter((a) => a.tipo === "DESTAQUE" && a.pagina === pagina).flatMap((a) => a.areas.map((area, i) => <span key={`${a.id}-${i}`} className={styles.highlight} style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.largura * 100}%`, height: `${area.altura * 100}%`, background: cores[a.cor] || cores.AMARELO }} />))}
            <div ref={texto} className={styles.textLayer} onPointerUp={capturarSelecao} onKeyUp={capturarSelecao} onCopy={(e) => {
              e.preventDefault(); const trecho = window.getSelection()?.toString().trim() || "";
              if (podeCopiar && trecho && trecho.length <= LIMITE_TRECHO_BIBLIOTECA) e.clipboardData.setData("text/plain", citar(trecho));
              else avisar("copyRestricted", false);
            }} />
            <span className={styles.watermark}>{t("watermark", { id: usuarioId })}</span>
            {virada && <FolhaFlexivelBiblioteca origem={copiaVirada.current} largura={dimensoes.width} altura={dimensoes.height}
              sentido={virada.sentido} animar={virada.fase === "turning"} onConcluir={concluirVirada} />}
            {pagina > 1 && <button className={`${styles.pageCorner} ${styles.cornerLeft}`} disabled={renderizando || !!virada} onClick={() => ir(pagina - 1)} aria-label={t("turnPrevious")} title={t("turnPrevious")}>‹</button>}
            {pagina < total && <button className={`${styles.pageCorner} ${styles.cornerRight}`} disabled={renderizando || !!virada} onClick={() => ir(pagina + 1)} aria-label={t("turnNext")} title={t("turnNext")}>›</button>}
          </div>
          </div>
        </div>
        {selecao && painel !== "notes" && <button className={`${styles.button} ${styles.primary} ${styles.selectionAction}`} onClick={() => setPainel("notes")}>{t("highlightSelection")}</button>}
        {painel && <aside className={styles.readerPanel} aria-label={t(painel === "notes" ? "myAnnotations" : painel === "search" ? "documentSearch" : "rightsTitle")}>
          <button className={`${styles.button} ${styles.closePanel}`} onClick={() => setPainel(null)} aria-label={t("closePanel")}>×</button>
          {painel === "search" && <><h2>{t("documentSearch")}</h2>
            <form className={styles.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); void pesquisar(); }}>
              <label className={styles.hidden} htmlFor="pesquisa-pdf">{t("documentSearch")}</label><input id="pesquisa-pdf" placeholder={t("documentSearch")} value={busca} maxLength={100} onChange={(e) => { numeroBusca.current++; setBuscando(false); setBuscou(false); setBusca(e.target.value); }} />
              <button className={styles.button} disabled={buscando || !busca.trim()}>{t(buscando ? "searching" : "search")}</button>
              {buscando && <button type="button" className={styles.button} onClick={() => { numeroBusca.current++; setBuscando(false); }}>{t("cancel")}</button>}
            </form>
            {buscou && <p role="status">{t(resultados.length ? "searchResults" : "noTextResults", { count: resultados.length })}</p>}
            <div className={styles.results}>{resultados.map((r) => <button className={styles.button} style={{ display: "block", textAlign: "left", width: "100%" }} key={r.pagina} onClick={() => ir(r.pagina)}>{t("pageCitation", { page: r.pagina })}: {r.trecho}</button>)}</div>
          </>}
          {painel === "rights" && <><h2>{t("rightsTitle")}</h2><p>{t("rightsNotice")}</p><p className={styles.notice}>{t("readerRights")}</p></>}
          {painel === "notes" && <>
          <h2>{t("myAnnotations")}</h2>
          <button className={`${styles.button} ${selecionarTexto ? styles.primary : ""}`} aria-pressed={selecionarTexto} onClick={() => {
            setSelecionarTexto(!selecionarTexto);
            if (!selecionarTexto && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900)) setPainel(null);
          }}>{t("selectTextMode")}</button>
          <p className={styles.muted}>{t("selectTextHelp")}</p>
          {carregandoAnotacoes && <p className={styles.muted} role="status">{t("loadingAnnotations")}</p>}
          {erroAnotacoes && <div><p className={styles.error} role="alert">{t("annotationsLoadError")}</p><button className={styles.button} onClick={() => setTentativaAnotacoes((x) => x + 1)}>{t("retry")}</button></div>}
          <button className={styles.button} disabled={!podeAnotar || salvando || renderizando} onClick={() => void anotar("MARCADOR")}>{t("bookmarkPage")}</button>
          <div className={styles.notice}><p>{t("highlightHelp")}</p>{selecao && <p>{t("selectedCharacters", { count: selecao.trecho.length })}</p>}
            <label>{t("highlightColor")}<select value={cor} onChange={(e) => setCor(e.target.value)}>{Object.keys(cores).map((c) => <option key={c} value={c}>{t(`highlightColors.${c}`)}</option>)}</select></label>
            <button className={styles.button} disabled={!podeAnotar || salvando || !selecao?.areas.length || selecao.pagina !== pagina || renderizando} onClick={() => void anotar("DESTAQUE")}>{t("highlightSelection")}</button>
            {podeCopiar && <button className={styles.button} disabled={!selecao || selecao.trecho.length > LIMITE_TRECHO_BIBLIOTECA || renderizando} onClick={() => void copiar()}>{t("copyExcerpt")}</button>}
            <p className={styles.muted}>{t(podeCopiar ? "excerptLimit" : "copyNotLicensed", { count: LIMITE_TRECHO_BIBLIOTECA })}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void anotar("NOTA"); }}><label>{t("pageNote")}<textarea value={textoNota} onChange={(e) => setTextoNota(e.target.value)} maxLength={10000} disabled={!podeAnotar || salvando} /></label><button className={`${styles.button} ${styles.primary}`} disabled={!podeAnotar || salvando || !textoNota.trim()}>{t("saveNote")}</button></form>
          {!carregandoAnotacoes && !erroAnotacoes && !anotacoes.length && <p className={styles.muted}>{t("noAnnotations")}</p>}
          {anotacoes.map((a) => <div key={a.id} className={styles.annotation}>
            <button className={styles.button} onClick={() => ir(a.pagina)}>{t(`annotationTypes.${a.tipo}`)} · {t("pageCitation", { page: a.pagina })}</button>
            {a.trecho && <p>{a.trecho}</p>}{a.conteudo && <p>{a.conteudo}</p>}
            <button className={styles.button} disabled={!podeAnotar || salvando} onClick={() => void remover(a.id)}>{t("removeAnnotation")}</button>
          </div>)}
          </>}
        </aside>}
      </div>
      <p className={`${styles.muted} ${styles.readerHint}`}>{t("readerGesturesHelp")}</p>
    </>}
    {mensagem && <PhanyxToast tipo={tipoMensagem} mensagem={mensagem} onClose={() => setMensagem("")} />}
  </section>;
  return imersivo && typeof document !== "undefined" ? createPortal(conteudo, document.body) : conteudo;
}
