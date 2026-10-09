"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";
import styles from "./BibliotecaLeitor.module.css";

type Destino = { chave: string; tipo: string; nome: string };
type Recomendacao = { id: number; itemId: number; titulo: string | null; mensagem: string | null; status: string; obrigatoria: boolean;
  disponivelInicioEm: string | null; disponivelFimEm: string | null; professor: { nome: string };
  item: { titulo: string; slug: string }; destinos: { chaveDestino: string }[] };
type Dados = { recebidas: Recomendacao[]; minhas: Recomendacao[]; destinos: Destino[] };

export default function RecomendacoesBiblioteca({ portal, itemId, bloqueado }: { portal: "aluno" | "professor"; itemId?: number; bloqueado: boolean }) {
  const t = useTranslations("ReaderLibrary");
  const [dados, setDados] = useState<Dados>({ recebidas: [], minhas: [], destinos: [] });
  const [carregando, setCarregando] = useState(true); const [erro, setErro] = useState(false);
  const [salvando, setSalvando] = useState(false); const [edicao, setEdicao] = useState<number | null>(null);
  const [aberto, setAberto] = useState(false); const [titulo, setTitulo] = useState(""); const [mensagem, setMensagem] = useState("");
  const [destinos, setDestinos] = useState<string[]>([]); const [obrigatoria, setObrigatoria] = useState(false);
  const [inicio, setInicio] = useState(""); const [fim, setFim] = useState(""); const [status, setStatus] = useState("PUBLICADA");
  const carregar = useCallback(async () => {
    setCarregando(true);
    try { const res = await fetch("/api/biblioteca/recomendacoes", { cache: "no-store" }); if (!res.ok) throw new Error(); setDados(await res.json()); }
    catch { setErro(true); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);
  function novo() { setEdicao(null); setTitulo(""); setMensagem(""); setDestinos([]); setObrigatoria(false); setInicio(""); setFim(""); setStatus("PUBLICADA"); setAberto(true); }
  function editar(r: Recomendacao) {
    setEdicao(r.id); setTitulo(r.titulo || ""); setMensagem(r.mensagem || ""); setDestinos(r.destinos.map((d) => d.chaveDestino));
    setObrigatoria(r.obrigatoria); setInicio(r.disponivelInicioEm?.slice(0, 10) || ""); setFim(r.disponivelFimEm?.slice(0, 10) || "");
    setStatus(r.status === "RASCUNHO" ? "RASCUNHO" : "PUBLICADA"); setAberto(true);
  }
  async function salvar() {
    setSalvando(true);
    try {
      const body = { id: edicao, itemId, titulo, mensagem, destinos, obrigatoria, status,
        disponivelInicioEm: inicio ? new Date(`${inicio}T00:00:00`).toISOString() : null,
        disponivelFimEm: fim ? new Date(`${fim}T23:59:59`).toISOString() : null };
      const res = await fetch("/api/biblioteca/recomendacoes", { method: edicao ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(); setAberto(false); await carregar();
    } catch { setErro(true); } finally { setSalvando(false); }
  }
  async function encerrar(id: number) {
    setSalvando(true);
    try { const res = await fetch("/api/biblioteca/recomendacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "ENCERRADA" }) });
      if (!res.ok) throw new Error(); await carregar();
    } catch { setErro(true); } finally { setSalvando(false); }
  }
  const recebidas = dados.recebidas.filter((r) => !itemId || r.itemId === itemId);
  const minhas = dados.minhas.filter((r) => !itemId || r.itemId === itemId);
  return <section className={styles.card} aria-labelledby={`recomendacoes-${itemId || "catalogo"}`}>
    <h2 id={`recomendacoes-${itemId || "catalogo"}`}>{t("recommendations")}</h2>
    {carregando && <p role="status">{t("loading")}</p>}
    {!carregando && !recebidas.length && <p className={styles.muted}>{t("noRecommendations")}</p>}
    {recebidas.map((r) => <div className={styles.annotation} key={r.id}>
      <Link href={`/${portal}/biblioteca/${encodeURIComponent(r.item.slug)}`}><strong>{r.titulo || r.item.titulo}</strong></Link>
      {r.titulo && <p>{r.item.titulo}</p>}<p className={styles.muted}>{t("recommendedBy", { name: r.professor.nome })}</p>
      {r.obrigatoria && <strong>{t("requiredReading")}</strong>}<p style={{ whiteSpace: "pre-wrap" }}>{r.mensagem}</p>
    </div>)}
    {portal === "professor" && <>
      <h2 style={{ marginTop: 20 }}>{t("myRecommendations")}</h2>
      {itemId ? <button className={styles.button} type="button" disabled={bloqueado || salvando} onClick={novo}>{t("recommendBook")}</button>
        : <p className={styles.muted}>{t("recommendFromBook")}</p>}
      {minhas.map((r) => <div className={styles.annotation} key={r.id}><strong>{r.titulo || r.item.titulo}</strong><p>{t(`recommendationStatus.${r.status}`)}</p>
        <div className={styles.toolbar}><Link className={styles.button} href={`/${portal}/biblioteca/${encodeURIComponent(r.item.slug)}`}>{t("openBook")}</Link>
          {itemId && <button className={styles.button} disabled={bloqueado || salvando} onClick={() => editar(r)}>{t("editRecommendation")}</button>}
          {["PUBLICADA", "RASCUNHO"].includes(r.status) && <button className={styles.button} disabled={bloqueado || salvando} onClick={() => void encerrar(r.id)}>{t("closeRecommendation")}</button>}
        </div></div>)}
      {aberto && <form className={styles.formGrid} style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
        <label className={styles.full}>{t("recommendationTitle")}<input value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} disabled={salvando} /></label>
        <label className={styles.full}>{t("recommendationMessage")}<textarea value={mensagem} maxLength={10000} onChange={(e) => setMensagem(e.target.value)} disabled={salvando} /></label>
        <fieldset className={styles.full}><legend>{t("recommendationRecipients")}</legend>{dados.destinos.map((d) => <label className={styles.check} key={d.chave}>
          <input type="checkbox" checked={destinos.includes(d.chave)} disabled={salvando || (!destinos.includes(d.chave) && destinos.length >= 20)}
            onChange={(e) => setDestinos(e.target.checked ? [...destinos, d.chave] : destinos.filter((x) => x !== d.chave))} />
          {d.tipo === "TODA_INSTITUICAO" ? t("allInstitution") : `${t(`recipientTypes.${d.tipo}`)}: ${d.nome}`}
        </label>)}</fieldset>
        <label>{t("availableFrom")}<input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} disabled={salvando} /></label>
        <label>{t("availableUntil")}<input type="date" value={fim} min={inicio || undefined} onChange={(e) => setFim(e.target.value)} disabled={salvando} /></label>
        <label className={styles.check}><input type="checkbox" checked={obrigatoria} onChange={(e) => setObrigatoria(e.target.checked)} disabled={salvando} />{t("requiredReading")}</label>
        <label>{t("publicationStatus")}<select value={status} onChange={(e) => setStatus(e.target.value)} disabled={salvando}><option value="RASCUNHO">{t("recommendationStatus.RASCUNHO")}</option><option value="PUBLICADA">{t("recommendationStatus.PUBLICADA")}</option></select></label>
        <div className={`${styles.toolbar} ${styles.full}`}><button className={`${styles.button} ${styles.primary}`} disabled={salvando || !destinos.length}>{t(salvando ? "saving" : "saveRecommendation")}</button>
          <button type="button" className={styles.button} disabled={salvando} onClick={() => setAberto(false)}>{t("cancel")}</button></div>
      </form>}
    </>}
    {erro && <><p className={styles.error} role="alert">{t("recommendationError")}</p><button className={styles.button} onClick={() => { setErro(false); void carregar(); }}>{t("retry")}</button>
      <PhanyxToast tipo="erro" mensagem={t("recommendationError")} onClose={() => setErro(false)} /></>}
  </section>;
}
