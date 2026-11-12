"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { camposModeloDocente, renderizarCamposDocentes } from "@/lib/documentos-docentes/campos-impressao";
import { traduzirDocumentoDocente, type ChaveDocumentoDocente } from "@/lib/documentos-docentes/i18n";
import { traducaoDocentesEtapa3, type ChaveDocentesEtapa3 } from "@/lib/documentos-docentes/i18n-etapa3";
import { professorPodeEditarDocumentoDocente } from "@/lib/documentos-docentes/fluxo";
import EditorPdfLocal from "./EditorPdfLocal";
import { textosEditorPdf } from "@/lib/documentos-docentes/i18n-editor-pdf";
import AssinaturaDocumentoDocenteModal from "@/components/documentos-docentes/AssinaturaDocumentoDocenteModal";

import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import EnviarDocumentoDocenteModal, { type DocumentoParaEnviar } from "./EnviarDocumentoDocenteModal";
import { textosGestaoDocente } from "@/lib/documentos-docentes/i18n-gestao";
import { eventosEmailDocente, lerRegistroEmailDocente } from "@/lib/documentos-docentes/destinos-email";

type Papel = "ADMIN" | "PROFESSOR";
type Modelo = { id: number; nome: string; descricao: string | null; contexto: string; campos: string[] };
type Professor = { id: number; nome: string };
type Doc = { id: number; titulo: string; tipo: string; status: string; versaoAtual: number; atualizadoEm: string; origem: string; professorId: number; professor?: { nome: string }; _count?: { mensagens: number; anexos: number; assinaturas: number } };
type Versao = { numero: number; modeloSnapshot: string; campos: Record<string, string>; criadoEm: string };
type Mensagem = { id: number; texto: string; papel: string; autorId: number; criadoEm: string };
type Evento = { id: number; tipo: string; descricao: string | null; versao: number; criadoEm: string };
type Assinatura = { id: number; versao: number; nomeAssinante: string; papel: string; tipo: string; hashConteudo:string; assinadoEm: string };
type Anexo = { id:number; versao:number; nomeOriginal:string; tamanho:number; mime:string; criadoEm:string; enviadoPorId:number; mensagemId:number|null };
type Detalhes = { documento: Doc; professor: { nome: string } | null; versao: Versao; mensagens: Mensagem[]; eventos: Evento[]; assinaturas: Assinatura[]; anexos:Anexo[] };

const campoBase = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";
const botaoBase = "rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

// A prévia é isolada em iframe sandbox sem scripts, formulários, navegação ou origem compartilhada.
function htmlPrevia(modelo: string, campos: Record<string, string>): string {
  const corpo = renderizarCamposDocentes(modelo, campos);
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>body{font:14px/1.6 Arial,sans-serif;padding:26px;color:#0f172a;overflow-wrap:anywhere;max-width:820px;margin:auto}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #64748b;padding:6px}img{max-width:100%}</style></head><body>${corpo}</body></html>`;
}

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin", headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(typeof dados.error === "string" ? dados.error : `HTTP ${resposta.status}`);
  return dados as T;
}
function dataFormatada(valor: string | null | undefined, locale: string): string {
  if (!valor) return "—";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleString(locale);
}

export default function CentralDocentes({ papel, documentoInicial = null }: { papel: Papel; documentoInicial?: number | null }) {
  const router = useRouter();
  const locale = useLocale();
  const t = (chave: ChaveDocumentoDocente) => traduzirDocumentoDocente(locale, chave);
  const t3 = (chave: ChaveDocentesEtapa3) => traducaoDocentesEtapa3(locale, chave);
  const admin = papel === "ADMIN";
  const gestao = textosGestaoDocente(locale);
  const [documentos, setDocumentos] = useState<Doc[]>([]);
  const [excluidos, setExcluidos] = useState<Doc[]>([]);
  const [documentoParaExcluir, setDocumentoParaExcluir] = useState<Doc | null>(null);
  const [documentoParaEnviar, setDocumentoParaEnviar] = useState<DocumentoParaEnviar | null>(null);
  const [erroExclusao, setErroExclusao] = useState("");
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [filtro, setFiltro] = useState("TODOS");
  const [idSelecionado, setIdSelecionado] = useState<number | null>(documentoInicial);
  const [versaoSelecionada, setVersaoSelecionada] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<Detalhes | null>(null);
  const [titulo, setTitulo] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [orientacao, setOrientacao] = useState("");
  const [professoresIds, setProfessoresIds] = useState<number[]>([]);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [textoMensagem, setTextoMensagem] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [somenteArquivo,setSomenteArquivo] = useState(false);
  const [arquivoSelecionado,setArquivoSelecionado] = useState<File|null>(null);
  const [notaAnexo,setNotaAnexo] = useState("");
  const [chaveArquivo,setChaveArquivo] = useState(0);
  const [painelPdf, setPainelPdf] = useState<"leitor" | "editor" | null>(null);
  const [assinaturaAberta,setAssinaturaAberta] = useState(false);

  async function carregarLista() {
    const [a, b, c] = await Promise.all([
      requisitar<{ documentos: Doc[] }>("/api/documentos-docentes"),
      requisitar<{ modelos: Modelo[] }>("/api/documentos-docentes/modelos"),
      admin ? requisitar<{ professores: Professor[] }>("/api/documentos-docentes/professores") : Promise.resolve({ professores: [] as Professor[] }),
    ]);
    setDocumentos(a.documentos);
    setModelos(b.modelos);
    setProfessores(c.professores);
  }
  async function carregarDetalhe(id: number, versao?: number | null) {
    const sufixo = versao ? `?versao=${encodeURIComponent(String(versao))}` : "";
    const dado = await requisitar<Detalhes>(`/api/documentos-docentes/${id}${sufixo}`);
    setDetalhes(dado);
    setCampos(dado.versao.campos || {});
  }
  useEffect(() => {
    let ativo = true;
    void Promise.all([
      requisitar<{ documentos: Doc[] }>("/api/documentos-docentes"),
      requisitar<{ modelos: Modelo[] }>("/api/documentos-docentes/modelos"),
      admin ? requisitar<{ professores: Professor[] }>("/api/documentos-docentes/professores") : Promise.resolve({ professores: [] as Professor[] }),
    ]).then(([a, b, c]) => { if (!ativo) return; setDocumentos(a.documentos); setModelos(b.modelos); setProfessores(c.professores); })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : t("genericError")); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  // papel é fixo durante a vida da página.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);
  useEffect(() => {
    if (!idSelecionado) { setDetalhes(null); return; }
    let ativo = true;
    const sufixo = versaoSelecionada ? `?versao=${versaoSelecionada}` : "";
    void requisitar<Detalhes>(`/api/documentos-docentes/${idSelecionado}${sufixo}`)
      .then(d => { if (ativo) { setDetalhes(d); setCampos(d.versao.campos || {}); } })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : t("genericError")); });
    return () => { ativo = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSelecionado, versaoSelecionada]);

  const modeloEscolhido = modelos.find(m => String(m.id) === modeloId);
  const documentosFiltrados = filtro === "CANCELADO" ? excluidos : documentos.filter(d => filtro === "TODOS" || d.status === filtro);
  const statusLabels: Record<string, ChaveDocumentoDocente> = { RASCUNHO:"draft", AGUARDANDO_PROFESSOR:"waiting", ENVIADO:"sent", APROVADO:"approved", DEVOLVIDO:"returned", CONCLUIDO:"done", CANCELADO:"cancelled" };
  const tipoLabels: Record<string, ChaveDocumentoDocente> = { PLANO_AULA:"plan", RELATORIO:"report", ORIENTACAO:"guidance", ARQUIVO:"attachmentDoc" };
  const statusTexto = (status: string) => status === "CANCELADO" ? gestao.excluido : statusLabels[status] ? t(statusLabels[status]) : status;
  const tipoTexto = (tipo: string) => tipoLabels[tipo] ? t(tipoLabels[tipo]) : tipo;

  async function atualizarLista(situacao: string) {
    setCarregando(true);
    setErro("");
    try {
      if (situacao === "CANCELADO") {
        const dados = await requisitar<{ documentos: Doc[] }>("/api/documentos-docentes?excluidos=1");
        setExcluidos(dados.documentos);
      } else {
        await carregarLista();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setCarregando(false);
    }
  }

  async function excluirDocumento() {
    if (!documentoParaExcluir || ocupado) return;
    const { id, versaoAtual } = documentoParaExcluir;
    setOcupado(true);
    setErroExclusao("");
    try {
      await requisitar(`/api/documentos-docentes/${id}?versao=${versaoAtual}`, { method: "DELETE" });
      setDocumentos(lista => lista.filter(doc => doc.id !== id));
      setDocumentoParaExcluir(null);
      if (idSelecionado === id) voltarLista();
      setAviso(gestao.exclusaoConcluida);
    } catch (e) {
      setErroExclusao(e instanceof Error ? e.message : gestao.falha);
    } finally {
      setOcupado(false);
    }
  }

  function acoesGestao(doc: Doc, versao: number, carregandoVersao = false) {
    if (!admin || doc.status === "CANCELADO") return null;
    return <>
      <button type="button" disabled={ocupado || carregandoVersao} className={`${botaoBase} border border-slate-300 dark:border-slate-600`}
        onClick={() => setDocumentoParaEnviar({ id: doc.id, titulo: doc.titulo, versao })}>{gestao.enviarPdf}</button>
      <button type="button" disabled={ocupado} className={`${botaoBase} border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950`}
        onClick={() => { setErroExclusao(""); setDocumentoParaExcluir(doc); }}>{gestao.excluir}</button>
    </>;
  }

  function historicoEvento(evento: Evento) {
    if (evento.tipo === "EXCLUIDO") return { titulo: gestao.excluido, descricao: evento.descricao ? statusTexto(evento.descricao) : null };
    if (eventosEmailDocente.some(tipo => tipo === evento.tipo)) {
      const registro = lerRegistroEmailDocente(evento.descricao);
      if (!registro) return { titulo: gestao.registrado, descricao: null };
      const resultado = registro.resultado;
      const resumo = resultado.estado === "aceito"
        ? `${gestao.aceitos} · ${resultado.aceitos}${resultado.recusados ? ` · ${gestao.recusados} · ${resultado.recusados}` : ""}`
        : gestao[resultado.estado];
      return { titulo: gestao.registrado, descricao: `${registro.destino}
${resumo}` };
    }
    return { titulo: evento.tipo, descricao: evento.descricao };
  }

  function iniciarCriacao() { setMostrarNovo(true); setIdSelecionado(null); setDetalhes(null); setErro(""); setAviso(""); }
  function selecionarModelo(id: string) {
    setModeloId(id);
    const selecionado = modelos.find(m => String(m.id) === id);
    if (selecionado) setTitulo(selecionado.nome);
  }
  function marcarProfessor(id: number, marcado: boolean) {
    setProfessoresIds(anteriores => marcado ? (anteriores.includes(id) ? anteriores : [...anteriores, id]) : anteriores.filter(x => x !== id));
  }
  async function criarDocumento() {
    setErro(""); setAviso("");
    if (!titulo.trim() || (!admin && !modeloEscolhido && !somenteArquivo)) { setErro(t("requiredTitle")); return; }
    if (admin && !professoresIds.length) { setErro(t("selectTeacher")); return; }
    if (admin && professoresIds.length > 30) { setErro(t("teachersTip")); return; }
    const tipo = !admin && somenteArquivo ? "ARQUIVO" : modeloEscolhido?.contexto === "DOCENTE_PLANO_AULA" ? "PLANO_AULA" : modeloEscolhido?.contexto === "DOCENTE_RELATORIO" ? "RELATORIO" : "ORIENTACAO";
    setOcupado(true);
    try {
      const resp = await requisitar<{ ids: number[] }>("/api/documentos-docentes", { method: "POST", body: JSON.stringify({ titulo: titulo.trim(), tipo, modeloId: modeloEscolhido?.id ?? null, instrucao: orientacao.trim(), professoresIds: admin ? professoresIds : undefined, campos: {} }) });
      await carregarLista(); setMostrarNovo(false); setTitulo(""); setOrientacao(""); setModeloId(""); setProfessoresIds([]); setSomenteArquivo(false);
      setIdSelecionado(resp.ids[0] || null); setVersaoSelecionada(null); setAviso(t("created"));
    } catch (e) { setErro(e instanceof Error ? e.message : t("genericError")); }
    finally { setOcupado(false); }
  }
  async function atualizarDocumento(acao: "EDITAR" | "ENVIAR" | "APROVAR" | "DEVOLVER" | "CONCLUIR") {
    if (!detalhes || versaoSelecionada !== null) return;
    if (acao === "DEVOLVER" && !justificativa.trim()) { setErro(t("requiredReason")); return; }
    setOcupado(true); setErro(""); setAviso("");
    try {
      await requisitar(`/api/documentos-docentes/${detalhes.documento.id}`, { method:"PATCH", body:JSON.stringify({ acao, versaoEsperada: detalhes.documento.versaoAtual, ...(acao === "EDITAR" ? { campos } : {}), ...(acao === "DEVOLVER" ? { justificativa } : {}) }) });
      await Promise.all([carregarLista(), carregarDetalhe(detalhes.documento.id)]);
      setJustificativa(""); setAviso(acao === "EDITAR" ? t("saved") : t("actionDone"));
    } catch (e) { setErro(e instanceof Error ? e.message : t("genericError")); }
    finally { setOcupado(false); }
  }
  async function enviarMensagem() {
    if (!detalhes || !textoMensagem.trim()) return;
    setOcupado(true); setErro(""); setAviso("");
    try {
      await requisitar(`/api/documentos-docentes/${detalhes.documento.id}/mensagens`, { method:"POST", body: JSON.stringify({ texto: textoMensagem.trim() }) });
      setTextoMensagem(""); await Promise.all([carregarLista(), carregarDetalhe(detalhes.documento.id, versaoSelecionada)]); setAviso(t("messageSent"));
    } catch (e) { setErro(e instanceof Error ? e.message : t("genericError")); }
    finally { setOcupado(false); }
  }
  async function enviarAnexo() {
    if(!detalhes||!arquivoSelecionado)return;
    if(arquivoSelecionado.size>10*1024*1024){setErro(t3("fileTooLarge"));return;}
    const dados = new FormData();dados.append("arquivo",arquivoSelecionado);dados.append("nota",notaAnexo);
    setOcupado(true);setErro("");setAviso("");
    try {
      const res=await fetch(`/api/documentos-docentes/${detalhes.documento.id}/anexos`,{method:"POST",body:dados,credentials:"same-origin",cache:"no-store"});
      const resposta=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(typeof resposta.error==="string"?resposta.error:t("genericError"));
      setArquivoSelecionado(null);setNotaAnexo("");setChaveArquivo(v=>v+1);
      await Promise.all([carregarLista(),carregarDetalhe(detalhes.documento.id,versaoSelecionada)]);
      setAviso(t3("fileSent"));
    } catch(e){setErro(e instanceof Error?e.message:t("genericError"));}
    finally{setOcupado(false);}
  }
  async function assinaturaConcluida() {
    if(!detalhes)return;
    await Promise.all([carregarLista(),carregarDetalhe(detalhes.documento.id)]);
    setAviso(t3("signatureDone"));
  }
  function voltarLista() {
    setIdSelecionado(null);
    setVersaoSelecionada(null);
    setDetalhes(null);
    setErro("");
    setAviso("");
    if (documentoInicial) router.replace("/professor/documentos", { scroll: false });
  }
  const historica = detalhes !== null && versaoSelecionada !== null && versaoSelecionada !== detalhes.documento.versaoAtual;
  const camposNaoSalvos = !!detalhes && JSON.stringify(campos) !== JSON.stringify(detalhes.versao.campos || {});
  const podeEditar = !admin && !historica && !!detalhes && professorPodeEditarDocumentoDocente(detalhes.documento.status);
  const podeAprovar = admin && !historica && detalhes?.documento.status === "ENVIADO";
  const podeDevolver = admin && !historica && ["ENVIADO", "APROVADO"].includes(detalhes?.documento.status || "");
  const podeConcluir = admin && !historica && detalhes?.documento.status === "APROVADO";
  const assinaturaProfessor = detalhes?.assinaturas.some(a=>a.versao===detalhes.documento.versaoAtual&&a.papel==="PROFESSOR")??false;
  const assinaturaAdmin = detalhes?.assinaturas.some(a=>a.versao===detalhes.documento.versaoAtual&&a.papel==="ADMIN")??false;
  const existeAssinaturaAtual = assinaturaProfessor||assinaturaAdmin;
  const deveAssinar = !!detalhes && ["PLANO_AULA","RELATORIO"].includes(detalhes.documento.tipo);
  const podeAssinarProfessor = podeEditar && !camposNaoSalvos && !assinaturaProfessor;
  const podeAssinarAdmin = admin && !historica && !camposNaoSalvos && detalhes?.documento.status === "APROVADO" && !assinaturaAdmin;
  const podeAnexar = !historica && !!detalhes && !existeAssinaturaAtual && (admin ? !["CONCLUIDO","CANCELADO"].includes(detalhes.documento.status) : podeEditar);
  const camposAtuais = detalhes?.versao.campos || {};
  const nomesCampos = detalhes ? Array.from(new Set([...Object.keys(camposAtuais), ...camposModeloDocente(detalhes.versao.modeloSnapshot)])) : [];
  const htmlRenderizado = detalhes?.versao.modeloSnapshot ? htmlPrevia(detalhes.versao.modeloSnapshot, campos) : "";

  if (painelPdf === "editor") return <EditorPdfLocal onVoltar={() => setPainelPdf(null)} />;
  if (painelPdf === "leitor" && detalhes) {
    const pdf = `/api/documentos-docentes/${detalhes.documento.id}/pdf?versao=${detalhes.versao.numero}`;
    const permiteEdicao = detalhes.documento.status !== "CANCELADO" && !detalhes.assinaturas.some(assinatura => assinatura.versao === detalhes.versao.numero);
    return (
      <EditorPdfLocal
        key={pdf}
        origem={{
          url: pdf,
          nome: detalhes.documento.titulo,
          versao: `${t("version")} ${detalhes.versao.numero}`,
          permiteEdicao,
        }}
        rotuloVoltar={t3("backToDocument")}
        onVoltar={() => setPainelPdf(null)}
        avisoLeitura={camposNaoSalvos && <p className="text-sm text-amber-800 dark:text-amber-300">{t3("savedBeforeSign")}</p>}
        acoesLeitura={<>
          <a href={`${pdf}&baixar=1`} className={`${botaoBase} border`}>{t3("downloadPdf")}</a>
          {podeAssinarProfessor && (
            <Link href={`/professor/documentos/${detalhes.documento.id}/assinar?versao=${detalhes.documento.versaoAtual}`}
              className={`${botaoBase} bg-blue-700 text-white`}>{t3("signWithPhanyx")}</Link>
          )}
        </>}
      />
    );
  }

  return <main className="mx-auto max-w-7xl space-y-5 text-slate-900 dark:text-slate-100">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold">{t(admin ? "titleAdmin" : "titleProfessor")}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(admin ? "descriptionAdmin" : "descriptionProfessor")}</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={ocupado} onClick={() => void atualizarLista(filtro)} className={`${botaoBase} border border-slate-300 dark:border-slate-600`}>{t("retry")}</button>
        <button type="button" onClick={() => setPainelPdf("editor")} className={`${botaoBase} border border-slate-300 dark:border-slate-600`}>{textosEditorPdf(locale).editor}</button>
        <button type="button" onClick={iniciarCriacao} className={`${botaoBase} bg-blue-700 text-white hover:bg-blue-800`}>{t("newDocument")}</button>
      </div>
    </header>
    {admin && <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><Link href="/admin/documentos/templates" className="font-semibold text-blue-700 underline dark:text-blue-300">{t("openTemplates")}</Link><Link href="/admin/professores/acessos" className="font-semibold text-blue-700 underline dark:text-blue-300">{t("accessSettings")}</Link><p className="text-slate-600 dark:text-slate-300">{t("adminNote")}</p></div>}
    {erro && <div role="alert" className="rounded-xl border border-red-500 p-3 text-sm text-red-700 dark:text-red-300">{erro}</div>}
    {aviso && <div role="status" className="rounded-xl border border-blue-400 p-3 text-sm text-blue-900 dark:text-blue-200">{aviso}</div>}

    {mostrarNovo && <section aria-label={t("newDocument")} className="space-y-4 rounded-2xl border border-blue-300 bg-blue-50/40 p-5 dark:border-blue-900 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{t("newDocument")}</h2><button type="button" className={`${botaoBase} border`} onClick={() => setMostrarNovo(false)}>{t("cancel")}</button></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1 text-sm"><span className="font-medium">{t("template")}</span><select className={campoBase} value={modeloId} disabled={!admin&&somenteArquivo} onChange={(e: { target: { value: string } }) => selecionarModelo(e.target.value)}>
          <option value="">{admin ? t("withoutTemplate") : t("selectTemplate")}</option>{modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">{t("name")}</span><input className={campoBase} maxLength={180} placeholder={t("titlePlaceholder")} value={titulo} onChange={(e: { target: { value: string } }) => setTitulo(e.target.value)} /></label>
      </div>
      {!admin && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={somenteArquivo} onChange={(e:{target:{checked:boolean}})=>{setSomenteArquivo(e.target.checked);if(e.target.checked)setModeloId("");}}/>{t3("manualUpload")}</label>}
      {modelos.length === 0 && !somenteArquivo && <p className="text-sm text-amber-800 dark:text-amber-300">{t(admin ? "noTemplates" : "noModelProfessor")}</p>}
      {admin && <div className="space-y-2"><h3 className="text-sm font-semibold">{t("teachers")} ({professoresIds.length}/30)</h3><p className="text-xs text-slate-500 dark:text-slate-400">{t("teachersTip")}</p>
        <div className="grid max-h-44 grid-cols-1 gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3">
          {professores.map(p => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={professoresIds.includes(p.id)} disabled={professoresIds.length >= 30 && !professoresIds.includes(p.id)} onChange={(e: { target: { checked: boolean } }) => marcarProfessor(p.id,e.target.checked)} /><span>{p.nome}</span></label>)}
        </div></div>}
      <label className="block space-y-1 text-sm"><span className="font-medium">{t("instruction")}</span><textarea className={campoBase} maxLength={10000} rows={3} placeholder={t("instructionPlaceholder")} value={orientacao} onChange={(e: { target: { value: string } }) => setOrientacao(e.target.value)} /></label>
      <p className="text-xs text-slate-600 dark:text-slate-300">{t("modelHint")}</p>
      <button type="button" onClick={() => void criarDocumento()} disabled={ocupado || !titulo.trim() || (!admin && !modeloEscolhido && !somenteArquivo) || (admin && professoresIds.length === 0)} className={`${botaoBase} bg-blue-700 text-white hover:bg-blue-800`}>{t(admin ? "create" : "createDraft")}</button>
    </section>}

    {!mostrarNovo && !idSelecionado && <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{t("inbox")} ({documentosFiltrados.length})</h2><label className="ml-auto text-sm">{t("status")} <select className={`${campoBase} ml-1 w-auto`} value={filtro} onChange={e => {
        const situacao = e.target.value;
        setFiltro(situacao);
        if (situacao === "CANCELADO") void atualizarLista(situacao);
      }}>
        <option value="TODOS">{t("all")}</option>{Object.keys(statusLabels).filter(k => k !== "CANCELADO").map(k => <option key={k} value={k}>{statusTexto(k)}</option>)}{admin && <option value="CANCELADO">{gestao.excluidos}</option>}
      </select></label></div>
      {carregando && <p role="status" className="text-sm">{t("loading")}</p>}
      {!carregando && documentosFiltrados.length === 0 && <p className="rounded-xl border border-slate-300 p-6 text-sm dark:border-slate-700">{t("noDocs")}</p>}
      <div className="grid gap-3">{documentosFiltrados.map(d => (
        <article key={d.id} className="rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500">
          <button type="button" className="block w-full rounded-xl p-4 text-left outline-offset-2 focus-visible:outline-blue-600"
            onClick={() => { setErro(""); setAviso(""); setVersaoSelecionada(null); setIdSelecionado(d.id); }}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{d.titulo}</span><span className="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-600">{statusTexto(d.status)}</span></div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-300"><span>{tipoTexto(d.tipo)}</span>{admin && <><span>#{d.id}</span><span>{t("teacher")}: {d.professor?.nome || d.professorId}</span></>}<span>{t("version")}: {d.versaoAtual}</span><span>{t("updated")}: {dataFormatada(d.atualizadoEm,locale)}</span><span>{t("messages")}: {d._count?.mensagens ?? 0}</span></div>
          </button>
          {admin && d.status !== "CANCELADO" && <div className="flex flex-wrap gap-2 px-4 pb-3">{acoesGestao(d, d.versaoAtual)}</div>}
        </article>
      ))}</div>
    </section>}

    {!mostrarNovo && idSelecionado && <section className="space-y-5">
      <button type="button" className={`${botaoBase} border border-slate-300 dark:border-slate-700`} onClick={voltarLista}>{t("back")}</button>
      {!detalhes && <p role="status">{t("loading")}</p>}
      {detalhes && <>
        <div className="space-y-2 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{detalhes.documento.titulo}</h2><span className="rounded-full border px-3 py-1 text-sm">{statusTexto(detalhes.documento.status)}</span></div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{tipoTexto(detalhes.documento.tipo)} · {t("teacher")}: {detalhes.professor?.nome || "—"} · {t("updated")}: {dataFormatada(detalhes.documento.atualizadoEm,locale)}</p>
          <label className="inline-flex items-center gap-3 text-sm">{t("version")}: <select className={`${campoBase} w-auto`} value={versaoSelecionada ?? detalhes.documento.versaoAtual} onChange={(e: { target: { value: string } }) => setVersaoSelecionada(Number(e.target.value) === detalhes.documento.versaoAtual ? null : Number(e.target.value))}>
            {Array.from({length: detalhes.documento.versaoAtual},(_,i)=>i+1).reverse().map(v => <option key={v} value={v}>{v}</option>)}
          </select></label>{historica && <p className="text-sm text-amber-700 dark:text-amber-300">{t("versionReadOnly")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPainelPdf("leitor")} className={`${botaoBase} border border-blue-500 text-blue-700 dark:text-blue-300`}>{t3("printPdf")}</button>
          <a href={`/api/documentos-docentes/${detalhes.documento.id}/pdf?versao=${detalhes.versao.numero}&baixar=1`} className={`${botaoBase} border border-slate-300 dark:border-slate-700`}>{t3("downloadPdf")}</a>
          {detalhes.versao.modeloSnapshot && <a href={`/api/documentos-docentes/${detalhes.documento.id}/pdf?versao=${detalhes.versao.numero}&branco=1&baixar=1`} className={`${botaoBase} border border-slate-300 dark:border-slate-700`}>{t3("blankPdf")}</a>}
          {acoesGestao(detalhes.documento, detalhes.versao.numero, detalhes.versao.numero !== (versaoSelecionada ?? detalhes.documento.versaoAtual))}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{t("fields")}</h3>
            {nomesCampos.length === 0 ? <p className="text-sm text-slate-500">{t("noFields")}</p> : nomesCampos.map(nome => <label key={nome} className="block space-y-1 text-sm"><span className="font-medium">{nome}</span>
              <textarea className={campoBase} rows={nome.length > 60 ? 3 : 4} maxLength={5000} disabled={!podeEditar || ocupado} value={campos[nome] || ""} onChange={(e: { target: { value: string } }) => setCampos(anteriores => ({...anteriores,[nome]:e.target.value}))} />
            </label>)}
            {podeEditar && <>
              <p className="text-xs text-slate-600 dark:text-slate-300">{t("editHelp")}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={ocupado} className={`${botaoBase} bg-blue-700 text-white`} onClick={() => void atualizarDocumento("EDITAR")}>{t("saveVersion")}</button>
                {podeAssinarProfessor && <button
                  type="button"
                  disabled={ocupado}
                  className={`${botaoBase} border border-blue-700 text-blue-700 dark:text-blue-300`}
                  onClick={() => router.push(`/professor/documentos/${detalhes.documento.id}/assinar?versao=${detalhes.documento.versaoAtual}`)}
                >
                  {t3("signWithPhanyx")}
                </button>}
                <button type="button" disabled={ocupado || camposNaoSalvos || (deveAssinar&&!assinaturaProfessor)} title={camposNaoSalvos ? t("saveFirst") : deveAssinar&&!assinaturaProfessor ? t3("signFirst") : undefined} className={`${botaoBase} border border-blue-700 text-blue-700 dark:text-blue-300`} onClick={() => void atualizarDocumento("ENVIAR")}>{t("send")}</button>
              </div>
              {camposNaoSalvos && <p className="text-xs text-amber-800 dark:text-amber-300">{t("saveFirst")}</p>}
            </>}
            {podeAprovar && <button type="button" disabled={ocupado} className={`${botaoBase} bg-blue-700 text-white`} onClick={() => void atualizarDocumento("APROVAR")}>{t("approve")}</button>}
            {podeDevolver && <div className="space-y-2"><label className="block space-y-1 text-sm"><span className="font-semibold">{t("reason")}</span><textarea className={campoBase} value={justificativa} onChange={(e: { target: { value: string } }) => setJustificativa(e.target.value)} maxLength={3000} rows={3} placeholder={t("reasonPlaceholder")} /></label><button type="button" disabled={ocupado || !justificativa.trim()} className={`${botaoBase} border border-amber-600 text-amber-800 dark:text-amber-300`} onClick={() => void atualizarDocumento("DEVOLVER")}>{t("return")}</button></div>}
            {podeConcluir && <button type="button" disabled={ocupado || (deveAssinar && (!assinaturaProfessor || !assinaturaAdmin))} title={deveAssinar&&!assinaturaAdmin?t3("adminSignFirst"):undefined} className={`${botaoBase} bg-blue-700 text-white`} onClick={() => void atualizarDocumento("CONCLUIR")}>{t("finish")}</button>}
          </section>
          <section className="space-y-2 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{t("preview")}</h3><p className="text-xs text-slate-600 dark:text-slate-300">{t("previewTip")}</p>
            {htmlRenderizado ? <iframe title={t("preview")} sandbox="" referrerPolicy="no-referrer" srcDoc={htmlRenderizado} className="h-[560px] w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700" /> : <p className="text-sm">{t("noFields")}</p>}
          </section>
        </div>
        <section className="space-y-3 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
          <h3 className="font-semibold">{t3("fileTitle")}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">{t3("uploadHelp")}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{t3("attachHint")}</p>
          {(detalhes.anexos||[]).filter(a=>a.versao<=detalhes.versao.numero).length===0&&<p className="text-sm">{t3("noFiles")}</p>}
          <ul className="space-y-2">{(detalhes.anexos||[]).filter(a=>a.versao<=detalhes.versao.numero).map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-800"><span className="break-all">{a.nomeOriginal} · {Math.round(a.tamanho/1024)} KB</span><a className="font-semibold text-blue-700 underline dark:text-blue-300" href={`/api/documentos-docentes/${detalhes.documento.id}/anexos/${a.id}`}>{t3("downloadFile")}</a></li>)}</ul>
          {podeAnexar ? <div className="space-y-2"><label className="block text-sm"><span className="font-semibold">{t3("selectFile")}</span><input key={chaveArquivo} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx,.txt,.csv" className={`${campoBase} mt-2`} onChange={(e:{target:{files:FileList|null}})=>setArquivoSelecionado(e.target.files?.[0]||null)}/></label><textarea className={campoBase} rows={2} maxLength={3000} placeholder={t3("optionalNote")} value={notaAnexo} onChange={(e:{target:{value:string}})=>setNotaAnexo(e.target.value)} /><button type="button" disabled={ocupado||!arquivoSelecionado} className={`${botaoBase} bg-blue-700 text-white`} onClick={()=>void enviarAnexo()}>{t3("upload")}</button></div> : existeAssinaturaAtual && !historica ? <p className="text-xs text-amber-700 dark:text-amber-300">{t3("lockedAttachment")}</p> : null}
        </section>
        <section className="space-y-3 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{t("messages")}</h3>
          {detalhes.mensagens.length === 0 && <p className="text-sm text-slate-500">{t("noMessages")}</p>}
          {detalhes.mensagens.map(m => <article key={m.id} className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800"><div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"><strong>{t(m.papel === "ADMIN" ? "adminSays" : "teacherSays")}</strong><time>{dataFormatada(m.criadoEm,locale)}</time></div><p className="whitespace-pre-wrap break-words">{m.texto}</p></article>)}
          {detalhes.documento.status !== "CANCELADO" && <>
          <label className="block"><span className="sr-only">{t("sendMessage")}</span><textarea className={campoBase} maxLength={10000} rows={3} placeholder={t("messagePlaceholder")} value={textoMensagem} onChange={(e: { target: { value: string } }) => setTextoMensagem(e.target.value)} /></label>
          <button type="button" disabled={ocupado || !textoMensagem.trim()} className={`${botaoBase} bg-blue-700 text-white`} onClick={() => void enviarMensagem()}>{t("sendMessage")}</button>
          </>}
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-2 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{t("history")}</h3>{detalhes.eventos.length === 0 && <p className="text-sm">{t("noHistory")}</p>}
            <ol className="space-y-2">{detalhes.eventos.map(evento => {
              const { titulo, descricao } = historicoEvento(evento);
              return <li key={evento.id} className="border-l-2 border-blue-400 pl-3 text-xs"><strong>{titulo}</strong> · {t("version")} {evento.versao} · {dataFormatada(evento.criadoEm, locale)}{descricao && <p className="mt-1 whitespace-pre-wrap break-words">{descricao}</p>}</li>;
            })}</ol>
          </section>
          <section className="space-y-2 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{t("signatures")}</h3>
            {detalhes.assinaturas.map(a => <p key={a.id} className="text-sm">{a.nomeAssinante} · {t("version")} {a.versao} · {dataFormatada(a.assinadoEm,locale)}</p>)}
            {detalhes.assinaturas.filter(a=>a.versao===detalhes.versao.numero).length===0 && <p className="text-xs text-slate-600 dark:text-slate-300">{t3("noSignature")}</p>}
            {podeAssinarAdmin && <button type="button" disabled={ocupado} className={`${botaoBase} bg-blue-700 text-white`} onClick={()=>setAssinaturaAberta(true)}>{t3("sign")}</button>}
            {!historica&&deveAssinar&&!assinaturaProfessor&&!admin&&<p className="text-xs text-amber-700 dark:text-amber-300">{t3("signFirst")}</p>}
            {!historica&&deveAssinar&&admin&&!assinaturaAdmin&&<p className="text-xs text-amber-700 dark:text-amber-300">{t3("adminSignFirst")}</p>}
          </section>
        </div>
      </>}
    </section>}
    {assinaturaAberta&&detalhes&&!historica&&<AssinaturaDocumentoDocenteModal documentoId={detalhes.documento.id} titulo={detalhes.documento.titulo} versao={detalhes.documento.versaoAtual} onFechar={()=>setAssinaturaAberta(false)} onAssinou={assinaturaConcluida}/>}
    {documentoParaExcluir && <PhanyxConfirmModal
      aberto
      titulo={gestao.confirmarExclusao}
      mensagem={`${documentoParaExcluir.titulo} (#${documentoParaExcluir.id}) · ${statusTexto(documentoParaExcluir.status)}`}
      textoConfirmar={gestao.excluir}
      textoCancelar={gestao.cancelar}
      textoCarregando={t("loading")}
      carregando={ocupado}
      tipo="perigo"
      onConfirmar={() => void excluirDocumento()}
      onCancelar={() => setDocumentoParaExcluir(null)}
    >
      <p className="text-sm">{gestao.efeitoExclusao}</p>
      {erroExclusao && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erroExclusao}</p>}
    </PhanyxConfirmModal>}
    {documentoParaEnviar && <EnviarDocumentoDocenteModal
      documento={documentoParaEnviar}
      locale={locale}
      onFechar={() => setDocumentoParaEnviar(null)}
      onResultado={() => {
        if (detalhes?.documento.id === documentoParaEnviar.id) {
          void carregarDetalhe(detalhes.documento.id, versaoSelecionada).catch(() => {});
        }
      }}
    />}
    <details className="rounded-xl border border-slate-200 p-4 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"><summary className="cursor-pointer font-semibold">{t("template")}</summary><p className="mt-2">{t("templateTip")}</p></details>
  </main>;
}
