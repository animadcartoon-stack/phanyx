"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  valor?: string | number | null
) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";

  return new Date(valor).toLocaleString("pt-BR", {
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
      return "border-amber-500/40 bg-amber-500/15 text-amber-700";

    case "APROVADO":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700";

    case "REPROVADO":
      return "border-red-500/40 bg-red-500/15 text-red-700";

    case "ENVIADO_HOLERITE":
  return "phanyx-remuneracao-status-enviado border-blue-500/40 bg-blue-500/15 text-blue-700";
      

    case "PAGO":
      return "border-violet-500/40 bg-violet-500/15 text-violet-700";

    case "ESTORNADO":
    case "CANCELADO":
      return "border-slate-500/40 bg-slate-500/15 text-slate-700";

    default:
      return "border-slate-500/40 bg-slate-500/15 text-slate-700";
  }
}

export default function GerenciarRemuneracaoVariavelPage() {
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
          dados.error ||
            "Não foi possível carregar o programa."
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
          "Erro ao carregar o programa."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (programaId) {
      carregar();
    }
  }, [programaId]);

 
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
          dados.error ||
            "Não foi possível incluir os participantes."
        );
      }

      setSucesso(dados.message);
      setSelecionados([]);
      setPrevia(null);

      await carregar();
    } catch (error: any) {
      setErro(
        error?.message ||
          "Erro ao incluir os participantes."
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
        dados.error ||
          "Não foi possível calcular a distribuição."
      );
    }

    setPrevia(dados.previa);
    setPreviaAberta(true);
  } catch (error: any) {
    setErro(
      error?.message ||
        "Erro ao calcular a distribuição."
    );
  } finally {
    setCalculandoPrevia(false);
  }
}

async function ativarPrograma() {
  if (!previa) {
    setErro(
      "Calcule a prévia antes de ativar o programa."
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
      const detalhes = Array.isArray(
        dados.detalhes
      )
        ? ` ${dados.detalhes.join(" ")}`
        : "";

      throw new Error(
        `${
          dados.error ||
          "Não foi possível ativar o programa."
        }${detalhes}`
      );
    }

    setModalAtivacaoAberto(false);
    setPrevia(null);

    setSucesso(
      dados.message ||
        "Programa ativado e lançamentos gerados."
    );

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        "Erro ao ativar o programa."
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
      "Selecione pelo menos um lançamento pendente."
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
        dados.error ||
          "Não foi possível processar os lançamentos."
      );
    }

    setSucesso(
      dados.message ||
        "Lançamentos processados com sucesso."
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
        "Erro ao processar os lançamentos."
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
      "Informe o motivo da reprovação com pelo menos 5 caracteres."
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
      "O lançamento para reabertura não foi identificado."
    );
    return;
  }

  const motivo = motivoReabertura.trim();

  if (motivo.length < 5) {
    setErro(
      "Informe o motivo da reabertura com pelo menos 5 caracteres."
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
        dados.error ||
          "Não foi possível reabrir o lançamento."
      );
    }

    setSucesso(
      dados.message ||
        "Lançamento reaberto e devolvido para análise."
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
        "Erro ao reabrir o lançamento."
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
      "Selecione pelo menos um lançamento aprovado."
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
        dados.error ||
          "Não foi possível enviar os lançamentos ao holerite."
      );
    }

    setSucesso(
      dados.message ||
        "Lançamentos enviados ao holerite."
    );

    setSelecionadosEnvioHolerite([]);
    setSelecionadosLancamentos([]);
    setModalEnvioHoleriteAberto(false);

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        "Erro ao enviar os lançamentos ao holerite."
    );
  } finally {
    setEnviandoHolerite(false);
  }
}

  if (carregando) {
    return (
      <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-6">
        <p>Carregando programa...</p>
      </main>
    );
  }

  if (!programa) {
    return (
      <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-6">
        <p>{erro || "Programa não encontrado."}</p>
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
          ? `cargo ${participante.funcionarioCargoSnapshot}`
          : null,
        participante.funcionarioDepartamentoSnapshot
          ? `departamento ${participante.funcionarioDepartamentoSnapshot}`
          : "sem departamento",
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
          ? `cargo ${funcionario.cargo}`
          : "cargo não informado",
        funcionario.departamento?.nome
          ? `departamento ${funcionario.departamento.nome}`
          : "sem departamento",
        funcionario.jaParticipa
          ? "já incluído já incluídos participante"
          : "não incluído não incluídos disponível",
        funcionario.elegivel
          ? "elegível elegíveis apto"
          : "inelegível inelegíveis inapto",
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
        ? `Cargo: ${participante.funcionarioCargoSnapshot}`
        : null
    ),
    ...programa.participantes.map((participante) =>
      participante.funcionarioDepartamentoSnapshot
        ? `Departamento: ${participante.funcionarioDepartamentoSnapshot}`
        : "Sem departamento"
    ),
  ],
  buscaParticipantes
);

const sugestoesFuncionarios = criarSugestoes(
  [
    "Já incluídos",
    "Não incluídos",
    "Elegíveis",
    "Inelegíveis",
    "Sem departamento",
    ...funcionarios.map(
      (funcionario) => funcionario.nome
    ),
    ...funcionarios.map((funcionario) =>
      funcionario.cargo
        ? `Cargo: ${funcionario.cargo}`
        : null
    ),
    ...funcionarios.map((funcionario) =>
      funcionario.departamento?.nome
        ? `Departamento: ${funcionario.departamento.nome}`
        : null
    ),
  ],
  buscaFuncionarios
);

  return (
    <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/rh/remuneracao-variavel"
              className="text-sm font-bold text-blue-400 hover:underline"
            >
              ← Voltar para Remuneração Variável
            </Link>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
              Gerenciamento do programa
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {programa.nome}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {programa.descricao ||
                "Programa sem descrição informada."}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
            {formatarTexto(programa.status)}
          </span>
        </header>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Abrangência
            </p>
            <p className="mt-3 font-black">
              {formatarTexto(programa.abrangencia)}
            </p>
            {programa.departamento?.nome && (
              <p className="mt-2 text-xs text-slate-400">
                {programa.departamento.nome}
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Método
            </p>
            <p className="mt-3 font-black">
              {formatarTexto(
                programa.metodoDistribuicao
              )}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Fundo
            </p>
            <p className="mt-3 text-xl font-black">
              {programa.valorFundo
                ? formatarMoeda(programa.valorFundo)
                : programa.percentualFundo
                  ? `${programa.percentualFundo}%`
                  : "-"}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Auditoria
            </p>
            <p className="mt-3 font-black">
              {programa.criadoPor?.nome ||
                programa.criadoPor?.email ||
                `Usuário ID ${programa.criadoPorId ?? "-"}`}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Criado em:{" "}
              {formatarDataHora(programa.criadoEm)}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
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
        <h2 className="text-lg font-black">
          Participantes
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {programa.participantes.length} funcionário(s)
          incluído(s) no programa.
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
        ? "Incluindo..."
        : exigeSelecao
          ? `Incluir selecionados (${selecionados.length})`
          : programa.participantes.length > 0
  ? "Atualizar participantes elegíveis"
  : "Gerar participantes elegíveis"}
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
          placeholder="Busque com suas palavras: nome, cargo ou departamento..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
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

        <p className="mt-3 text-xs text-slate-400">
          Mostrando {participantesExibidos.length} de{" "}
          {participantesFiltrados.length} resultado(s).
          {participantesFiltrados.length > 30 &&
            " Refine a busca para localizar outros participantes."}
        </p>
      </div>

      {programa.participantes.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Nenhum participante incluído ainda.
        </div>
      ) : participantesFiltrados.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Nenhum participante corresponde à busca.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Funcionário</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Departamento</th>
              </tr>
            </thead>

            <tbody>
              {participantesExibidos.map(
                (participante) => (
                  <tr
                    key={participante.id}
                    className="border-t border-slate-800"
                  >
                    <td className="p-3 font-bold">
                      {
                        participante.funcionarioNomeSnapshot
                      }
                    </td>

                    <td className="p-3 text-slate-300">
                      {participante.funcionarioCargoSnapshot ||
                        "-"}
                    </td>

                    <td className="p-3 text-slate-300">
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

<section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
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
        <h2 className="text-lg font-black">
          Prévia da distribuição
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Confira quanto cada funcionário receberá antes
          de gerar lançamentos.
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
        ? "Calculando..."
        : previa
          ? "Recalcular prévia"
          : "Calcular prévia"}
    </button>
  </div>

  {previaAberta && (
    <>
      {!previa ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Clique em “Calcular prévia” para visualizar
          os valores individuais.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Participantes
              </p>

              <p className="mt-2 text-2xl font-black">
                {previa.totalParticipantes}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Fundo
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(previa.valorFundo)}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Total distribuído
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(
                  previa.totalDistribuido
                )}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Saldo
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(previa.saldo)}
              </p>
            </article>
          </div>

          {previa.alertasGerais.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-black">
                Pontos de atenção
              </p>

              <div className="mt-2 space-y-1 text-sm">
                {previa.alertasGerais.map(
                  (alerta) => (
                    <p key={alerta}>• {alerta}</p>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Funcionário</th>
                  <th className="p-3">Critério</th>
                  <th className="p-3">Valor previsto</th>
                  <th className="p-3">Observações</th>
                </tr>
              </thead>

              <tbody>
  {previa.linhas.map((linha) => (
    <tr
      key={linha.participanteId}
      className="border-t border-slate-800"
    >
      <td className="p-3">
        <p className="font-black">
          {linha.funcionarioNome}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {linha.funcionarioCargo || "Cargo não informado"}
          {" • "}
          {linha.funcionarioDepartamento || "Sem departamento"}
        </p>
      </td>

      <td className="p-3">
        {linha.criterio}
      </td>

      <td className="p-3 text-base font-black">
        {formatarMoeda(linha.valorPrevisto)}
      </td>

      <td className="p-3">
        {linha.alertas.length === 0 ? (
          <span className="text-emerald-600">
            Cálculo válido
          </span>
        ) : (
          <div className="space-y-1 text-xs text-amber-600">
            {linha.alertas.map((alerta) => (
              <p key={alerta}>• {alerta}</p>
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
  <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-black">
        Ativação do programa
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Serão gerados {previa.totalParticipantes} lançamentos
        pendentes, totalizando{" "}
        {formatarMoeda(previa.totalDistribuido)}.
      </p>

      {previa.saldo > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          Permanecerá um saldo não distribuído de{" "}
          {formatarMoeda(previa.saldo)}.
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
    >
      Ativar programa e gerar lançamentos
    </button>
  </div>
)}

        </>
      )}
    </>
  )}
</section>

<section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
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
        <h2 className="text-lg font-black">
          Lançamentos e aprovação
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {resumoLancamentos.total} lançamento(s), sendo{" "}
          {resumoLancamentos.pendentes} pendente(s).
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
        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Pendentes
          </p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.pendentes}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {formatarMoeda(
              resumoLancamentos.valorPendente
            )}
          </p>
        </article>

        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Aprovados
          </p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.aprovados}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {formatarMoeda(
              resumoLancamentos.valorAprovado
            )}
          </p>
        </article>

        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Reprovados
          </p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.reprovados}
          </p>
        </article>

        <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Enviados ao holerite
          </p>

          <p className="mt-2 text-2xl font-black">
            {resumoLancamentos.enviadosHolerite}
          </p>
        </article>
      </div>

      {lancamentos.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Nenhum lançamento foi gerado para este programa.
        </div>
      ) : (
        <>
          {programaAtivo &&
            resumoLancamentos.pendentes > 0 && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-700 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-black">
                    Aprovação dos lançamentos
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {selecionadosLancamentos.length} selecionado(s), totalizando{" "}
                    {formatarMoeda(
                      valorLancamentosSelecionados
                    )}.
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
                  >
                    Reprovar selecionados
                  </button>

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
                  >
                    Aprovar selecionados
                  </button>
                </div>
              </div>
            )}

            {programaAtivo &&
  resumoLancamentos.aprovados > 0 && (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-500/50 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="font-black">
          Envio ao holerite
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {selecionadosEnvioHolerite.length} aprovado(s)
          selecionado(s), totalizando{" "}
          {formatarMoeda(
            valorSelecionadoEnvioHolerite
          )}.
        </p>

        <p className="mt-1 text-xs text-slate-400">
          O valor será incluído como vencimento no
          holerite da competência correspondente.
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
          className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {todosAprovadosSelecionados
            ? "Limpar seleção"
            : "Selecionar todos aprovados"}
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
        >
          Enviar selecionados ao holerite
        </button>
      </div>
    </div>
  )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos os lançamentos pendentes"
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

                  <th className="p-3">
                    Funcionário
                  </th>

                  <th className="p-3">
                    Competência
                  </th>

                  <th className="p-3">
                    Valor
                  </th>

                  <th className="p-3">
                    Status
                  </th>

                  <th className="p-3">
                    Auditoria
                  </th>
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

let rotuloUsuarioAuditoria = "Gerado por";
let rotuloDataAuditoria = "Gerado em";

switch (statusLancamento) {
  case "APROVADO":
    usuarioAuditoria = lancamento.aprovadoPor;
    dataAuditoria = lancamento.aprovadoEm;
    rotuloUsuarioAuditoria = "Aprovado por";
    rotuloDataAuditoria = "Aprovado em";
    break;

  case "REPROVADO":
    usuarioAuditoria = lancamento.reprovadoPor;
    dataAuditoria = lancamento.reprovadoEm;
    rotuloUsuarioAuditoria = "Reprovado por";
    rotuloDataAuditoria = "Reprovado em";
    break;

  case "ENVIADO_HOLERITE":
    usuarioAuditoria =
      lancamento.enviadoHoleritePor;
    dataAuditoria =
      lancamento.enviadoHoleriteEm;
    rotuloUsuarioAuditoria = "Enviado por";
    rotuloDataAuditoria = "Enviado em";
    break;

  case "PAGO":
    usuarioAuditoria =
      lancamento.enviadoHoleritePor;
    dataAuditoria =
      lancamento.pagoEm ||
      lancamento.enviadoHoleriteEm;
    rotuloUsuarioAuditoria =
      "Responsável registrado";
    rotuloDataAuditoria = lancamento.pagoEm
      ? "Pago em"
      : "Enviado em";
    break;

  case "ESTORNADO":
    usuarioAuditoria = lancamento.estornadoPor;
    dataAuditoria = lancamento.estornadoEm;
    rotuloUsuarioAuditoria = "Estornado por";
    rotuloDataAuditoria = "Estornado em";
    break;
}

                  return (
                    <tr
                      key={lancamento.id}
                      className="border-t border-slate-800"
                    >
                      <td className="p-3">
                        <input
  type="checkbox"
  aria-label={
    pendente
      ? `Selecionar lançamento de ${lancamento.funcionarioNomeSnapshot} para aprovação`
      : `Selecionar lançamento de ${lancamento.funcionarioNomeSnapshot} para envio ao holerite`
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

                        <p className="mt-1 text-xs text-slate-400">
                          {lancamento.funcionarioCargoSnapshot ||
                            "Cargo não informado"}
                          {" • "}
                          {lancamento.funcionarioDepartamentoSnapshot ||
                            "Sem departamento"}
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
                            lancamento.valorCalculado
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classeStatusLancamento(
                            lancamento.status
                          )}`}
                        >
                          {formatarTexto(
                            lancamento.status
                          )}
                        </span>
                      </td>

                      <td className="p-3">
  <p className="text-xs font-bold uppercase text-slate-400">
    {rotuloUsuarioAuditoria}
  </p>

  <p className="mt-1 font-semibold">
    {usuarioAuditoria?.nome ||
      usuarioAuditoria?.email ||
      (statusLancamento ===
      "ENVIADO_HOLERITE"
        ? "Usuário do envio não registrado"
        : "Aguardando análise")}
  </p>

  {usuarioAuditoria?.id && (
    <p className="mt-1 text-xs text-slate-400">
      ID do usuário: {usuarioAuditoria.id}
    </p>
  )}

  <p className="mt-1 text-xs text-slate-400">
    {rotuloDataAuditoria}:{" "}
    {formatarDataHora(dataAuditoria)}
  </p>

  {lancamento.motivoReprovacao && (
    <p className="mt-2 text-xs text-red-600">
      Motivo:{" "}
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
    >
      Reabrir análise
    </button>
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

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
  <button
    type="button"
    aria-expanded={funcionariosAberto}
    onClick={() =>
      setFuncionariosAberto((atual) => !atual)
    }
    className="flex w-full items-center justify-between gap-4 text-left"
  >
    <div>
      <h2 className="text-lg font-black">
        Funcionários disponíveis
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Abra para localizar, revisar ou selecionar
        funcionários.
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
          placeholder='Busque: "Comercial", "vendedor", "já incluído", "inelegível"...'
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
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

        <p className="mt-3 text-xs text-slate-400">
          Mostrando {funcionariosExibidos.length} de{" "}
          {funcionariosFiltrados.length} resultado(s).
          {funcionariosFiltrados.length > 30 &&
            " Refine a busca para localizar outros funcionários."}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {funcionariosExibidos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
            Nenhum funcionário corresponde à busca.
          </p>
        ) : (
          funcionariosExibidos.map((funcionario) => (
            <label
              key={funcionario.id}
              className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
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
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                      Já incluído
                    </span>
                  )}

                  {!funcionario.elegivel && (
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-300">
                      Inelegível
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {funcionario.cargo ||
                    "Cargo não informado"}
                  {" • "}
                  {funcionario.departamento?.nome ||
                    "Sem departamento"}
                  {" • "}
                  {formatarMoeda(
                    funcionario.salarioBase
                  )}
                </p>

                {funcionario.motivosInelegibilidade
                  .length > 0 && (
                  <div className="mt-2 text-xs text-red-300">
                    {funcionario.motivosInelegibilidade.map(
                      (motivo) => (
                        <p key={motivo}>• {motivo}</p>
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
        aria-label="Fechar reabertura"
        onClick={fecharModalReabertura}
        className="absolute inset-0 bg-black/70"
      />

      <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
          Correção auditada
        </p>

        <h2
          id="titulo-modal-reabertura"
          className="mt-2 text-2xl font-black"
        >
          Reabrir lançamento?
        </h2>

        <p className="mt-4 text-sm">
          O lançamento de{" "}
          <strong>
            {
              lancamentoReabertura.funcionarioNomeSnapshot
            }
          </strong>{" "}
          voltará para o status pendente.
        </p>

        <div className="mt-5 rounded-2xl border p-4 text-sm">
          <p>
            <strong>Competência:</strong>{" "}
            {String(
              lancamentoReabertura.competenciaMes
            ).padStart(2, "0")}
            /{lancamentoReabertura.competenciaAno}
          </p>

          <p className="mt-2">
            <strong>Valor:</strong>{" "}
            {formatarMoeda(
              lancamentoReabertura.valorAprovado ??
                lancamentoReabertura.valorCalculado
            )}
          </p>

          <p className="mt-2">
            <strong>
              Motivo anterior da reprovação:
            </strong>{" "}
            {lancamentoReabertura.motivoReprovacao ||
              "Não informado"}
          </p>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-black">
            Motivo da reabertura
          </span>

          <textarea
            value={motivoReabertura}
            onChange={(event) =>
              setMotivoReabertura(
                event.target.value
              )
            }
            placeholder="Explique por que este lançamento precisa voltar para análise."
            rows={4}
            disabled={reabrindoLancamento}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:opacity-60"
          />
        </label>

        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          A reprovação anterior não será apagada do
          histórico. O PHANYX registrará quem reabriu,
          quando reabriu e a justificativa informada.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={reabrindoLancamento}
            onClick={fecharModalReabertura}
            className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            Cancelar
          </button>

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
              ? "Reabrindo..."
              : "Confirmar reabertura"}
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
      aria-label="Fechar confirmação de envio"
      onClick={() =>
        !enviandoHolerite &&
        setModalEnvioHoleriteAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
        Integração com a folha
      </p>

      <h2
        id="titulo-modal-envio-holerite"
        className="mt-2 text-2xl font-black"
      >
        Enviar ao holerite?
      </h2>

      <p className="mt-4 text-sm">
        Serão enviados{" "}
        <strong>
          {selecionadosEnvioHolerite.length} lançamento(s)
        </strong>
        , totalizando{" "}
        <strong>
          {formatarMoeda(
            valorSelecionadoEnvioHolerite
          )}
        </strong>
        .
      </p>

      <div className="mt-5 rounded-2xl border p-4 text-sm">
        <p className="font-black">
          O que acontecerá
        </p>

        <p className="mt-2 text-slate-400">
          O PHANYX criará o holerite da competência
          quando ele ainda não existir ou acrescentará
          o valor ao holerite existente.
        </p>

        <p className="mt-2 text-slate-400">
          Cada remuneração será registrada como um
          evento do tipo vencimento. Esta ação não marca
          o holerite como pago.
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
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={enviandoHolerite}
          onClick={enviarAprovadosAoHolerite}
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviandoHolerite
            ? "Enviando..."
            : "Confirmar envio ao holerite"}
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
      aria-label="Fechar confirmação"
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
      >
        Aprovar lançamentos?
      </h2>

      <p className="mt-4 text-sm">
        Serão aprovados{" "}
        <strong>
          {selecionadosLancamentos.length} lançamento(s)
        </strong>
        , totalizando{" "}
        <strong>
          {formatarMoeda(
            valorLancamentosSelecionados
          )}
        </strong>
        .
      </p>

      <p className="mt-4 text-sm text-slate-400">
        Os valores aprovados ficarão prontos para a
        próxima etapa de envio ao holerite.
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={processandoLancamentos}
          onClick={() =>
            setModalAprovacaoAberto(false)
          }
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={processandoLancamentos}
          onClick={
            aprovarLancamentosSelecionados
          }
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processandoLancamentos
            ? "Aprovando..."
            : "Confirmar aprovação"}
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
      aria-label="Fechar reprovação"
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
      >
        Reprovar lançamentos?
      </h2>

      <p className="mt-4 text-sm">
        Serão reprovados{" "}
        <strong>
          {selecionadosLancamentos.length} lançamento(s)
        </strong>
        , totalizando{" "}
        <strong>
          {formatarMoeda(
            valorLancamentosSelecionados
          )}
        </strong>
        .
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-black">
          Motivo da reprovação
        </span>

        <textarea
          value={motivoReprovacao}
          onChange={(event) =>
            setMotivoReprovacao(
              event.target.value
            )
          }
          placeholder="Explique por que os lançamentos estão sendo reprovados."
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
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
        >
          Cancelar
        </button>

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
            ? "Reprovando..."
            : "Confirmar reprovação"}
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
      aria-label="Fechar confirmação"
      onClick={() =>
        !ativandoPrograma &&
        setModalAtivacaoAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Confirmação
          </p>

          <h2
            id="titulo-modal-ativacao"
            className="mt-2 text-2xl font-black"
          >
            Ativar programa?
          </h2>
        </div>

        <button
          type="button"
          aria-label="Fechar"
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
        Serão criados{" "}
        <strong>
          {previa.totalParticipantes} lançamentos
          pendentes
        </strong>
        , totalizando{" "}
        <strong>
          {formatarMoeda(
            previa.totalDistribuido
          )}
        </strong>
        .
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-bold uppercase">
            Participantes
          </p>

          <p className="mt-2 text-2xl font-black">
            {previa.totalParticipantes}
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="text-xs font-bold uppercase">
            Total
          </p>

          <p className="mt-2 text-2xl font-black">
            {formatarMoeda(
              previa.totalDistribuido
            )}
          </p>
        </div>
      </div>

      {previa.saldo > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          O programa possui saldo não distribuído de{" "}
          <strong>
            {formatarMoeda(previa.saldo)}
          </strong>
          .
        </div>
      )}

      <p className="mt-5 text-sm">
        Após a ativação, participantes e regras não
        poderão ser alterados livremente. Os valores
        ainda precisarão ser aprovados antes do envio ao
        holerite.
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={ativandoPrograma}
          onClick={() =>
            setModalAtivacaoAberto(false)
          }
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={ativandoPrograma}
          onClick={ativarPrograma}
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ativandoPrograma
            ? "Ativando..."
            : "Ativar e gerar lançamentos"}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}