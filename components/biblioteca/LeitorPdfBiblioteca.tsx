"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as EventoPonteiro } from "react";
import { createPortal } from "react-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";
import FolhaFlexivelBiblioteca from "./FolhaFlexivelBiblioteca";
import PainelAnotacoesBiblioteca, { CanetasBiblioteca } from "./PainelAnotacoesBiblioteca";
import { anotacaoTemTrecho, type AnotacaoLeitor } from "@/lib/biblioteca-anotacoes-leitor";
import { pintarMarcacoesPdf } from "@/lib/biblioteca-cores-marcacoes";
import { LIMITE_TRECHO_BIBLIOTECA, LIMITE_PAGINAS_BIBLIOTECA } from "@/lib/biblioteca-direitos-leitura";
import { carregarBibliotecaPdf, obterWorkerBibliotecaPdf, raizPdfBiblioteca, workerPdfBiblioteca, type BibliotecaPdf } from "@/lib/biblioteca-pdf-client";
import { SessaoPaginasPdf, type FacePdfPreparada } from "@/lib/biblioteca-render-paginas";
import { limitarZoomLeitor, viradaPorGestoLeitor, zoomPorPincaLeitor } from "@/lib/biblioteca-gestos-leitor";
import { paginasLivro, destinoViradaLivro } from "@/lib/biblioteca-livro-paginas";
import { localizarTermoPdf, areasTermoPdf } from "@/lib/biblioteca-busca-pdf";
import styles from "./BibliotecaLeitor.module.css";
import "./leitor-print.css";

type Area = { x: number; y: number; largura: number; altura: number };
type Anotacao = AnotacaoLeitor;
const fontesOriginais = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function copiarFace(fonte: HTMLCanvasElement | null, numero: number | null, notas: Anotacao[], marca: string) {
  if (!fonte || !numero || !fonte.width || !fonte.height) return null;
  const copia = document.createElement("canvas"); const ratio = Math.min(1, Math.sqrt(1800000 / (fonte.width * fonte.height)));
  copia.width = Math.max(1, Math.ceil(fonte.width * ratio)); copia.height = Math.max(1, Math.ceil(fonte.height * ratio));
  const ctx = copia.getContext("2d"); if (!ctx) return null;
  const original = fontesOriginais.get(fonte) || fonte;
  const x = Number(fonte.dataset.contentX || 0), y = Number(fonte.dataset.contentY || 0);
  const w = Number(fonte.dataset.contentWidth || 1), h = Number(fonte.dataset.contentHeight || 1);
  pintarMarcacoesPdf(ctx, original, { x, y, w, h }, notas.filter(a => anotacaoTemTrecho(a) && a.pagina === numero));
  const escala = copia.width / Number.parseFloat(fonte.style.width);
  if (Number.isFinite(escala) && escala > 0) {
    ctx.save(); ctx.scale(escala, escala); ctx.font = "10px sans-serif";
    const larguraMarca = ctx.measureText(marca).width; const mx = copia.width / escala - larguraMarca - 17, my = copia.height / escala - 22;
    ctx.fillStyle = "#ffffffc9"; ctx.fillRect(mx - 5, my, larguraMarca + 10, 14);
    ctx.fillStyle = "#475569"; ctx.fillText(marca, mx, my + 10); ctx.restore();
  }
  return copia;
}
function IconeTelaCheia() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>; }
function IconeInformacao() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v7M12 6v1" /></svg>; }
function TrechoBusca({ texto, termo }: { texto: string; termo: string }) {
  let inicio = 0;
  const partes: { texto: string; destaque: boolean }[] = [];
  for (const match of localizarTermoPdf(texto, termo)) {
    partes.push({ texto: texto.slice(inicio, match.inicio), destaque: false });
    partes.push({ texto: texto.slice(match.inicio, match.fim), destaque: true });
    inicio = match.fim;
  }
  partes.push({ texto: texto.slice(inicio), destaque: false });
  return <>{partes.map((parte, i) => parte.destaque ? <mark key={i} className={styles.searchSnippet}>{parte.texto}</mark> : parte.texto)}</>;
}
export default function LeitorPdfBiblioteca({ arquivoId, titulo, voltar, direitos, downloadId, usuarioId, bloqueado, paginaInicial }: {
  arquivoId: number; titulo: string; voltar: string; direitos: { copiarTrecho: boolean; imprimir: boolean };
  downloadId: number | null; usuarioId: number; bloqueado: boolean; paginaInicial: number;
}) {
  const t = useTranslations("ReaderLibrary"); const base = `/api/biblioteca/arquivos/${arquivoId}`;
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null); const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0); const [zoom, setZoom] = useState(1); const [largura, setLargura] = useState(700);
  const [altura, setAltura] = useState(700); const [zoomDesenhado, setZoomDesenhado] = useState(1);
  const [zoomGesto, setZoomGesto] = useState<number | null>(null);
  const [modo, setModo] = useState<"auto" | "pagina" | "livro">("auto");
  const dupla = modo === "livro" || (modo === "auto" && largura >= 720);
  const faces = paginasLivro(pagina, total, dupla);
  const anterior = destinoViradaLivro(pagina, total, dupla, -1), proxima = destinoViradaLivro(pagina, total, dupla, 1);
  const [quadros, setQuadros] = useState<Record<number, { x: number; y: number; w: number; h: number }>>({});
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
  const [contextosNotas, setContextosNotas] = useState<Record<number, { trecho: string; areas: Area[]; cor: string }>>({});
  const [anotacaoAberta, setAnotacaoAberta] = useState<string | null>(null);
  const contextoNota = contextosNotas[pagina];
  const textoNota = rascunhos[pagina] || "";
  function setTextoNota(valor: string) { setRascunhos((notas) => ({ ...notas, [pagina]: valor })); }
  function prepararNotaTrecho() {
    if (!selecao?.areas.length || !podeAnotar) return;
    setContextosNotas(notas => ({ ...notas, [selecao.pagina]: { trecho: selecao.trecho, areas: selecao.areas, cor } }));
    setPagina(selecao.pagina); setPainel("notes");
  }
  const [selecao, setSelecao] = useState<{ trecho: string; areas: Area[]; pagina: number } | null>(null);
  const [cor, setCor] = useState("AMARELO"); const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(""); const [tipoMensagem, setTipoMensagem] = useState<"erro" | "info">("erro");
  const [busca, setBusca] = useState(""); const [buscando, setBuscando] = useState(false); const [buscou, setBuscou] = useState(false);
  const [resultados, setResultados] = useState<{ pagina: number; trecho: string }[]>([]);
  const [termoPesquisado, setTermoPesquisado] = useState("");
  const [areasBusca, setAreasBusca] = useState<Record<number, Area[]>>({});
  const [textoPronto, setTextoPronto] = useState(0);
  const [restricoes, setRestricoes] = useState({ copiar: true, imprimir: true });
  const [estadoProgresso, setEstadoProgresso] = useState("ready");
  const canvas = useRef<HTMLCanvasElement>(null); const texto = useRef<HTMLDivElement>(null);
  const canvasEsquerdo = useRef<HTMLCanvasElement>(null), textoEsquerdo = useRef<HTMLDivElement>(null);
  const folhaEsquerda = useRef<HTMLDivElement>(null), livro = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLElement>(null); const botaoFullscreen = useRef<HTMLButtonElement>(null);
  const copiaVirada = useRef<{ esquerda: HTMLCanvasElement | null; direita: HTMLCanvasElement | null; verso: HTMLCanvasElement | null; sentido: "next" | "previous" } | null>(null);
  const dadosFace = useRef({ anotacoes, marca: "" });
  useEffect(() => { dadosFace.current = { anotacoes, marca: t("watermark", { id: usuarioId }) }; }, [anotacoes, t, usuarioId]);
  const fullscreenAnterior = useRef(false);
  const toques = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ x: number; y: number; inicio: number; zoom: number; distancia: number; scrollX: number; scrollY: number; pinca: boolean } | null>(null);
  const zoomGestoAtual = useRef<number | null>(null);
  const ancoraZoom = useRef<{ x: number; y: number; centroX: number; centroY: number } | null>(null);
  const folha = useRef<HTMLDivElement>(null); const documento = useRef<HTMLDivElement>(null);
  const filaProgresso = useRef<Promise<void>>(Promise.resolve()); const numeroBusca = useRef(0);
  const textosPaginas = useRef(new Map<number, string>());
  const sessaoPaginas = useRef<SessaoPaginasPdf | null>(null);
  const facesPreparadas = useRef(new Map<number, FacePdfPreparada>());
  const podeCopiar = direitos.copiarTrecho && restricoes.copiar;
  const podeImprimir = direitos.imprimir && restricoes.imprimir;
  const podeAnotar = !bloqueado && !carregandoAnotacoes && !erroAnotacoes;
  const temSelecao = Boolean(selecao?.areas.length && selecao.pagina === pagina);

  function avisar(chave: string, erro = true) { setTipoMensagem(erro ? "erro" : "info"); setMensagem(t(chave)); }
  const restaurarFoco = useCallback(() => botaoFullscreen.current?.focus({ preventScroll: true }), []);
  const cancelarBusca = useCallback(() => { numeroBusca.current++; }, []);
  const concluirVirada = useCallback(() => { setVirada(null); copiaVirada.current = null; }, []);
  useEffect(() => { if (falhaDocumento) concluirVirada(); }, [falhaDocumento, concluirVirada]);

  useEffect(() => {
    try { const m = localStorage.getItem("phanyx.biblioteca.formato"); if (m === "pagina" || m === "livro") setModo(m); } catch {}
  }, []);
  function escolherModo(m: "pagina" | "livro") {
    if (virada) return;
    setModo(m); setSelecao(null); ancoraZoom.current = null;
    try { localStorage.setItem("phanyx.biblioteca.formato", m); } catch {}
  }

  const ir = useCallback((p: number, animar = true) => {
    if (!Number.isInteger(p) || p < 1 || p > total || p === pagina || (animar && (renderizando || virada))) return;
    if (!animar) concluirVirada();
    const destino = paginasLivro(p, total, dupla), atual = paginasLivro(pagina, total, dupla);
    const mesmaAbertura = dupla && atual.esquerda === destino.esquerda && atual.direita === destino.direita;
    if (animar && !mesmaAbertura && (p === destinoViradaLivro(pagina, total, dupla, p > pagina ? 1 : -1)) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const marca = t("watermark", { id: usuarioId });
      const esquerda = copiarFace(canvasEsquerdo.current, atual.esquerda, anotacoes, marca);
      const direita = copiarFace(canvas.current, atual.direita, anotacoes, marca);
      if (p > pagina ? direita : (dupla ? esquerda : direita)) {
        const numeroVerso = p > pagina && dupla ? destino.esquerda : destino.direita;
        const pronta = numeroVerso ? sessaoPaginas.current?.obter(numeroVerso) : undefined;
        const verso = pronta ? copiarFace(pronta.canvas, numeroVerso, anotacoes, marca) : null;
        const preparada = [destino.esquerda, destino.direita].every(numero => !numero || sessaoPaginas.current?.obter(numero));
        copiaVirada.current = { esquerda, direita, verso, sentido: p > pagina ? "next" : "previous" };
        setVirada({ sentido: p > pagina ? "next" : "previous", fase: preparada && verso ? "turning" : "waiting" });
      }
    }
    ancoraZoom.current = null; setSelecao(null); setPagina(p);
    if (documento.current) { documento.current.scrollTop = 0; documento.current.scrollLeft = 0; }
  }, [total, pagina, renderizando, virada, anotacoes, t, usuarioId, dupla, concluirVirada]);

  function iniciarToque(evento: EventoPonteiro<HTMLDivElement>) {
    if (evento.pointerType !== "touch" || selecionarTexto || virada || renderizando ||
        (evento.target as HTMLElement).closest("button")) return;
    const doc = documento.current; if (!doc) return;
    toques.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    evento.currentTarget.setPointerCapture(evento.pointerId);
    if (toques.current.size === 1) {
      gesto.current = { x: evento.clientX, y: evento.clientY, inicio: performance.now(), zoom,
        distancia: 0, scrollX: doc.scrollLeft, scrollY: doc.scrollTop, pinca: false };
    } else if (toques.current.size === 2 && gesto.current && livro.current) {
      const [a, b] = Array.from(toques.current.values());
      const centroX = (a.x + b.x) / 2; const centroY = (a.y + b.y) / 2;
      const bounds = livro.current.getBoundingClientRect();
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
      if (sentido) ir(destinoViradaLivro(pagina, total, dupla, sentido));
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
      if (evento.key === "ArrowRight") { evento.preventDefault(); ir(proxima); }
      if (evento.key === "ArrowLeft") { evento.preventDefault(); ir(anterior); }
    }
    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  }, [imersivo, ir, anterior, proxima, sairFullscreen]);

  useLayoutEffect(() => {
    const ancora = ancoraZoom.current;
    if (!ancora || !livro.current || !documento.current) return;
    const bounds = livro.current.getBoundingClientRect();
    documento.current.scrollLeft += bounds.left + ancora.x * bounds.width - ancora.centroX;
    documento.current.scrollTop += bounds.top + ancora.y * bounds.height - ancora.centroY;
  }, [zoomGesto, dimensoes, zoomDesenhado]);

  useEffect(() => {
    let ativo = true;
    let loading: ReturnType<BibliotecaPdf["getDocument"]> | null = null;
    setCarregando(true); setFalhaDocumento(false); setPdf(null); setTotal(0); setSelecao(null); textosPaginas.current.clear(); numeroBusca.current++;
    setBusca(""); setTermoPesquisado(""); setResultados([]); setBuscou(false); setBuscando(false); setAreasBusca({});
    setVirada(null); copiaVirada.current = null;
    async function carregar() {
      try {
        const [lib, worker] = await Promise.all([carregarBibliotecaPdf(), obterWorkerBibliotecaPdf()]); if (!ativo) return;
        lib.GlobalWorkerOptions.workerSrc = workerPdfBiblioteca;
        loading = lib.getDocument({ url: `${base}/conteudo`, worker, withCredentials: true, disableRange: true,
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
    return () => { ativo = false; cancelarBusca(); sessaoPaginas.current?.destruir(); sessaoPaginas.current = null; facesPreparadas.current.clear(); void loading?.destroy(); };
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
    if (!pdf) return;
    let ativo = true, aquecimento = 0;
    setRenderizando(true);
    async function desenhar() {
      try {
        const primeira = await pdf!.getPage(1);
        if (!ativo) return;
        const original = primeira.getViewport({ scale: 1 });
        const scale = Math.min(largura / (dupla ? 2 : 1) / original.width, altura / original.height) * zoom;
        const width = original.width * scale, height = original.height * scale;
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16000000 / (width * height * (dupla ? 2 : 1))));
        let sessao = sessaoPaginas.current;
        if (!sessao || sessao.pdf !== pdf || sessao.largura !== width || sessao.altura !== height || sessao.ratio !== ratio) {
          sessao?.destruir();
          sessao = new SessaoPaginasPdf(pdf!, width, height, ratio);
          sessaoPaginas.current = sessao;
        }
        const atual = sessao;
        const lista = [
          { numero: faces.direita, canvas: canvas.current, texto: texto.current },
          { numero: faces.esquerda, canvas: canvasEsquerdo.current, texto: textoEsquerdo.current },
        ];
        const prontas = await Promise.all(lista.map(face => face.numero ? atual.preparar(face.numero) : null));
        if (!ativo) return;
        const layouts: Record<number, { x: number; y: number; w: number; h: number }> = {};
        facesPreparadas.current.clear();
        lista.forEach((face, indice) => {
          const pronta = prontas[indice];
          if (!face.numero || !face.canvas || !pronta) return;
          const ctx = face.canvas.getContext("2d"); if (!ctx) throw new Error("CANVAS_INDISPONIVEL");
          face.canvas.width = pronta.canvas.width; face.canvas.height = pronta.canvas.height;
          face.canvas.style.width = `${width}px`; face.canvas.style.height = `${height}px`;
          Object.assign(face.canvas.dataset, pronta.canvas.dataset);
          fontesOriginais.set(face.canvas, pronta.canvas);
          ctx.drawImage(pronta.canvas, 0, 0); face.texto?.replaceChildren();
          layouts[face.numero] = pronta.quadro;
          facesPreparadas.current.set(face.numero, pronta);
        });
        setDimensoes({ width, height }); setZoomDesenhado(zoom); setQuadros(layouts);
        if (copiaVirada.current && !copiaVirada.current.verso) {
          const esquerda = dupla && copiaVirada.current.sentido === "next";
          copiaVirada.current.verso = copiarFace(esquerda ? canvasEsquerdo.current : canvas.current,
            esquerda ? faces.esquerda : faces.direita, dadosFace.current.anotacoes, dadosFace.current.marca);
        }
        // A camada de seleção de texto nunca atrasa a imagem nem a virada.
        setVirada((viradaAtual) => viradaAtual?.fase === "waiting" ? { ...viradaAtual, fase: "turning" } : viradaAtual);
        if (zoom <= 1.5) {
          const seguintes = paginasLivro(destinoViradaLivro(pagina, total, dupla, 1), total, dupla);
          const anteriores = paginasLivro(destinoViradaLivro(pagina, total, dupla, -1), total, dupla);
          const numeros = [...new Set([seguintes.esquerda, seguintes.direita, anteriores.esquerda, anteriores.direita])]
            .filter((n): n is number => n !== null && n !== faces.esquerda && n !== faces.direita);
          aquecimento = window.requestAnimationFrame(() => {
            if (!ativo) return;
            // Uma página por vez: limita CPU e memória, sem competir com o desenho visível.
            void (async () => {
              for (const numero of numeros) {
                if (!ativo || sessaoPaginas.current !== atual) return;
                try { await atual.preparar(numero); } catch { return; }
              }
            })();
          });
        }
      } catch (erro) { if (ativo && (erro as Error)?.name !== "RenderingCancelledException") setFalhaDocumento(true); }
      finally { if (ativo) { setRenderizando(false); if (toques.current.size < 2) ancoraZoom.current = null; } }
    }
    void desenhar();
    return () => { ativo = false; window.cancelAnimationFrame(aquecimento); };
    // A página ativa dentro da mesma abertura não exige outro desenho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, faces.esquerda, faces.direita, dupla, zoom, largura, altura, imersivo]);

  useEffect(() => {
    if (!pdf || virada || renderizando) return;
    let ativo = true;
    const layers: { cancel(): void }[] = [];
    async function desenharTexto() {
      const lib = await carregarBibliotecaPdf(); if (!ativo) return;
      await Promise.all([
        { numero: faces.direita, texto: texto.current },
        { numero: faces.esquerda, texto: textoEsquerdo.current },
      ].map(async face => {
        if (!face.numero || !face.texto || !quadros[face.numero]) return;
        const pronta = facesPreparadas.current.get(face.numero); if (!pronta) return;
        const { page, viewport, quadro } = pronta;
        const content = await page.getTextContent(); if (!ativo) return;
        const x = quadro.x * dimensoes.width, y = quadro.y * dimensoes.height;
        face.texto.replaceChildren(); face.texto.style.left = `${x}px`; face.texto.style.top = `${y}px`;
        face.texto.style.width = `${viewport.width}px`; face.texto.style.height = `${viewport.height}px`;
        face.texto.style.right = "auto"; face.texto.style.bottom = "auto";
        face.texto.style.setProperty("--scale-factor", String(viewport.scale));
        face.texto.style.setProperty("--total-scale-factor", String(viewport.scale * page.userUnit));
        const layer = new lib.TextLayer({ textContentSource: content, container: face.texto, viewport });
        layers.push(layer); await layer.render();
        if (ativo) {
          face.texto.style.width = `${viewport.width}px`; face.texto.style.height = `${viewport.height}px`;
        }
      }));
      if (ativo) setTextoPronto((versao) => versao + 1);
    }
    void desenharTexto().catch((erro) => {
      if (ativo && process.env.NODE_ENV === "development" && (erro as Error)?.name !== "RenderingCancelledException") console.error("Biblioteca texto:", erro);
    });
    return () => { ativo = false; layers.forEach(layer => layer.cancel()); };
  }, [pdf, faces.esquerda, faces.direita, quadros, dimensoes, virada, renderizando]);

  useEffect(() => {
    const areas: Record<number, Area[]> = {};
    if (termoPesquisado && !renderizando && !virada) {
      for (const face of [
        { numero: faces.esquerda, camada: textoEsquerdo.current },
        { numero: faces.direita, camada: texto.current },
      ]) {
        if (face.numero && face.camada) areas[face.numero] = areasTermoPdf(face.camada, termoPesquisado);
      }
    }
    setAreasBusca(areas);
  }, [termoPesquisado, textoPronto, faces.esquerda, faces.direita, quadros, renderizando, virada]);

  useLayoutEffect(() => {
    if (renderizando) return;
    function desenharMarcacoes(incluirBusca = true) {
      for (const face of [
        { numero: faces.esquerda, canvas: canvasEsquerdo.current },
        { numero: faces.direita, canvas: canvas.current },
      ]) {
        if (!face.numero || !face.canvas) continue;
        const pronta = facesPreparadas.current.get(face.numero), ctx = face.canvas.getContext("2d");
        if (!pronta || !ctx || !quadros[face.numero]) continue;
        const marcacoes = anotacoes.filter(a => anotacaoTemTrecho(a) && a.pagina === face.numero);
        pintarMarcacoesPdf(ctx, pronta.canvas, pronta.quadro, [
          ...marcacoes, { cor: "AMARELO", areas: incluirBusca ? areasBusca[face.numero] || [] : [] },
        ]);
      }
    }
    desenharMarcacoes();
    const antesDeImprimir = () => desenharMarcacoes(false);
    const depoisDeImprimir = () => desenharMarcacoes();
    window.addEventListener("beforeprint", antesDeImprimir);
    window.addEventListener("afterprint", depoisDeImprimir);
    return () => {
      window.removeEventListener("beforeprint", antesDeImprimir);
      window.removeEventListener("afterprint", depoisDeImprimir);
    };
  }, [anotacoes, areasBusca, quadros, dimensoes, renderizando, faces.esquerda, faces.direita]);

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
    if (!selected || selected.isCollapsed || !selected.rangeCount) { setSelecao(null); return; }
    const range = selected.getRangeAt(0);
    const esquerda = textoEsquerdo.current?.contains(range.commonAncestorContainer);
    const camada = esquerda ? textoEsquerdo.current : texto.current;
    const numero = esquerda ? faces.esquerda : faces.direita;
    if (!camada?.contains(range.commonAncestorContainer) || !numero) { setSelecao(null); return; }
    const trecho = selected.toString().trim(); if (!trecho || trecho.length > 2000) { setSelecao(null); return; }
    const bounds = camada.getBoundingClientRect();
    const areas = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1).slice(0, 100).map((r) => {
      const x = Math.max(0, Math.min(1, (r.left - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (r.top - bounds.top) / bounds.height));
      return { x, y, largura: Math.min(1 - x, r.width / bounds.width), altura: Math.min(1 - y, r.height / bounds.height) };
    }).filter((r) => r.largura > 0 && r.altura > 0);
    setPagina(numero); setSelecao({ trecho, areas, pagina: numero });
  }, [faces.esquerda, faces.direita]);
  useEffect(() => {
    if (!selecionarTexto) return;
    function mudouSelecao() { if (!window.getSelection()?.isCollapsed) capturarSelecao(); }
    document.addEventListener("selectionchange", mudouSelecao);
    return () => document.removeEventListener("selectionchange", mudouSelecao);
  }, [selecionarTexto, capturarSelecao]);
  function citar(trecho: string, numero = pagina) { return `${trecho}\n\n${titulo} — ${t("pageCitation", { page: numero })}`; }
  async function copiar() {
    if (!podeCopiar || !selecao || selecao.trecho.length > LIMITE_TRECHO_BIBLIOTECA) { avisar("copyRestricted", false); return; }
    try { await navigator.clipboard.writeText(citar(selecao.trecho, selecao.pagina)); avisar("excerptCopied", false); } catch { avisar("copyError"); }
  }
  async function anotar(tipo: Anotacao["tipo"]) {
    if (!podeAnotar) return;
    if (tipo === "DESTAQUE" && !temSelecao) return;
    const paginaAnotacao = tipo === "DESTAQUE" ? selecao!.pagina : pagina;
    const alvo = tipo === "DESTAQUE" ? selecao : tipo === "NOTA" ? contextoNota : null;
    const notaEnviada = textoNota;
    setSalvando(true);
    try {
      const res = await fetch(`${base}/anotacoes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        tipo, pagina: paginaAnotacao, cor: tipo === "NOTA" && contextoNota ? contextoNota.cor : cor,
        trecho: alvo?.trecho || null, areas: alvo?.areas || [], conteudo: tipo === "NOTA" ? notaEnviada : null,
      }) });
      if (!res.ok) throw new Error(); const data = await res.json();
      setAnotacoes((lista) => [...lista.filter((a) => a.id !== data.anotacao.id), data.anotacao].sort((a, b) => a.pagina - b.pagina));
      if (tipo === "NOTA") {
        setRascunhos(notas => notas[paginaAnotacao] === notaEnviada ? { ...notas, [paginaAnotacao]: "" } : notas);
        setContextosNotas(notas => { const novas = { ...notas }; delete novas[paginaAnotacao]; return novas; });
        setAnotacaoAberta(data.anotacao.id);
      }
      setSelecao(null); window.getSelection()?.removeAllRanges();
    } catch { avisar("annotationError"); } finally { setSalvando(false); }
  }
  async function remover(id: string) {
    if (!podeAnotar) return;
    setSalvando(true);
    try {
      const res = await fetch(`${base}/anotacoes`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error(); setAnotacoes((lista) => lista.filter((a) => a.id !== id));
      setAnotacaoAberta(aberta => aberta === id ? null : aberta);
    } catch { avisar("annotationError"); } finally { setSalvando(false); }
  }
  async function pesquisar() {
    if (!pdf || !busca.trim()) return;
    const numero = ++numeroBusca.current; setBuscando(true); setBuscou(false); setResultados([]);
    const encontrados: { pagina: number; trecho: string }[] = []; const termo = busca.trim();
    setTermoPesquisado(termo);
    try {
      for (let p = 1; p <= pdf.numPages && encontrados.length < 100; p++) {
        if (numero !== numeroBusca.current) return;
        let conteudo = textosPaginas.current.get(p);
        if (conteudo === undefined) {
          const page = await pdf.getPage(p); const textoPagina = await page.getTextContent();
          if (numero !== numeroBusca.current) return;
          conteudo = textoPagina.items.map((item) => "str" in item ? item.str : "").join(" ");
          if (textosPaginas.current.size < 1000) textosPaginas.current.set(p, conteudo);
        }
        const match = localizarTermoPdf(conteudo, termo, 1)[0];
        if (match) encontrados.push({ pagina: p, trecho: conteudo.slice(Math.max(0, match.inicio - 45), match.fim + 75) });
        if (p % 10 === 0) await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      if (numero === numeroBusca.current) { setResultados(encontrados); setBuscou(true); }
    } catch { if (numero === numeroBusca.current) avisar("searchError"); }
    finally { if (numero === numeroBusca.current) setBuscando(false); }
  }

  function renderizarFace(numero: number | null, esquerda: boolean) {
    if (!numero) return <div className={styles.emptyFace} style={{ width: dimensoes.width, height: dimensoes.height }} aria-hidden="true" />;
    const quadro = quadros[numero] || { x: 0, y: 0, w: 1, h: 1 };
    return <div className={styles.page} ref={esquerda ? folhaEsquerda : folha} data-reader-page={numero} aria-current={pagina === numero ? "page" : undefined}
      aria-label={t("documentPage", { page: numero })} tabIndex={0} style={{ width: dimensoes.width || undefined, height: dimensoes.height || undefined }}
      onPointerDown={e => { if (!(e.target as HTMLElement).closest("button") && !virada && !renderizando) setPagina(numero); }}
      onContextMenu={e => e.preventDefault()}>
      <canvas ref={esquerda ? canvasEsquerdo : canvas} aria-label={t("documentPage", { page: numero })} />
      {(areasBusca[numero] || []).map((area, i) => <span key={`busca-${i}`} className={styles.searchHighlight} aria-hidden="true" data-search-highlight="true"
        style={{ left: `${(quadro.x + area.x * quadro.w) * 100}%`, top: `${(quadro.y + area.y * quadro.h) * 100}%`, width: `${area.largura * quadro.w * 100}%`, height: `${area.altura * quadro.h * 100}%` }} />)}
      {anotacoes.filter(a => anotacaoTemTrecho(a) && a.pagina === numero).flatMap(a => a.areas.map((area, i) => <span key={`${a.id}-${i}`} className={styles.highlight} data-annotation-highlight={a.id}
        style={{ left: `${(quadro.x + area.x * quadro.w) * 100}%`, top: `${(quadro.y + area.y * quadro.h) * 100}%`, width: `${area.largura * quadro.w * 100}%`, height: `${area.altura * quadro.h * 100}%` }} />))}
      <div ref={esquerda ? textoEsquerdo : texto} className={styles.textLayer} onPointerUp={capturarSelecao} onKeyUp={capturarSelecao} onCopy={e => {
        e.preventDefault(); const trecho = window.getSelection()?.toString().trim() || "";
        if (podeCopiar && trecho && trecho.length <= LIMITE_TRECHO_BIBLIOTECA) e.clipboardData.setData("text/plain", citar(trecho, numero));
        else avisar("copyRestricted", false);
      }} />
      <span className={styles.watermark}>{t("watermark", { id: usuarioId })}</span>
      {anotacoes.filter(a => a.tipo === "NOTA" && anotacaoTemTrecho(a) && a.pagina === numero).map(a => {
        const area = a.areas[0], aberta = anotacaoAberta === a.id;
        const top = (quadro.y + area.y * quadro.h) * 100;
        const left = (quadro.x + (area.x + area.largura) * quadro.w) * 100;
        return <div key={`nota-${a.id}`}>
          <button type="button" className={styles.notePin} style={{ top: `${top}%`, left: `clamp(0px, calc(${left}% + 5px), calc(100% - 28px))` }}
            aria-label={t("annotationTools.openInlineNote", { page: numero })} aria-expanded={aberta} aria-controls={`nota-${a.id}`}
            onClick={() => { setPagina(numero); setAnotacaoAberta(aberta ? null : a.id); }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ transform: aberta ? "rotate(90deg)" : undefined }}><path d="m7 4 6 6-6 6" /></svg>
          </button>
          {aberta && <aside id={`nota-${a.id}`} className={styles.inlineNote} aria-label={t("annotationTools.comment")} style={{ top: `min(calc(${top}% + 29px), calc(100% - 150px))`, left: `${Math.min(40, Math.max(2, left - 35))}%` }}>
            <button type="button" className={`${styles.button} ${styles.closeInlineNote}`} onClick={() => setAnotacaoAberta(null)} aria-label={t("closePanel")}>×</button>
            <strong>{t("annotationTools.comment")}</strong><p>{a.conteudo}</p>
          </aside>}
        </div>;
      })}
    </div>;
  }
  const fatorVisual = (zoomGesto ?? zoom) / zoomDesenhado;
  const conteudo = <section ref={raiz} data-reader-version="cores-vivas-20261014" id={imersivo ? "biblioteca-leitor-fullscreen" : undefined}
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
        <button className={styles.button} disabled={anterior === pagina || renderizando || !!virada} onClick={() => ir(anterior)} aria-label={t("previousPage")} title={t("previousPage")}>‹</button>
        <form className={styles.pageNavigation} onSubmit={(e) => { e.preventDefault(); const p = Number(paginaDigitada); ir(p); if (!Number.isInteger(p) || p < 1 || p > total) setPaginaDigitada(String(pagina)); }}>
          <label className={styles.hidden} htmlFor="pagina-leitor">{t("pageLabel")}</label>
          <input id="pagina-leitor" className={styles.smallInput} type="number" min={1} max={total} value={paginaDigitada} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setPaginaDigitada(e.target.value)} />
          <span>{t("pageTotal", { total })}</span><button className={styles.button} disabled={renderizando || !!virada}>{t("goToPage")}</button>
        </form>
        <button className={styles.button} disabled={proxima === pagina || renderizando || !!virada} onClick={() => ir(proxima)} aria-label={t("nextPage")} title={t("nextPage")}>›</button>
        <div className={styles.zoomControls} aria-label={t("zoom")}>
          <button className={styles.button} onClick={() => ajustarZoom(zoom - .25)} disabled={zoom <= .5 || !!virada} aria-label={t("zoomOut")}>−</button>
          <span data-reader-zoom={Math.round((zoomGesto ?? zoom) * 100)}>{Math.round((zoomGesto ?? zoom) * 100)}%</span>
          <button className={styles.button} onClick={() => ajustarZoom(zoom + .25)} disabled={zoom >= 4 || !!virada} aria-label={t("zoomIn")}>+</button>
          <button className={styles.button} onClick={() => ajustarZoom(1)} disabled={!!virada}>{t("fitPage")}</button>
        </div>
        <div className={styles.formatControls}>
          <button className={styles.button} aria-pressed={!dupla} disabled={!!virada} onClick={() => escolherModo("pagina")}>{t("singlePage")}</button>
          <button className={styles.button} aria-pressed={dupla} disabled={!!virada} onClick={() => escolherModo("livro")}>{t("bookSpread")}</button>
        </div>
        {dupla && faces.esquerda && <span className={styles.muted}>{t("visiblePages", { from: faces.esquerda, to: faces.direita || faces.esquerda })}</span>}
        {downloadId && <a className={styles.button} href={`/api/biblioteca/arquivos/${downloadId}/download`}>{t("downloadPdf")}</a>}
        {podeImprimir && <button className={styles.button} onClick={() => window.print()}>{t("printPage")}</button>}
      </div>}
      {pdf && !falhaDocumento && <div className={styles.annotationToolbar} aria-label={t("annotationTools.pens")}>
        <CanetasBiblioteca cor={cor} ativo={selecionarTexto} disabled={!podeAnotar || salvando} onEscolher={c => { setCor(c); setSelecionarTexto(true); }} />
        <button className={`${styles.button} ${selecionarTexto ? styles.primary : ""}`} aria-pressed={selecionarTexto} onClick={() => setSelecionarTexto(!selecionarTexto)}>{t("selectTextMode")}</button>
        <button className={styles.button} disabled={!podeAnotar || salvando || !temSelecao || renderizando} onClick={() => void anotar("DESTAQUE")}>{t("highlightSelection")}</button>
        <button className={styles.button} disabled={!podeAnotar || salvando || !temSelecao || renderizando} onClick={prepararNotaTrecho}>{t("annotationTools.annotateExcerpt")}</button>
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
          <div className={styles.sheetHolder} style={{ width: dimensoes.width * (dupla ? 2 : 1) * fatorVisual || undefined, height: dimensoes.height * fatorVisual || undefined }}>
          <div ref={livro} className={`${styles.bookSheets} ${dupla ? styles.dualPages : ""}`} style={{ width: dimensoes.width * (dupla ? 2 : 1) || undefined, height: dimensoes.height || undefined, transform: `scale(${fatorVisual})`, transformOrigin: "top left" }}>
            {dupla && renderizarFace(faces.esquerda, true)}
            {renderizarFace(faces.direita, false)}
            {virada && <FolhaFlexivelBiblioteca
              origem={virada.sentido === "next" || !dupla ? copiaVirada.current?.direita || null : copiaVirada.current?.esquerda || null}
              apoio={virada.sentido === "next" ? copiaVirada.current?.esquerda || null : copiaVirada.current?.direita || null}
              verso={copiaVirada.current?.verso || null} dupla={dupla} largura={dimensoes.width} altura={dimensoes.height}
              sentido={virada.sentido} animar={virada.fase === "turning"} onConcluir={concluirVirada} />}
            {anterior !== pagina && <button className={`${styles.pageCorner} ${styles.cornerLeft}`} disabled={renderizando || !!virada} onClick={() => ir(anterior)} aria-label={t("turnPrevious")} title={t("turnPrevious")}>‹</button>}
            {proxima !== pagina && <button className={`${styles.pageCorner} ${styles.cornerRight}`} disabled={renderizando || !!virada} onClick={() => ir(proxima)} aria-label={t("turnNext")} title={t("turnNext")}>›</button>}
          </div>
          </div>
        </div>
        {temSelecao && painel !== "notes" && <div className={styles.selectionAction}>
          <button className={`${styles.button} ${styles.primary}`} disabled={!podeAnotar || salvando || renderizando} onClick={() => void anotar("DESTAQUE")}>{t("highlightSelection")}</button>
          <button className={styles.button} disabled={!podeAnotar || salvando || renderizando} onClick={prepararNotaTrecho}>{t("annotationTools.annotateExcerpt")}</button>
        </div>}
        {painel && <aside className={styles.readerPanel} aria-label={t(painel === "notes" ? "myAnnotations" : painel === "search" ? "documentSearch" : "rightsTitle")}>
          <button className={`${styles.button} ${styles.closePanel}`} onClick={() => setPainel(null)} aria-label={t("closePanel")}>×</button>
          {painel === "search" && <><h2>{t("documentSearch")}</h2>
            <form className={styles.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); void pesquisar(); }}>
              <label className={styles.hidden} htmlFor="pesquisa-pdf">{t("documentSearch")}</label><input id="pesquisa-pdf" placeholder={t("documentSearch")} value={busca} maxLength={100} onChange={(e) => { numeroBusca.current++; setBuscando(false); setBuscou(false); setResultados([]); setTermoPesquisado(""); setBusca(e.target.value); }} />
              <button className={styles.button} disabled={buscando || !busca.trim()}>{t(buscando ? "searching" : "search")}</button>
              {buscando && <button type="button" className={styles.button} onClick={() => { numeroBusca.current++; setBuscando(false); }}>{t("cancel")}</button>}
            </form>
            {buscou && <p role="status">{t(resultados.length ? "searchResults" : "noTextResults", { count: resultados.length })}</p>}
            <div className={styles.results}>{resultados.map((r) => <button className={styles.button} style={{ display: "block", textAlign: "left", width: "100%" }} key={r.pagina} aria-current={pagina === r.pagina ? "page" : undefined} onClick={() => ir(r.pagina, false)}>{t("pageCitation", { page: r.pagina })}: <TrechoBusca texto={r.trecho} termo={termoPesquisado} /></button>)}</div>
          </>}
          {painel === "rights" && <><h2>{t("rightsTitle")}</h2><p>{t("rightsNotice")}</p><p className={styles.notice}>{t("readerRights")}</p></>}
          {painel === "notes" && <PainelAnotacoesBiblioteca
            titulo={titulo} pagina={pagina} anotacoes={anotacoes} selecionando={selecionarTexto}
            carregando={carregandoAnotacoes} erro={erroAnotacoes} salvando={salvando} podeAnotar={podeAnotar}
            podeCopiar={podeCopiar} renderizando={renderizando} textoNota={textoNota} trechoNota={contextoNota?.trecho || ""}
            temSelecao={temSelecao} selecionados={selecao?.trecho.length || 0}
            onSelecionar={() => { setSelecionarTexto(!selecionarTexto); if (!selecionarTexto && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900)) setPainel(null); }}
            onRecarregar={() => setTentativaAnotacoes(x => x + 1)} onMarcarPagina={() => void anotar("MARCADOR")}
            onDestacar={() => void anotar("DESTAQUE")} onAnotarTrecho={prepararNotaTrecho} onCopiar={() => void copiar()}
            onLimparTrecho={() => setContextosNotas(notas => { const novas = { ...notas }; delete novas[pagina]; return novas; })}
            onTextoNota={setTextoNota} onSalvarNota={() => void anotar("NOTA")}
            onAbrir={a => { ir(a.pagina, false); setAnotacaoAberta(a.id); if (window.innerWidth <= 900) setPainel(null); }}
            onRemover={id => void remover(id)} onErroExportacao={() => avisar("annotationTools.exportError")} />}

        </aside>}
      </div>
      <p className={`${styles.muted} ${styles.readerHint}`}>{t("readerGesturesHelp")}</p>
    </>}
    {mensagem && <PhanyxToast tipo={tipoMensagem} mensagem={mensagem} onClose={() => setMensagem("")} />}
  </section>;
  return imersivo && typeof document !== "undefined" ? createPortal(conteudo, document.body) : conteudo;
}
