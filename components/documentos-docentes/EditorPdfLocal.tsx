"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import type { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import LeitorPdfDocumento, { botaoLeitorPdf, type PontoPdf } from "./LeitorPdfDocumento";
import { textosEditorPdf } from "@/lib/documentos-docentes/i18n-editor-pdf";
import { textosEditorTextoPdf } from "@/lib/documentos-docentes/i18n-editor-texto-pdf";
import { documentoTextoVazio, importarTextoPdf, type TextoImportadoPdf } from "@/lib/documentos-docentes/texto-editavel-pdf";

import { useTelaCheiaPdf } from "./useTelaCheiaPdf";
import { bytesImagemPdf, dimensoesImagemPdf, lerImagemPdf } from "@/lib/documentos-docentes/imagem-pdf-local";

const EditorTextoPdf = dynamic(() => import("./EditorTextoPdf"), { ssr: false });

const LIMITE_ARQUIVO = 30 * 1024 * 1024;
type DadosPdf = { bytes: Uint8Array<ArrayBuffer>; total: number; nome: string; modificado?: boolean };
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

const campo = "rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600";

export default function EditorPdfLocal({ onVoltar, origem, rotuloVoltar, acoesLeitura, avisoLeitura }: Props) {
  const locale = useLocale();
  const t = textosEditorPdf(locale);
  const tTexto = textosEditorTextoPdf(locale);
  const leitor = useTranslations("ReaderLibrary");
  const tela = useTelaCheiaPdf();
  const [imagemSelecionada, setImagemSelecionada] = useState<File | null>(null);
  const [larguraImagem, setLarguraImagem] = useState("");
  const [dados, setDados] = useState<DadosPdf | null>(null);
  const [pdfLido, setPdfLido] = useState<PDFDocumentProxy | null>(null);
  const [edicao, setEdicao] = useState(false);
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
    if (!dados) return;
    const url = URL.createObjectURL(new Blob([dados.bytes], { type: "application/pdf" }));
    setArquivo({ url, dados });
    return () => URL.revokeObjectURL(url);
  }, [dados]);

  async function executar(fn: () => Promise<void>) {
    setOcupado(true);
    setErro("");
    try { await fn(); }
    catch { setErro(t.falha); }
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
    setEdicao(false);
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
      navegar(Math.min(proximaPagina, pdf.getPageCount()));
      setDados({ bytes: new Uint8Array(bytes), total: pdf.getPageCount(), nome: dados.nome, modificado: true });
    });
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

  const copiaModificada = dados?.modificado === true;
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
            onPdfPronto={origem ? setPdfLido : undefined}
            onPonto={edicao ? p => { if (!ocupado) selecionarPonto(p); } : undefined} ponto={edicao ? ponto : null} />
          {edicao && dados && arquivo?.dados === dados && <section className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="break-all text-sm font-semibold">{dados.nome}</p>
            <button type="button" disabled={ocupado} onClick={() => void editarTexto()}
              className={`${botaoLeitorPdf} border-blue-600 text-blue-700 dark:text-blue-300`}>{tTexto.editar}</button>
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
