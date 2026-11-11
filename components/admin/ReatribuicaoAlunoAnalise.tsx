"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type DocumentoTermo = { id: number; nomeOriginal: string; criadoEm: string; tamanhoBytes: number; enviadoPorId: number | null };
type Aluno = { id: number; nome: string; nomeSocial?: string | null };
type Analise = {
  modo: "ANALISE_SOMENTE_LEITURA";
  matricula: {
    id: number;
    numeroMatricula: string | null;
    status: string;
    aluno: Aluno;
    curso: { nome: string } | null;
    turmaPrincipal: { nome: string } | null;
  };
  alunoDestino: Aluno | null;
  academico: {
    itens: number;
    turmasAvulsas: number;
    optativas: number;
    presencasOptativas: number;
    presencasEmTurmas: number;
    notasEmTurmas: number;
    observacao: string;
  };
  financeiro: {
    previaFinanceira: {
      lancamentos: Array<{ id: number; grupo: string; motivo: string; alteracaoAutomaticaPermitida: false }>;
      titulosPreservados: number;
      totalRevisar: number;
      totalPreservar: number;
    };
    lancamentos: Array<{ id: number; status: string; valorOriginal: number; valorPago: number | null }>;
    cobrancas: Array<{ id: number; statusBancario: string; statusOperacional: string; valorCobrado: string }>;
  };
  contratos: Array<{ id: number; status: string; dataAssinatura: string | null }>;
  documentos: number;
  transferenciasPendentes: number;
  solicitacaoPendente: {
    id: number;
    alunoDestinoId: number | null;
    propostaAcademica: {
      turmaIds: number[];
      optativaSessaoIds: number[];
      cursoPrincipalId: number | null;
      dataInicioCurso: string;
      registradoEm: string | null;
      nome: string;
    } | null;
    tipo: string;
    status: string;
    motivo: string;
    alunoOrigemNomeSnapshot: string | null;
    alunoDestinoNomeSnapshot: string | null;
    dataTransferencia: string;
    createdAt: string;
  } | null;
  alertas: string[];
  podeConfirmarNestaEtapa: false;
};

type Oferta = {
  id: number;
  nome: string;
  cursoId: number | null;
  vagas: number | null;
  horariosPendentes: boolean;
  capacidadePendente: boolean;
  curso: { id: number; nome: string; permiteCursosAdicionais: boolean };
};
type Optativa = {
  id: number;
  nome: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  vagas: number;
  turmaIds: number[];
};
type ParecerIntegridade = {
  modo: "PARECER_SOMENTE_LEITURA";
  podeExecutarTransferencia: false;
  semImpedimentosIdentificados: boolean;
  quantidadeImpedimentos: number;
  observacao: string;
  impedimentos: Array<{
    codigo: string;
    grupo: string;
    descricao: string;
    quantidade: number | null;
  }>;
  contagens: Record<string, number>;
};


type DossieReatribuicao = {
  modo: "DOSSIE_SEM_EXECUCAO";
  podeExecutarTransferencia: false;
  origem: { id: number; nome: string };
  destino: { id: number; nome: string; ativo: boolean } | null;
  matricula: { id: number; numeroMatricula: string | null; status: string };
  possuiProposta: boolean;
  estrategia: {
    origemInalterada: boolean;
    possuiVinculos: boolean;
    estrategiaSugerida: string;
    explicacao: string;
    transferenciaHabilitada: false;
  };
  financeiro: {
    totalLancamentos: number;
    totalTitulos: number;
    totalTitulosExternos: number;
    divergenciaAluno: boolean;
    totais: Record<string, number>;
    linhas: Array<{
      id: number; tipo: string; grupo: string; status: string;
      valorOriginalCentavos: number; valorPagoCentavos: number;
      valorFinalCentavos: number; cobrancasIds: number[];
      alunoConfere: boolean; acaoRecomendada: string;
    }>;
    cobrancas: Array<{
      id: number; statusBancario: string; statusOperacional: string;
      integradoProvedor: boolean; temBaixaOuPagamento: boolean; alunoConfere: boolean;
    }>;
  };
  contratos: Array<{ id: number; status: string; alunoId: number; dataAssinatura: string | null }>;
  documentosGerados: Array<{ id: number; status: string; alunoId: number | null }>;
  documentosAluno: Array<{ id: number; alunoId: number; titulo: string }>;
  itensAcademicos: number;
  vinculosTurmasAvulsas: number;
};

type MinutaReatribuicao = {
  tipo: "MINUTA_NAO_ASSINADA";
  texto: string;
  referenciaPlano: string;
  mensagem: string;
  financeiroExigeRevisao: boolean;
  assinaturasPendentes: string[];
  podeExecutarTransferencia: false;
};

type PreviaAcademica = {
  versao: string;
  nome: string;
  calculo: { matriculaCentavos: number; mensalidadeCentavos: number; quantidadeParcelas: number };
  ofertas: Array<{ turmaId: number; turmaNome: string; cursoNome: string }>;
};
const nomeAluno = (aluno: Aluno) => aluno.nomeSocial || aluno.nome;
const dataLocal = () => {
  const hoje = new Date();
  const dois = (numero: number) => String(numero).padStart(2, "0");
  return `${hoje.getFullYear()}-${dois(hoje.getMonth() + 1)}-${dois(hoje.getDate())}`;
};

export default function ReatribuicaoAlunoAnalise({ matriculaId }: { matriculaId: number }) {
  const locale = useLocale();
  const t = useTranslations("AdminReatribuicaoAluno");
  const formatarMoeda = (centavos: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(centavos / 100);
  const traduzirStatus = (status: string) =>
    t.has(`status_${status}`) ? t(`status_${status}`) : status;
  // Mensagens do servidor permanecem em pt quando a interface está em português.
  // Para outros idiomas, usa o código conhecido ou uma mensagem genérica traduzida.
  const erroDaApi = useCallback((dados: { codigo?: string; error?: string } | null, padrao: string) => {
    if (locale === "pt-BR" && dados?.error) return dados.error;
    return t(padrao);
  }, [locale, t]);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataTransferencia, setDataTransferencia] = useState(dataLocal);
  const [registrando, setRegistrando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [optativas, setOptativas] = useState<Optativa[]>([]);
  const [buscaCurso, setBuscaCurso] = useState("");
  const [carregandoOfertas, setCarregandoOfertas] = useState(false);
  const [turmaIds, setTurmaIds] = useState<number[]>([]);
  const [optativaSessaoIds, setOptativaSessaoIds] = useState<number[]>([]);
  const [cursoPrincipalId, setCursoPrincipalId] = useState<number | null>(null);
  const [dataInicioNovoAluno, setDataInicioNovoAluno] = useState(dataLocal);
  const [previaAcademica, setPreviaAcademica] = useState<PreviaAcademica | null>(null);
  const [processandoProposta, setProcessandoProposta] = useState(false);
  const [sucessoProposta, setSucessoProposta] = useState("");
  const [parecer, setParecer] = useState<ParecerIntegridade | null>(null);
  const [carregandoParecer, setCarregandoParecer] = useState(false);
  const [dossie, setDossie] = useState<DossieReatribuicao | null>(null);
  const [carregandoDossie, setCarregandoDossie] = useState(false);
  const [minuta, setMinuta] = useState<MinutaReatribuicao | null>(null);
  const [carregandoMinuta, setCarregandoMinuta] = useState(false);
  const [mensagemMinuta, setMensagemMinuta] = useState("");
  const [execucaoDisponivel, setExecucaoDisponivel] = useState(false);
  const [estadoExecucao, setEstadoExecucao] = useState(() => t("execNotChecked"));
  const [vencimentoSucessora, setVencimentoSucessora] = useState(dataLocal);
  const [documentoTermo, setDocumentoTermo] = useState<DocumentoTermo | null>(null);
  const [arquivoTermo, setArquivoTermo] = useState<File | null>(null);
  const [enviandoTermo, setEnviandoTermo] = useState(false);
  const [anuenciasConferidas, setAnuenciasConferidas] = useState(false);
  const [fraseConfirmacao, setFraseConfirmacao] = useState("");
  const [efetivando, setEfetivando] = useState(false);
  const [resultadoEfetivacao, setResultadoEfetivacao] = useState<{ matriculaDestinoId: number; numeroMatricula?: string | null } | null>(null);

  const carregar = useCallback(async (alunoId: number | null) => {
    setParecer(null);
    setDossie(null);
    setMinuta(null);
    setMensagemMinuta("");
    setAnuenciasConferidas(false);
    setFraseConfirmacao("");
    setCarregando(true);
    setErro("");
    try {
      const qs = alunoId ? `?alunoDestinoId=${alunoId}` : "";
      const resposta = await fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/analise${qs}`, {
        credentials: "include",
        cache: "no-store",
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "analyzeLoadFailed"));
      setAnalise(dados as Analise);
    } catch (error) {
      setAnalise(null);
      setErro(error instanceof Error ? error.message : t("analyzeFailed"));
    } finally {
      setCarregando(false);
    }
  }, [matriculaId, t, erroDaApi]);

  useEffect(() => {
    if (Number.isSafeInteger(matriculaId) && matriculaId > 0) void carregar(null);
    else { setCarregando(false); setErro(t("invalidEnrollment")); }
  }, [carregar, matriculaId, t]);

  // Restaura apenas uma vez por solicitação/versão, sem descartar escolhas em andamento
  // quando a análise é recarregada com a mesma proposta acadêmica.
  const ultimaRestauracaoRef = useRef<string | null>(null);
  useEffect(() => {
    const pendente = analise?.solicitacaoPendente;
    if (!pendente || pendente.tipo !== "REATRIBUICAO_ALUNO") {
      ultimaRestauracaoRef.current = null;
      return;
    }
    const chave = `${matriculaId}:${pendente.id}:${pendente.propostaAcademica?.registradoEm ?? "sem-plano"}`;
    if (ultimaRestauracaoRef.current === chave) return;
    ultimaRestauracaoRef.current = chave;
    const salvo = pendente.propostaAcademica;
    setTurmaIds(salvo?.turmaIds || []);
    setOptativaSessaoIds(salvo?.optativaSessaoIds || []);
    setCursoPrincipalId(salvo?.cursoPrincipalId ?? null);
    setDataInicioNovoAluno(salvo?.dataInicioCurso || pendente.dataTransferencia.slice(0, 10));
    setPreviaAcademica(null);
  }, [analise?.solicitacaoPendente, matriculaId]);

  async function carregarOfertas() {
    setCarregandoOfertas(true);
    setErro("");
    try {
      const resposta = await fetch("/api/admin/matriculas/modalidades", {
        credentials: "include", cache: "no-store",
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "offersLoadFailed"));
      setOfertas(Array.isArray(dados?.ofertas) ? dados.ofertas : []);
      setOptativas(Array.isArray(dados?.optativas) ? dados.optativas : []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t("offersLoadFailed"));
    } finally {
      setCarregandoOfertas(false);
    }
  }

  function alternarTurma(id: number, selecionada: boolean) {
    setTurmaIds(atual => selecionada ? [...atual, id] : atual.filter(t => t !== id));
    // Uma optativa nunca deve sobreviver a uma mudança de turmas sem nova conferência.
    setOptativaSessaoIds([]);
    setCursoPrincipalId(null);
    setPreviaAcademica(null);
    setSucessoProposta("");
  }

  async function executarProposta(acao: "PREVIA" | "SALVAR") {
    const pendente = analise?.solicitacaoPendente;
    if (!pendente || pendente.tipo !== "REATRIBUICAO_ALUNO") return;
    if (acao === "SALVAR" && !previaAcademica) {
      setErro(t("proposalPreviewFirst"));
      return;
    }
    setProcessandoProposta(true);
    setErro("");
    setSucessoProposta("");
    try {
      const resposta = await fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/proposta`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao, transferenciaId: pendente.id, turmaIds, optativaSessaoIds,
          cursoPrincipalId, dataInicioCurso: dataInicioNovoAluno,
          ...(acao === "SALVAR" ? { versao: previaAcademica?.versao } : {}),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "proposalValidateFailed"));
      setPreviaAcademica(dados.proposta as PreviaAcademica);
      if (acao === "SALVAR") {
        setSucessoProposta(t("proposalSavedSuccess"));
        await carregar(destinoId);
      }
    } catch (e) {
      setPreviaAcademica(null);
      setErro(e instanceof Error ? e.message : t("proposalError"));
    } finally {
      setProcessandoProposta(false);
    }
  }

  async function conferirIntegridade() {
    const pendente = analise?.solicitacaoPendente;
    if (!pendente || pendente.tipo !== "REATRIBUICAO_ALUNO") return;
    setCarregandoParecer(true);
    setParecer(null);
    setErro("");
    try {
      const parametros = new URLSearchParams({ transferenciaId: String(pendente.id) });
      const resposta = await fetch(
        `/api/admin/matriculas/${matriculaId}/reatribuicao/parecer?${parametros}`,
        { credentials: "include", cache: "no-store" },
      );
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "integrityLoadFailed"));
      setParecer(dados as ParecerIntegridade);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("integrityFailed"));
    } finally {
      setCarregandoParecer(false);
    }
  }

  async function prepararDossie() {
    const pendente = analise?.solicitacaoPendente;
    if (!pendente || pendente.tipo !== "REATRIBUICAO_ALUNO") return;
    setCarregandoDossie(true);
    setDossie(null);
    setErro("");
    try {
      const params = new URLSearchParams({ transferenciaId: String(pendente.id) });
      const resposta = await fetch(
        `/api/admin/matriculas/${matriculaId}/reatribuicao/dossie?${params}`,
        { credentials: "include", cache: "no-store" },
      );
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "dossierLoadFailed"));
      setDossie(dados as DossieReatribuicao);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("dossierFailed"));
    } finally {
      setCarregandoDossie(false);
    }
  }

  async function prepararMinuta() {
    const pendente = analise?.solicitacaoPendente;
    if (!pendente || pendente.tipo !== "REATRIBUICAO_ALUNO") return;
    setCarregandoMinuta(true);
    setMinuta(null);
    setMensagemMinuta("");
    setErro("");
    try {
      const params = new URLSearchParams({ transferenciaId: String(pendente.id) });
      const resposta = await fetch(
        `/api/admin/matriculas/${matriculaId}/reatribuicao/termo?${params}`,
        { credentials: "include", cache: "no-store" },
      );
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "draftLoadFailed"));
      if (dados?.tipo !== "MINUTA_NAO_ASSINADA" || typeof dados?.texto !== "string") {
        throw new Error(t("minutaInvalid"));
      }
      setMinuta(dados as MinutaReatribuicao);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("minutaFailed"));
    } finally {
      setCarregandoMinuta(false);
    }
  }

  useEffect(() => {
    const solicitacaoId = analise?.solicitacaoPendente?.id;
    if (!solicitacaoId) return;
    let ativo = true;
    setExecucaoDisponivel(false);
    setEstadoExecucao(t("execChecking"));
    void fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/confirmar`, {
      credentials: "include", cache: "no-store",
    }).then(async resposta => {
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "executionLoadFailed"));
      if (!ativo) return;
      setExecucaoDisponivel(dados.habilitada === true);
      setEstadoExecucao(dados.habilitada === true
        ? t("execTestEnabled")
        : t("execDisabled"));
    }).catch(() => {
      if (ativo) setEstadoExecucao(t("execCheckFailed"));
    });
    return () => { ativo = false; };
  }, [matriculaId, analise?.solicitacaoPendente?.id, t, erroDaApi]);

  // A seleção de um documento nunca pode sobreviver à troca de protocolo.
  useEffect(() => {
    const transferenciaId = analise?.solicitacaoPendente?.id;
    setDocumentoTermo(null);
    setArquivoTermo(null);
    if (!transferenciaId) return;
    let ativo = true;
    const parametros = new URLSearchParams({ transferenciaId: String(transferenciaId) });
    void fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/documento?${parametros}`, {
      credentials: "include", cache: "no-store",
    }).then(async resposta => {
      if (!resposta.ok) return null;
      return resposta.json();
    }).then(dados => { if (ativo) setDocumentoTermo(dados?.documento ?? null); })
      .catch(() => { if (ativo) setDocumentoTermo(null); });
    return () => { ativo = false; };
  }, [matriculaId, analise?.solicitacaoPendente?.id, analise?.solicitacaoPendente?.propostaAcademica?.registradoEm]);

  async function enviarDocumentoTermoAssinado() {
    const transferenciaId = analise?.solicitacaoPendente?.id;
    if (!transferenciaId || !arquivoTermo || !minuta?.referenciaPlano || enviandoTermo || !execucaoDisponivel) {
      setErro(t("generateCurrentDraftFirst"));
      return;
    }
    setEnviandoTermo(true);
    setErro("");
    try {
      const formulario = new FormData();
      formulario.set("transferenciaId", String(transferenciaId));
      formulario.set("referenciaPlano", minuta.referenciaPlano);
      formulario.set("arquivo", arquivoTermo);
      const resposta = await fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/documento`, {
        method: "POST", body: formulario, credentials: "include", cache: "no-store",
      });
      const dados = await resposta.json();
      if (!resposta.ok || !dados?.documento?.id) {
        throw new Error(erroDaApi(dados, "attachFailed"));
      }
      setDocumentoTermo(dados.documento as DocumentoTermo);
      setArquivoTermo(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("uploadFailed"));
    } finally { setEnviandoTermo(false); }
  }

  async function confirmarSucessaoControlada() {
    const pendente = analise?.solicitacaoPendente;
    if (!pendente || !execucaoDisponivel || !dossie || efetivando ||
        !anuenciasConferidas || !documentoTermo?.id || enviandoTermo || fraseConfirmacao !== "REATRIBUIR") return;
    setEfetivando(true);
    setErro("");
    try {
      const resposta = await fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/confirmar`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferenciaId: pendente.id,
          primeiroVencimento: vencimentoSucessora,
          referenciaTermoAssinado: `DOCUMENTO_ID:${documentoTermo.id}`,
          documentoTermoAssinadoId: documentoTermo.id,
          reconheceAutorizacao: anuenciasConferidas,
          confirmacaoDigitada: fraseConfirmacao,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "reassignmentFailed"));
      const destino = dados?.resultado?.matriculaDestinoId;
      if (!Number.isSafeInteger(destino) || destino <= 0) throw new Error(t("successorMissing"));
      setResultadoEfetivacao({ matriculaDestinoId: destino, numeroMatricula: dados?.resultado?.numeroMatricula });
      setAnuenciasConferidas(false);
      setFraseConfirmacao("");
      await carregar(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("confirmFailed"));
    } finally {
      setEfetivando(false);
    }
  }

  async function copiarMinuta() {
    if (!minuta) return;
    try {
      await navigator.clipboard.writeText(minuta.texto);
      setMensagemMinuta(t("minutaCopied"));
    } catch {
      setMensagemMinuta(t("minutaCopyUnavailable"));
    }
  }

  async function pesquisar() {
    if (busca.trim().length < 2) {
      setErro(t("searchMinChars"));
      return;
    }
    setBuscando(true);
    setErro("");
    setDestinoId(null);
    setAlunos([]);
    try {
      const params = new URLSearchParams({ busca: busca.trim(), page: "1", limit: "20" });
      const resposta = await fetch(`/api/aluno?${params}`, { credentials: "include", cache: "no-store" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "searchLoadFailed"));
      setAlunos((Array.isArray(dados?.data) ? dados.data : []).filter(
        (aluno: Aluno) => aluno.id !== analise?.matricula.aluno.id,
      ));
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("searchFailed"));
    } finally {
      setBuscando(false);
    }
  }

  async function registrarSolicitacao() {
    if (!analise?.alunoDestino || destinoId !== analise.alunoDestino.id) {
      setErro(t("selectDestinationFirst"));
      return;
    }
    setRegistrando(true);
    setErro("");
    setSucesso("");
    try {
      const resposta = await fetch(`/api/admin/matriculas/${matriculaId}/reatribuicao/solicitacao`, {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunoDestinoId: destinoId, motivo, observacoes, dataTransferencia }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(erroDaApi(dados, "requestFailed"));
      setSucesso(t("requestSaved", { id: dados.solicitacao?.id ?? "—" }));
      await carregar(destinoId);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("requestSaveFailed"));
    } finally {
      setRegistrando(false);
    }
  }

  function selecionar(aluno: Aluno) {
    setDestinoId(aluno.id);
    void carregar(aluno.id);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header>
        <Link href={`/admin/matriculas/${matriculaId}/transferir`}
          className="text-sm font-medium text-cyan-700 hover:underline dark:text-cyan-300">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{t("title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </header>

      {erro && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{erro}</p>}

      {analise && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("sourceEnrollment")}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500 dark:text-slate-400">{t("enrollment")}</dt><dd className="font-medium text-slate-900 dark:text-white">{analise.matricula.numeroMatricula || `#${matriculaId}`}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">{t("status")}</dt><dd className="font-medium text-slate-900 dark:text-white">{traduzirStatus(analise.matricula.status)}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">{t("currentStudent")}</dt><dd className="font-medium text-slate-900 dark:text-white">{nomeAluno(analise.matricula.aluno)}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">{t("courseClass")}</dt><dd className="font-medium text-slate-900 dark:text-white">{analise.matricula.curso?.nome || "—"} / {analise.matricula.turmaPrincipal?.nome || "—"}</dd></div>
        </dl>
      </section>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("destinationStudent")}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("searchInstruction")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input aria-label={t("destinationStudentName")} value={busca} onChange={event => setBusca(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") void pesquisar(); }}
            placeholder={t("studentName")} className="min-w-52 flex-1 rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          <button type="button" onClick={() => void pesquisar()} disabled={buscando}
            className="rounded-lg bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60">
            {buscando ? t("searching") : t("search")}
          </button>
          <Link href="/admin/alunos/novo" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-800 dark:border-slate-600 dark:text-slate-100">{t("registerStudent")}</Link>
        </div>
        {alunos.length > 0 && <div className="mt-3 space-y-2">
          {alunos.map(aluno => <button key={aluno.id} type="button" onClick={() => selecionar(aluno)}
            className={`block w-full rounded-lg border p-3 text-left text-sm dark:text-white ${destinoId === aluno.id ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40" : "border-slate-200 dark:border-slate-700"}`}>
            {nomeAluno(aluno)} <span className="text-slate-500 dark:text-slate-400">(ID {aluno.id})</span>
          </button>)}
        </div>}
        {destinoId && analise?.alunoDestino && <p className="mt-3 text-sm font-semibold text-cyan-800 dark:text-cyan-300">{t("selectedDestination")} {nomeAluno(analise.alunoDestino)}</p>}
      </section>

      {sucesso && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">{sucesso}</p>}

      {analise?.solicitacaoPendente && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <h2 className="font-semibold text-amber-950 dark:text-amber-100">{t("transferUnderReview")} #{analise.solicitacaoPendente.id}</h2>
        <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">{t("status")}: {traduzirStatus(analise.solicitacaoPendente.status)} · {t("proposedDestination")} {analise.solicitacaoPendente.alunoDestinoNomeSnapshot || t("notProvided")}</p>
        <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{t("requestDoesNotChange")}</p>
      </section>}

      {analise?.solicitacaoPendente?.tipo === "REATRIBUICAO_ALUNO" && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("destinationPlanTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("requestDestination")} <strong>{analise.solicitacaoPendente.alunoDestinoNomeSnapshot}</strong>.
          {t("selectionRules")}
        </p>
        {analise.solicitacaoPendente.propostaAcademica && <div className="mt-3 rounded-lg border border-emerald-300 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:text-emerald-200">
          <strong>{t("savedProposal")}</strong> {analise.solicitacaoPendente.propostaAcademica.nome}.
          {t("plannedStart")} {analise.solicitacaoPendente.propostaAcademica.dataInicioCurso}.
          {t("noReservation")}
        </div>}
        <button type="button" onClick={() => void carregarOfertas()} disabled={carregandoOfertas}
          className="mt-4 rounded-lg border border-cyan-600 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-200 dark:hover:bg-cyan-950">
          {carregandoOfertas ? t("consultingOffers") : t("consultOffers")}
        </button>
        {ofertas.length > 0 && <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("newStudentStart")}
            <input type="date" value={dataInicioNovoAluno} onChange={e => { setDataInicioNovoAluno(e.target.value); setPreviaAcademica(null); }}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          </label>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("searchCourseClass")}
            <input value={buscaCurso} onChange={e => setBuscaCurso(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder={t("filterAvailable")} />
          </label>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            {ofertas.filter(oferta => `${oferta.curso.nome} ${oferta.nome}`.toLocaleLowerCase(locale).includes(buscaCurso.toLocaleLowerCase(locale))).map(oferta => {
              const indisponivel = oferta.horariosPendentes || oferta.capacidadePendente ||
                (oferta.vagas !== null && oferta.vagas <= 0);
              return <label key={oferta.id} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${indisponivel ? "border-slate-200 opacity-60 dark:border-slate-700" : "border-slate-200 dark:border-slate-700"}`}>
                <input type="checkbox" checked={turmaIds.includes(oferta.id)}
                  disabled={indisponivel} onChange={e => alternarTurma(oferta.id, e.target.checked)} className="mt-1" />
                <span className="text-slate-900 dark:text-white"><strong>{oferta.curso.nome}</strong> — {oferta.nome}
                  <span className="block text-xs text-slate-600 dark:text-slate-300">{indisponivel ? t("offerUnavailable") : oferta.vagas === null ? t("placesToConfirm") : t("placesReported", { count: oferta.vagas })}</span>
                </span>
              </label>;
            })}
          </div>
          {turmaIds.length > 0 && <p className="text-sm text-slate-700 dark:text-slate-200">{t("selectedClasses")} {turmaIds.length}</p>}
          {turmaIds.length > 1 && <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("primaryCourse")}
            <select value={cursoPrincipalId || ""} onChange={e => { setCursoPrincipalId(e.target.value ? Number(e.target.value) : null); setPreviaAcademica(null); }}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
              <option value="">{t("combinationRules")}</option>
              {ofertas.filter(oferta => turmaIds.includes(oferta.id) && oferta.curso.permiteCursosAdicionais)
                .map(oferta => <option key={oferta.id} value={oferta.curso.id}>{oferta.curso.nome}</option>)}
            </select>
          </label>}
          {optativas.filter(optativa => optativa.turmaIds.some(id => turmaIds.includes(id))).length > 0 && <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("electivesForClasses")}</h3>
            <div className="mt-2 space-y-2">{optativas.filter(optativa => optativa.turmaIds.some(id => turmaIds.includes(id))).map(optativa => <label key={optativa.id} className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
              <input type="checkbox" checked={optativaSessaoIds.includes(optativa.id)} disabled={optativa.vagas <= 0}
                onChange={e => { setOptativaSessaoIds(ids => e.target.checked ? [...ids, optativa.id] : ids.filter(id => id !== optativa.id)); setPreviaAcademica(null); }} />
              {optativa.nome} · {t("day")} {optativa.diaSemana} · {optativa.horaInicio}–{optativa.horaFim} · {optativa.vagas} {t("places")}
            </label>)}</div>
          </div>}
          <button type="button" disabled={processandoProposta || turmaIds.length === 0 || !dataInicioNovoAluno}
            onClick={() => void executarProposta("PREVIA")}
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
            {processandoProposta ? t("validating") : t("validateCourses")}
          </button>
        </div>}
        {previaAcademica && <div className="mt-4 rounded-xl border border-slate-300 p-4 dark:border-slate-600">
          <h3 className="font-semibold text-slate-950 dark:text-white">{t("validatedPreview")} {previaAcademica.nome}</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {previaAcademica.ofertas.map(oferta => <p key={oferta.turmaId}>{oferta.cursoNome} — {oferta.turmaNome}</p>)}
            <p>{t("newEnrollmentFee")} <strong>{formatarMoeda(previaAcademica.calculo.matriculaCentavos)}</strong></p>
            <p>{t("referenceMonthly")} <strong>{formatarMoeda(previaAcademica.calculo.mensalidadeCentavos)}</strong></p>
            <p>{t("referenceInstallments")} <strong>{previaAcademica.calculo.quantidadeParcelas}</strong></p>
          </div>
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
            {t("indicativeValues")}
          </p>
          <button type="button" disabled={processandoProposta} onClick={() => void executarProposta("SALVAR")}
            className="mt-3 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50">
            {processandoProposta ? t("reviewing") : t("saveAcademicProposal")}
          </button>
        </div>}
        {sucessoProposta && <p role="status" className="mt-3 rounded-lg border border-emerald-300 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:text-emerald-200">{sucessoProposta}</p>}
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t("planSaveOnly")}
        </p>
      </section>}

      {analise?.solicitacaoPendente?.tipo === "REATRIBUICAO_ALUNO" && <section
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("integrityTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("integrityDescription")}
        </p>
        <button type="button" disabled={carregandoParecer} onClick={() => void conferirIntegridade()}
          className="mt-3 rounded-lg border border-cyan-600 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-200 dark:hover:bg-cyan-950">
          {carregandoParecer ? t("checkingIntegrity") : t("checkObstacles")}
        </button>
        {parecer && <div className="mt-4 space-y-3" role="status">
          <p className="font-medium text-slate-900 dark:text-white">
            {parecer.quantidadeImpedimentos === 0
              ? t("noObstacles")
              : t("obstacleCount", { count: parecer.quantidadeImpedimentos })}
          </p>
          {parecer.impedimentos.map(item => <div key={item.codigo}
            className="rounded-lg border border-amber-300 p-3 text-sm text-amber-900 dark:border-amber-800 dark:text-amber-100">
            <strong>{item.grupo}</strong> — {item.descricao}
            {item.quantidade !== null && <span className="ml-1">{t("recordCount", { count: item.quantidade })}</span>}
          </div>)}
          <p className="text-xs text-slate-600 dark:text-slate-300">{parecer.observacao}</p>
        </div>}
      </section>}

      {analise?.solicitacaoPendente?.tipo === "REATRIBUICAO_ALUNO" && <section
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("dossierTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("dossierDescription")}
        </p>
        <button type="button" disabled={carregandoDossie} onClick={() => void prepararDossie()}
          className="mt-3 rounded-lg border border-cyan-600 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-200 dark:hover:bg-cyan-950">
          {carregandoDossie ? t("checkingClaims") : t("prepareDossier")}
        </button>
        {dossie && <div className="mt-4 space-y-4" role="status">
          <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
            <p><strong>{t("origin")}</strong> {dossie.origem.nome} (ID {dossie.origem.id})</p>
            <p><strong>{t("destination")}</strong> {dossie.destino?.nome || t("notFound")} (ID {dossie.destino?.id || "—"})</p>
            <p><strong>{t("publicNumber")}</strong> {dossie.matricula.numeroMatricula || t("notAssigned")}</p>
            <p><strong>{t("registeredProposal")}</strong> {dossie.possuiProposta ? t("yes") : t("no")}</p>
            <p><strong>{t("sourceUnchanged")}</strong> {dossie.estrategia.origemInalterada ? t("yes") : t("noReviewRequest")}</p>
            <p className="mt-2">{dossie.estrategia.explicacao}</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              [t("entries"), dossie.financeiro.totalLancamentos],
              [t("registeredClaims"), dossie.financeiro.totalTitulos],
              [t("externalClaims"), dossie.financeiro.totalTitulosExternos],
              [t("existingContracts"), dossie.contratos.length],
              [t("existingDocuments"), dossie.documentosGerados.length + dossie.documentosAluno.length],
              [t("academicLinks"), dossie.itensAcademicos + dossie.vinculosTurmasAvulsas],
            ].map(([rotulo, numero]) => <div key={rotulo} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="text-slate-600 dark:text-slate-300">{rotulo}</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{numero}</div>
            </div>)}
          </div>
          {dossie.financeiro.divergenciaAluno && <p className="rounded-lg border border-red-300 p-3 text-sm text-red-800 dark:border-red-800 dark:text-red-200">
            {t("divergentOwner")}
          </p>}
          {dossie.financeiro.linhas.length > 0 && <div className="space-y-2">
            <h3 className="font-semibold text-slate-950 dark:text-white">{t("existingEntries")}</h3>
            {dossie.financeiro.linhas.map(linha => <div key={linha.id}
              className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-white">
                {t("entry")} #{linha.id} · {linha.tipo} · {traduzirStatus(linha.status)}
              </p>
              <p className="text-slate-700 dark:text-slate-200">
                {t("original")} {formatarMoeda(linha.valorOriginalCentavos)} · {t("paid")} {formatarMoeda(linha.valorPagoCentavos)}
              </p>
              <p className="text-slate-600 dark:text-slate-300">{linha.acaoRecomendada}</p>
              {linha.cobrancasIds.length > 0 && <p className="text-slate-600 dark:text-slate-300">
                {t("associatedClaims")} {linha.cobrancasIds.join(", ")}
              </p>}
            </div>)}
          </div>}
          {dossie.financeiro.cobrancas.length > 0 && <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("claimsPreserve")}</h3>
            {dossie.financeiro.cobrancas.map(cobranca => <p key={cobranca.id}>
              #{cobranca.id} — {traduzirStatus(cobranca.statusBancario)} / {traduzirStatus(cobranca.statusOperacional)}
              {cobranca.integradoProvedor ? ` ${t("linkedProvider")}` : ""}
              {cobranca.temBaixaOuPagamento ? ` ${t("withPayment")}` : ""}
            </p>)}
          </div>}
          <p className="rounded-lg border border-amber-300 p-3 text-sm text-amber-900 dark:border-amber-800 dark:text-amber-200">
            {t("transferStillBlocked")}
          </p>
        </div>}
      </section>}

      {analise?.solicitacaoPendente?.tipo === "REATRIBUICAO_ALUNO" && <section
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("draftTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("draftDescription")}
        </p>
        <button type="button" disabled={carregandoMinuta} onClick={() => void prepararMinuta()}
          className="mt-3 rounded-lg border border-cyan-600 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-200 dark:hover:bg-cyan-950">
          {carregandoMinuta ? t("preparingDraft") : t("generateDraft")}
        </button>
        {minuta && <div className="mt-4 space-y-3">
          {minuta.financeiroExigeRevisao && <p role="status"
            className="rounded-lg border border-amber-300 p-3 text-sm text-amber-900 dark:border-amber-800 dark:text-amber-200">
            {t("financeRequiresReview")}
          </p>}
          <label htmlFor="minuta-reatribuicao" className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("draftReadOnly")}
          </label>
          <textarea id="minuta-reatribuicao" readOnly rows={22} value={minuta.texto}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copiarMinuta()}
              className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800">
              {t("copyDraft")}
            </button>
          </div>
          {mensagemMinuta && <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{mensagemMinuta}</p>}
          <p className="text-xs text-slate-600 dark:text-slate-300">{minuta.mensagem}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {t("pendingSignatures")} {minuta.assinaturasPendentes.join("; ")}.
          </p>
        </div>}
      </section>}

      {resultadoEfetivacao && <section className="rounded-xl border border-emerald-300 p-4 dark:border-emerald-800" role="status">
        <h2 className="font-semibold text-emerald-900 dark:text-emerald-200">{t("successorCreated")}</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {t("publicNumberSuccess")} {resultadoEfetivacao.numeroMatricula || t("toConfirm")}. {t("newContractPending")}
        </p>
        <Link className="mt-2 inline-block text-sm font-medium text-cyan-700 underline dark:text-cyan-300"
          href={`/admin/matriculas/${resultadoEfetivacao.matriculaDestinoId}`}>
          {t("openSuccessor")} #{resultadoEfetivacao.matriculaDestinoId}
        </Link>
      </section>}

      {analise?.solicitacaoPendente?.tipo === "REATRIBUICAO_ALUNO" && <section
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("controlledTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{estadoExecucao}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("controlledDescription")}
        </p>
        {execucaoDisponivel && <div className="mt-4 space-y-3">
          {!dossie && <p className="text-sm text-amber-700 dark:text-amber-200">
            {t("prepareDossierFirst")}
          </p>}
          {dossie && (dossie.financeiro.totalLancamentos > 0 || dossie.financeiro.totalTitulos > 0) &&
            <p className="text-sm text-amber-700 dark:text-amber-200">
              {t("sourceHasFinance")}
            </p>}
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("firstDueDate")}
            <input type="date" value={vencimentoSucessora} min={dataLocal()} onChange={event => setVencimentoSucessora(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          </label>
          <div className="rounded-lg border border-slate-300 p-3 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
              {t("signedPdf")}
              <input type="file" accept="application/pdf,.pdf" onChange={event => setArquivoTermo(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-slate-800 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-2 dark:text-slate-100 dark:file:bg-slate-700" />
            </label>
            <button type="button" onClick={() => void enviarDocumentoTermoAssinado()}
              disabled={!arquivoTermo || !minuta?.referenciaPlano || enviandoTermo || efetivando}
              className="mt-3 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              {enviandoTermo ? t("uploadingTerm") : t("attachSigned")}
            </button>
            {documentoTermo && <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
              {t("linkedDocument", { id: documentoTermo.id, name: documentoTermo.nomeOriginal })}
              {analise?.solicitacaoPendente && <a className="ml-2 underline" href={`/api/admin/matriculas/${matriculaId}/reatribuicao/documento?transferenciaId=${analise.solicitacaoPendente.id}&baixarId=${documentoTermo.id}`}>
                {t("downloadToReview")}
              </a>}
            </p>}
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-100">
            <input type="checkbox" checked={anuenciasConferidas} onChange={event => setAnuenciasConferidas(event.target.checked)} className="mt-1" />
            {t("authorizationsChecked")}
          </label>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("typeConfirm")}
            <input type="text" autoComplete="off" value={fraseConfirmacao} onChange={event => setFraseConfirmacao(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          </label>
          <button type="button" disabled={efetivando || !dossie || dossie.financeiro.totalLancamentos > 0 ||
            dossie.financeiro.totalTitulos > 0 || !anuenciasConferidas || fraseConfirmacao !== "REATRIBUIR" ||
            !documentoTermo?.id || enviandoTermo || !vencimentoSucessora}
            onClick={() => void confirmarSucessaoControlada()}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50">
            {efetivando ? t("confirmingTest") : t("confirmTest")}
          </button>
        </div>}
      </section>}

      {analise?.alunoDestino && !analise.solicitacaoPendente && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("registerRequest")}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("registerRequestHelp")}</p>
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("plannedTransferDate")}
            <input type="date" value={dataTransferencia} onChange={event => setDataTransferencia(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          </label>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("reasonRequired")}
            <textarea rows={3} maxLength={1000} value={motivo} onChange={event => setMotivo(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          </label>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {t("notesOptional")}
            <textarea rows={2} maxLength={2000} value={observacoes} onChange={event => setObservacoes(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
          </label>
          <button type="button" onClick={() => void registrarSolicitacao()}
            disabled={registrando || motivo.trim().length < 10 || !dataTransferencia}
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
            {registrando ? t("registering") : t("registerNoTransfer")}
          </button>
        </div>
      </section>}

      {carregando && <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{t("analyzing")}</p>}

      {analise && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("inventory")}</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            [t("academicItems"), analise.academico.itens],
            [t("standaloneClasses"), analise.academico.turmasAvulsas],
            [t("electives"), analise.academico.optativas],
            [t("electiveAttendance"), analise.academico.presencasOptativas],
            [t("classAttendance"), analise.academico.presencasEmTurmas],
            [t("classGrades"), analise.academico.notasEmTurmas],
            [t("financialEntries"), analise.financeiro.lancamentos.length],
            [t("financialCharges"), analise.financeiro.cobrancas.length],
            [t("contracts"), analise.contratos.length],
            [t("generatedDocuments"), analise.documentos],
          ].map(([rotulo, numero]) => <div key={rotulo} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="text-slate-600 dark:text-slate-300">{rotulo}</div>
            <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{numero}</div>
          </div>)}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{analise.academico.observacao}</p>

        {(analise.financeiro.lancamentos.length > 0 || analise.financeiro.cobrancas.length > 0) && <div>
          <h3 className="font-medium text-slate-950 dark:text-white">{t("financePreview")}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("financeDisclaimer")}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("entriesToPreserve")}</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{analise.financeiro.previaFinanceira.totalPreservar}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("entriesToReview")}</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{analise.financeiro.previaFinanceira.totalRevisar}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("claimsToPreserve")}</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{analise.financeiro.previaFinanceira.titulosPreservados}</div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {analise.financeiro.previaFinanceira.lancamentos.map(item => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {t("entry")} #{item.id}: {item.grupo === "REVISAR_SEM_MOVIMENTACAO" ? t("reviewNoActivity") : t("preserveLink")}
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{item.motivo}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-4 font-medium text-slate-950 dark:text-white">{t("currentRecordedStatus")}</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {analise.financeiro.lancamentos.map(item => <p key={`l-${item.id}`}>{t("entry")} #{item.id}: {traduzirStatus(item.status)} ({t("paidValue")} {formatarMoeda(Math.round(Number(item.valorPago || 0) * 100))})</p>)}
            {analise.financeiro.cobrancas.map(item => <p key={`c-${item.id}`}>{t("charge")} #{item.id}: {traduzirStatus(item.statusBancario)} / {traduzirStatus(item.statusOperacional)}</p>)}
          </div>
        </div>}
        {analise.alertas.length > 0 && <div className="space-y-2" role="status">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200">{t("reviewsNeeded")}</h3>
          {analise.alertas.map(alerta => <p key={alerta} className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">{alerta}</p>)}
        </div>}
        <p className="rounded-xl border border-slate-300 p-3 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200">
          {t("confirmationDisabled")}
        </p>
      </section>}
    </main>
  );
}
