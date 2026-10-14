"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { filtrarAnotacoesLeitor, type AnotacaoLeitor } from "@/lib/biblioteca-anotacoes-leitor";
import { CORES_MARCACOES } from "@/lib/biblioteca-cores-marcacoes";
import styles from "./BibliotecaLeitor.module.css";

const cores = CORES_MARCACOES;
export function IconeCaneta({ cor }: { cor: string }) {
  return <svg width="26" height="30" viewBox="0 0 28 32" fill="none" aria-hidden="true" focusable="false">
    <path d="M9 3h10v15l-3 5h-4l-3-5V3Z" fill={cor} stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 23h4v5l-4 2v-7Z" fill={cor} stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 8h10M11 3v5M17 3v5" stroke="currentColor" strokeWidth="1.5" />
  </svg>;
}
export function CanetasBiblioteca({ cor, ativo, disabled, onEscolher }: {
  cor: string; ativo: boolean; disabled: boolean; onEscolher: (cor: string) => void;
}) {
  const t = useTranslations("ReaderLibrary");
  return <div className={styles.penGroup} role="group" aria-label={t("annotationTools.pens")}>
    {Object.entries(cores).map(([codigo, valor]) => <button key={codigo} type="button" className={`${styles.button} ${styles.penButton}`}
      aria-label={t("annotationTools.penColor", { color: t(`highlightColors.${codigo}`) })}
      title={t("annotationTools.penColor", { color: t(`highlightColors.${codigo}`) })}
      aria-pressed={ativo && cor === codigo} disabled={disabled} onClick={() => onEscolher(codigo)}><IconeCaneta cor={valor} /></button>)}
  </div>;
}

type Props = {
  titulo: string; pagina: number; anotacoes: AnotacaoLeitor[]; selecionando: boolean; carregando: boolean; erro: boolean;
  salvando: boolean; podeAnotar: boolean; podeCopiar: boolean; renderizando: boolean; textoNota: string;
  trechoNota: string; temSelecao: boolean; selecionados: number;
  onSelecionar: () => void; onRecarregar: () => void; onMarcarPagina: () => void;
  onDestacar: () => void; onAnotarTrecho: () => void; onLimparTrecho: () => void;
  onCopiar: () => void;
  onTextoNota: (texto: string) => void; onSalvarNota: () => void; onAbrir: (anotacao: AnotacaoLeitor) => void;
  onRemover: (id: string) => void; onErroExportacao: () => void;
};
export default function PainelAnotacoesBiblioteca(p: Props) {
  const t = useTranslations("ReaderLibrary");
  const [busca, setBusca] = useState(""), [exportando, setExportando] = useState(false);
  const consulta = useDeferredValue(busca);
  const filtradas = useMemo(() => filtrarAnotacoesLeitor(p.anotacoes, consulta), [p.anotacoes, consulta]);
  const campoNota = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (p.trechoNota) campoNota.current?.focus({ preventScroll: true }); }, [p.trechoNota, p.pagina]);
  async function exportar() {
    setExportando(true);
    try {
      const { exportarAnotacoesPdf } = await import("@/lib/biblioteca-exportar-anotacoes");
      await exportarAnotacoesPdf(p.titulo, filtradas, p.podeCopiar, {
        titulo: t("myAnnotations"), pagina: t("pageLabel"), trecho: t("annotationTools.selectedExcerpt"),
        nota: t("annotationTools.comment"), semTrechos: t("annotationTools.exportWithoutQuotes"),
        tipos: { MARCADOR: t("annotationTypes.MARCADOR"), DESTAQUE: t("annotationTypes.DESTAQUE"), NOTA: t("annotationTypes.NOTA") },
      });
    } catch { p.onErroExportacao(); } finally { setExportando(false); }
  }
  return <>
    <h2>{t("myAnnotations")}</h2>
    <button className={`${styles.button} ${p.selecionando ? styles.primary : ""}`} aria-pressed={p.selecionando} onClick={p.onSelecionar}>{t("selectTextMode")}</button>
    <p className={styles.muted}>{t("annotationTools.selectionHelp")}</p>
    {p.carregando && <p role="status">{t("loadingAnnotations")}</p>}
    {p.erro && <div><p className={styles.error} role="alert">{t("annotationsLoadError")}</p><button className={styles.button} onClick={p.onRecarregar}>{t("retry")}</button></div>}
    <button className={styles.button} disabled={!p.podeAnotar || p.salvando || p.renderizando} onClick={p.onMarcarPagina}>{t("bookmarkPage")}</button>
    {p.temSelecao && <div className={styles.selectionCard}><p>{t("selectedCharacters", { count: p.selecionados })}</p><div className={styles.toolbar}>
      <button className={styles.button} disabled={!p.podeAnotar || p.salvando || p.renderizando} onClick={p.onDestacar}>{t("highlightSelection")}</button>
      <button className={styles.button} disabled={!p.podeAnotar || p.salvando || p.renderizando} onClick={p.onAnotarTrecho}>{t("annotationTools.annotateExcerpt")}</button>
      {p.podeCopiar && <button className={styles.button} disabled={p.selecionados > 1000 || p.renderizando} onClick={p.onCopiar}>{t("copyExcerpt")}</button>}
    </div></div>}
    <p className={styles.muted}>{t(p.podeCopiar ? "excerptLimit" : "copyNotLicensed", { count: 1000 })}</p>
    <form className={styles.noteComposer} onSubmit={e => { e.preventDefault(); p.onSalvarNota(); }}>
      {p.trechoNota ? <div className={styles.selectionCard}><strong>{t("annotationTools.selectedExcerpt")}</strong><blockquote>{p.trechoNota}</blockquote><button type="button" className={styles.button} onClick={p.onLimparTrecho}>{t("annotationTools.detachExcerpt")}</button></div> : <p className={styles.muted}>{t("annotationTools.pageNoteHint", { page: p.pagina })}</p>}
      <label>{t("annotationTools.comment")}<textarea ref={campoNota} value={p.textoNota} onChange={e => p.onTextoNota(e.target.value)} maxLength={10000} disabled={!p.podeAnotar || p.salvando} /></label>
      <button className={`${styles.button} ${styles.primary}`} disabled={!p.podeAnotar || p.salvando || !p.textoNota.trim()}>{t("saveNote")}</button>
    </form>
    <div className={styles.notesSearch}><label>{t("annotationTools.searchNotes")}<input type="search" value={busca} maxLength={100} onChange={e => setBusca(e.target.value)} placeholder={t("annotationTools.searchPlaceholder")} /></label>
      <p role="status" className={styles.muted}>{t("annotationTools.resultCount", { count: filtradas.length })}</p>
      <button className={styles.button} disabled={p.carregando || p.erro || exportando || !filtradas.length || busca !== consulta} onClick={() => void exportar()}>{t(exportando ? "annotationTools.exporting" : "annotationTools.exportPdf")}</button>
      <p className={styles.muted}>{t("annotationTools.exportHelp")}</p>
    </div>
    {!p.carregando && !p.erro && !filtradas.length && <p>{t(busca ? "annotationTools.noMatchingNotes" : "noAnnotations")}</p>}
    {filtradas.slice(0, 100).map(a => <div key={a.id} className={styles.annotation}>
      <button className={styles.button} onClick={() => p.onAbrir(a)}>{t(`annotationTypes.${a.tipo}`)} · {t("pageCitation", { page: a.pagina })}</button>
      {a.trecho && <blockquote>{a.trecho}</blockquote>}{a.conteudo && <p>{a.conteudo}</p>}
      <button className={styles.button} disabled={!p.podeAnotar || p.salvando} onClick={() => p.onRemover(a.id)}>{t("removeAnnotation")}</button>
    </div>)}
    {filtradas.length > 100 && <p className={styles.muted}>{t("annotationTools.listLimit")}</p>}
  </>;
}
