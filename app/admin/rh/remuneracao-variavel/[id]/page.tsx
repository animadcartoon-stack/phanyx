"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  salarioBase?: string | number | null;
  elegivel: boolean;
  jaParticipa: boolean;
  motivosInelegibilidade: string[];
  departamento?: {
    id: number;
    nome: string;
  } | null;
};

type Participante = {
  id: number;
  funcionarioId: number;
  funcionarioNomeSnapshot: string;
  funcionarioCargoSnapshot?: string | null;
  funcionarioDepartamentoSnapshot?: string | null;
};

type UsuarioAuditoria = {
  id: number;
  nome: string;
  email: string;
};

type LancamentoRemuneracaoVariavel = {
  id: number;
  funcionarioId: number;
  participanteId?: number | null;

  status: string;

  competenciaMes: number;
  competenciaAno: number;

  descricao: string;

  baseCalculo?: string | number | null;
  percentualAplicado?: string | number | null;
  pesoAplicado?: string | number | null;

  valorCalculado: string | number;
  valorAprovado?: string | number | null;

  funcionarioNomeSnapshot: string;
  funcionarioCargoSnapshot?: string | null;
  funcionarioDepartamentoSnapshot?: string | null;

  calculadoEm?: string | null;
  aprovadoEm?: string | null;
  reprovadoEm?: string | null;
  enviadoHoleriteEm?: string | null;
  pagoEm?: string | null;
  estornadoEm?: string | null;

  motivoAjuste?: string | null;
  motivoReprovacao?: string | null;
  motivoEstorno?: string | null;
  observacoes?: string | null;

  criadoPor?: UsuarioAuditoria | null;
  aprovadoPor?: UsuarioAuditoria | null;
  reprovadoPor?: UsuarioAuditoria | null;
  enviadoHoleritePor?: UsuarioAuditoria | null;
  estornadoPor?: UsuarioAuditoria | null;
};

type ResumoLancamentos = {
  total: number;
  pendentes: number;
  aprovados: number;
  reprovados: number;
  enviadosHolerite: number;
  valorPendente: number;
  valorAprovado: number;
};

type Programa = {
  id: number;
  nome: string;
  descricao?: string | null;
  tipo: string;
  abrangencia: string;
  metodoDistribuicao: string;
  status: string;
  valorFundo?: string | number | null;
  percentualFundo?: string | number | null;
  competenciaMes?: number | null;
  competenciaAno?: number | null;
  criadoEm: string;
  criadoPorId?: number | null;
  criadoPor?: {
    id: number;
    nome: string;
    email: string;
  } | null;
  departamento?: {
    id: number;
    nome: string;
  } | null;
  participantes: Participante[];
  lancamentos?: LancamentoRemuneracaoVariavel[];
};

type LinhaPreviaDistribuicao = {
  participanteId: number;
  funcionarioId: number;
  funcionarioNome: string;
  funcionarioCargo?: string | null;
  funcionarioDepartamento?: string | null;
  criterio: string;
  baseCalculo: number;
  percentualAplicado?: number | null;
  pesoAplicado?: number | null;
  diasConsiderados?: number | null;
  valorBruto: number;
  valorPrevisto: number;
  alertas: string[];
};

type PreviaDistribuicao = {
  metodoDistribuicao: string;
  totalParticipantes: number;
  valorFundo: number;
  totalDistribuido: number;
  saldo: number;
  linhas: LinhaPreviaDistribuicao[];
  alertasGerais: string[];
};

function formatarMoeda(
  valor: string | number | null | undefined, locale: string
) {
  return Number(valor || 0).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(valor: string | null | undefined, locale: string) {
  if (!valor) return "-";

  return new Date(valor).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarTexto(valor: string) {
  return valor.replaceAll("_", " ");
}

function normalizarBusca(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function correspondeBusca(
  valores: Array<string | null | undefined>,
  busca: string
) {
  const termos = normalizarBusca(busca)
    .split(/\s+/)
    .filter(Boolean);

  if (termos.length === 0) {
    return true;
  }

  const indice = normalizarBusca(
    valores.filter(Boolean).join(" ")
  );

  return termos.every((termo) => indice.includes(termo));
}

function criarSugestoes(
  valores: Array<string | null | undefined>,
  busca: string
) {
  const sugestoesUnicas = Array.from(
    new Set(
      valores
        .map((valor) => String(valor || "").trim())
        .filter(Boolean)
    )
  );

  const termo = normalizarBusca(busca);

  return sugestoesUnicas
    .filter(
      (sugestao) =>
        !termo ||
        normalizarBusca(sugestao).includes(termo)
    )
    .slice(0, 6);
}

function classeStatusLancamento(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "PENDENTE":
      return "border-amber-500/40 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";

    case "APROVADO":
      return "border-emerald-500/40 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";

    case "REPROVADO":
      return "border-red-500/40 bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";

    case "ENVIADO_HOLERITE":
  return "phanyx-remuneracao-status-enviado border-blue-500/40 bg-blue-500/15 text-blue-700";


    case "PAGO":
      return "border-violet-500/40 bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300";

    case "ESTORNADO":
    case "CANCELADO":
      return "border-slate-500/40 bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-300";

    default:
      return "border-slate-500/40 bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-300";
  }
}

export default function GerenciarRemuneracaoVariavelPage() {
  const t = useTranslations("AdminHRVariablePayDetail");
  const locale = useLocale();
  const enumKeys: Record<string, "statusDraft" | "statusActive" | "statusPending" | "statusApproved" | "statusRejected" | "statusSent" | "statusPaid" | "statusReversed" | "statusCancelled" | "statusCalculating" | "statusClosed" | "scopeAll" | "scopeDepartment" | "scopeSelected" | "methodFixed" | "methodEqual" | "methodSalary" | "methodTime" | "methodPercent" | "methodPoints" | "methodManual"> = {
    RASCUNHO: "statusDraft", ATIVO: "statusActive", PENDENTE: "statusPending",
    APROVADO: "statusApproved", REPROVADO: "statusRejected",
    ENVIADO_HOLERITE: "statusSent", PAGO: "statusPaid", ESTORNADO: "statusReversed",
    CANCELADO: "statusCancelled", EM_APURACAO: "statusCalculating", FECHADO: "statusClosed",
    TODOS_FUNCIONARIOS: "scopeAll", DEPARTAMENTO: "scopeDepartment",
    FUNCIONARIOS_SELECIONADOS: "scopeSelected", VALOR_FIXO_INDIVIDUAL: "methodFixed",
    IGUALITARIO: "methodEqual", PROPORCIONAL_SALARIO: "methodSalary",
    PROPORCIONAL_TEMPO_TRABALHADO: "methodTime", PERCENTUAL_INDIVIDUAL: "methodPercent",
    PONTUACAO: "methodPoints", MANUAL: "methodManual",
  };
  const enumLabel = (value: string) => enumKeys[value]
    ? t(enumKeys[value]) : formatarTexto(value);

  const traduzirMensagemApi = (message: string) => {
    switch (message) {
      case 'Divisão igualitária': return t("apiCriterionEqual");
      case 'Proporcional ao salário-base': return t("apiCriterionSalary");
      case 'Proporcional ao tempo trabalhado': return t("apiCriterionTime");
      case 'Percentual individual': return t("apiCriterionPercent");
      case 'Peso ou pontuação': return t("apiCriterionPoints");
      case 'Valor fixo individual': return t("apiCriterionFixed");
      case 'Definição manual': return t("apiCriterionManual");
      case 'Informe um valor monetário para o fundo antes de gerar os lançamentos.': return t("apiFundRequired");
      case 'O percentual do fundo foi informado, mas ainda é necessário definir o valor monetário apurado.': return t("apiFundPercentMissing");
      case 'Não existem salários-base válidos para calcular a distribuição proporcional.': return t("apiNoSalaries");
      case 'Não existem períodos trabalhados válidos para calcular a distribuição.': return t("apiNoTime");
      case 'A soma dos pesos dos participantes precisa ser maior que zero.': return t("apiNoWeights");
      case 'Salário-base não informado ou igual a zero.': return t("apiSalaryMissing");
      case 'Não foi possível calcular o período trabalhado.': return t("apiTimeMissing");
      case 'Percentual individual não informado.': return t("apiPercentMissing");
      case 'Valor fixo individual não informado.': return t("apiFixedMissing");
      case 'O RH ainda não definiu o valor manual.': return t("apiManualMissing");
      case 'Método de distribuição não reconhecido.': return t("apiMethodUnknown");
      case 'O valor previsto ultrapassa o fundo configurado.': return t("apiOverFund");
      case 'Existe saldo do fundo ainda não distribuído.': return t("apiFundRemaining");
      case 'Funcionário inativo ou desligado.': return t("apiInactive");
      case 'Funcionário em período de experiência.': return t("apiProbation");
      case 'Data de admissão não informada.': return t("apiAdmissionMissing");
    }
    const min = /^Aplicado o valor mínimo individual de R\$ (\d+[.,]\d+)\.$/.exec(message);
    if (min) return t("apiMinApplied", {amount: formatarMoeda(Number(min[1].replace(",", ".")), locale)});
    const max = /^Aplicado o valor máximo individual de R\$ (\d+[.,]\d+)\.$/.exec(message);
    if (max) return t("apiMaxApplied", {amount: formatarMoeda(Number(max[1].replace(",", ".")), locale)});
    const days = /^Possui (\d+) dias desde a admissão; mínimo exigido: (\d+)\.$/.exec(message);
    if (days) return t("apiTooNew", {days: Number(days[1]), minimum: Number(days[2])});
    return message;
  };
  const params = useParams<{ id: string }>();
  const programaId = Number(params.id);

  const [programa, setPrograma] =
    useState<Programa | null>(null);

  const [funcionarios, setFuncionarios] = useState<
    Funcionario[]
  >([]);

  const [selecionados, setSelecionados] = useState<
    number[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [participantesAberto, setParticipantesAberto] =
  useState(true);

const [funcionariosAberto, setFuncionariosAberto] =
  useState(false);

const [buscaParticipantes, setBuscaParticipantes] =
  useState("");

const [buscaFuncionarios, setBuscaFuncionarios] =
  useState("");

  const [previaAberta, setPreviaAberta] =
  useState(true);

const [calculandoPrevia, setCalculandoPrevia] =
  useState(false);

const [previa, setPrevia] =
  useState<PreviaDistribuicao | null>(null);

  const [
  modalAtivacaoAberto,
  setModalAtivacaoAberto,
] = useState(false);

const [ativandoPrograma, setAtivandoPrograma] =
  useState(false);

  const [lancamentosAberto, setLancamentosAberto] =
  useState(true);

const [
  selecionadosLancamentos,
  setSelecionadosLancamentos,
] = useState<number[]>([]);

const [
  resumoLancamentos,
  setResumoLancamentos,
] = useState<ResumoLancamentos>({
  total: 0,
  pendentes: 0,
  aprovados: 0,
  reprovados: 0,
  enviadosHolerite: 0,
  valorPendente: 0,
  valorAprovado: 0,
});

const [
  processandoLancamentos,
  setProcessandoLancamentos,
] = useState(false);

const [
  modalAprovacaoAberto,
  setModalAprovacaoAberto,
] = useState(false);

const [
  modalReprovacaoAberto,
  setModalReprovacaoAberto,
] = useState(false);

const [motivoReprovacao, setMotivoReprovacao] =
  useState("");

  const [
  modalReaberturaAberto,
  setModalReaberturaAberto,
] = useState(false);

const [
  lancamentoReabertura,
  setLancamentoReabertura,
] =
  useState<LancamentoRemuneracaoVariavel | null>(
    null
  );

const [motivoReabertura, setMotivoReabertura] =
  useState("");

const [
  reabrindoLancamento,
  setReabrindoLancamento,
] = useState(false);

  const [
  selecionadosEnvioHolerite,
  setSelecionadosEnvioHolerite,
] = useState<number[]>([]);

const [
  modalEnvioHoleriteAberto,
  setModalEnvioHoleriteAberto,
] = useState(false);

const [enviandoHolerite, setEnviandoHolerite] =
  useState(false);

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `/api/admin/rh/remuneracao-variavel/${programaId}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          (locale === "pt-BR" && dados.error) || t("loadFailed")
        );
      }

      setPrograma(dados.programa);
setFuncionarios(dados.funcionarios || []);

setResumoLancamentos(
  dados.resumoLancamentos || {
    total: 0,
    pendentes: 0,
    aprovados: 0,
    reprovados: 0,
    enviadosHolerite: 0,
    valorPendente: 0,
    valorAprovado: 0,
  }
);
    } catch (error: any) {
      setErro(
        error?.message ||
          t("loadFailed")
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (programaId) {
      carregar();
    }
  }, [programaId, locale]);


  function alternarFuncionario(id: number) {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  async function gerarParticipantes() {
    try {
      setProcessando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        `/api/admin/rh/remuneracao-variavel/${programaId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao: "GERAR_PARTICIPANTES",
            funcionarioIds: selecionados,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          (locale === "pt-BR" && dados.error) || t("participantsFailed")
        );
      }

      setSucesso((locale === "pt-BR" && dados.message) || t("participantsSuccess"));
      setSelecionados([]);
      setPrevia(null);

      await carregar();
    } catch (error: any) {
      setErro(
        error?.message ||
          t("participantsFailed")
      );
    } finally {
      setProcessando(false);
    }
  }

  async function calcularPrevia() {
  try {
    setCalculandoPrevia(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      `/api/admin/rh/remuneracao-variavel/${programaId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "PREVISUALIZAR_DISTRIBUICAO",
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        (locale === "pt-BR" && dados.error) || t("previewFailed")
      );
    }

    setPrevia(dados.previa);
    setPreviaAberta(true);
  } catch (error: any) {
    setErro(
      error?.message ||
        t("previewFailed")
    );
  } finally {
    setCalculandoPrevia(false);
  }
}

async function ativarPrograma() {
  if (!previa) {
    setErro(
      t("previewRequired")
    );
    return;
  }

  try {
    setAtivandoPrograma(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      `/api/admin/rh/remuneracao-variavel/${programaId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao:
            "ATIVAR_E_GERAR_LANCAMENTOS",
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      const detalhes = locale === "pt-BR" && Array.isArray(
        dados.detalhes
      )
        ? ` ${dados.detalhes.join(" ")}`
        : "";

      throw new Error(
        `${
          (locale === "pt-BR" && dados.error) || t("activateFailed")
        }${detalhes}`
      );
    }

    setModalAtivacaoAberto(false);
    setPrevia(null);

    setSucesso(
      (locale === "pt-BR" && dados.message) || t("activateSuccess")
    );

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        t("activateFailed")
    );
  } finally {
    setAtivandoPrograma(false);
  }
}

function alternarLancamento(id: number) {
  setSelecionadosEnvioHolerite([]);

  setSelecionadosLancamentos((atuais) =>
    atuais.includes(id)
      ? atuais.filter((item) => item !== id)
      : [...atuais, id]
  );
}

function alternarTodosLancamentosPendentes() {
  if (!programa) return;
  setSelecionadosEnvioHolerite([]);

  const idsPendentes = (
    programa.lancamentos || []
  )
    .filter(
      (lancamento) =>
        String(lancamento.status).toUpperCase() ===
        "PENDENTE"
    )
    .map((lancamento) => lancamento.id);

  const todosSelecionados =
    idsPendentes.length > 0 &&
    idsPendentes.every((id) =>
      selecionadosLancamentos.includes(id)
    );

  setSelecionadosLancamentos(
    todosSelecionados ? [] : idsPendentes
  );
}

async function processarLancamentos(
  acao:
    | "APROVAR_LANCAMENTOS"
    | "REPROVAR_LANCAMENTOS",
  motivo?: string
) {
  if (selecionadosLancamentos.length === 0) {
    setErro(
      t("selectPending")
    );
    return;
  }

  try {
    setProcessandoLancamentos(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      `/api/admin/rh/remuneracao-variavel/${programaId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao,
          lancamentoIds: selecionadosLancamentos,
          ...(acao === "REPROVAR_LANCAMENTOS"
            ? {
                motivoReprovacao: motivo,
              }
            : {}),
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        (locale === "pt-BR" && dados.error) || t("processFailed")
      );
    }

    setSucesso(
      (locale === "pt-BR" && dados.message) || t("processSuccess")
    );

    setSelecionadosLancamentos([]);
    setSelecionadosEnvioHolerite([]);
    setModalAprovacaoAberto(false);
    setModalReprovacaoAberto(false);
    setMotivoReprovacao("");

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        t("processFailed")
    );
  } finally {
    setProcessandoLancamentos(false);
  }
}

async function aprovarLancamentosSelecionados() {
  await processarLancamentos(
    "APROVAR_LANCAMENTOS"
  );
}

async function reprovarLancamentosSelecionados() {
  const motivo = motivoReprovacao.trim();

  if (motivo.length < 5) {
    setErro(
      t("rejectReasonRequired")
    );
    return;
  }

  await processarLancamentos(
    "REPROVAR_LANCAMENTOS",
    motivo
  );
}

function abrirModalReabertura(
  lancamento: LancamentoRemuneracaoVariavel
) {
  setErro("");
  setSucesso("");
  setLancamentoReabertura(lancamento);
  setMotivoReabertura("");
  setModalReaberturaAberto(true);
}

function fecharModalReabertura() {
  if (reabrindoLancamento) return;

  setModalReaberturaAberto(false);
  setLancamentoReabertura(null);
  setMotivoReabertura("");
}

async function reabrirLancamento() {
  if (!lancamentoReabertura) {
    setErro(
      t("reopenMissing")
    );
    return;
  }

  const motivo = motivoReabertura.trim();

  if (motivo.length < 5) {
    setErro(
      t("reopenReasonRequired")
    );
    return;
  }

  try {
    setReabrindoLancamento(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      `/api/admin/rh/remuneracao-variavel/${programaId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "REABRIR_LANCAMENTO",
          lancamentoId: lancamentoReabertura.id,
          motivoReabertura: motivo,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        (locale === "pt-BR" && dados.error) || t("reopenFailed")
      );
    }

    setSucesso(
      (locale === "pt-BR" && dados.message) || t("reopenSuccess")
    );

    setSelecionadosLancamentos([]);
    setSelecionadosEnvioHolerite([]);
    setModalReaberturaAberto(false);
    setLancamentoReabertura(null);
    setMotivoReabertura("");

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        t("reopenFailed")
    );
  } finally {
    setReabrindoLancamento(false);
  }
}

function alternarLancamentoEnvioHolerite(id: number) {
  setSelecionadosLancamentos([]);

  setSelecionadosEnvioHolerite((atuais) =>
    atuais.includes(id)
      ? atuais.filter((item) => item !== id)
      : [...atuais, id]
  );
}

function alternarTodosLancamentosAprovados() {
  if (!programa) return;

  setSelecionadosLancamentos([]);

  const idsAprovados = (
    programa.lancamentos || []
  )
    .filter(
      (lancamento) =>
        String(lancamento.status).toUpperCase() ===
        "APROVADO"
    )
    .map((lancamento) => lancamento.id);

  const todosSelecionados =
    idsAprovados.length > 0 &&
    idsAprovados.every((id) =>
      selecionadosEnvioHolerite.includes(id)
    );

  setSelecionadosEnvioHolerite(
    todosSelecionados ? [] : idsAprovados
  );
}

async function enviarAprovadosAoHolerite() {
  if (selecionadosEnvioHolerite.length === 0) {
    setErro(
      t("selectApproved")
    );
    return;
  }

  try {
    setEnviandoHolerite(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      "/api/admin/rh/holerites",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "ENVIAR_REMUNERACAO_VARIAVEL",
          programaId,
          lancamentoIds:
            selecionadosEnvioHolerite,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        (locale === "pt-BR" && dados.error) || t("sendFailed")
      );
    }

    setSucesso(
      (locale === "pt-BR" && dados.message) || t("sendSuccess")
    );

    setSelecionadosEnvioHolerite([]);
    setSelecionadosLancamentos([]);
    setModalEnvioHoleriteAberto(false);

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        t("sendFailed")
    );
  } finally {
    setEnviandoHolerite(false);
  }
}

  if (carregando) {
    return (
      <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen text-slate-900 dark:text-slate-100 p-6">
        <p>{t("loading")}</p>
      </main>
    );
  }

  if (!programa) {
    return (
      <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen text-slate-900 dark:text-slate-100 p-6">
        <p>{erro || t("notFound")}</p>
      </main>
    );
  }

  const exigeSelecao =
    programa.abrangencia ===
    "FUNCIONARIOS_SELECIONADOS";

    const statusPrograma = String(programa.status || "")
  .trim()
  .toUpperCase();

const programaEmRascunho =
  statusPrograma === "RASCUNHO";

  const programaAtivo =
  statusPrograma === "ATIVO";

const lancamentos =
  programa.lancamentos || [];

const lancamentosPendentes =
  lancamentos.filter(
    (lancamento) =>
      String(lancamento.status).toUpperCase() ===
      "PENDENTE"
  );

const todosPendentesSelecionados =
  lancamentosPendentes.length > 0 &&
  lancamentosPendentes.every((lancamento) =>
    selecionadosLancamentos.includes(
      lancamento.id
    )
  );

const lancamentosSelecionados =
  lancamentosPendentes.filter((lancamento) =>
    selecionadosLancamentos.includes(
      lancamento.id
    )
  );

const valorLancamentosSelecionados =
  lancamentosSelecionados.reduce(
    (total, lancamento) =>
      total +
      Number(
        lancamento.valorAprovado ??
          lancamento.valorCalculado ??
          0
      ),
    0
  );

  const lancamentosAprovados =
  lancamentos.filter(
    (lancamento) =>
      String(lancamento.status).toUpperCase() ===
      "APROVADO"
  );

const todosAprovadosSelecionados =
  lancamentosAprovados.length > 0 &&
  lancamentosAprovados.every((lancamento) =>
    selecionadosEnvioHolerite.includes(
      lancamento.id
    )
  );

const lancamentosSelecionadosEnvio =
  lancamentosAprovados.filter((lancamento) =>
    selecionadosEnvioHolerite.includes(
      lancamento.id
    )
  );

const valorSelecionadoEnvioHolerite =
  lancamentosSelecionadosEnvio.reduce(
    (total, lancamento) =>
      total +
      Number(
        lancamento.valorAprovado ??
          lancamento.valorCalculado ??
          0
      ),
    0
  );

    const participantesFiltrados =
  programa.participantes.filter((participante) =>
    correspondeBusca(
      [
        participante.funcionarioNomeSnapshot,
        participante.funcionarioCargoSnapshot,
        participante.funcionarioDepartamentoSnapshot,
        participante.funcionarioCargoSnapshot
          ? `${t("jobTitle")} ${participante.funcionarioCargoSnapshot}`
          : null,
        participante.funcionarioDepartamentoSnapshot
          ? `${t("department")} ${participante.funcionarioDepartamentoSnapshot}`
          : t("noDepartment"),
      ],
      buscaParticipantes
    )
  );

const participantesExibidos =
  participantesFiltrados.slice(0, 30);

const funcionariosFiltrados = funcionarios.filter(
  (funcionario) =>
    correspondeBusca(
      [
        funcionario.nome,
        funcionario.cargo,
        funcionario.departamento?.nome,
        funcionario.cargo
          ? `${t("jobTitle")} ${funcionario.cargo}`
          : t("noJobTitle"),
        funcionario.departamento?.nome
          ? `${t("department")} ${funcionario.departamento.nome}`
          : t("noDepartment"),
        funcionario.jaParticipa
          ? t("alreadyIncluded")
          : t("notIncluded"),
        funcionario.elegivel
          ? t("eligible")
          : t("ineligible"),
      ],
      buscaFuncionarios
    )
);

const funcionariosExibidos =
  funcionariosFiltrados.slice(0, 30);

const sugestoesParticipantes = criarSugestoes(
  [
    ...programa.participantes.map(
      (participante) =>
        participante.funcionarioNomeSnapshot
    ),
    ...programa.participantes.map((participante) =>
      participante.funcionarioCargoSnapshot
        ? t("jobPrefix", {value: participante.funcionarioCargoSnapshot})
        : null
    ),
    ...programa.participantes.map((participante) =>
      participante.funcionarioDepartamentoSnapshot
        ? t("departmentPrefix", {value: participante.funcionarioDepartamentoSnapshot})
        : t("noDepartment")
    ),
  ],
  buscaParticipantes
);

const sugestoesFuncionarios = criarSugestoes(
  [
    t("alreadyIncluded"),
    t("notIncluded"),
    t("eligible"),
    t("ineligible"),
    t("noDepartment"),
    ...funcionarios.map(
      (funcionario) => funcionario.nome
    ),
    ...funcionarios.map((funcionario) =>
      funcionario.cargo
        ? t("jobPrefix", {value: funcionario.cargo})
        : null
    ),
    ...funcionarios.map((funcionario) =>
      funcionario.departamento?.nome
        ? t("departmentPrefix", {value: funcionario.departamento.nome})
        : null
    ),
  ],
  buscaFuncionarios
);

  return (
    <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen text-slate-900 dark:text-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/rh/remuneracao-variavel"
              className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300"
            >{t("back")}</Link>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">{t("programManagement")}</p>

            <h1 className="mt-2 text-3xl font-black">
              {programa.nome}
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {programa.descricao ||
                t("noDescription")}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-amber-500/50 bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
            {enumLabel(programa.status)}
          </span>
        </header>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("scope")}</p>
            <p className="mt-3 font-black">
              {enumLabel(programa.abrangencia)}
            </p>
            {programa.departamento?.nome && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {programa.departamento.nome}
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("method")}</p>
            <p className="mt-3 font-black">
              {enumLabel(programa.metodoDistribuicao)}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("fund")}</p>
            <p className="mt-3 text-xl font-black">
              {programa.valorFundo
                ? formatarMoeda(programa.valorFundo, locale)
                : programa.percentualFundo
                  ? `${programa.percentualFundo}%`
                  : "-"}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("audit")}</p>
            <p className="mt-3 font-black">
              {programa.criadoPor?.nome ||
                programa.criadoPor?.email ||
                t("userId", {id: programa.criadoPorId ?? "-"})}
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {t("createdAt", {date: formatarDataHora(programa.criadoEm, locale)})}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <button
      type="button"
      aria-expanded={participantesAberto}
      onClick={() =>
        setParticipantesAberto((atual) => !atual)
      }
      className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-lg font-black">{t("participants")}</h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("participantsCount", {count: programa.participantes.length})}
        </p>
      </div>

      <span className="text-2xl font-black">
        {participantesAberto ? "▴" : "▾"}
      </span>
    </button>

    <button
      type="button"
      disabled={
        processando ||
        !programaEmRascunho ||
        (exigeSelecao && selecionados.length === 0)
      }
      onClick={gerarParticipantes}
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {processando
        ? t("including")
        : exigeSelecao
          ? t("includeSelected", {count: selecionados.length})
          : programa.participantes.length > 0
  ? t("updateEligible")
  : t("generateEligible")}
    </button>
  </div>

  {participantesAberto && (
    <>
      <div className="mt-5">
        <input
          type="search"
          value={buscaParticipantes}
          onChange={(event) =>
            setBuscaParticipantes(event.target.value)
          }
          placeholder={t("searchByWords")}
          className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
        />

        {sugestoesParticipantes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {sugestoesParticipantes.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                onClick={() =>
                  setBuscaParticipantes(sugestao)
                }
                className="phanyx-remuneracao-sugestao rounded-full border px-3 py-1 text-xs font-semibold transition"
              >
                {sugestao}
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          {t("showingResults", {shown: participantesExibidos.length, total: participantesFiltrados.length})}
          {participantesFiltrados.length > 30 &&
            t("refineParticipants")}
        </p>
      </div>

      {programa.participantes.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-400">{t("noParticipants")}</div>
      ) : participantesFiltrados.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-400">{t("noParticipantMatch")}</div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950/70 text-left text-xs uppercase text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">{t("employee")}</th>
                <th className="p-3">{t("jobTitle")}</th>
                <th className="p-3">{t("department")}</th>
              </tr>
            </thead>

            <tbody>
              {participantesExibidos.map(
                (participante) => (
                  <tr
                    key={participante.id}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="p-3 font-bold">
                      {
                        participante.funcionarioNomeSnapshot
                      }
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {participante.funcionarioCargoSnapshot ||
                        "-"}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {participante.funcionarioDepartamentoSnapshot ||
                        "-"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

      )}
    </>
  )}
</section>

<section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <button
      type="button"
      aria-expanded={previaAberta}
      onClick={() =>
        setPreviaAberta((atual) => !atual)
      }
      className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-lg font-black">{t("preview")}</h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("previewDescription")}
        </p>
      </div>

      <span className="text-2xl font-black">
        {previaAberta ? "▴" : "▾"}
      </span>
    </button>

    <button
      type="button"
      disabled={
        calculandoPrevia ||
        programa.participantes.length === 0
      }
      onClick={calcularPrevia}
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {calculandoPrevia
        ? t("calculating")
        : previa
          ? t("recalculate")
          : t("calculate")}
    </button>
  </div>

  {previaAberta && (
    <>
      {!previa ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-400">{t("previewHint")}</div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("participants")}</p>

              <p className="mt-2 text-2xl font-black">
                {previa.totalParticipantes}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("fund")}</p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(previa.valorFundo, locale)}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("totalDistributed")}</p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(
                  previa.totalDistribuido, locale)}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("balance")}</p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(previa.saldo, locale)}
              </p>
            </article>
          </div>

          {previa.alertasGerais.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-black">{t("alerts")}</p>

              <div className="mt-2 space-y-1 text-sm">
                {previa.alertasGerais.map(
                  (alerta) => (
                    <p key={alerta}>• {traduzirMensagemApi(alerta)}</p>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-950/70 text-left text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">{t("employee")}</th>
                  <th className="p-3">{t("criterion")}</th>
                  <th className="p-3">{t("expectedAmount")}</th>
                  <th className="p-3">{t("notes")}</th>
                </tr>
              </thead>

              <tbody>
  {previa.linhas.map((linha) => (
    <tr
      key={linha.participanteId}
      className="border-t border-slate-200 dark:border-slate-800"
    >
      <td className="p-3">
        <p className="font-black">
          {linha.funcionarioNome}
        </p>

        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {linha.funcionarioCargo || t("noJobTitle")}
          {" • "}
          {linha.funcionarioDepartamento || t("noDepartment")}
        </p>
      </td>

      <td className="p-3">
        {traduzirMensagemApi(linha.criterio)}
      </td>

      <td className="p-3 text-base font-black">
        {formatarMoeda(linha.valorPrevisto, locale)}
      </td>

      <td className="p-3">
        {linha.alertas.length === 0 ? (
          <span className="text-emerald-700 dark:text-emerald-400">{t("validCalculation")}</span>
        ) : (
          <div className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
            {linha.alertas.map((alerta) => (
              <p key={alerta}>• {traduzirMensagemApi(alerta)}</p>
            ))}
          </div>
        )}
      </td>
    </tr>
  ))}
</tbody>
</table>
</div>

{programaEmRascunho && (
  <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-300 dark:border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-black">{t("activation")}</p>

      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t("activationSummary", {count: previa.totalParticipantes, amount: formatarMoeda(previa.totalDistribuido, locale)})}
      </p>

      {previa.saldo > 0 && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          {t("remainingBalance", {amount: formatarMoeda(previa.saldo, locale)})}
        </p>
      )}
    </div>

    <button
      type="button"
      disabled={
        previa.totalParticipantes === 0 ||
        previa.totalDistribuido <= 0 ||
        previa.saldo < -0.009
      }
      onClick={() => setModalAtivacaoAberto(true)}
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >{t("activateAndGenerate")}</button>
  </div>
)}

        </>
      )}
    </>
  )}
</section>

<section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <button
      type="button"
      aria-expanded={lancamentosAberto}
      onClick={() =>
        setLancamentosAberto((atual) => !atual)
      }
      className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-lg font-black">{t("entriesApproval")}</h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("entriesCount", {count: resumoLancamentos.total, pending: resumoLancamentos.pendentes})}
        </p>
      </div>

      <span className="text-2xl font-black">
        {lancamentosAberto ? "▴" : "▾"}
      </span>
    </button>
  </div>

  {lancamentosAberto && (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("pendingPlural")}</p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.pendentes}
          </p>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {formatarMoeda(
              resumoLancamentos.valorPendente, locale)}
          </p>
        </article>

        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("approvedPlural")}</p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.aprovados}
          </p>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {formatarMoeda(
              resumoLancamentos.valorAprovado, locale)}
          </p>
        </article>

        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("rejectedPlural")}</p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.reprovados}
          </p>
        </article>

        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("sentPlural")}</p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.enviadosHolerite}
          </p>
        </article>
      </div>

      {lancamentos.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-400">{t("noEntries")}</div>
      ) : (
        <>
          {programaAtivo &&
            resumoLancamentos.pendentes > 0 && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-black">{t("approval")}</p>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t("selectedSummary", {count: selecionadosLancamentos.length, amount: formatarMoeda(valorLancamentosSelecionados, locale)})}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      processandoLancamentos ||
                      selecionadosLancamentos.length === 0
                    }
                    onClick={() =>
                      setModalReprovacaoAberto(true)
                    }
                    className="phanyx-remuneracao-botao-reprovar rounded-xl border px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed"
                  >{t("rejectSelected")}</button>

                  <button
                    type="button"
                    disabled={
                      processandoLancamentos ||
                      selecionadosLancamentos.length === 0
                    }
                    onClick={() =>
                      setModalAprovacaoAberto(true)
                    }
                    className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >{t("approveSelected")}</button>
                </div>
              </div>
            )}

            {programaAtivo &&
  resumoLancamentos.aprovados > 0 && (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-500/50 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="font-black">{t("payrollSend")}</p>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("approvedSelectedSummary", {count: selecionadosEnvioHolerite.length, amount: formatarMoeda(valorSelecionadoEnvioHolerite, locale)})}
        </p>

        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {t("payrollAmountHint")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            enviandoHolerite ||
            lancamentosAprovados.length === 0
          }
          onClick={
            alternarTodosLancamentosAprovados
          }
          className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {todosAprovadosSelecionados
            ? t("clearSelection")
            : t("selectAllApproved")}
        </button>

        <button
          type="button"
          disabled={
            enviandoHolerite ||
            selecionadosEnvioHolerite.length === 0
          }
          onClick={() =>
            setModalEnvioHoleriteAberto(true)
          }
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >{t("sendSelected")}</button>
      </div>
    </div>
  )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-950/70 text-left text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      aria-label={t("selectAllPending")}
                      checked={
                        todosPendentesSelecionados
                      }
                      disabled={
                        lancamentosPendentes.length === 0 ||
                        processandoLancamentos
                      }
                      onChange={
                        alternarTodosLancamentosPendentes
                      }
                    />
                  </th>

                  <th className="p-3">{t("employee")}</th>

                  <th className="p-3">{t("period")}</th>

                  <th className="p-3">{t("amount")}</th>

                  <th className="p-3">{t("status")}</th>

                  <th className="p-3">{t("audit")}</th>
                </tr>
              </thead>

              <tbody>
                {lancamentos.map((lancamento) => {
                  const statusLancamento = String(
  lancamento.status || ""
).toUpperCase();

const pendente =
  statusLancamento === "PENDENTE";

const aprovado =
  statusLancamento === "APROVADO";

let usuarioAuditoria:
  | UsuarioAuditoria
  | null
  | undefined = lancamento.criadoPor;

let dataAuditoria:
  | string
  | null
  | undefined = lancamento.calculadoEm;

let rotuloUsuarioAuditoria = t("generatedBy");
let rotuloDataAuditoria = t("generatedAt");

switch (statusLancamento) {
  case "APROVADO":
    usuarioAuditoria = lancamento.aprovadoPor;
    dataAuditoria = lancamento.aprovadoEm;
    rotuloUsuarioAuditoria = t("approvedBy");
    rotuloDataAuditoria = t("approvedAt");
    break;

  case "REPROVADO":
    usuarioAuditoria = lancamento.reprovadoPor;
    dataAuditoria = lancamento.reprovadoEm;
    rotuloUsuarioAuditoria = t("rejectedBy");
    rotuloDataAuditoria = t("rejectedAt");
    break;

  case "ENVIADO_HOLERITE":
    usuarioAuditoria =
      lancamento.enviadoHoleritePor;
    dataAuditoria =
      lancamento.enviadoHoleriteEm;
    rotuloUsuarioAuditoria = t("sentBy");
    rotuloDataAuditoria = t("sentAt");
    break;

  case "PAGO":
    usuarioAuditoria =
      lancamento.enviadoHoleritePor;
    dataAuditoria =
      lancamento.pagoEm ||
      lancamento.enviadoHoleriteEm;
    rotuloUsuarioAuditoria =
      t("registeredBy");
    rotuloDataAuditoria = lancamento.pagoEm
      ? t("paidAt")
      : t("sentAt");
    break;

  case "ESTORNADO":
    usuarioAuditoria = lancamento.estornadoPor;
    dataAuditoria = lancamento.estornadoEm;
    rotuloUsuarioAuditoria = t("reversedBy");
    rotuloDataAuditoria = t("reversedAt");
    break;
}

                  return (
                    <tr
                      key={lancamento.id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="p-3">
                        <input
  type="checkbox"
  aria-label={
    pendente
      ? t("selectForApproval", {name: lancamento.funcionarioNomeSnapshot})
      : t("selectForPayroll", {name: lancamento.funcionarioNomeSnapshot})
  }
  disabled={
    (!pendente && !aprovado) ||
    processandoLancamentos ||
    enviandoHolerite
  }
  checked={
    pendente
      ? selecionadosLancamentos.includes(
          lancamento.id
        )
      : aprovado
        ? selecionadosEnvioHolerite.includes(
            lancamento.id
          )
        : false
  }
  onChange={() => {
    if (pendente) {
      alternarLancamento(lancamento.id);
      return;
    }

    if (aprovado) {
      alternarLancamentoEnvioHolerite(
        lancamento.id
      );
    }
  }}
/>
                      </td>

                      <td className="p-3">
                        <p className="font-black">
                          {
                            lancamento.funcionarioNomeSnapshot
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {lancamento.funcionarioCargoSnapshot ||
                            t("noJobTitle")}
                          {" • "}
                          {lancamento.funcionarioDepartamentoSnapshot ||
                            t("noDepartment")}
                        </p>
                      </td>

                      <td className="p-3">
                        {String(
                          lancamento.competenciaMes
                        ).padStart(2, "0")}
                        /{lancamento.competenciaAno}
                      </td>

                      <td className="p-3 text-base font-black">
                        {formatarMoeda(
                          lancamento.valorAprovado ??
                            lancamento.valorCalculado, locale)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classeStatusLancamento(
                            lancamento.status
                          )}`}
                        >
                          {enumLabel(lancamento.status)}
                        </span>
                      </td>

                      <td className="p-3">
  <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
    {rotuloUsuarioAuditoria}
  </p>

  <p className="mt-1 font-semibold">
    {usuarioAuditoria?.nome ||
      usuarioAuditoria?.email ||
      (statusLancamento ===
      "ENVIADO_HOLERITE"
        ? t("sentUserUnknown")
        : t("awaitingReview"))}
  </p>

  {usuarioAuditoria?.id && (
    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
      {t("userIdLabel", {id: usuarioAuditoria.id})}
    </p>
  )}

  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
    {rotuloDataAuditoria}:{" "}
    {formatarDataHora(dataAuditoria, locale)}
  </p>

  {lancamento.motivoReprovacao && (
    <p className="mt-2 text-xs text-red-700 dark:text-red-400">
      {t("reasonLabel")}{" "}
      {lancamento.motivoReprovacao}
    </p>
  )}
  {programaAtivo &&
  statusLancamento === "REPROVADO" && (
    <button
      type="button"
      disabled={reabrindoLancamento}
      onClick={() =>
        abrirModalReabertura(lancamento)
      }
      className="mt-3 rounded-xl border border-amber-500 px-3 py-2 text-xs font-black transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >{t("reopenReview")}</button>
  )}
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )}
</section>

        <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
  <button
    type="button"
    aria-expanded={funcionariosAberto}
    onClick={() =>
      setFuncionariosAberto((atual) => !atual)
    }
    className="flex w-full items-center justify-between gap-4 text-left"
  >
    <div>
      <h2 className="text-lg font-black">{t("availableEmployees")}</h2>

      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t("availableHint")}
      </p>
    </div>

    <span className="text-2xl font-black">
      {funcionariosAberto ? "▴" : "▾"}
    </span>
  </button>

  {funcionariosAberto && (
    <>
      <div className="mt-5">
        <input
          type="search"
          value={buscaFuncionarios}
          onChange={(event) =>
            setBuscaFuncionarios(event.target.value)
          }
          placeholder={t("searchEmployees")}
          className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
        />

        <div className="mt-2 flex flex-wrap gap-2">
          {sugestoesFuncionarios.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() =>
                setBuscaFuncionarios(sugestao)
              }
              className="phanyx-remuneracao-sugestao rounded-full border px-3 py-1 text-xs font-semibold transition"
            >
              {sugestao}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          {t("showingResults", {shown: funcionariosExibidos.length, total: funcionariosFiltrados.length})}
          {funcionariosFiltrados.length > 30 &&
            t("refineEmployees")}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {funcionariosExibidos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-400">{t("noEmployeeMatch")}</p>
        ) : (
          funcionariosExibidos.map((funcionario) => (
            <label
              key={funcionario.id}
              className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4"
            >
              {exigeSelecao && (
                <input
                  type="checkbox"
                  disabled={
                    !funcionario.elegivel ||
                    funcionario.jaParticipa
                  }
                  checked={selecionados.includes(
                    funcionario.id
                  )}
                  onChange={() =>
                    alternarFuncionario(funcionario.id)
                  }
                  className="mt-1"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">
                    {funcionario.nome}
                  </p>

                  {funcionario.jaParticipa && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{t("alreadyIncluded")}</span>
                  )}

                  {!funcionario.elegivel && (
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-700 dark:text-red-300">{t("ineligible")}</span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {funcionario.cargo ||
                    t("noJobTitle")}
                  {" • "}
                  {funcionario.departamento?.nome ||
                    t("noDepartment")}
                  {" • "}
                  {formatarMoeda(
                    funcionario.salarioBase, locale)}
                </p>

                {funcionario.motivosInelegibilidade
                  .length > 0 && (
                  <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                    {funcionario.motivosInelegibilidade.map(
                      (motivo) => (
                        <p key={motivo}>• {traduzirMensagemApi(motivo)}</p>
                      )
                    )}
                  </div>
                )}
              </div>
            </label>
          ))
        )}
      </div>
    </>
  )}
</section>
      </div>

      {modalReaberturaAberto &&
  lancamentoReabertura && (
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-reabertura"
    >
      <button
        type="button"
        aria-label={t("closeReopen")}
        onClick={fecharModalReabertura}
        className="absolute inset-0 bg-black/70"
      />

      <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">{t("auditCorrection")}</p>

        <h2
          id="titulo-modal-reabertura"
          className="mt-2 text-2xl font-black"
        >{t("reopenQuestion")}</h2>

        <p className="mt-4 text-sm">
          {t("reopenIntro", {name: lancamentoReabertura.funcionarioNomeSnapshot})}
        </p>

        <div className="mt-5 rounded-2xl border p-4 text-sm">
          <p>
            <strong>{t("period")}:</strong>{" "}
            {String(
              lancamentoReabertura.competenciaMes
            ).padStart(2, "0")}
            /{lancamentoReabertura.competenciaAno}
          </p>

          <p className="mt-2">
            <strong>{t("amount")}:</strong>{" "}
            {formatarMoeda(
              lancamentoReabertura.valorAprovado ??
                lancamentoReabertura.valorCalculado, locale)}
          </p>

          <p className="mt-2">
            <strong>{t("previousRejection")}</strong>{" "}
            {lancamentoReabertura.motivoReprovacao ||
              t("notProvided")}
          </p>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-black">{t("reopenReason")}</span>

          <textarea
            value={motivoReabertura}
            onChange={(event) =>
              setMotivoReabertura(
                event.target.value
              )
            }
            placeholder={t("reopenPlaceholder")}
            rows={4}
            disabled={reabrindoLancamento}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:opacity-60"
          />
        </label>

        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          {t("reopenAuditHint")}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={reabrindoLancamento}
            onClick={fecharModalReabertura}
            className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >{t("cancel")}</button>

          <button
            type="button"
            disabled={
              reabrindoLancamento ||
              motivoReabertura.trim().length < 5
            }
            onClick={reabrirLancamento}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reabrindoLancamento
              ? t("reopening")
              : t("confirmReopen")}
          </button>
        </div>
      </div>
    </div>
  )}

      {modalEnvioHoleriteAberto && (
  <div
    className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-modal-envio-holerite"
  >
    <button
      type="button"
      aria-label={t("closeSend")}
      onClick={() =>
        !enviandoHolerite &&
        setModalEnvioHoleriteAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">{t("payrollIntegration")}</p>

      <h2
        id="titulo-modal-envio-holerite"
        className="mt-2 text-2xl font-black"
      >{t("sendQuestion")}</h2>

      <p className="mt-4 text-sm">
        {t("sendModalSummary", {count: selecionadosEnvioHolerite.length, amount: formatarMoeda(valorSelecionadoEnvioHolerite, locale)})}
      </p>

      <div className="mt-5 rounded-2xl border p-4 text-sm">
        <p className="font-black">{t("whatHappens")}</p>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t("payslipCreateHint")}
        </p>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t("earningsHint")}
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={enviandoHolerite}
          onClick={() =>
            setModalEnvioHoleriteAberto(false)
          }
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >{t("cancel")}</button>

        <button
          type="button"
          disabled={enviandoHolerite}
          onClick={enviarAprovadosAoHolerite}
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviandoHolerite
            ? t("sending")
            : t("confirmSend")}
        </button>
      </div>
    </div>
  </div>
)}

{modalAprovacaoAberto && (
  <div
    className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-modal-aprovacao"
  >
    <button
      type="button"
      aria-label={t("closeConfirm")}
      onClick={() =>
        !processandoLancamentos &&
        setModalAprovacaoAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <h2
        id="titulo-modal-aprovacao"
        className="text-2xl font-black"
      >{t("approveQuestion")}</h2>

      <p className="mt-4 text-sm">
        {t("approveModalSummary", {count: selecionadosLancamentos.length, amount: formatarMoeda(valorLancamentosSelecionados, locale)})}
      </p>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        {t("approveHint")}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={processandoLancamentos}
          onClick={() =>
            setModalAprovacaoAberto(false)
          }
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >{t("cancel")}</button>

        <button
          type="button"
          disabled={processandoLancamentos}
          onClick={
            aprovarLancamentosSelecionados
          }
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processandoLancamentos
            ? t("approving")
            : t("confirmApprove")}
        </button>
      </div>
    </div>
  </div>
)}

{modalReprovacaoAberto && (
  <div
    className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-modal-reprovacao"
  >
    <button
      type="button"
      aria-label={t("closeReject")}
      onClick={() =>
        !processandoLancamentos &&
        setModalReprovacaoAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <h2
        id="titulo-modal-reprovacao"
        className="text-2xl font-black"
      >{t("rejectQuestion")}</h2>

      <p className="mt-4 text-sm">
        {t("rejectModalSummary", {count: selecionadosLancamentos.length, amount: formatarMoeda(valorLancamentosSelecionados, locale)})}
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-black">{t("rejectionReason")}</span>

        <textarea
          value={motivoReprovacao}
          onChange={(event) =>
            setMotivoReprovacao(
              event.target.value
            )
          }
          placeholder={t("rejectPlaceholder")}
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
        />
      </label>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={processandoLancamentos}
          onClick={() => {
            setModalReprovacaoAberto(false);
            setMotivoReprovacao("");
          }}
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >{t("cancel")}</button>

        <button
          type="button"
          disabled={
            processandoLancamentos ||
            motivoReprovacao.trim().length < 5
          }
          onClick={
            reprovarLancamentosSelecionados
          }
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processandoLancamentos
            ? t("rejecting")
            : t("confirmReject")}
        </button>
      </div>
    </div>
  </div>
)}

      {modalAtivacaoAberto && previa && (
  <div
    className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-modal-ativacao"
  >
    <button
      type="button"
      aria-label={t("closeConfirm")}
      onClick={() =>
        !ativandoPrograma &&
        setModalAtivacaoAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">{t("confirmation")}</p>

          <h2
            id="titulo-modal-ativacao"
            className="mt-2 text-2xl font-black"
          >{t("activateQuestion")}</h2>
        </div>

        <button
          type="button"
          aria-label={t("close")}
          disabled={ativandoPrograma}
          onClick={() =>
            setModalAtivacaoAberto(false)
          }
          className="rounded-full border px-3 py-1 text-lg font-black disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <p className="mt-4 text-sm">
        {t("activateModalSummary", {count: previa.totalParticipantes, amount: formatarMoeda(previa.totalDistribuido, locale)})}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-bold uppercase">{t("participants")}</p>

          <p className="mt-2 text-2xl font-black">
            {previa.totalParticipantes}
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="text-xs font-bold uppercase">{t("total")}</p>

          <p className="mt-2 text-2xl font-black">
            {formatarMoeda(
              previa.totalDistribuido, locale)}
          </p>
        </div>
      </div>

      {previa.saldo > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          {t("undistributedBalance", {amount: formatarMoeda(previa.saldo, locale)})}
        </div>
      )}

      <p className="mt-5 text-sm">
        {t("afterActivation")}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={ativandoPrograma}
          onClick={() =>
            setModalAtivacaoAberto(false)
          }
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >{t("cancel")}</button>

        <button
          type="button"
          disabled={ativandoPrograma}
          onClick={ativarPrograma}
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ativandoPrograma
            ? t("activating")
            : t("activateGenerate")}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}
