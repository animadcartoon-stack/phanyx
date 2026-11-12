"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import type { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import LeitorPdfDocumento, { botaoLeitorPdf, type PontoPdf } from "./LeitorPdfDocumento";
import { textosEditorPdf } from "@/lib/documentos-docentes/i18n-editor-pdf";
import { textosEditorTextoPdf } from "@/lib/documentos-docentes/i18n-editor-texto-pdf";
import { documentoTextoVazio, importarTextoPdf, type TextoImportadoPdf } from "@/lib/documentos-docentes/texto-editavel-pdf";

import FerramentaVisualPdf from "./FerramentaVisualPdf";
import { textosEdicaoNativaPdf } from "@/lib/documentos-docentes/i18n-edicao-nativa-pdf";
import { executarEdicaoNativaPdf, type CaixaNativaPdf, type SelecaoNativaPdf } from "@/lib/documentos-docentes/edicao-nativa-pdf";
import { textosEdicaoVisualPdf } from "@/lib/documentos-docentes/i18n-edicao-visual-pdf";
import { aplicarOperacaoVisualPdf, type AreaVisualPdf, type OperacaoVisualPdf } from "@/lib/documentos-docentes/operacoes-visuais-pdf";
import { useTelaCheiaPdf } from "./useTelaCheiaPdf";
import { bytesImagemPdf, dimensoesImagemPdf, lerImagemPdf } from "@/lib/documentos-docentes/imagem-pdf-local";

const EditorTextoPdf = dynamic(() => import("./EditorTextoPdf"), { ssr: false });

const LIMITE_ARQUIVO = 30 * 1024 * 1024;
type DadosPdf = { bytes: Uint8Array<ArrayBuffer>; total: number; nome: string; modificado?: boolean };
type ModoEdicaoPdf = OperacaoVisualPdf["tipo"] | "textoNativo";
type OperacaoPdf = (documento: PDFDocument, biblioteca: typeof import("pdf-lib")) => Promise<void> | void;
type OrigemPdf = {
  url: string;
  nome: string;
  versao: string;
  permiteEdicao: boolean;
};

type Props = {
  onVoltar: () => void;
  origem?: OrigemPdf;
  rotuloVoltar?: string;
  acoesLeitura?: ReactNode;
  avisoLeitura?: ReactNode;
};

const botaoModo = `${botaoLeitorPdf} aria-pressed:border-blue-700 aria-pressed:bg-blue-100 aria-pressed:text-blue-900 dark:aria-pressed:bg-blue-950 dark:aria-pressed:text-blue-200`;
const campo = "rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600";

export default function EditorPdfLocal({ onVoltar, origem, rotuloVoltar, acoesLeitura, avisoLeitura }: Props) {
  const locale = useLocale();
  const t = textosEditorPdf(locale);
  const tTexto = textosEditorTextoPdf(locale);
  const tVisual = textosEdicaoVisualPdf(locale);
  const tNativo = textosEdicaoNativaPdf(locale);
  const leitor = useTranslations("ReaderLibrary");
  const tela = useTelaCheiaPdf();
  const [imagemSelecionada, setImagemSelecionada] = useState<File | null>(null);
  const [larguraImagem, setLarguraImagem] = useState("");
  const [dados, setDados] = useState<DadosPdf | null>(null);
  const [pdfLido, setPdfLido] = useState<PDFDocumentProxy | null>(null);
  const [edicao, setEdicao] = useState(false);
  const [modoVisual, setModoVisual] = useState<ModoEdicaoPdf | null>(null);
  const [selecaoNativa, setSelecaoNativa] = useState<SelecaoNativaPdf | null>(null);
  const [textoNativo, setTextoNativo] = useState("");
  const caixaTextoNativo = useRef<HTMLTextAreaElement>(null);
  const [corNativa, setCorNativa] = useState<string | null>(null);
  const [areaVisual, setAreaVisual] = useState<AreaVisualPdf | null>(null);
  const [anterior, setAnterior] = useState<{ dados: DadosPdf; pagina: number } | null>(null);
  const [arquivo, setArquivo] = useState<{ dados: DadosPdf; url: string } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState("");
  const [tamanho, setTamanho] = useState("12");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [progresso, setProgresso] = useState("");
  const [textoEditavel, setTextoEditavel] = useState<{ documento: TextoImportadoPdf; nome: string; importado: boolean } | null>(null);

  useEffect(() => {
    if (selecaoNativa && !ocupado) caixaTextoNativo.current?.focus({ preventScroll: true });
  }, [selecaoNativa, ocupado]);

  useEffect(() => {
    if (!dados) return;
    const url = URL.createObjectURL(new Blob([dados.bytes], { type: "application/pdf" }));
    setArquivo({ url, dados });
    return () => URL.revokeObjectURL(url);
  }, [dados]);

  async function executar(fn: () => Promise<void>) {
    setOcupado(true);
    setErro("");
    try { await fn(); }
    catch (falha) {
      const codigo = falha instanceof Error ? falha.message : "";
      const errosVisuais: Record<string, string> = {
        AREA_PEQUENA: tVisual.areaPequena,
        GRAFICO_PEQUENO: tVisual.graficoPequeno,
        TEXTO_NAO_CABE: tVisual.textoNaoCabe,
        TEXTO_NATIVO_NAO_CABE: tNativo.naoCabe,
        TEXTO_NATIVO_INDISPONIVEL: tNativo.semTexto,
        COR_OBJETO_PARCIAL: tNativo.parcial,
        FONTE_NATIVA: tNativo.fonte,
        LINHAS_NATIVAS: tNativo.linhas,
      };
      setErro(errosVisuais[codigo] ?? t.falha);
    }
    finally { setOcupado(false); }
  }

  function habilitarEdicao() {
    if (ocupado || (origem && !origem.permiteEdicao)) return;
    if (dados) {
      setEdicao(true);
      return;
    }
    if (!origem || !pdfLido) return;
    void executar(async () => {
      // Usa os bytes da versão já carregada no leitor, sem solicitar outra geração.
      const bytes = await pdfLido.getData();
      if (bytes.byteLength > LIMITE_ARQUIVO) {
        setErro(t.arquivo);
        return;
      }
      setDados({ bytes: new Uint8Array(bytes), total: pdfLido.numPages, nome: origem.nome });
      setEdicao(true);
    });
  }

  function voltarLeitura() {
    setX("");
    setY("");
    escolherModoVisual(null);
    setEdicao(false);
  }

  function escolherModoVisual(modo: ModoEdicaoPdf | null) {
    setErro("");
    setAreaVisual(null);
    setModoVisual(modo);
    setSelecaoNativa(null);
  }

  async function editarTexto() {
    if (!dados) return;
    await tela.fechar();
    setOcupado(true);
    setErro("");
    try {
      const documento = await importarTextoPdf(dados.bytes, (pagina, total) => {
        setProgresso(`${tTexto.extracao} ${pagina}/${total}`);
      });
      setTextoEditavel({ documento, nome: dados.nome, importado: true });
    } catch (falha) {
      const codigo = falha instanceof Error ? falha.message : "";
      setErro(codigo === "SEM_TEXTO" ? tTexto.semTexto : codigo === "TEXTO_LONGO" ? tTexto.textoLongo : t.falha);
    } finally {
      setProgresso("");
      setOcupado(false);
    }
  }

  async function bytesDoArquivo(file: File) {
    if (file.size < 5 || file.size > LIMITE_ARQUIVO) throw new Error("Tamanho inválido");
    return new Uint8Array(await file.arrayBuffer());
  }

  function navegar(numero: number) {
    setPagina(numero);
    setAreaVisual(null);
    setSelecaoNativa(null);
    setX("");
    setY("");
  }

  function abrir(file: File) {
    void executar(async () => {
      const lib = await import("pdf-lib");
      const bytes = await bytesDoArquivo(file);
      const pdf = await lib.PDFDocument.load(bytes, { updateMetadata: false });
      if (!pdf.getPageCount()) throw new Error("PDF vazio");
      navegar(1);
      setImagemSelecionada(null);
      setLarguraImagem("");
      setAnterior(null);
      escolherModoVisual(null);
      setEdicao(false);
      setDados({ bytes, total: pdf.getPageCount(), nome: file.name });
    });
  }

  function alterar(fn: OperacaoPdf, proximaPagina = pagina) {
    if (!dados) return;
    void executar(async () => {
      const lib = await import("pdf-lib");
      const pdf = await lib.PDFDocument.load(dados.bytes, { updateMetadata: false });
      await fn(pdf, lib);
      const bytes = await pdf.save({ updateFieldAppearances: false });
      if (bytes.byteLength > LIMITE_ARQUIVO) throw new Error("Tamanho inválido");
      guardarCopia(new Uint8Array(bytes), dados, Math.min(proximaPagina, pdf.getPageCount()), pdf.getPageCount());
    });
  }

  function guardarCopia(bytes: Uint8Array<ArrayBuffer>, original: DadosPdf, proximaPagina = pagina, total = original.total) {
    setAnterior({ dados: original, pagina });
    navegar(proximaPagina);
    setDados({ bytes, total, nome: original.nome, modificado: true });
  }

  async function caixaNativa(area: AreaVisualPdf, leitura: PDFDocumentProxy): Promise<CaixaNativaPdf> {
    const folha = await leitura.getPage(pagina);
    const vista = folha.getViewport({ scale: 1 });
    const [x1, y1] = vista.convertToPdfPoint(area.x * vista.width, area.y * vista.height);
    const [x2, y2] = vista.convertToPdfPoint((area.x + area.largura) * vista.width, (area.y + area.altura) * vista.height);
    return { esquerda: Math.min(x1, x2), baixo: Math.min(y1, y2), direita: Math.max(x1, x2), alto: Math.max(y1, y2) };
  }

  function selecionarArea(area: AreaVisualPdf | null) {
    if (ocupado) return;
    setAreaVisual(area);
    setSelecaoNativa(null);
    setCorNativa(null);
    setTextoNativo("");
    if (modoVisual !== "textoNativo" || !area || !dados || !pdfLido) return;
    void executar(async () => {
      const caixa = await caixaNativa(area, pdfLido);
      const resposta = await executarEdicaoNativaPdf(dados.bytes, pagina, { tipo: "selecionar", caixa });
      if ("erro" in resposta) throw new Error(resposta.erro);
      if (!("selecao" in resposta)) throw new Error("PDFIUM");
      setTextoNativo(resposta.selecao.texto);
      setSelecaoNativa(resposta.selecao);
    });
  }

  function salvarTextoNativo() {
    if (!dados || !areaVisual || !pdfLido || !selecaoNativa || ocupado) return;
    const cor = corNativa === selecaoNativa.cor ? null : corNativa;
    if (textoNativo === selecaoNativa.texto && !cor) return;
    void executar(async () => {
      const caixa = await caixaNativa(areaVisual, pdfLido);
      const resposta = await executarEdicaoNativaPdf(dados.bytes, pagina, { tipo: "editar", caixa, texto: textoNativo, cor });
      if ("erro" in resposta) throw new Error(resposta.erro);
      if (!("bytes" in resposta)) throw new Error("PDFIUM");
      guardarCopia(new Uint8Array(resposta.bytes), dados);
    });
  }

  function desfazer() {
    if (!anterior || ocupado) return;
    navegar(anterior.pagina);
    setDados(anterior.dados);
    setAnterior(null);
    setErro("");
  }

  function aplicarVisual(op: OperacaoVisualPdf) {
    if (!areaVisual || !pdfLido || ocupado) return;
    alterar((pdf, lib) => aplicarOperacaoVisualPdf(pdf, lib, pdfLido, pagina, areaVisual, op));
  }

  function mover(destino: number) {
    alterar(pdf => {
      const atual = pdf.getPage(pagina - 1);
      pdf.removePage(pagina - 1);
      pdf.insertPage(destino - 1, atual);
    }, destino);
  }

  function mesclar(file: File) {
    alterar(async (pdf, lib) => {
      const adicional = await lib.PDFDocument.load(await bytesDoArquivo(file), { updateMetadata: false });
      const paginas = await pdf.copyPages(adicional, adicional.getPageIndices());
      for (const p of paginas) pdf.addPage(p);
    });
  }

  const ponto = x !== "" && y !== "" && Number.isFinite(Number(x)) && Number.isFinite(Number(y))
    ? { x: Number(x), y: Number(y) } : null;
  const pt = Number(tamanho);

  function selecionarPonto(p: PontoPdf) {
    setX(p.x.toFixed(1));
    setY(p.y.toFixed(1));
  }

  function adicionarTexto() {
    if (!ponto || !texto.trim() || pt < 6 || pt > 72) return;
    alterar(async (pdf, lib) => {
      const p = pdf.getPage(pagina - 1);
      const caixa = p.getCropBox();
      if (ponto.x < caixa.x || ponto.x > caixa.x + caixa.width || ponto.y < caixa.y || ponto.y > caixa.y + caixa.height) {
        throw new Error("Posição fora da página");
      }
      const fonte = await pdf.embedFont(lib.StandardFonts.Helvetica);
      p.drawText(texto.trim(), { ...ponto, font: fonte, size: pt, rotate: p.getRotation() });
    });
  }

  async function selecionarImagem(arquivo: File) {
    setImagemSelecionada(null);
    setLarguraImagem("");
    setErro("");
    setOcupado(true);
    try {
      await lerImagemPdf(arquivo);
      setImagemSelecionada(arquivo);
    } catch { setErro(tTexto.imagemFalha); }
    finally { setOcupado(false); }
  }

  function inserirImagem() {
    if (!ponto || !imagemSelecionada) return;
    const solicitada = larguraImagem === "" ? undefined : Number(larguraImagem);
    if (solicitada !== undefined && (!Number.isFinite(solicitada) || solicitada <= 0)) return;
    alterar(async (pdf, lib) => {
      const { bytes, jpeg } = await bytesImagemPdf(imagemSelecionada);
      const imagem = jpeg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      const paginaPdf = pdf.getPage(pagina - 1);
      const caixa = paginaPdf.getCropBox();
      const angulo = (paginaPdf.getRotation().angle + 360) % 360;
      const esq = ponto.x - caixa.x, baixo = ponto.y - caixa.y;
      const dir = caixa.width - esq, cima = caixa.height - baixo;
      if (Math.min(esq, baixo, dir, cima) < 0) throw new Error("Posição fora da página");
      const limites = angulo === 90 ? [cima, esq] : angulo === 180 ? [esq, baixo] : angulo === 270 ? [baixo, dir] : [dir, cima];
      const dimensoes = dimensoesImagemPdf(imagem.width, imagem.height, limites[0], limites[1], solicitada);
      if (dimensoes.width <= 0 || dimensoes.height <= 0) throw new Error("Imagem fora da página");
      paginaPdf.drawImage(imagem, { ...ponto, ...dimensoes, rotate: paginaPdf.getRotation() });
    });
  }

  async function abrirTextoVazio() {
    await tela.fechar();
    setTextoEditavel({ documento: { conteudo: documentoTextoVazio, paginasSemTexto: [] }, nome: "documento-phanyx", importado: false });
  }

  const copiaModificada = arquivo?.dados.modificado === true;
  const urlVisivel = origem && !copiaModificada ? origem.url : arquivo?.url;
  const nomeCopia = dados && `${dados.nome.replace(/\.pdf$/i, "")}-phanyx.pdf`;
  const nomeVisivel = origem?.nome ?? dados?.nome;
  const podeHabilitar = origem?.permiteEdicao ?? true;

  if (textoEditavel) return <EditorTextoPdf {...textoEditavel} onVoltar={() => setTextoEditavel(null)} />;

  return (
    <main ref={tela.principal} className={`space-y-5 text-slate-900 dark:text-slate-100 ${tela.telaCheia ? "fixed inset-0 z-[1000] overflow-auto bg-white p-4 dark:bg-slate-950" : "mx-auto max-w-7xl"}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{nomeVisivel ?? t.leitor}</h1>
          {origem && <p className="text-sm">{copiaModificada ? t.copiaLocal : origem.versao}</p>}
          {urlVisivel && <p className="text-sm">{edicao ? t.ajuda : t.modoLeitura}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!origem && (!urlVisivel || edicao) && <button type="button" disabled={ocupado} className={botaoLeitorPdf} onClick={() => void abrirTextoVazio()}>{tTexto.novo}</button>}
          {urlVisivel && <button type="button" className={botaoLeitorPdf} onClick={() => void tela.alternar()}>{tela.telaCheia ? tTexto.sairTelaCheia : leitor("fullscreen")}</button>}
          {edicao && <button type="button" disabled={ocupado} className={botaoLeitorPdf} onClick={voltarLeitura}>{t.voltarLeitura}</button>}
          {!edicao && !copiaModificada && acoesLeitura}
          {!edicao && urlVisivel && podeHabilitar && (
            <button type="button" disabled={ocupado || (!dados && !pdfLido)}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={habilitarEdicao}>{t.habilitar}</button>
          )}
          <button type="button" disabled={ocupado} className={botaoLeitorPdf} onClick={() => { void tela.fechar().then(onVoltar); }}>{rotuloVoltar ?? t.descartar}</button>
        </div>
      </header>
      {!origem && <label className="block text-sm font-semibold">
        {t.abrir}
        <input type="file" accept="application/pdf,.pdf" disabled={ocupado} className="mt-1 block max-w-full text-sm"
          onChange={e => { const file = e.target.files?.[0]; if (file) abrir(file); e.target.value = ""; }} />
        <span className="font-normal">{t.arquivo}</span>
      </label>}
      {!edicao && !copiaModificada && avisoLeitura}
      {!edicao && origem && !podeHabilitar && <p className="text-sm">{t.leituraAssinado}</p>}
      {!edicao && arquivo && (!origem || copiaModificada) && (
        <a href={arquivo.url} download={copiaModificada ? nomeCopia : dados?.nome} className={`inline-block ${botaoLeitorPdf}`}>{t.baixar}</a>
      )}
      {erro && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p>}
      {progresso && <p role="status" className="text-sm">{progresso}</p>}
      {urlVisivel && (
        <div className={edicao ? "grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}>
          <LeitorPdfDocumento permitirMarcacoes url={urlVisivel} pagina={pagina} onPagina={n => { if (!ocupado) navegar(n); }}
            onPdfPronto={setPdfLido}
            onArea={edicao && modoVisual ? selecionarArea : undefined} area={areaVisual}
            onPonto={edicao && !modoVisual ? p => { if (!ocupado) selecionarPonto(p); } : undefined}
            ponto={edicao && !modoVisual ? ponto : null} />
          {edicao && dados && arquivo?.dados === dados && <section className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="break-all text-sm font-semibold">{dados.nome}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={ocupado} aria-pressed={modoVisual === "textoNativo"} className={botaoModo}
                onClick={() => escolherModoVisual("textoNativo")}>{tNativo.texto}</button>
              <button type="button" disabled={ocupado} aria-pressed={modoVisual === "remover"} className={botaoModo}
                onClick={() => escolherModoVisual("remover")}>{tVisual.remover}</button>
              {anterior && <button type="button" disabled={ocupado} className={botaoLeitorPdf} onClick={desfazer}>{tVisual.desfazer}</button>}
            </div>
            <div role="group" aria-label={tVisual.inserir}>
              <p className="mb-2 text-sm font-semibold">{tVisual.inserir}</p>
              <div className="flex flex-wrap gap-2">
                {(["forma", "simbolo", "grafico"] as const).map(modo => (
                  <button key={modo} type="button" disabled={ocupado} aria-pressed={modoVisual === modo}
                    className={botaoModo} onClick={() => escolherModoVisual(modo)}>{tVisual[modo]}</button>
                ))}
              </div>
            </div>
            {modoVisual === "textoNativo" && <fieldset disabled={ocupado} className="space-y-2 rounded-lg border border-blue-300 p-3 dark:border-blue-700">
              <p className="text-sm" role="status">{selecaoNativa ? tNativo.pronto : tNativo.selecionar}</p>
              <label className="block text-sm">{tNativo.textoSelecionado}
                <textarea ref={caixaTextoNativo} className={`block w-full ${campo}`} rows={5} maxLength={12000} disabled={!selecaoNativa}
                  value={selecaoNativa ? textoNativo : ""} onChange={e => setTextoNativo(e.target.value)} />
              </label>
              {selecaoNativa && <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">{tNativo.cor}
                  <input type="color" className="h-8 w-10" value={corNativa ?? selecaoNativa.cor ?? "#0f172a"} onChange={e => setCorNativa(e.target.value)} />
                </label>
                <button type="button" disabled={textoNativo === selecaoNativa.texto && (!corNativa || corNativa === selecaoNativa.cor)}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={salvarTextoNativo}>{tVisual.aplicar}</button>
              </div>}
            </fieldset>}
            {modoVisual && modoVisual !== "textoNativo" &&
              <FerramentaVisualPdf key={modoVisual} modo={modoVisual} temArea={Boolean(areaVisual && pdfLido)}
                ocupado={ocupado} onAplicar={aplicarVisual} onCancelar={() => escolherModoVisual(null)} />}
            <button type="button" disabled={ocupado} aria-pressed={modoVisual === "texto"} className={botaoModo}
              onClick={() => escolherModoVisual("texto")}>{tNativo.retoque}</button>
            <button type="button" disabled={ocupado} onClick={() => void editarTexto()}
              className={botaoLeitorPdf}>{tTexto.editar}</button>
            <fieldset disabled={ocupado} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={botaoLeitorPdf} onClick={() => alterar((pdf, lib) => {
                  const p = pdf.getPage(pagina - 1);
                  p.setRotation(lib.degrees((p.getRotation().angle + 90) % 360));
                })}>{t.girar}</button>
                <button type="button" className={botaoLeitorPdf} disabled={pagina <= 1} onClick={() => mover(pagina - 1)}>{t.antes}</button>
                <button type="button" className={botaoLeitorPdf} disabled={pagina >= dados.total} onClick={() => mover(pagina + 1)}>{t.depois}</button>
                <button type="button" className={botaoLeitorPdf} disabled={dados.total < 2} onClick={() => alterar(pdf => pdf.removePage(pagina - 1))}>{t.excluir}</button>
              </div>
              <label className="block text-sm">{t.mesclar}
                <input type="file" accept="application/pdf,.pdf" className="mt-1 block max-w-full"
                  onChange={e => { const file = e.target.files?.[0]; if (file) mesclar(file); e.target.value = ""; }} />
              </label>
              {!modoVisual && <>
                <label className="block text-sm">{t.texto}
                  <textarea maxLength={1000} rows={3} className={`block w-full ${campo}`} value={texto} onChange={e => setTexto(e.target.value)} />
                </label>
                <p className="text-sm">{t.posicao}</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-sm">X <input type="number" step="any" value={x} className={`block w-full ${campo}`} onChange={e => setX(e.target.value)} /></label>
                  <label className="text-sm">Y <input type="number" step="any" value={y} className={`block w-full ${campo}`} onChange={e => setY(e.target.value)} /></label>
                  <label className="text-sm">{t.tamanho} <input type="number" min={6} max={72} value={tamanho} className={`block w-full ${campo}`} onChange={e => setTamanho(e.target.value)} /></label>
                </div>
                <button type="button" className={botaoLeitorPdf} disabled={!ponto || !texto.trim() || pt < 6 || pt > 72} onClick={adicionarTexto}>{t.adicionar}</button>
                <label className="block text-sm">{tTexto.imagem}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 block max-w-full"
                    onChange={e => { const imagem = e.target.files?.[0]; if (imagem) void selecionarImagem(imagem); e.target.value = ""; }} />
                </label>
                {imagemSelecionada && <div className="space-y-2">
                  <p className="break-all text-sm">{imagemSelecionada.name}</p>
                  <label className="block text-sm">{tTexto.larguraPt}
                    <input type="number" min="1" step="any" placeholder={tTexto.original} value={larguraImagem}
                      className={`ml-2 w-24 ${campo}`} onChange={e => setLarguraImagem(e.target.value)} />
                  </label>
                  <button type="button" className={botaoLeitorPdf} disabled={!ponto || (larguraImagem !== "" && !(Number(larguraImagem) > 0))}
                    onClick={inserirImagem}>{tTexto.aplicarImagem}</button>
                </div>}
              </>}
            </fieldset>
            <a href={arquivo.url} download={nomeCopia}
              className="inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              {t.baixar}
            </a>
          </section>}
        </div>
      )}
    </main>
  );
}
