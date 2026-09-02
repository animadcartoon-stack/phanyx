"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

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

type TemaEscolhido = "light" | "dark" | "system";
type ModoTema = "light" | "dark" | "system-dark";

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

type OpcaoSelectTema = {
  value: string;
  label: string;
};

const CATALOGOS_INICIAIS: CatalogosMetas = {
  equipes: [],
  funcionarios: [],
  cursos: [],
  polos: [],
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

function formatarData(
  valor: string | null | undefined,
  locale: string,
  rotuloDataInvalida: string
) {
  if (!valor) {
    return "—";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return rotuloDataInvalida;
  }

  return data.toLocaleDateString(locale, {
    timeZone: "UTC",
  });
}

function formatarNumero(valor: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function formatarMoeda(valor: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function formatarPercentual(
  valor: number | undefined,
  locale: string
) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}

function larguraBarraProgresso(valor: number | undefined) {
  const percentual = Number(valor ?? 0);

  if (!Number.isFinite(percentual)) {
    return 0;
  }

  return Math.min(Math.max(percentual, 0), 100);
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

function classeStatus(status: StatusMeta) {
  if (status === "ATIVA") {
    return "border-emerald-700 bg-emerald-700 text-white";
  }

  if (status === "RASCUNHO") {
    return "border-amber-700 bg-amber-600 text-white";
  }

  if (status === "ENCERRADA") {
    return "border-slate-600 bg-slate-700 text-white";
  }

  return "border-red-700 bg-red-700 text-white";
}

function SelectTema({
  value,
  options,
  onChange,
  modoTema,
  disabled = false,
  ariaLabel,
}: {
  value: string;
  options: OpcaoSelectTema[];
  onChange: (value: string) => void;
  modoTema: ModoTema;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  const selecionada =
    options.find((option) => option.value === value) ?? options[0];

  const botao =
    modoTema === "dark"
      ? "border-blue-800 bg-blue-950 text-blue-50"
      : modoTema === "system-dark"
        ? "border-neutral-600 bg-neutral-800 text-white"
        : "border-slate-300 bg-white text-slate-950";

  const menu =
    modoTema === "dark"
      ? "border-blue-800 bg-blue-950"
      : modoTema === "system-dark"
        ? "border-neutral-600 bg-neutral-800"
        : "border-slate-300 bg-white";

  function classeOpcao(ativa: boolean) {
    if (modoTema === "dark") {
      return ativa
        ? "bg-blue-800 text-white"
        : "text-blue-50 hover:bg-blue-900";
    }

    if (modoTema === "system-dark") {
      return ativa
        ? "bg-neutral-600 text-white"
        : "text-neutral-100 hover:bg-neutral-700";
    }

    return ativa
      ? "bg-slate-200 text-slate-950"
      : "text-slate-900 hover:bg-slate-100";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={aberto}
        onClick={() => {
          if (!disabled) {
            setAberto((atual) => !atual);
          }
        }}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${botao}`}
      >
        <span className="truncate">{selecionada?.label ?? ""}</span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto && !disabled && (
        <div
          className={`absolute left-0 right-0 top-full z-[180] mt-1 max-h-72 overflow-y-auto rounded-2xl border p-1 shadow-2xl ${menu}`}
        >
          {options.map((option) => {
            const ativa = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setAberto(false);
                }}
                className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${classeOpcao(
                  ativa
                )}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MetasComerciaisPage() {
  const t = useTranslations("AdminCommercialGoals");
  const locale = useLocale();

  const [temaAtual, setTemaAtual] =
    useState<TemaEscolhido>("light");
  const [sistemaEscuro, setSistemaEscuro] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function sincronizarTema() {
      const html = document.documentElement;
      const armazenado = window.localStorage.getItem("phanyx_tema");
      const candidato =
        html.dataset.themeChoice ||
        armazenado ||
        "system";

      const tema: TemaEscolhido =
        candidato === "light" ||
        candidato === "dark" ||
        candidato === "system"
          ? candidato
          : "system";

      setTemaAtual(tema);
      setSistemaEscuro(media.matches);
    }

    sincronizarTema();

    const observer = new MutationObserver(sincronizarTema);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "class",
        "data-theme",
        "data-theme-choice",
      ],
    });

    window.addEventListener("storage", sincronizarTema);
    window.addEventListener("phanyx-theme-change", sincronizarTema);

    const listenerMedia = () => sincronizarTema();
    media.addEventListener("change", listenerMedia);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sincronizarTema);
      window.removeEventListener(
        "phanyx-theme-change",
        sincronizarTema
      );
      media.removeEventListener("change", listenerMedia);
    };
  }, []);

  const modoTema: ModoTema =
    temaAtual === "dark"
      ? "dark"
      : temaAtual === "system" && sistemaEscuro
        ? "system-dark"
        : "light";

  const c = useMemo(() => {
    if (modoTema === "dark") {
      return {
        page: "bg-[#020617] text-white",
        panel: "border-blue-900/80 bg-blue-950/70",
        panelStrong: "border-blue-800 bg-blue-950",
        panelSoft: "border-blue-900/70 bg-blue-950/45",
        input:
          "border-blue-800 bg-blue-950 text-blue-50 placeholder:text-blue-200/50",
        primary: "text-white",
        secondary: "text-blue-100/80",
        muted: "text-blue-200/60",
        divider: "border-blue-900/80",
        ghostButton:
          "border-blue-800 bg-blue-950 text-blue-50 hover:bg-blue-900",
        modalFooter: "border-blue-900 bg-blue-950",
        kicker: "text-blue-300",
      };
    }

    if (modoTema === "system-dark") {
      return {
        page: "bg-neutral-900 text-white",
        panel: "border-neutral-700 bg-neutral-900",
        panelStrong: "border-neutral-600 bg-neutral-800",
        panelSoft: "border-neutral-700 bg-neutral-800/70",
        input:
          "border-neutral-600 bg-neutral-800 text-white placeholder:text-neutral-400",
        primary: "text-white",
        secondary: "text-neutral-200",
        muted: "text-neutral-400",
        divider: "border-neutral-700",
        ghostButton:
          "border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700",
        modalFooter: "border-neutral-700 bg-neutral-800",
        kicker: "text-neutral-300",
      };
    }

    return {
      page: "bg-slate-50 text-slate-950",
      panel: "border-slate-200 bg-white",
      panelStrong: "border-slate-300 bg-white",
      panelSoft: "border-slate-200 bg-slate-50",
      input:
        "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500",
      primary: "text-slate-950",
      secondary: "text-slate-600",
      muted: "text-slate-500",
      divider: "border-slate-200",
      ghostButton:
        "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
      modalFooter: "border-slate-200 bg-slate-50",
      kicker: "text-blue-700",
    };
  }, [modoTema]);

  const rotulosEscopo = useMemo<Record<EscopoMeta, string>>(
    () => ({
      INSTITUICAO: t("scope.institution"),
      EQUIPE: t("scope.team"),
      FUNCIONARIO: t("scope.employee"),
    }),
    [t]
  );

  const rotulosIndicador = useMemo<Record<IndicadorMeta, string>>(
    () => ({
      QUANTIDADE_MATRICULAS: t("indicator.enrollments"),
      VALOR_VENDIDO: t("indicator.soldAmount"),
      VALOR_RECEBIDO: t("indicator.receivedAmount"),
      LEADS_CONVERTIDOS: t("indicator.convertedLeads"),
    }),
    [t]
  );

  const rotulosPeriodicidade =
    useMemo<Record<PeriodicidadeMeta, string>>(
      () => ({
        MENSAL: t("periodicity.monthly"),
        TRIMESTRAL: t("periodicity.quarterly"),
        SEMESTRAL: t("periodicity.semiannual"),
        ANUAL: t("periodicity.annual"),
        PERSONALIZADA: t("periodicity.custom"),
      }),
      [t]
    );

  const rotulosStatus = useMemo<Record<StatusMeta, string>>(
    () => ({
      RASCUNHO: t("status.draft"),
      ATIVA: t("status.active"),
      ENCERRADA: t("status.closed"),
      CANCELADA: t("status.canceled"),
    }),
    [t]
  );

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

  const [buscaParticipante, setBuscaParticipante] = useState("");

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

  function valorMetaFormatado(meta: MetaComercial) {
    if (
      meta.indicador === "VALOR_VENDIDO" ||
      meta.indicador === "VALOR_RECEBIDO"
    ) {
      return formatarMoeda(meta.valorAlvo, locale);
    }

    return formatarNumero(meta.valorAlvo, locale);
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
      return formatarMoeda(numero, locale);
    }

    return formatarNumero(numero, locale);
  }

  function descricaoResponsavel(meta: MetaComercial) {
    if (meta.escopo === "EQUIPE") {
      return meta.equipe?.nome || t("common.teamNotProvided");
    }

    if (meta.escopo === "FUNCIONARIO") {
      return meta.funcionario?.nome || t("common.employeeNotProvided");
    }

    return t("common.wholeInstitution");
  }

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
        throw new Error(dados?.error || t("errors.load"));
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
        error instanceof Error ? error.message : t("errors.loadGeneric")
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void Promise.all([carregarControleAcesso(), carregarMetas()]);
    // carga inicial intencional
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        rotulosEscopo[meta.escopo],
        rotulosIndicador[meta.indicador],
        rotulosStatus[meta.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [
    metas,
    busca,
    filtroStatus,
    filtroEscopo,
    filtroIndicador,
    rotulosEscopo,
    rotulosIndicador,
    rotulosStatus,
  ]);

  const metricas = useMemo(() => {
    return {
      total: metas.length,
      ativas: metas.filter((meta) => meta.status === "ATIVA").length,
      rascunhos: metas.filter((meta) => meta.status === "RASCUNHO").length,
      encerradas: metas.filter((meta) => meta.status === "ENCERRADA").length,
      canceladas: metas.filter((meta) => meta.status === "CANCELADA").length,
    };
  }, [metas]);

  const equipeSelecionada = useMemo(
    () =>
      catalogos.equipes.find(
        (equipe) => String(equipe.id) === form.equipeId
      ) ?? null,
    [catalogos.equipes, form.equipeId]
  );

  const membrosEquipeSelecionada = equipeSelecionada?.membros ?? [];

  const idsMembrosEquipeSelecionada = useMemo(
    () =>
      new Set<number>(
        (equipeSelecionada?.membros ?? []).map(
          (membro) => membro.funcionarioId
        )
      ),
    [equipeSelecionada]
  );

  const participantesAdicionaisSelecionados = useMemo(
    () =>
      catalogos.funcionarios.filter(
        (funcionario) =>
          form.participanteIds.includes(funcionario.id) &&
          !idsMembrosEquipeSelecionada.has(funcionario.id)
      ),
    [
      catalogos.funcionarios,
      form.participanteIds,
      idsMembrosEquipeSelecionada,
    ]
  );

  const outrosFuncionariosDisponiveis = useMemo(() => {
    const termo = buscaParticipante.trim().toLowerCase();

    return catalogos.funcionarios.filter((funcionario) => {
      if (idsMembrosEquipeSelecionada.has(funcionario.id)) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = [
        funcionario.nome,
        funcionario.cargo,
        funcionario.departamento?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
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
      setErro(t("errors.lockedGoal"));
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
      equipeId: meta.equipeId ? String(meta.equipeId) : "",
      participanteIds:
        meta.escopo === "EQUIPE"
          ? Array.from(
              new Set<number>(
                (meta.participantes ?? [])
                  .filter((participante) => participante.ativo)
                  .map(
                    (participante) => participante.funcionarioId
                  )
              )
            )
          : [],
      funcionarioId: meta.funcionarioId
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

  function alterarEscopo(escopo: EscopoMeta) {
    setForm((atual) => ({
      ...atual,
      escopo,
      equipeId: escopo === "EQUIPE" ? atual.equipeId : "",
      participanteIds:
        escopo === "EQUIPE" ? atual.participanteIds : [],
      funcionarioId:
        escopo === "FUNCIONARIO" ? atual.funcionarioId : "",
    }));
  }

  function alterarEquipe(equipeId: string) {
    const equipe = catalogos.equipes.find(
      (item) => String(item.id) === equipeId
    );

    const participanteIds =
      equipe?.membros?.map((membro) => membro.funcionarioId) ?? [];

    setForm((atual) => ({
      ...atual,
      equipeId,
      participanteIds,
    }));
  }

  function alternarParticipante(funcionarioId: number) {
    setForm((atual) => {
      const selecionado =
        atual.participanteIds.includes(funcionarioId);

      return {
        ...atual,
        participanteIds: selecionado
          ? atual.participanteIds.filter((id) => id !== funcionarioId)
          : [...atual.participanteIds, funcionarioId],
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
      setErro(t("errors.name"));
      return;
    }

    if (!form.dataInicio || !form.dataFim) {
      setErro(t("errors.dates"));
      return;
    }

    if (form.dataFim < form.dataInicio) {
      setErro(t("errors.endBeforeStart"));
      return;
    }

    if (!Number.isFinite(valorAlvo) || valorAlvo <= 0) {
      setErro(t("errors.targetPositive"));
      return;
    }

    if (
      (form.indicador === "QUANTIDADE_MATRICULAS" ||
        form.indicador === "LEADS_CONVERTIDOS") &&
      !Number.isInteger(valorAlvo)
    ) {
      setErro(t("errors.integerTarget"));
      return;
    }

    if (form.escopo === "EQUIPE" && !form.equipeId) {
      setErro(t("errors.team"));
      return;
    }

    if (
      form.escopo === "EQUIPE" &&
      form.participanteIds.length === 0
    ) {
      setErro(t("errors.participant"));
      return;
    }

    if (form.escopo === "FUNCIONARIO" && !form.funcionarioId) {
      setErro(t("errors.employee"));
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
        throw new Error(dados?.error || t("errors.save"));
      }

      setModalAberto(false);
      setEditandoId(null);
      setForm(criarFormInicial());
      setSucesso(
        dados?.mensagem ||
          (editandoId
            ? t("success.updated")
            : t("success.created"))
      );

      await carregarMetas();
    } catch (error: unknown) {
      setErro(
        error instanceof Error ? error.message : t("errors.saveGeneric")
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirConfirmacao(
    acao: AcaoConfirmacao,
    meta: MetaComercial
  ) {
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
        throw new Error(dados?.error || t("errors.action"));
      }

      setConfirmacao(null);
      setSucesso(dados?.mensagem || t("success.action"));
      await carregarMetas();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.actionGeneric")
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
        titulo: t("confirmation.activate.title"),
        mensagem: t("confirmation.activate.message", { name: nome }),
        acao: t("confirmation.activate.action"),
        classeBotao:
          "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
      };
    }

    if (confirmacao.acao === "ENCERRAR") {
      return {
        titulo: t("confirmation.close.title"),
        mensagem: t("confirmation.close.message", { name: nome }),
        acao: t("confirmation.close.action"),
        classeBotao:
          "border-slate-700 bg-slate-700 text-white hover:bg-slate-800",
      };
    }

    if (confirmacao.acao === "CANCELAR") {
      return {
        titulo: t("confirmation.cancel.title"),
        mensagem: t("confirmation.cancel.message", { name: nome }),
        acao: t("confirmation.cancel.action"),
        classeBotao:
          "border-red-700 bg-red-700 text-white hover:bg-red-800",
      };
    }

    return {
      titulo: t("confirmation.delete.title"),
      mensagem: t("confirmation.delete.message", { name: nome }),
      acao: t("confirmation.delete.action"),
      classeBotao:
        "border-red-700 bg-red-700 text-white hover:bg-red-800",
    };
  }, [confirmacao, t]);

  const indicadorEhValor =
    form.indicador === "VALOR_VENDIDO" ||
    form.indicador === "VALOR_RECEBIDO";

  const opcoesFiltroStatus: OpcaoSelectTema[] = [
    { value: "TODOS", label: t("filters.allStatuses") },
    { value: "RASCUNHO", label: rotulosStatus.RASCUNHO },
    { value: "ATIVA", label: rotulosStatus.ATIVA },
    { value: "ENCERRADA", label: rotulosStatus.ENCERRADA },
    { value: "CANCELADA", label: rotulosStatus.CANCELADA },
  ];

  const opcoesFiltroEscopo: OpcaoSelectTema[] = [
    { value: "TODOS", label: t("filters.allScopes") },
    { value: "INSTITUICAO", label: rotulosEscopo.INSTITUICAO },
    { value: "EQUIPE", label: rotulosEscopo.EQUIPE },
    { value: "FUNCIONARIO", label: rotulosEscopo.FUNCIONARIO },
  ];

  const opcoesFiltroIndicador: OpcaoSelectTema[] = [
    { value: "TODOS", label: t("filters.allIndicators") },
    {
      value: "QUANTIDADE_MATRICULAS",
      label: t("indicator.enrollmentsShort"),
    },
    {
      value: "VALOR_VENDIDO",
      label: rotulosIndicador.VALOR_VENDIDO,
    },
    {
      value: "VALOR_RECEBIDO",
      label: rotulosIndicador.VALOR_RECEBIDO,
    },
    {
      value: "LEADS_CONVERTIDOS",
      label: rotulosIndicador.LEADS_CONVERTIDOS,
    },
  ];

  return (
    <main
      className={`phanyx-metas-comerciais-page min-h-screen w-full ${c.page}`}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        <header
          className={`rounded-3xl border p-6 shadow-sm ${c.panel}`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p
                className={`text-xs font-black uppercase tracking-[0.22em] ${c.kicker}`}
              >
                {t("header.kicker")}
              </p>

              <h1 className={`mt-2 text-3xl font-black ${c.primary}`}>
                {t("header.title")}
              </h1>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.secondary}`}
              >
                {t("header.description")}
              </p>
            </div>

            {!carregandoPermissoes && podeCriarMeta && (
              <button
                type="button"
                onClick={abrirNovaMeta}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-700 bg-blue-700 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
              >
                {t("header.newGoal")}
              </button>
            )}
          </div>
        </header>

        {erro && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              modoTema === "light"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-red-800 bg-red-950/40 text-red-100"
            }`}
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              modoTema === "light"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-emerald-800 bg-emerald-950/40 text-emerald-100"
            }`}
          >
            {sucesso}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { titulo: t("metrics.total"), valor: metricas.total },
            { titulo: t("metrics.active"), valor: metricas.ativas },
            { titulo: t("metrics.drafts"), valor: metricas.rascunhos },
            { titulo: t("metrics.closed"), valor: metricas.encerradas },
            { titulo: t("metrics.canceled"), valor: metricas.canceladas },
          ].map((item) => (
            <article
              key={item.titulo}
              className={`rounded-3xl border p-5 shadow-sm ${c.panel}`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
              >
                {item.titulo}
              </p>

              <p className={`mt-3 text-3xl font-black ${c.primary}`}>
                {item.valor}
              </p>
            </article>
          ))}
        </section>

        <section
          className={`rounded-3xl border p-5 shadow-sm ${c.panel}`}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_230px]">
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className={`min-h-12 w-full rounded-2xl border px-4 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 ${c.input}`}
            />

            <SelectTema
              value={filtroStatus}
              onChange={(valor) =>
                setFiltroStatus(valor as StatusMeta | "TODOS")
              }
              options={opcoesFiltroStatus}
              modoTema={modoTema}
              ariaLabel={t("filters.statusAria")}
            />

            <SelectTema
              value={filtroEscopo}
              onChange={(valor) =>
                setFiltroEscopo(valor as EscopoMeta | "TODOS")
              }
              options={opcoesFiltroEscopo}
              modoTema={modoTema}
              ariaLabel={t("filters.scopeAria")}
            />

            <SelectTema
              value={filtroIndicador}
              onChange={(valor) =>
                setFiltroIndicador(valor as IndicadorMeta | "TODOS")
              }
              options={opcoesFiltroIndicador}
              modoTema={modoTema}
              ariaLabel={t("filters.indicatorAria")}
            />
          </div>
        </section>

        {carregando ? (
          <div
            className={`rounded-3xl border p-10 text-center font-semibold shadow-sm ${c.panel} ${c.secondary}`}
          >
            {t("loading")}
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div
            className={`rounded-3xl border border-dashed p-12 text-center shadow-sm ${c.panel}`}
          >
            <p className={`text-lg font-black ${c.primary}`}>
              {t("empty.title")}
            </p>

            <p className={`mt-2 text-sm ${c.secondary}`}>
              {t("empty.description")}
            </p>
          </div>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2">
            {metasFiltradas.map((meta) => {
              const podeAlterar =
                meta.status === "RASCUNHO" ||
                meta.status === "ATIVA";

              return (
                <article
                  key={meta.id}
                  className={`flex min-h-[360px] flex-col rounded-3xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${c.panel}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          className={`text-xl font-black ${c.primary}`}
                        >
                          {meta.nome}
                        </h2>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatus(
                            meta.status
                          )}`}
                        >
                          {rotulosStatus[meta.status]}
                        </span>
                      </div>

                      <p
                        className={`mt-2 text-sm leading-6 ${c.secondary}`}
                      >
                        {meta.descricao || t("card.noDescription")}
                      </p>
                    </div>

                    <div
                      className={`shrink-0 rounded-2xl border px-4 py-3 text-right ${c.panelSoft}`}
                    >
                      <p
                        className={`text-[11px] font-black uppercase tracking-wide ${c.muted}`}
                      >
                        {t("card.definedGoal")}
                      </p>
                      <p
                        className={`mt-1 text-xl font-black ${c.primary}`}
                      >
                        {valorMetaFormatado(meta)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-2xl border p-4 ${c.panelSoft}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-xs font-black uppercase tracking-wide ${c.muted}`}
                        >
                          {t("card.progressTitle")}
                        </p>

                        <p className={`mt-1 text-xs ${c.secondary}`}>
                          {t("card.progressAuto")}
                        </p>
                      </div>

                      {meta.atingida && (
                        <span className="rounded-full border border-emerald-700 bg-emerald-700 px-3 py-1 text-xs font-black text-white">
                          {t("card.achieved")}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: t("card.actual"),
                          value: valorApuracaoFormatado(
                            meta,
                            meta.valorRealizado
                          ),
                        },
                        {
                          label: t("card.remaining"),
                          value: valorApuracaoFormatado(
                            meta,
                            meta.valorRestante
                          ),
                        },
                        {
                          label: t("card.progress"),
                          value: `${formatarPercentual(
                            meta.percentualAtingido,
                            locale
                          )}%`,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl border p-3 ${c.panelStrong}`}
                        >
                          <p
                            className={`text-[11px] font-bold uppercase tracking-wide ${c.muted}`}
                          >
                            {item.label}
                          </p>
                          <p
                            className={`mt-1 text-lg font-black ${c.primary}`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
                        <span className={c.secondary}>
                          {t("card.progressLabel")}
                        </span>

                        <span className={c.primary}>
                          {formatarPercentual(
                            meta.percentualAtingido,
                            locale
                          )}
                          %
                        </span>
                      </div>

                      <div
                        className={`h-3 w-full overflow-hidden rounded-full ${
                          modoTema === "light"
                            ? "bg-slate-200"
                            : modoTema === "dark"
                              ? "bg-blue-900"
                              : "bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            meta.atingida
                              ? "bg-emerald-600"
                              : "bg-blue-600"
                          }`}
                          style={{
                            width: `${larguraBarraProgresso(
                              meta.percentualAtingido
                            )}%`,
                          }}
                        />
                      </div>

                      {meta.atingida && (
                        <p className="mt-2 text-xs font-black text-emerald-600">
                          ✓ {t("card.reached")}
                          {Number(meta.percentualAtingido ?? 0) > 100
                            ? ` — ${t("card.aboveGoal", {
                                value: formatarPercentual(
                                  Number(
                                    meta.percentualAtingido ?? 0
                                  ) - 100,
                                  locale
                                ),
                              })}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div
                      className={`rounded-2xl border p-4 ${c.panelSoft}`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                      >
                        {t("card.indicator")}
                      </p>
                      <p
                        className={`mt-2 font-black ${c.primary}`}
                      >
                        {rotulosIndicador[meta.indicador]}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl border p-4 ${c.panelSoft}`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                      >
                        {t("card.responsible")}
                      </p>
                      <p
                        className={`mt-2 font-black ${c.primary}`}
                      >
                        {descricaoResponsavel(meta)}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl border p-4 ${c.panelSoft}`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                      >
                        {t("card.period")}
                      </p>
                      <p
                        className={`mt-2 font-black ${c.primary}`}
                      >
                        {formatarData(
                          meta.dataInicio,
                          locale,
                          t("common.invalidDate")
                        )}{" "}
                        {t("common.to")}{" "}
                        {formatarData(
                          meta.dataFim,
                          locale,
                          t("common.invalidDate")
                        )}
                      </p>
                      <p className={`mt-1 text-xs ${c.muted}`}>
                        {rotulosPeriodicidade[meta.periodicidade]}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl border p-4 ${c.panelSoft}`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                      >
                        {t("card.segmentation")}
                      </p>
                      <p
                        className={`mt-2 font-black ${c.primary}`}
                      >
                        {meta.curso?.nome || t("common.allCourses")}
                      </p>
                      <p className={`mt-1 text-xs ${c.muted}`}>
                        {meta.polo?.nome || t("common.allCampuses")}
                      </p>
                    </div>
                  </div>

                  {meta.observacoes && (
                    <div
                      className={`mt-4 rounded-2xl border p-4 ${c.panelStrong}`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                      >
                        {t("card.notes")}
                      </p>
                      <p
                        className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${c.secondary}`}
                      >
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
                            className={`rounded-2xl border px-4 py-2.5 text-sm font-black transition ${c.ghostButton}`}
                          >
                            {t("actions.edit")}
                          </button>
                        )}

                        {podeEditarMeta &&
                          meta.status === "RASCUNHO" && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirConfirmacao("ATIVAR", meta)
                              }
                              className="rounded-2xl border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
                            >
                              {t("actions.activate")}
                            </button>
                          )}

                        {podeEditarMeta &&
                          meta.status === "ATIVA" && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirConfirmacao("ENCERRAR", meta)
                              }
                              className="rounded-2xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
                            >
                              {t("actions.close")}
                            </button>
                          )}

                        {podeEditarMeta && podeAlterar && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirConfirmacao("CANCELAR", meta)
                            }
                            className="rounded-2xl border border-amber-700 bg-amber-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-700"
                          >
                            {t("actions.cancel")}
                          </button>
                        )}

                        {podeExcluirMeta &&
                          meta.status === "RASCUNHO" && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirConfirmacao("EXCLUIR", meta)
                              }
                              className="rounded-2xl border border-red-700 bg-red-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-800"
                            >
                              {t("actions.deleteDraft")}
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
            <div
              className={`my-4 max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border shadow-2xl ${c.panel}`}
            >
              <div
                className={`sticky top-0 z-10 flex items-start justify-between gap-4 border-b p-6 ${c.divider} ${c.panel}`}
              >
                <div>
                  <p
                    className={`text-xs font-black uppercase tracking-[0.2em] ${c.kicker}`}
                  >
                    {t("modal.kicker")}
                  </p>
                  <h2
                    className={`mt-2 text-2xl font-black ${c.primary}`}
                  >
                    {editandoId
                      ? t("modal.editTitle")
                      : t("modal.newTitle")}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className={`rounded-2xl border px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${c.ghostButton}`}
                >
                  {t("modal.close")}
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.name")}
                    </label>
                    <input
                      value={form.nome}
                      onChange={(event) =>
                        setForm((atual) => ({
                          ...atual,
                          nome: event.target.value,
                        }))
                      }
                      placeholder={t("modal.placeholders.name")}
                      className={`min-h-12 w-full rounded-2xl border px-4 outline-none focus:border-blue-600 ${c.input}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.description")}
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
                      placeholder={t(
                        "modal.placeholders.description"
                      )}
                      className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600 ${c.input}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.scope")}
                    </label>
                    <SelectTema
                      value={form.escopo}
                      onChange={(valor) =>
                        alterarEscopo(valor as EscopoMeta)
                      }
                      modoTema={modoTema}
                      options={[
                        {
                          value: "INSTITUICAO",
                          label: t("modal.scopeOptions.institution"),
                        },
                        {
                          value: "EQUIPE",
                          label: t("modal.scopeOptions.team"),
                        },
                        {
                          value: "FUNCIONARIO",
                          label: t("modal.scopeOptions.employee"),
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.indicator")}
                    </label>
                    <SelectTema
                      value={form.indicador}
                      onChange={(valor) =>
                        setForm((atual) => ({
                          ...atual,
                          indicador: valor as IndicadorMeta,
                          valorAlvo: "",
                        }))
                      }
                      modoTema={modoTema}
                      options={[
                        {
                          value: "QUANTIDADE_MATRICULAS",
                          label: rotulosIndicador.QUANTIDADE_MATRICULAS,
                        },
                        {
                          value: "VALOR_VENDIDO",
                          label: rotulosIndicador.VALOR_VENDIDO,
                        },
                        {
                          value: "VALOR_RECEBIDO",
                          label: rotulosIndicador.VALOR_RECEBIDO,
                        },
                        {
                          value: "LEADS_CONVERTIDOS",
                          label: rotulosIndicador.LEADS_CONVERTIDOS,
                        },
                      ]}
                    />
                  </div>

                  {form.escopo === "EQUIPE" && (
                    <>
                      <div className="md:col-span-2">
                        <label
                          className={`mb-2 block text-sm font-black ${c.primary}`}
                        >
                          {t("modal.fields.team")}
                        </label>

                        <SelectTema
                          value={form.equipeId}
                          onChange={alterarEquipe}
                          modoTema={modoTema}
                          options={[
                            {
                              value: "",
                              label: t("modal.selectTeam"),
                            },
                            ...catalogos.equipes.map((equipe) => ({
                              value: String(equipe.id),
                              label:
                                equipe.nome +
                                (typeof equipe._count?.membros ===
                                "number"
                                  ? ` — ${t("common.memberCount", {
                                      count:
                                        equipe._count.membros,
                                    })}`
                                  : ""),
                            })),
                          ]}
                        />
                      </div>

                      {form.equipeId && (
                        <div
                          className={`md:col-span-2 rounded-2xl border p-5 ${c.panelSoft}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p
                                className={`text-sm font-black ${c.primary}`}
                              >
                                {t("participants.title")}
                              </p>

                              <p
                                className={`mt-1 text-xs ${c.secondary}`}
                              >
                                {t("participants.description")}
                              </p>
                            </div>

                            <div
                              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${c.panelStrong} ${c.primary}`}
                            >
                              {t("common.selectedCount", {
                                count:
                                  form.participanteIds.length,
                              })}
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
                              className={`rounded-xl border px-3 py-2 text-xs font-black transition ${c.ghostButton}`}
                            >
                              {t("participants.selectTeamMembers")}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setForm((atual) => ({
                                  ...atual,
                                  participanteIds: [],
                                }))
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-black transition ${c.ghostButton}`}
                            >
                              {t("participants.clearSelection")}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setMostrarOutrosFuncionarios(
                                  (atual) => !atual
                                )
                              }
                              className="rounded-xl border border-blue-700 bg-blue-700 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-800"
                            >
                              {mostrarOutrosFuncionarios
                                ? t("participants.closeEmployees")
                                : t("participants.addOtherEmployees")}
                            </button>
                          </div>

                          <div className="mt-5">
                            <p
                              className={`text-xs font-black uppercase tracking-wide ${c.muted}`}
                            >
                              {t("participants.teamMembers")}
                            </p>

                            {membrosEquipeSelecionada.length > 0 ? (
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
                                            ? "border-emerald-500 bg-emerald-950/10"
                                            : c.panelStrong
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
                                          <p
                                            className={`font-black ${c.primary}`}
                                          >
                                            {membro.funcionario.nome}
                                          </p>

                                          <p
                                            className={`mt-1 text-xs ${c.muted}`}
                                          >
                                            {membro.funcionario.cargo ||
                                              t("common.roleNotProvided")}
                                            {membro.funcionario
                                              .departamento?.nome
                                              ? ` — ${membro.funcionario.departamento.nome}`
                                              : ""}
                                          </p>

                                          <p className="mt-1 text-[11px] font-bold text-emerald-600">
                                            {t(
                                              "participants.teamMember"
                                            )}
                                          </p>
                                        </div>
                                      </label>
                                    );
                                  }
                                )}
                              </div>
                            ) : (
                              <div
                                className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${c.panelStrong} ${c.secondary}`}
                              >
                                {t("participants.noActiveMembers")}
                              </div>
                            )}
                          </div>

                          {participantesAdicionaisSelecionados.length >
                            0 && (
                            <div className="mt-5">
                              <p
                                className={`text-xs font-black uppercase tracking-wide ${c.muted}`}
                              >
                                {t(
                                  "participants.additionalParticipants"
                                )}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {participantesAdicionaisSelecionados.map(
                                  (funcionario) => (
                                    <label
                                      key={funcionario.id}
                                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-500 bg-violet-950/10 p-4"
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
                                        <p
                                          className={`font-black ${c.primary}`}
                                        >
                                          {funcionario.nome}
                                        </p>

                                        <p
                                          className={`mt-1 text-xs ${c.muted}`}
                                        >
                                          {funcionario.cargo ||
                                            t(
                                              "common.roleNotProvided"
                                            )}
                                          {funcionario.departamento
                                            ?.nome
                                            ? ` — ${funcionario.departamento.nome}`
                                            : ""}
                                        </p>

                                        <p className="mt-1 text-[11px] font-bold text-violet-500">
                                          {t(
                                            "participants.additionalParticipant"
                                          )}
                                        </p>
                                      </div>
                                    </label>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {mostrarOutrosFuncionarios && (
                            <div
                              className={`mt-5 rounded-2xl border p-4 ${c.panelStrong}`}
                            >
                              <div>
                                <p
                                  className={`font-black ${c.primary}`}
                                >
                                  {t(
                                    "participants.addOtherEmployeesTitle"
                                  )}
                                </p>

                                <p
                                  className={`mt-1 text-xs ${c.muted}`}
                                >
                                  {t(
                                    "participants.addOtherEmployeesDescription"
                                  )}
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
                                placeholder={t(
                                  "participants.searchPlaceholder"
                                )}
                                className={`mt-4 min-h-11 w-full rounded-xl border px-4 text-sm font-semibold outline-none focus:border-blue-600 ${c.input}`}
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
                                          key={funcionario.id}
                                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                            selecionado
                                              ? "border-violet-500 bg-violet-950/10"
                                              : c.panelSoft
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selecionado}
                                            onChange={() =>
                                              alternarParticipante(
                                                funcionario.id
                                              )
                                            }
                                            className="mt-1 h-4 w-4 shrink-0 accent-violet-600"
                                          />

                                          <div className="min-w-0">
                                            <p
                                              className={`font-black ${c.primary}`}
                                            >
                                              {funcionario.nome}
                                            </p>

                                            <p
                                              className={`mt-1 text-xs ${c.muted}`}
                                            >
                                              {funcionario.cargo ||
                                                t(
                                                  "common.roleNotProvided"
                                                )}
                                              {funcionario
                                                .departamento?.nome
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
                                <div
                                  className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${c.panelSoft} ${c.secondary}`}
                                >
                                  {t(
                                    "participants.noOtherEmployees"
                                  )}
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
                      <label
                        className={`mb-2 block text-sm font-black ${c.primary}`}
                      >
                        {t("modal.fields.employee")}
                      </label>
                      <SelectTema
                        value={form.funcionarioId}
                        onChange={(valor) =>
                          setForm((atual) => ({
                            ...atual,
                            funcionarioId: valor,
                          }))
                        }
                        modoTema={modoTema}
                        options={[
                          {
                            value: "",
                            label: t("modal.selectEmployee"),
                          },
                          ...catalogos.funcionarios.map(
                            (funcionario) => ({
                              value: String(funcionario.id),
                              label:
                                funcionario.nome +
                                (funcionario.cargo
                                  ? ` — ${funcionario.cargo}`
                                  : "") +
                                (funcionario.departamento?.nome
                                  ? ` — ${funcionario.departamento.nome}`
                                  : ""),
                            })
                          ),
                        ]}
                      />
                    </div>
                  )}

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.periodicity")}
                    </label>
                    <SelectTema
                      value={form.periodicidade}
                      onChange={(valor) =>
                        alterarPeriodicidade(
                          valor as PeriodicidadeMeta
                        )
                      }
                      modoTema={modoTema}
                      options={[
                        {
                          value: "MENSAL",
                          label: rotulosPeriodicidade.MENSAL,
                        },
                        {
                          value: "TRIMESTRAL",
                          label: rotulosPeriodicidade.TRIMESTRAL,
                        },
                        {
                          value: "SEMESTRAL",
                          label: rotulosPeriodicidade.SEMESTRAL,
                        },
                        {
                          value: "ANUAL",
                          label: rotulosPeriodicidade.ANUAL,
                        },
                        {
                          value: "PERSONALIZADA",
                          label:
                            rotulosPeriodicidade.PERSONALIZADA,
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.target")}
                    </label>
                    <input
                      value={form.valorAlvo}
                      onChange={(event) =>
                        setForm((atual) => ({
                          ...atual,
                          valorAlvo: event.target.value,
                        }))
                      }
                      inputMode={
                        indicadorEhValor ? "decimal" : "numeric"
                      }
                      placeholder={
                        indicadorEhValor
                          ? t("modal.placeholders.moneyTarget")
                          : t(
                              "modal.placeholders.quantityTarget"
                            )
                      }
                      className={`min-h-12 w-full rounded-2xl border px-4 outline-none focus:border-blue-600 ${c.input}`}
                    />
                    <p className={`mt-2 text-xs ${c.muted}`}>
                      {indicadorEhValor
                        ? t("modal.helpers.moneyTarget")
                        : t("modal.helpers.quantityTarget")}
                    </p>
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.startDate")}
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
                      className={`min-h-12 w-full rounded-2xl border px-4 outline-none focus:border-blue-600 ${c.input}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.endDate")}
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
                      className={`min-h-12 w-full rounded-2xl border px-4 outline-none focus:border-blue-600 ${c.input}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.course")}
                    </label>
                    <SelectTema
                      value={form.cursoId}
                      onChange={(valor) =>
                        setForm((atual) => ({
                          ...atual,
                          cursoId: valor,
                        }))
                      }
                      modoTema={modoTema}
                      options={[
                        {
                          value: "",
                          label: t("common.allCourses"),
                        },
                        ...catalogos.cursos.map((curso) => ({
                          value: String(curso.id),
                          label:
                            curso.nome +
                            (curso.codigo
                              ? ` — ${curso.codigo}`
                              : ""),
                        })),
                      ]}
                    />
                  </div>

                  <div>
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.campus")}
                    </label>
                    <SelectTema
                      value={form.poloId}
                      onChange={(valor) =>
                        setForm((atual) => ({
                          ...atual,
                          poloId: valor,
                        }))
                      }
                      modoTema={modoTema}
                      options={[
                        {
                          value: "",
                          label: t("common.allCampuses"),
                        },
                        ...catalogos.polos.map((polo) => ({
                          value: String(polo.id),
                          label:
                            polo.nome +
                            (polo.codigo
                              ? ` — ${polo.codigo}`
                              : ""),
                        })),
                      ]}
                    />
                  </div>

                  {!editandoId && (
                    <div className="md:col-span-2">
                      <label
                        className={`mb-2 block text-sm font-black ${c.primary}`}
                      >
                        {t("modal.fields.initialStatus")}
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            form.status === "RASCUNHO"
                              ? "border-amber-600 bg-amber-950/10 ring-1 ring-amber-500/40"
                              : c.panelStrong
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
                          <strong className={c.primary}>
                            {t("modal.initialStatus.draftTitle")}
                          </strong>
                          <span
                            className={`mt-1 block pl-7 text-xs ${c.muted}`}
                          >
                            {t(
                              "modal.initialStatus.draftDescription"
                            )}
                          </span>
                        </label>

                        <label
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            form.status === "ATIVA"
                              ? "border-emerald-600 bg-emerald-950/10 ring-1 ring-emerald-500/40"
                              : c.panelStrong
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
                          <strong className={c.primary}>
                            {t("modal.initialStatus.activeTitle")}
                          </strong>
                          <span
                            className={`mt-1 block pl-7 text-xs ${c.muted}`}
                          >
                            {t(
                              "modal.initialStatus.activeDescription"
                            )}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label
                      className={`mb-2 block text-sm font-black ${c.primary}`}
                    >
                      {t("modal.fields.notes")}
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
                      placeholder={t("modal.placeholders.notes")}
                      className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600 ${c.input}`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`sticky bottom-0 flex flex-col-reverse gap-3 border-t p-6 sm:flex-row sm:justify-end ${c.modalFooter}`}
              >
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className={`min-h-11 rounded-2xl border px-5 text-sm font-black transition disabled:opacity-60 ${c.ghostButton}`}
                >
                  {t("modal.cancel")}
                </button>

                <button
                  type="button"
                  onClick={() => void salvarMeta()}
                  disabled={salvando}
                  className="min-h-11 rounded-2xl border border-blue-700 bg-blue-700 px-6 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? t("modal.saving")
                    : editandoId
                      ? t("modal.saveChanges")
                      : t("modal.createGoal")}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmacao && configuracaoConfirmacao && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4">
            <div
              className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${c.panel}`}
            >
              <p
                className={`text-xs font-black uppercase tracking-[0.2em] ${c.kicker}`}
              >
                {t("confirmation.kicker")}
              </p>

              <h2
                className={`mt-2 text-2xl font-black ${c.primary}`}
              >
                {configuracaoConfirmacao.titulo}
              </h2>

              <p
                className={`mt-3 text-sm leading-6 ${c.secondary}`}
              >
                {configuracaoConfirmacao.mensagem}
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmacao(null)}
                  disabled={salvando}
                  className={`min-h-11 rounded-2xl border px-5 text-sm font-black transition disabled:opacity-60 ${c.ghostButton}`}
                >
                  {t("confirmation.back")}
                </button>

                <button
                  type="button"
                  onClick={() => void confirmarAcao()}
                  disabled={salvando}
                  className={`min-h-11 rounded-2xl border px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${configuracaoConfirmacao.classeBotao}`}
                >
                  {salvando
                    ? t("confirmation.processing")
                    : configuracaoConfirmacao.acao}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
