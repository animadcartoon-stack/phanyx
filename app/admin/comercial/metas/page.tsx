"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type EscopoMeta =
  | "INSTITUICAO"
  | "EQUIPE"
  | "FUNCIONARIO";

type IndicadorMeta =
  | "QUANTIDADE_MATRICULAS"
  | "VALOR_VENDIDO"
  | "VALOR_RECEBIDO"
  | "LEADS_CONVERTIDOS";

type PeriodicidadeMeta =
  | "MENSAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL"
  | "PERSONALIZADA";

type StatusMeta =
  | "RASCUNHO"
  | "ATIVA"
  | "ENCERRADA"
  | "CANCELADA";

type DepartamentoOption = {
  id: number;
  nome: string;
};

type EquipeMembroOption = {
  id: number;
  funcionarioId: number;
  papel?: string | null;
  inicioVigencia?: string | null;
  fimVigencia?: string | null;

  funcionario: {
    id: number;
    nome: string;
    cargo?: string | null;
    departamento?: DepartamentoOption | null;
  };
};

type MetaParticipante = {
  id: number;
  funcionarioId: number;
  inicioVigencia: string;
  fimVigencia?: string | null;
  ativo: boolean;

  funcionario?: {
    id: number;
    nome: string;
    cargo?: string | null;
    ativo?: boolean;
    statusFuncionario?: string | null;
    departamento?: DepartamentoOption | null;
  } | null;
};

type EquipeOption = {
  id: number;
  nome: string;
  responsavelFuncionario?: {
    id: number;
    nome: string;
  } | null;

  membros?: EquipeMembroOption[];

  _count?: {
    membros?: number;
  };
};

type FuncionarioOption = {
  id: number;
  nome: string;
  cargo?: string | null;
  departamento?: DepartamentoOption | null;
};

type CursoOption = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type PoloOption = {
  id: number;
  nome: string;
  codigo?: string | null;
  statusComercial?: string | null;
};

type UsuarioOption = {
  id: number;
  nome: string;
};

type MetaComercial = {
  id: number;
  nome: string;
  descricao?: string | null;
  observacoes?: string | null;
  escopo: EscopoMeta;
  indicador: IndicadorMeta;
  periodicidade: PeriodicidadeMeta;
  status: StatusMeta;
  valorAlvo: number;
  valorRealizado?: number;
  valorRestante?: number;
  percentualAtingido?: number;
  atingida?: boolean;
  unidadeMeta?: "QUANTIDADE" | "VALOR";
  matriculasConsideradas?: number;
  pagamentosConsiderados?: number;
  membrosEquipeConsiderados?: number;
  apuradoEm?: string | null;
  dataInicio: string;
  dataFim: string;
  equipeId?: number | null;
  funcionarioId?: number | null;
  cursoId?: number | null;
  poloId?: number | null;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  equipe?: {
    id: number;
    nome: string;
    ativo?: boolean;
  } | null;
  funcionario?: {
    id: number;
    nome: string;
    cargo?: string | null;
    ativo?: boolean;
    statusFuncionario?: string | null;
    departamento?: DepartamentoOption | null;
  } | null;
  curso?: {
    id: number;
    nome: string;
    ativo?: boolean;
  } | null;
  polo?: {
    id: number;
    nome: string;
    codigo?: string | null;
    ativo?: boolean;
    statusComercial?: string | null;
  } | null;
  criadoPor?: UsuarioOption | null;
  atualizadoPor?: UsuarioOption | null;
  participantes?: MetaParticipante[];
};

type CatalogosMetas = {
  equipes: EquipeOption[];
  funcionarios: FuncionarioOption[];
  cursos: CursoOption[];
  polos: PoloOption[];
};

type FormMeta = {
  nome: string;
  descricao: string;
  observacoes: string;
  escopo: EscopoMeta;
  indicador: IndicadorMeta;
  periodicidade: PeriodicidadeMeta;
  status: "RASCUNHO" | "ATIVA";
  valorAlvo: string;
  dataInicio: string;
  dataFim: string;
  equipeId: string;
  participanteIds: number[];
  funcionarioId: string;
  cursoId: string;
  poloId: string;
};

type UsuarioControleAcesso = {
  role?: string | null;
  isMasterAdmin?: boolean;
};

type AcaoConfirmacao =
  | "ATIVAR"
  | "ENCERRAR"
  | "CANCELAR"
  | "EXCLUIR";

type ConfirmacaoMeta = {
  acao: AcaoConfirmacao;
  meta: MetaComercial;
};

const CATALOGOS_INICIAIS: CatalogosMetas = {
  equipes: [],
  funcionarios: [],
  cursos: [],
  polos: [],
};

const ROTULOS_ESCOPO: Record<EscopoMeta, string> = {
  INSTITUICAO: "Instituição",
  EQUIPE: "Equipe",
  FUNCIONARIO: "Funcionário",
};

const ROTULOS_INDICADOR: Record<IndicadorMeta, string> = {
  QUANTIDADE_MATRICULAS: "Quantidade de matrículas",
  VALOR_VENDIDO: "Valor vendido",
  VALOR_RECEBIDO: "Valor recebido",
  LEADS_CONVERTIDOS: "Leads convertidos",
};

const ROTULOS_PERIODICIDADE: Record<PeriodicidadeMeta, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  PERSONALIZADA: "Personalizada",
};

const ROTULOS_STATUS: Record<StatusMeta, string> = {
  RASCUNHO: "Rascunho",
  ATIVA: "Ativa",
  ENCERRADA: "Encerrada",
  CANCELADA: "Cancelada",
};

function dataLocalParaInput(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataHojeLocal() {
  return dataLocalParaInput(new Date());
}

function periodoDaPeriodicidade(
  periodicidade: PeriodicidadeMeta,
  referencia = new Date()
) {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();

  if (periodicidade === "MENSAL") {
    return {
      inicio: dataLocalParaInput(new Date(ano, mes, 1)),
      fim: dataLocalParaInput(new Date(ano, mes + 1, 0)),
    };
  }

  if (periodicidade === "TRIMESTRAL") {
    const mesInicial = Math.floor(mes / 3) * 3;

    return {
      inicio: dataLocalParaInput(new Date(ano, mesInicial, 1)),
      fim: dataLocalParaInput(new Date(ano, mesInicial + 3, 0)),
    };
  }

  if (periodicidade === "SEMESTRAL") {
    const mesInicial = mes < 6 ? 0 : 6;

    return {
      inicio: dataLocalParaInput(new Date(ano, mesInicial, 1)),
      fim: dataLocalParaInput(new Date(ano, mesInicial + 6, 0)),
    };
  }

  if (periodicidade === "ANUAL") {
    return {
      inicio: dataLocalParaInput(new Date(ano, 0, 1)),
      fim: dataLocalParaInput(new Date(ano, 11, 31)),
    };
  }

  const hoje = dataHojeLocal();

  return {
    inicio: hoje,
    fim: hoje,
  };
}

function criarFormInicial(): FormMeta {
  const periodo = periodoDaPeriodicidade("MENSAL");

  return {
    nome: "",
    descricao: "",
    observacoes: "",
    escopo: "INSTITUICAO",
    indicador: "QUANTIDADE_MATRICULAS",
    periodicidade: "MENSAL",
    status: "RASCUNHO",
    valorAlvo: "",
    dataInicio: periodo.inicio,
    dataFim: periodo.fim,
    equipeId: "",
    participanteIds: [],
    funcionarioId: "",
    cursoId: "",
    poloId: "",
  };
}

function dataApiParaInput(valor?: string | null) {
  if (!valor) {
    return "";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor).slice(0, 10);
  }

  return data.toISOString().slice(0, 10);
}

function formatarData(valor?: string | null) {
  if (!valor) {
    return "—";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return data.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function valorMetaFormatado(meta: MetaComercial) {
  if (
    meta.indicador === "VALOR_VENDIDO" ||
    meta.indicador === "VALOR_RECEBIDO"
  ) {
    return formatarMoeda(meta.valorAlvo);
  }

  return formatarNumero(meta.valorAlvo);
}

function valorApuracaoFormatado(
  meta: MetaComercial,
  valor: number | undefined
) {
  const numero = Number(valor ?? 0);

  if (
    meta.indicador === "VALOR_VENDIDO" ||
    meta.indicador === "VALOR_RECEBIDO"
  ) {
    return formatarMoeda(numero);
  }

  return formatarNumero(numero);
}

function formatarPercentual(
  valor: number | undefined
) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}

function larguraBarraProgresso(
  valor: number | undefined
) {
  const percentual = Number(valor ?? 0);

  if (!Number.isFinite(percentual)) {
    return 0;
  }

  return Math.min(
    Math.max(percentual, 0),
    100
  );
}

function normalizarValorAlvo(valor: string) {
  const texto = String(valor || "").trim();

  if (!texto) {
    return Number.NaN;
  }

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  return Number(normalizado);
}

function descricaoResponsavel(meta: MetaComercial) {
  if (meta.escopo === "EQUIPE") {
    return meta.equipe?.nome || "Equipe não informada";
  }

  if (meta.escopo === "FUNCIONARIO") {
    return meta.funcionario?.nome || "Funcionário não informado";
  }

  return "Toda a instituição";
}

function classeStatus(status: StatusMeta) {
  if (status === "ATIVA") {
    return "border-emerald-700 !bg-emerald-700 !text-white shadow-sm dark:border-emerald-700 dark:!bg-emerald-950/50 dark:!text-emerald-100";
  }

  if (status === "RASCUNHO") {
    return "border-amber-700 !bg-amber-600 !text-white shadow-sm dark:border-amber-700 dark:!bg-amber-950/50 dark:!text-amber-100";
  }

  if (status === "ENCERRADA") {
    return "border-slate-700 !bg-slate-700 !text-white shadow-sm dark:border-slate-600 dark:!bg-slate-800 dark:!text-slate-100";
  }

  return "border-red-700 !bg-red-700 !text-white shadow-sm dark:border-red-800 dark:!bg-red-950/50 dark:!text-red-100";
}

export default function MetasComerciaisPage() {
  const [metas, setMetas] = useState<MetaComercial[]>([]);
  const [catalogos, setCatalogos] =
    useState<CatalogosMetas>(CATALOGOS_INICIAIS);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusMeta | "TODOS">(
    "TODOS"
  );
  const [filtroEscopo, setFiltroEscopo] = useState<EscopoMeta | "TODOS">(
    "TODOS"
  );
  const [filtroIndicador, setFiltroIndicador] = useState<
    IndicadorMeta | "TODOS"
  >("TODOS");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormMeta>(() => criarFormInicial());

  const [
    mostrarOutrosFuncionarios,
    setMostrarOutrosFuncionarios,
  ] = useState(false);

  const [
    buscaParticipante,
    setBuscaParticipante,
  ] = useState("");

  const [confirmacao, setConfirmacao] =
    useState<ConfirmacaoMeta | null>(null);

  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [usuarioAtual, setUsuarioAtual] =
    useState<UsuarioControleAcesso | null>(null);

  const roleUsuario = String(usuarioAtual?.role || "").toUpperCase();

  const usuarioAdmin =
    roleUsuario === "ADMIN" ||
    roleUsuario === "GERENCIA" ||
    roleUsuario === "SUPER_ADMIN" ||
    usuarioAtual?.isMasterAdmin === true;

  function possuiPermissao(chave: string) {
    return (
      usuarioAdmin ||
      permissoes.includes("*") ||
      permissoes.includes(chave)
    );
  }

  const podeCriarMeta = possuiPermissao("comercial.metas.criar");
  const podeEditarMeta = possuiPermissao("comercial.metas.editar");
  const podeExcluirMeta = possuiPermissao("comercial.metas.excluir");

  async function carregarControleAcesso() {
    try {
      setCarregandoPermissoes(true);

      const [respostaUsuario, respostaPermissoes] = await Promise.all([
        fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/permissoes/me", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      if (respostaUsuario.ok) {
        const dadosUsuario = await respostaUsuario.json().catch(() => null);
        setUsuarioAtual(dadosUsuario?.user || null);
      } else {
        setUsuarioAtual(null);
      }

      if (respostaPermissoes.ok) {
        const dadosPermissoes = await respostaPermissoes
          .json()
          .catch(() => null);

        setPermissoes(
          Array.isArray(dadosPermissoes?.permissoes)
            ? dadosPermissoes.permissoes
            : []
        );
      } else {
        setPermissoes([]);
      }
    } catch {
      setUsuarioAtual(null);
      setPermissoes([]);
    } finally {
      setCarregandoPermissoes(false);
    }
  }

  async function carregarMetas() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch("/api/admin/comercial/metas", {
        cache: "no-store",
        credentials: "include",
      });

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.error || "Não foi possível carregar as metas comerciais."
        );
      }

      setMetas(Array.isArray(dados?.metas) ? dados.metas : []);

      setCatalogos({
        equipes: Array.isArray(dados?.catalogos?.equipes)
          ? dados.catalogos.equipes
          : [],
        funcionarios: Array.isArray(dados?.catalogos?.funcionarios)
          ? dados.catalogos.funcionarios
          : [],
        cursos: Array.isArray(dados?.catalogos?.cursos)
          ? dados.catalogos.cursos
          : [],
        polos: Array.isArray(dados?.catalogos?.polos)
          ? dados.catalogos.polos
          : [],
      });
    } catch (error: unknown) {
      setMetas([]);
      setCatalogos(CATALOGOS_INICIAIS);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar metas comerciais."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void Promise.all([carregarControleAcesso(), carregarMetas()]);
  }, []);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSucesso("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const metasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return metas.filter((meta) => {
      if (filtroStatus !== "TODOS" && meta.status !== filtroStatus) {
        return false;
      }

      if (filtroEscopo !== "TODOS" && meta.escopo !== filtroEscopo) {
        return false;
      }

      if (
        filtroIndicador !== "TODOS" &&
        meta.indicador !== filtroIndicador
      ) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = [
        meta.nome,
        meta.descricao,
        meta.observacoes,
        meta.equipe?.nome,
        meta.funcionario?.nome,
        meta.curso?.nome,
        meta.polo?.nome,
        ROTULOS_ESCOPO[meta.escopo],
        ROTULOS_INDICADOR[meta.indicador],
        ROTULOS_STATUS[meta.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [metas, busca, filtroStatus, filtroEscopo, filtroIndicador]);

  const metricas = useMemo(() => {
    return {
      total: metas.length,
      ativas: metas.filter((meta) => meta.status === "ATIVA").length,
      rascunhos: metas.filter((meta) => meta.status === "RASCUNHO").length,
      encerradas: metas.filter((meta) => meta.status === "ENCERRADA").length,
      canceladas: metas.filter((meta) => meta.status === "CANCELADA").length,
    };
  }, [metas]);

  const equipeSelecionada =
    useMemo(
      () =>
        catalogos.equipes.find(
          (equipe) =>
            String(equipe.id) ===
            form.equipeId
        ) ?? null,
      [
        catalogos.equipes,
        form.equipeId,
      ]
    );

  const membrosEquipeSelecionada =
    equipeSelecionada?.membros ??
    [];

  const idsMembrosEquipeSelecionada =
    useMemo(
      () =>
        new Set<number>(
          (
            equipeSelecionada?.membros ??
            []
          ).map(
            (membro) =>
              membro.funcionarioId
          )
        ),
      [equipeSelecionada]
    );

  const participantesAdicionaisSelecionados =
    useMemo(
      () =>
        catalogos.funcionarios.filter(
          (funcionario) =>
            form.participanteIds.includes(
              funcionario.id
            ) &&
            !idsMembrosEquipeSelecionada.has(
              funcionario.id
            )
        ),
      [
        catalogos.funcionarios,
        form.participanteIds,
        idsMembrosEquipeSelecionada,
      ]
    );

  const outrosFuncionariosDisponiveis =
    useMemo(() => {
      const termo =
        buscaParticipante
          .trim()
          .toLowerCase();

      return catalogos.funcionarios.filter(
        (funcionario) => {
          if (
            idsMembrosEquipeSelecionada.has(
              funcionario.id
            )
          ) {
            return false;
          }

          if (!termo) {
            return true;
          }

          const texto = [
            funcionario.nome,
            funcionario.cargo,
            funcionario
              .departamento
              ?.nome,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return texto.includes(
            termo
          );
        }
      );
    }, [
      catalogos.funcionarios,
      buscaParticipante,
      idsMembrosEquipeSelecionada,
    ]);

  function abrirNovaMeta() {
    setEditandoId(null);
    setForm(criarFormInicial());
    setErro("");
    setBuscaParticipante("");
    setMostrarOutrosFuncionarios(false);
    setModalAberto(true);
  }

  function abrirEdicao(meta: MetaComercial) {
    if (meta.status === "ENCERRADA" || meta.status === "CANCELADA") {
      setErro("Metas encerradas ou canceladas não podem mais ser alteradas.");
      return;
    }

    setEditandoId(meta.id);

    setForm({
      nome: meta.nome || "",
      descricao: meta.descricao || "",
      observacoes: meta.observacoes || "",
      escopo: meta.escopo,
      indicador: meta.indicador,
      periodicidade: meta.periodicidade,
      status: meta.status === "ATIVA" ? "ATIVA" : "RASCUNHO",
      valorAlvo: String(meta.valorAlvo ?? ""),
      dataInicio: dataApiParaInput(meta.dataInicio),
      dataFim: dataApiParaInput(meta.dataFim),
      equipeId:
        meta.equipeId
          ? String(meta.equipeId)
          : "",

      participanteIds:
        meta.escopo === "EQUIPE"
          ? Array.from(
            new Set<number>(
              (meta.participantes ?? [])
                .filter(
                  (participante) =>
                    participante.ativo
                )
                .map(
                  (participante) =>
                    participante.funcionarioId
                )
            )
          )
          : [],

      funcionarioId:
        meta.funcionarioId
          ? String(meta.funcionarioId)
          : "",
      cursoId: meta.cursoId ? String(meta.cursoId) : "",
      poloId: meta.poloId ? String(meta.poloId) : "",
    });

    setErro("");
    setBuscaParticipante("");
    setMostrarOutrosFuncionarios(false);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setEditandoId(null);
    setBuscaParticipante("");
    setMostrarOutrosFuncionarios(false);
    setForm(criarFormInicial());
  }

  function alterarEscopo(
    escopo: EscopoMeta
  ) {
    setForm((atual) => ({
      ...atual,

      escopo,

      equipeId:
        escopo === "EQUIPE"
          ? atual.equipeId
          : "",

      participanteIds:
        escopo === "EQUIPE"
          ? atual.participanteIds
          : [],

      funcionarioId:
        escopo === "FUNCIONARIO"
          ? atual.funcionarioId
          : "",
    }));
  }

  function alterarEquipe(
    equipeId: string
  ) {
    const equipe =
      catalogos.equipes.find(
        (item) =>
          String(item.id) ===
          equipeId
      );

    const participanteIds =
      equipe?.membros?.map(
        (membro) =>
          membro.funcionarioId
      ) ?? [];

    setForm((atual) => ({
      ...atual,
      equipeId,
      participanteIds,
    }));
  }

  function alternarParticipante(
    funcionarioId: number
  ) {
    setForm((atual) => {
      const selecionado =
        atual.participanteIds.includes(
          funcionarioId
        );

      return {
        ...atual,

        participanteIds:
          selecionado
            ? atual.participanteIds.filter(
              (id) =>
                id !==
                funcionarioId
            )
            : [
              ...atual.participanteIds,
              funcionarioId,
            ],
      };
    });
  }

  function alterarPeriodicidade(periodicidade: PeriodicidadeMeta) {
    const periodo = periodoDaPeriodicidade(periodicidade);

    setForm((atual) => ({
      ...atual,
      periodicidade,
      dataInicio:
        periodicidade === "PERSONALIZADA"
          ? atual.dataInicio || periodo.inicio
          : periodo.inicio,
      dataFim:
        periodicidade === "PERSONALIZADA"
          ? atual.dataFim || periodo.fim
          : periodo.fim,
    }));
  }

  async function salvarMeta() {
    const nome = form.nome.trim();
    const valorAlvo = normalizarValorAlvo(form.valorAlvo);

    if (nome.length < 2) {
      setErro("Informe o nome da meta comercial.");
      return;
    }

    if (!form.dataInicio || !form.dataFim) {
      setErro("Informe a data inicial e a data final da meta.");
      return;
    }

    if (form.dataFim < form.dataInicio) {
      setErro("A data final não pode ser anterior à data inicial.");
      return;
    }

    if (!Number.isFinite(valorAlvo) || valorAlvo <= 0) {
      setErro("Informe um valor-alvo maior que zero.");
      return;
    }

    if (
      (form.indicador === "QUANTIDADE_MATRICULAS" ||
        form.indicador === "LEADS_CONVERTIDOS") &&
      !Number.isInteger(valorAlvo)
    ) {
      setErro("Para metas de quantidade, informe um número inteiro.");
      return;
    }

    if (form.escopo === "EQUIPE" && !form.equipeId) {
      setErro("Selecione a equipe responsável pela meta.");
      return;
    }

    if (
      form.escopo === "EQUIPE" &&
      form.participanteIds.length ===
      0
    ) {
      setErro(
        "Selecione pelo menos um participante para a meta da equipe."
      );
      return;
    }

    if (form.escopo === "FUNCIONARIO" && !form.funcionarioId) {
      setErro("Selecione o funcionário responsável pela meta.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const endpoint = editandoId
        ? `/api/admin/comercial/metas/${editandoId}`
        : "/api/admin/comercial/metas";

      const resposta = await fetch(endpoint, {
        method: editandoId ? "PATCH" : "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          descricao: form.descricao.trim() || null,
          observacoes: form.observacoes.trim() || null,
          escopo: form.escopo,
          indicador: form.indicador,
          periodicidade: form.periodicidade,
          status: form.status,
          valorAlvo: form.valorAlvo,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim,
          equipeId:
            form.escopo === "EQUIPE" && form.equipeId
              ? Number(form.equipeId)
              : null,
          participanteIds:
            form.escopo === "EQUIPE"
              ? form.participanteIds
              : [],
          funcionarioId:
            form.escopo === "FUNCIONARIO" && form.funcionarioId
              ? Number(form.funcionarioId)
              : null,
          cursoId: form.cursoId ? Number(form.cursoId) : null,
          poloId: form.poloId ? Number(form.poloId) : null,
        }),
      });

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.error || "Não foi possível salvar a meta comercial."
        );
      }

      setModalAberto(false);
      setEditandoId(null);
      setForm(criarFormInicial());
      setSucesso(
        dados?.mensagem ||
        (editandoId
          ? "Meta comercial atualizada com sucesso."
          : "Meta comercial criada com sucesso.")
      );

      await carregarMetas();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar a meta comercial."
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirConfirmacao(acao: AcaoConfirmacao, meta: MetaComercial) {
    setErro("");
    setConfirmacao({ acao, meta });
  }

  async function confirmarAcao() {
    if (!confirmacao) {
      return;
    }

    const { acao, meta } = confirmacao;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const exclusao = acao === "EXCLUIR";
      const statusDestino: StatusMeta | null =
        acao === "ATIVAR"
          ? "ATIVA"
          : acao === "ENCERRAR"
            ? "ENCERRADA"
            : acao === "CANCELAR"
              ? "CANCELADA"
              : null;

      const resposta = await fetch(
        `/api/admin/comercial/metas/${meta.id}`,
        {
          method: exclusao ? "DELETE" : "PATCH",
          cache: "no-store",
          credentials: "include",
          headers: exclusao
            ? undefined
            : {
              "Content-Type": "application/json",
            },
          body: exclusao
            ? undefined
            : JSON.stringify({
              status: statusDestino,
            }),
        }
      );

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.error || "Não foi possível concluir a ação sobre a meta."
        );
      }

      setConfirmacao(null);
      setSucesso(dados?.mensagem || "Ação concluída com sucesso.");
      await carregarMetas();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao processar a meta comercial."
      );
    } finally {
      setSalvando(false);
    }
  }

  const configuracaoConfirmacao = useMemo(() => {
    if (!confirmacao) {
      return null;
    }

    const nome = confirmacao.meta.nome;

    if (confirmacao.acao === "ATIVAR") {
      return {
        titulo: "Ativar meta comercial",
        mensagem: `A meta “${nome}” passará a acompanhar oficialmente o período definido.`,
        acao: "Ativar meta",
        classeBotao:
          "!border-emerald-700 !bg-emerald-700 !text-white hover:!bg-emerald-800",
      };
    }

    if (confirmacao.acao === "ENCERRAR") {
      return {
        titulo: "Encerrar meta comercial",
        mensagem: `A meta “${nome}” será encerrada e não poderá ser reaberta ou editada.`,
        acao: "Encerrar meta",
        classeBotao:
          "!border-slate-800 !bg-slate-800 !text-white hover:!bg-slate-900 dark:!border-slate-200 dark:!bg-slate-200 dark:!text-slate-950",
      };
    }

    if (confirmacao.acao === "CANCELAR") {
      return {
        titulo: "Cancelar meta comercial",
        mensagem: `A meta “${nome}” será cancelada e seu histórico permanecerá preservado.`,
        acao: "Cancelar meta",
        classeBotao:
          "!border-red-700 !bg-red-700 !text-white hover:!bg-red-800",
      };
    }

    return {
      titulo: "Excluir rascunho de meta",
      mensagem: `O rascunho “${nome}” será excluído definitivamente. Esta ação é permitida somente para metas que ainda não foram ativadas.`,
      acao: "Excluir rascunho",
      classeBotao:
        "!border-red-700 !bg-red-700 !text-white hover:!bg-red-800",
    };
  }, [confirmacao]);

  const indicadorEhValor =
    form.indicador === "VALOR_VENDIDO" ||
    form.indicador === "VALOR_RECEBIDO";

  return (
    <main className="phanyx-metas-comerciais-page mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="phanyx-metas-cabecalho rounded-3xl border border-slate-200 !bg-white p-6 shadow-sm dark:border-slate-700 dark:!bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
              Comercial
            </p>

            <h1 className="mt-2 text-3xl font-black !text-slate-950 dark:!text-white">
              Metas comerciais
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 !text-slate-600 dark:!text-slate-300">
              Defina objetivos para toda a instituição, equipes ou funcionários,
              com período, indicador, curso e polo opcionais.
            </p>
          </div>

          {!carregandoPermissoes && podeCriarMeta && (
            <button
              type="button"
              onClick={abrirNovaMeta}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border !border-blue-700 !bg-blue-700 px-6 text-sm font-black !text-white shadow-sm transition hover:!bg-blue-800"
            >
              + Nova meta
            </button>
          )}
        </div>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-300 !bg-red-50 px-4 py-3 text-sm font-bold !text-red-900 dark:border-red-800 dark:!bg-red-950/40 dark:!text-red-100">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-300 !bg-emerald-50 px-4 py-3 text-sm font-bold !text-emerald-950 dark:border-emerald-800 dark:!bg-emerald-950/40 dark:!text-emerald-100">
          {sucesso}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { titulo: "Total de metas", valor: metricas.total },
          { titulo: "Metas ativas", valor: metricas.ativas },
          { titulo: "Rascunhos", valor: metricas.rascunhos },
          { titulo: "Encerradas", valor: metricas.encerradas },
          { titulo: "Canceladas", valor: metricas.canceladas },
        ].map((item) => (
          <article
            key={item.titulo}
            className="phanyx-metas-metrica rounded-3xl border border-slate-200 !bg-white p-5 shadow-sm dark:border-slate-700 dark:!bg-slate-900"
          >
            <p className="text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
              {item.titulo}
            </p>

            <p className="mt-3 text-3xl font-black !text-slate-950 dark:!text-white">
              {item.valor}
            </p>
          </article>
        ))}
      </section>

      <section className="phanyx-metas-filtros rounded-3xl border border-slate-200 !bg-white p-5 shadow-sm dark:border-slate-700 dark:!bg-slate-900">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_230px]">
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar meta, equipe, funcionário, curso ou polo"
            className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 !text-slate-950 outline-none transition placeholder:!text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
          />

          <select
            value={filtroStatus}
            onChange={(event) =>
              setFiltroStatus(event.target.value as StatusMeta | "TODOS")
            }
            className="min-h-12 rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
          >
            <option value="TODOS">Todos os status</option>
            <option value="RASCUNHO">Rascunhos</option>
            <option value="ATIVA">Ativas</option>
            <option value="ENCERRADA">Encerradas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>

          <select
            value={filtroEscopo}
            onChange={(event) =>
              setFiltroEscopo(event.target.value as EscopoMeta | "TODOS")
            }
            className="min-h-12 rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
          >
            <option value="TODOS">Todos os escopos</option>
            <option value="INSTITUICAO">Instituição</option>
            <option value="EQUIPE">Equipe</option>
            <option value="FUNCIONARIO">Funcionário</option>
          </select>

          <select
            value={filtroIndicador}
            onChange={(event) =>
              setFiltroIndicador(
                event.target.value as IndicadorMeta | "TODOS"
              )
            }
            className="min-h-12 rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
          >
            <option value="TODOS">Todos os indicadores</option>
            <option value="QUANTIDADE_MATRICULAS">Matrículas</option>
            <option value="VALOR_VENDIDO">Valor vendido</option>
            <option value="VALOR_RECEBIDO">Valor recebido</option>
            <option value="LEADS_CONVERTIDOS">Leads convertidos</option>
          </select>
        </div>
      </section>

      {carregando ? (
        <div className="rounded-3xl border border-slate-200 !bg-white p-10 text-center font-semibold !text-slate-600 shadow-sm dark:border-slate-700 dark:!bg-slate-900 dark:!text-slate-300">
          Carregando metas comerciais...
        </div>
      ) : metasFiltradas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 !bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:!bg-slate-900">
          <p className="text-lg font-black !text-slate-900 dark:!text-white">
            Nenhuma meta encontrada
          </p>

          <p className="mt-2 text-sm !text-slate-600 dark:!text-slate-300">
            Cadastre uma meta comercial ou ajuste os filtros da listagem.
          </p>
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {metasFiltradas.map((meta) => {
            const podeAlterar =
              meta.status === "RASCUNHO" || meta.status === "ATIVA";

            return (
              <article
                key={meta.id}
                className="phanyx-meta-card flex min-h-[360px] flex-col rounded-3xl border border-slate-200 !bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:!bg-slate-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black !text-slate-950 dark:!text-white">
                        {meta.nome}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatus(meta.status)}`}
                      >
                        {ROTULOS_STATUS[meta.status]}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                      {meta.descricao || "Sem descrição cadastrada."}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-slate-200 !bg-slate-50 px-4 py-3 text-right dark:border-slate-700 dark:!bg-slate-950">
                    <p className="text-[11px] font-black uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                      Meta definida
                    </p>
                    <p className="mt-1 text-xl font-black !text-slate-950 dark:!text-white">
                      {valorMetaFormatado(meta)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 !bg-slate-50 p-4 dark:border-slate-700 dark:!bg-slate-950">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                        Acompanhamento da meta
                      </p>

                      <p className="mt-1 text-xs !text-slate-500 dark:!text-slate-400">
                        Resultado calculado automaticamente pelos dados do PHANYX.
                      </p>
                    </div>

                    {meta.atingida && (
                      <span className="rounded-full border border-emerald-700 !bg-emerald-700 px-3 py-1 text-xs font-black !text-white">
                        Meta atingida
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 !bg-white p-3 dark:border-slate-700 dark:!bg-slate-900">
                      <p className="text-[11px] font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                        Realizado
                      </p>

                      <p className="mt-1 text-lg font-black !text-slate-950 dark:!text-white">
                        {valorApuracaoFormatado(
                          meta,
                          meta.valorRealizado
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 !bg-white p-3 dark:border-slate-700 dark:!bg-slate-900">
                      <p className="text-[11px] font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                        Restante
                      </p>

                      <p className="mt-1 text-lg font-black !text-slate-950 dark:!text-white">
                        {valorApuracaoFormatado(
                          meta,
                          meta.valorRestante
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 !bg-white p-3 dark:border-slate-700 dark:!bg-slate-900">
                      <p className="text-[11px] font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                        Progresso
                      </p>

                      <p className="mt-1 text-lg font-black !text-slate-950 dark:!text-white">
                        {formatarPercentual(
                          meta.percentualAtingido
                        )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
                      <span className="!text-slate-600 dark:!text-slate-300">
                        Progresso da meta
                      </span>

                      <span className="!text-slate-900 dark:!text-white">
                        {formatarPercentual(
                          meta.percentualAtingido
                        )}
                        %
                      </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full !bg-slate-200 dark:!bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${meta.atingida
                          ? "!bg-emerald-600"
                          : "!bg-blue-600"
                          }`}
                        style={{
                          width: `${larguraBarraProgresso(
                            meta.percentualAtingido
                          )}%`,
                        }}
                      />
                    </div>

                    {meta.atingida && (
                      <p className="mt-2 text-xs font-black !text-emerald-700 dark:!text-emerald-300">
                        ✓ Meta alcançada
                        {Number(
                          meta.percentualAtingido ?? 0
                        ) > 100
                          ? ` — ${formatarPercentual(
                            Number(
                              meta.percentualAtingido ?? 0
                            ) - 100
                          )}% acima do objetivo`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 dark:border-slate-700 dark:!bg-slate-950">
                    <p className="text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                      Indicador
                    </p>
                    <p className="mt-2 font-black !text-slate-900 dark:!text-white">
                      {ROTULOS_INDICADOR[meta.indicador]}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 dark:border-slate-700 dark:!bg-slate-950">
                    <p className="text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                      Responsável
                    </p>
                    <p className="mt-2 font-black !text-slate-900 dark:!text-white">
                      {descricaoResponsavel(meta)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 dark:border-slate-700 dark:!bg-slate-950">
                    <p className="text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                      Período
                    </p>
                    <p className="mt-2 font-black !text-slate-900 dark:!text-white">
                      {formatarData(meta.dataInicio)} a {formatarData(meta.dataFim)}
                    </p>
                    <p className="mt-1 text-xs !text-slate-500 dark:!text-slate-400">
                      {ROTULOS_PERIODICIDADE[meta.periodicidade]}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 dark:border-slate-700 dark:!bg-slate-950">
                    <p className="text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                      Segmentação
                    </p>
                    <p className="mt-2 font-black !text-slate-900 dark:!text-white">
                      {meta.curso?.nome || "Todos os cursos"}
                    </p>
                    <p className="mt-1 text-xs !text-slate-500 dark:!text-slate-400">
                      {meta.polo?.nome || "Todos os polos"}
                    </p>
                  </div>
                </div>

                {meta.observacoes && (
                  <div className="mt-4 rounded-2xl border border-slate-200 !bg-white p-4 dark:border-slate-700 dark:!bg-slate-900">
                    <p className="text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                      Observações
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 !text-slate-700 dark:!text-slate-300">
                      {meta.observacoes}
                    </p>
                  </div>
                )}

                {!carregandoPermissoes &&
                  (podeEditarMeta || podeExcluirMeta) && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      {podeEditarMeta && podeAlterar && (
                        <button
                          type="button"
                          onClick={() => abrirEdicao(meta)}
                          className="rounded-2xl border border-slate-400 !bg-white px-4 py-2.5 text-sm font-black !text-slate-800 transition hover:!bg-slate-100 dark:border-slate-600 dark:!bg-slate-900 dark:!text-slate-100 dark:hover:!bg-slate-800"
                        >
                          Editar
                        </button>
                      )}

                      {podeEditarMeta && meta.status === "RASCUNHO" && (
                        <button
                          type="button"
                          onClick={() => abrirConfirmacao("ATIVAR", meta)}
                          className="rounded-2xl border border-emerald-700 !bg-emerald-700 px-4 py-2.5 text-sm font-black !text-white shadow-sm transition hover:!bg-emerald-800 dark:border-emerald-700 dark:!bg-emerald-950/40 dark:!text-emerald-100"
                        >
                          Ativar
                        </button>
                      )}

                      {podeEditarMeta && meta.status === "ATIVA" && (
                        <button
                          type="button"
                          onClick={() => abrirConfirmacao("ENCERRAR", meta)}
                          className="rounded-2xl border border-slate-700 !bg-slate-100 px-4 py-2.5 text-sm font-black !text-slate-900 transition hover:!bg-slate-200 dark:border-slate-500 dark:!bg-slate-800 dark:!text-white"
                        >
                          Encerrar
                        </button>
                      )}

                      {podeEditarMeta && podeAlterar && (
                        <button
                          type="button"
                          onClick={() => abrirConfirmacao("CANCELAR", meta)}
                          className="rounded-2xl border border-amber-700 !bg-amber-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm transition hover:!bg-amber-700 dark:border-amber-600 dark:!bg-amber-700 dark:hover:!bg-amber-600"
                        >
                          Cancelar meta
                        </button>
                      )}

                      {podeExcluirMeta && meta.status === "RASCUNHO" && (
                        <button
                          type="button"
                          onClick={() => abrirConfirmacao("EXCLUIR", meta)}
                          className="rounded-2xl border border-red-700 !bg-red-700 px-4 py-2.5 text-sm font-black !text-white transition hover:!bg-red-800"
                        >
                          Excluir rascunho
                        </button>
                      )}
                    </div>
                  )}
              </article>
            );
          })}
        </section>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-950/70 p-4">
          <div className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 !bg-white shadow-2xl dark:border-slate-700 dark:!bg-slate-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 !bg-white p-6 dark:border-slate-700 dark:!bg-slate-900">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                  Comercial
                </p>
                <h2 className="mt-2 text-2xl font-black !text-slate-950 dark:!text-white">
                  {editandoId ? "Editar meta comercial" : "Nova meta comercial"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="rounded-2xl border border-slate-300 !bg-white px-4 py-2 text-sm font-bold !text-slate-800 transition hover:!bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:!bg-slate-900 dark:!text-white"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Nome da meta
                  </label>
                  <input
                    value={form.nome}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        nome: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Meta de matrículas do primeiro semestre"
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Descrição
                  </label>
                  <textarea
                    value={form.descricao}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        descricao: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Descreva o objetivo desta meta."
                    className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Escopo
                  </label>
                  <select
                    value={form.escopo}
                    onChange={(event) =>
                      alterarEscopo(event.target.value as EscopoMeta)
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  >
                    <option value="INSTITUICAO">Toda a instituição</option>
                    <option value="EQUIPE">Equipe comercial</option>
                    <option value="FUNCIONARIO">Funcionário individual</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Indicador
                  </label>
                  <select
                    value={form.indicador}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        indicador: event.target.value as IndicadorMeta,
                        valorAlvo: "",
                      }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  >
                    <option value="QUANTIDADE_MATRICULAS">
                      Quantidade de matrículas
                    </option>
                    <option value="VALOR_VENDIDO">Valor vendido</option>
                    <option value="VALOR_RECEBIDO">Valor recebido</option>
                    <option value="LEADS_CONVERTIDOS">Leads convertidos</option>
                  </select>
                </div>

                {form.escopo === "EQUIPE" && (
                  <>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                        Equipe responsável
                      </label>

                      <select
                        value={form.equipeId}
                        onChange={(event) =>
                          alterarEquipe(
                            event.target.value
                          )
                        }
                        className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                      >
                        <option value="">
                          Selecione a equipe
                        </option>

                        {catalogos.equipes.map(
                          (equipe) => (
                            <option
                              key={equipe.id}
                              value={equipe.id}
                            >
                              {equipe.nome}
                              {typeof equipe._count?.membros ===
                                "number"
                                ? ` — ${equipe._count.membros} membro(s)`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {form.equipeId && (
  <div className="phanyx-meta-participantes-box md:col-span-2 rounded-2xl border border-slate-200 !bg-slate-50 p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black !text-slate-900 dark:!text-white">
          Participantes desta meta
        </p>

        <p className="mt-1 text-xs !text-slate-600 dark:!text-slate-400">
          Os membros da equipe são sugeridos automaticamente, mas você pode incluir outros funcionários da instituição somente nesta meta.
        </p>
      </div>

      <div className="shrink-0 rounded-full border border-slate-300 !bg-slate-200 px-3 py-1 text-xs font-black !text-slate-950">
        {form.participanteIds.length}{" "}
        selecionado(s)
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          const idsEquipe =
            membrosEquipeSelecionada.map(
              (membro) =>
                membro.funcionarioId
            );

          setForm((atual) => ({
            ...atual,

            participanteIds:
              Array.from(
                new Set<number>([
                  ...atual.participanteIds,
                  ...idsEquipe,
                ])
              ),
          }));
        }}
        className="rounded-xl border border-slate-300 !bg-white px-3 py-2 text-xs font-black !text-slate-700 transition hover:!bg-slate-100"
      >
        Selecionar membros da equipe
      </button>

      <button
        type="button"
        onClick={() =>
          setForm(
            (atual) => ({
              ...atual,
              participanteIds: [],
            })
          )
        }
        className="rounded-xl border border-slate-300 !bg-white px-3 py-2 text-xs font-black !text-slate-700 transition hover:!bg-slate-100"
      >
        Limpar seleção
      </button>

      <button
        type="button"
        onClick={() =>
          setMostrarOutrosFuncionarios(
            (atual) => !atual
          )
        }
        className="rounded-xl border border-blue-700 !bg-blue-700 px-3 py-2 text-xs font-black !text-white transition hover:!bg-blue-800"
      >
        {mostrarOutrosFuncionarios
          ? "Fechar funcionários"
          : "+ Adicionar outros funcionários"}
      </button>
    </div>

    <div className="mt-5">
      <p className="text-xs font-black uppercase tracking-wide !text-slate-500">
        Membros da equipe
      </p>

      {membrosEquipeSelecionada.length >
      0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {membrosEquipeSelecionada.map(
            (membro) => {
              const selecionado =
                form.participanteIds.includes(
                  membro.funcionarioId
                );

              return (
                <label
                  key={membro.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    selecionado
                      ? "border-emerald-500 !bg-white ring-1 ring-emerald-200"
                      : "border-slate-200 !bg-white hover:border-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() =>
                      alternarParticipante(
                        membro.funcionarioId
                      )
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                  />

                  <div className="min-w-0">
                    <p className="font-black !text-slate-900">
                      {
                        membro
                          .funcionario
                          .nome
                      }
                    </p>

                    <p className="mt-1 text-xs !text-slate-500">
                      {membro
                        .funcionario
                        .cargo ||
                        "Cargo não informado"}

                      {membro
                        .funcionario
                        .departamento
                        ?.nome
                        ? ` — ${membro.funcionario.departamento.nome}`
                        : ""}
                    </p>

                    <p className="mt-1 text-[11px] font-bold !text-emerald-700">
                      Membro da equipe
                    </p>
                  </div>
                </label>
              );
            }
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-slate-300 !bg-white px-4 py-3 text-sm font-semibold !text-slate-600">
          Esta equipe não possui membros ativos. Você ainda pode adicionar outros funcionários à meta.
        </div>
      )}
    </div>

    {participantesAdicionaisSelecionados.length >
      0 && (
      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-wide !text-slate-500">
          Participantes adicionais
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {participantesAdicionaisSelecionados.map(
            (funcionario) => (
              <label
                key={
                  funcionario.id
                }
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-300 !bg-white p-4 ring-1 ring-violet-100"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() =>
                    alternarParticipante(
                      funcionario.id
                    )
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-violet-600"
                />

                <div className="min-w-0">
                  <p className="font-black !text-slate-900">
                    {funcionario.nome}
                  </p>

                  <p className="mt-1 text-xs !text-slate-500">
                    {funcionario.cargo ||
                      "Cargo não informado"}

                    {funcionario
                      .departamento
                      ?.nome
                      ? ` — ${funcionario.departamento.nome}`
                      : ""}
                  </p>

                  <p className="mt-1 text-[11px] font-bold !text-violet-700">
                    Participante adicional
                  </p>
                </div>
              </label>
            )
          )}
        </div>
      </div>
    )}

    {mostrarOutrosFuncionarios && (
      <div className="mt-5 rounded-2xl border border-slate-300 !bg-white p-4">
        <div>
          <p className="font-black !text-slate-900">
            Adicionar outros funcionários
          </p>

          <p className="mt-1 text-xs !text-slate-500">
            Selecionar um funcionário aqui não o adiciona à equipe comercial. Ele participará somente desta meta.
          </p>
        </div>

        <input
          type="search"
          value={buscaParticipante}
          onChange={(event) =>
            setBuscaParticipante(
              event.target.value
            )
          }
          placeholder="Buscar por nome, cargo ou departamento"
          className="mt-4 min-h-11 w-full rounded-xl border border-slate-300 !bg-white px-4 text-sm font-semibold !text-slate-950 outline-none focus:border-blue-600"
        />

        {outrosFuncionariosDisponiveis.length >
        0 ? (
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
            {outrosFuncionariosDisponiveis.map(
              (funcionario) => {
                const selecionado =
                  form.participanteIds.includes(
                    funcionario.id
                  );

                return (
                  <label
                    key={
                      funcionario.id
                    }
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selecionado
                        ? "border-violet-400 !bg-violet-50"
                        : "border-slate-200 !bg-white hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selecionado
                      }
                      onChange={() =>
                        alternarParticipante(
                          funcionario.id
                        )
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-violet-600"
                    />

                    <div className="min-w-0">
                      <p className="font-black !text-slate-900">
                        {
                          funcionario.nome
                        }
                      </p>

                      <p className="mt-1 text-xs !text-slate-500">
                        {funcionario.cargo ||
                          "Cargo não informado"}

                        {funcionario
                          .departamento
                          ?.nome
                          ? ` — ${funcionario.departamento.nome}`
                          : ""}
                      </p>
                    </div>
                  </label>
                );
              }
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 !bg-slate-50 px-4 py-3 text-sm font-semibold !text-slate-600">
            Nenhum outro funcionário encontrado.
          </div>
        )}
      </div>
    )}
  </div>
)}
                  </>
                )}

                {form.escopo === "FUNCIONARIO" && (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                      Funcionário responsável
                    </label>
                    <select
                      value={form.funcionarioId}
                      onChange={(event) =>
                        setForm((atual) => ({
                          ...atual,
                          funcionarioId: event.target.value,
                        }))
                      }
                      className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                    >
                      <option value="">Selecione o funcionário</option>
                      {catalogos.funcionarios.map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                          {funcionario.cargo ? ` — ${funcionario.cargo}` : ""}
                          {funcionario.departamento?.nome
                            ? ` — ${funcionario.departamento.nome}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Periodicidade
                  </label>
                  <select
                    value={form.periodicidade}
                    onChange={(event) =>
                      alterarPeriodicidade(
                        event.target.value as PeriodicidadeMeta
                      )
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                    <option value="PERSONALIZADA">Personalizada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Valor-alvo
                  </label>
                  <input
                    value={form.valorAlvo}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        valorAlvo: event.target.value,
                      }))
                    }
                    inputMode={indicadorEhValor ? "decimal" : "numeric"}
                    placeholder={indicadorEhValor ? "Ex.: 25.000,00" : "Ex.: 100"}
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  />
                  <p className="mt-2 text-xs !text-slate-500 dark:!text-slate-400">
                    {indicadorEhValor
                      ? "Informe o valor em reais."
                      : "Informe uma quantidade inteira."}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        dataInicio: event.target.value,
                      }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={form.dataFim}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        dataFim: event.target.value,
                      }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Curso
                  </label>
                  <select
                    value={form.cursoId}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        cursoId: event.target.value,
                      }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  >
                    <option value="">Todos os cursos</option>
                    {catalogos.cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome}
                        {curso.codigo ? ` — ${curso.codigo}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Polo
                  </label>
                  <select
                    value={form.poloId}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        poloId: event.target.value,
                      }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 !bg-white px-4 font-semibold !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  >
                    <option value="">Todos os polos</option>
                    {catalogos.polos.map((polo) => (
                      <option key={polo.id} value={polo.id}>
                        {polo.nome}
                        {polo.codigo ? ` — ${polo.codigo}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {!editandoId && (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                      Situação inicial
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label
                        className={`cursor-pointer rounded-2xl border p-4 transition ${form.status === "RASCUNHO"
                          ? "border-amber-600 !bg-amber-100 ring-1 ring-amber-300 dark:border-amber-700 dark:!bg-amber-950/30"
                          : "border-slate-200 !bg-white dark:border-slate-700 dark:!bg-slate-950"
                          }`}
                      >
                        <input
                          type="radio"
                          name="statusInicialMeta"
                          value="RASCUNHO"
                          checked={form.status === "RASCUNHO"}
                          onChange={() =>
                            setForm((atual) => ({
                              ...atual,
                              status: "RASCUNHO",
                            }))
                          }
                          className="mr-3"
                        />
                        <strong className="!text-slate-900 dark:!text-white">
                          Salvar como rascunho
                        </strong>
                        <span className="mt-1 block pl-7 text-xs !text-slate-500 dark:!text-slate-400">
                          Permite revisar a meta antes de ativá-la.
                        </span>
                      </label>

                      <label
                        className={`cursor-pointer rounded-2xl border p-4 transition ${form.status === "ATIVA"
                          ? "border-emerald-600 !bg-emerald-100 ring-1 ring-emerald-300 dark:border-emerald-700 dark:!bg-emerald-950/30"
                          : "border-slate-200 !bg-white dark:border-slate-700 dark:!bg-slate-950"
                          }`}
                      >
                        <input
                          type="radio"
                          name="statusInicialMeta"
                          value="ATIVA"
                          checked={form.status === "ATIVA"}
                          onChange={() =>
                            setForm((atual) => ({
                              ...atual,
                              status: "ATIVA",
                            }))
                          }
                          className="mr-3"
                        />
                        <strong className="!text-slate-900 dark:!text-white">
                          Criar como ativa
                        </strong>
                        <span className="mt-1 block pl-7 text-xs !text-slate-500 dark:!text-slate-400">
                          A meta já começa valendo para o período definido.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black !text-slate-800 dark:!text-slate-100">
                    Observações internas
                  </label>
                  <textarea
                    value={form.observacoes}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        observacoes: event.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Registre critérios, orientações ou informações internas sobre a meta."
                    className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:!bg-slate-950 dark:!text-white"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 !bg-slate-50 p-6 sm:flex-row sm:justify-end dark:border-slate-700 dark:!bg-slate-950">
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="min-h-11 rounded-2xl border border-slate-300 !bg-white px-5 text-sm font-black !text-slate-800 transition hover:!bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:!bg-slate-900 dark:!text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void salvarMeta()}
                disabled={salvando}
                className="min-h-11 rounded-2xl border !border-blue-700 !bg-blue-700 px-6 text-sm font-black !text-white transition hover:!bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Criar meta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmacao && configuracaoConfirmacao && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 !bg-white p-6 shadow-2xl dark:border-slate-700 dark:!bg-slate-900">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
              Confirmação
            </p>

            <h2 className="mt-2 text-2xl font-black !text-slate-950 dark:!text-white">
              {configuracaoConfirmacao.titulo}
            </h2>

            <p className="mt-3 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
              {configuracaoConfirmacao.mensagem}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmacao(null)}
                disabled={salvando}
                className="min-h-11 rounded-2xl border border-slate-300 !bg-white px-5 text-sm font-black !text-slate-800 transition hover:!bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:!bg-slate-900 dark:!text-white"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => void confirmarAcao()}
                disabled={salvando}
                className={`min-h-11 rounded-2xl border px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${configuracaoConfirmacao.classeBotao}`}
              >
                {salvando ? "Processando..." : configuracaoConfirmacao.acao}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}