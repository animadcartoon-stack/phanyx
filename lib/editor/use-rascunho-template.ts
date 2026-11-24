"use client";
import { useEffect, useRef, useState } from "react";
import { importarChave, cifrarRascunho, lerRascunho, localId, type LocalDraft } from "./rascunho-local-seguro";

type Status = "loading" | "idle" | "dirty" | "saving" | "saved" | "recover" | "error" | "conflict" | "session";
type Snapshot = { editingId: number | null; nome: string; descricao: string; tipo: string; contexto: string; conteudo: string; ativo: boolean; exigeAssinatura: boolean; formatoImpressao: string; camposVisuais: unknown[] };
type Remote<T> = { dados: T; versao: number };
const labels = {
  pt: ["Consultando rascunho...", "Sem alterações pendentes", "Alterações ainda não sincronizadas", "Salvando rascunho...", "Rascunho salvo no servidor", "Rascunho encontrado. Recupere ou descarte antes de sincronizar.", "Falha ao sincronizar. Mantenha esta página aberta.", "Conflito de edição. Suas alterações não foram sobrescritas.", "Sessão indisponível. Alterações ainda não sincronizadas podem ser perdidas.", "Recuperar rascunho", "Descartar rascunho", "Tentar novamente"],
  en: ["Checking draft...", "No pending changes", "Changes not yet synced", "Saving draft...", "Draft saved on server", "Draft found. Restore or discard before syncing.", "Sync failed. Keep this page open.", "Editing conflict. Your changes were not overwritten.", "Session unavailable. Unsynced changes may be lost.", "Restore draft", "Discard draft", "Retry"],
  es: ["Consultando borrador...", "Sin cambios pendientes", "Cambios sin sincronizar", "Guardando borrador...", "Borrador guardado en el servidor", "Borrador encontrado. Recupérelo o descártelo antes de sincronizar.", "Error de sincronización. Mantenga la página abierta.", "Conflicto de edición. Sus cambios no se sobrescribieron.", "Sesión no disponible. Los cambios sin sincronizar pueden perderse.", "Recuperar borrador", "Descartar borrador", "Reintentar"],
  fr: ["Recherche du brouillon...", "Aucune modification en attente", "Modifications non synchronisées", "Enregistrement du brouillon...", "Brouillon enregistré sur le serveur", "Brouillon trouvé. Restaurez-le ou supprimez-le avant la synchronisation.", "Échec de synchronisation. Gardez cette page ouverte.", "Conflit de modification. Vos modifications ont été conservées.", "Session indisponible. Les modifications non synchronisées peuvent être perdues.", "Restaurer le brouillon", "Supprimer le brouillon", "Réessayer"],
};
const statuses: Status[] = ["loading","idle","dirty","saving","saved","recover","error","conflict","session"];
const endpoint = "/api/editor/rascunhos";
const serialize = (x: unknown) => JSON.stringify(x);
type Context<T> = { key: string; owner: string; version: number; baseline: string; remote: Remote<T> | null; status: Status; busy: boolean; retired: boolean; cryptoKey?: CryptoKey; local?: LocalDraft<T> | null; localSeq?: number };
export function useRascunhoTemplate<T extends Snapshot>(dados: T, locale: string, officialSaving: boolean) {
  const key = dados.editingId === null ? "novo" : String(dados.editingId);
  const latest = useRef(dados);
  latest.current = dados;
  const paused = useRef(officialSaving);
  paused.current = officialSaving;
  const ctx = useRef<Context<T> | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const publish = (c: Context<T>, s: Status) => { c.status = s; if (ctx.current === c && !c.retired) setStatus(s); };
  async function load(c: Context<T>, retry = false) {
    if (c.busy) return;
    c.busy = true; publish(c,"loading");
    try {
      const res = await fetch(`${endpoint}?chaveDocumento=${encodeURIComponent(c.key)}`, {cache:"no-store", credentials:"include"});
      if (res.status === 401 || res.status === 403) { publish(c,"session"); return; }
      if (!res.ok) throw Error("load");
      const body = await res.json();
      if (c.owner && c.owner !== body.proprietario) { publish(c,"session"); return; }
      c.owner = body.proprietario;
      c.remote = body.rascunho;
      c.cryptoKey = undefined;
      c.local = null;
      try {
        c.cryptoKey = await importarChave(body.chaveLocal);
        c.local = await lerRascunho<T>(localId(c.owner,c.key), c.cryptoKey);
      } catch { /* Server recovery remains available; never store plaintext. */ }
      c.version = c.remote?.versao ?? 0;
      if (c.local || c.remote) publish(c,"recover");
      else publish(c, retry ? "dirty" : "idle");
    } catch { publish(c,"error"); } finally { c.busy = false; }
  }
  async function sync(c: Context<T>) {
    if (c.retired || c.busy || paused.current || !c.owner || !["idle","dirty","saved"].includes(c.status)) return;
    const d = latest.current;
    if ((d.editingId === null ? "novo" : String(d.editingId)) !== c.key) return;
    const snapshot = serialize(d);
    if (snapshot === c.baseline) return;
    c.busy = true; publish(c,"saving");
    try {
      const res = await fetch(endpoint,{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json","x-draft-owner":c.owner},body:serialize({chaveDocumento:c.key,versao:c.version,dados:d})});
      if (res.status === 409) { publish(c,"conflict"); return; }
      if (res.status === 401 || res.status === 403) { publish(c,"session"); return; }
      if (!res.ok) throw Error("sync");
      const body = await res.json(); c.version = body.versao; c.baseline = snapshot;
      if (serialize(latest.current) === snapshot) {
        c.localSeq = (c.localSeq ?? 0) + 1;
        try { sessionStorage.removeItem(localId(c.owner,c.key)); } catch {}
      }
      publish(c,serialize(latest.current) === snapshot ? "saved" : "dirty");
    } catch { publish(c,"error"); } finally { c.busy = false; }
  }
  useEffect(() => {
    const c: Context<T> = {key,owner:"",version:0,baseline:serialize(latest.current),remote:null,status:"loading",busy:false,retired:false};
    ctx.current = c; void load(c);
    const timer = window.setInterval(() => void sync(c), 1000);
    return () => { c.retired = true; window.clearInterval(timer); };
  },[key]);
  useEffect(() => {
    const c = ctx.current;
    if (!c || c.key !== key) return;
    if (["idle","saved"].includes(c.status) && serialize(dados) !== c.baseline) publish(c,"dirty");
    if (!c.cryptoKey || !c.owner || (c.status === "conflict" && c.local) || c.status === "recover" || c.status === "loading" || serialize(dados) === c.baseline) return;
    const seq = (c.localSeq ?? 0) + 1;
    c.localSeq = seq;
    const id = localId(c.owner,c.key);
    void cifrarRascunho(id,c.cryptoKey,{dados,versao:c.version,salvoEm:Date.now()}).then(value => {
      if (c.localSeq === seq) sessionStorage.setItem(id,value);
    }).catch(() => { /* No plaintext fallback. Unsynced status remains visible. */ });
  },[dados,key]);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      const c = ctx.current;
      if (c && serialize(latest.current) !== c.baseline) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload",warn);
    return () => window.removeEventListener("beforeunload",warn);
  },[]);
  function recuperar() {
    const c = ctx.current; if (!c || (!c.remote && !c.local) || c.status !== "recover") return null;
    // Prefer the server if a different version was saved in another tab.
    // Keep the encrypted local copy when versions differ; do not overwrite the server silently.
    if (c.local && c.remote && c.local.versao !== c.remote.versao && serialize(c.local.dados) !== serialize(c.remote.dados)) {
      publish(c,"conflict"); return c.local.dados;
    }
    const d = (c.local?.dados ?? c.remote?.dados)!;
    const isLocalChange = !!c.local && (!c.remote || serialize(c.remote.dados) !== serialize(d));
    if (!isLocalChange) c.baseline = serialize(d);
    c.remote = null; c.local = null; publish(c,isLocalChange ? "dirty" : "saved"); return d;
  }
  async function remove(c: Context<T>) {
    const res = await fetch(endpoint,{method:"DELETE",credentials:"include",headers:{"Content-Type":"application/json","x-draft-owner":c.owner},body:serialize({chaveDocumento:c.key,versao:c.version})});
    if (!res.ok) throw Error(String(res.status));
    c.version = 0; c.remote = null;
  }
  async function descartar() {
    const c = ctx.current; if (!c || c.status !== "recover" || c.busy) return;
    c.busy = true;
    try {
      if (c.version) await remove(c);
      c.localSeq = (c.localSeq ?? 0) + 1;
      try { sessionStorage.removeItem(localId(c.owner,c.key)); } catch {}
      c.local = null; publish(c,"dirty");
    } catch { publish(c,"conflict"); } finally { c.busy = false; }
  }
  async function tentarNovamente() { const c = ctx.current; if (c) await load(c,true); }
  async function finalizar(payload: Omit<Snapshot,"editingId"> & { descricao: string | null; contexto: string | null } | object) {
    const c = ctx.current;
    if (!c || c.busy || c.remote || !c.owner || !["saved","idle","dirty"].includes(c.status)) return;
    // Never remove a draft that differs from the official payload, or a newer version in another tab.
    const d = latest.current;
    const normalized = {nome:d.nome.trim(),descricao:d.descricao.trim() || null,tipo:d.tipo,contexto:d.contexto.trim() || null,conteudo:d.conteudo.trim(),ativo:d.ativo,exigeAssinatura:d.exigeAssinatura,formatoImpressao:d.formatoImpressao,camposVisuais:d.camposVisuais};
    if (serialize(normalized) !== serialize(payload) || serialize(d) !== c.baseline) return;
    c.busy = true;
    try { if (c.version) await remove(c); publish(c,"idle"); } catch { publish(c,"conflict"); } finally { c.busy = false; }
  }
  const lang = locale.slice(0,2) as keyof typeof labels;
  const text = labels[lang] || labels.en;
  return {status,mensagem:text[statuses.indexOf(status)],texto:{recuperar:text[9],descartar:text[10],tentar:text[11]},recuperar,descartar,tentarNovamente,finalizar};
}
