"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

import PhanyxToast from "@/components/ui/PhanyxToast";

type ModoParticipacaoPlano =
  | "SOMENTE_PARTICIPANTES_MATRICULA"
  | "TODOS_VINCULADOS_PLANO";

type EscopoRegra =
  | "GERAL"
  | "DEPARTAMENTO"
  | "CARGO"
  | "FUNCIONARIO";

type CursoOption = {
  id: number;
  nome: string;
};

type FuncionarioOption = {
  id: number;
  nome: string;
  cargo?: string | null;
  departamento?: {
    id: number;
    nome: string;
  } | null;
};

type DepartamentoOption = {
  id: number;
  nome: string;
  quantidadeFuncionarios: number;
};

type VinculoVendedor = {
  id: number;
  inicioVigencia: string;
  fimVigencia?: string | null;
  ativo: boolean;
  planoNomeSnapshot?: string | null;
  observacoes?: string | null;
  origemVinculo?: "INDIVIDUAL" | "DEPARTAMENTO";
  departamentoOrigemId?: number | null;
  departamentoNomeSnapshot?: string | null;
  loteVinculoId?: string | null;

  funcionario: {
    id: number;
    nome: string;
    cargo?: string | null;
    ativo: boolean;
    statusFuncionario?: string | null;
    departamento?: {
      id: number;
      nome: string;
    } | null;
  };

  criadoPor?: {
    id: number;
    nome?: string | null;
    email: string;
  } | null;
};

type Plano = {
  id: number;
  nome: string;
  ativo: boolean;
  modoParticipacao: ModoParticipacaoPlano;
};

type Regra = {
  id: number;
  regraBaseId?: number | null;
  nome: string;
  descricao?: string | null;
  escopoAplicacao: EscopoRegra;
  departamentoAlvoId?: number | null;
  departamentoAlvoNomeSnapshot?: string | null;
  cargoAlvo?: string | null;
  funcionarioAlvoId?: number | null;
  funcionarioAlvoNomeSnapshot?: string | null;
  tipo: "PERCENTUAL" | "VALOR_FIXO";
  baseCalculo:
  | "VALOR_MATRICULA"
  | "VALOR_MENSALIDADE"
  | "VALOR_TOTAL_CONTRATO"
  | "VALOR_RECEBIDO"
  | "LUCRO"
  | "QUANTIDADE_MATRICULAS";
  gatilho:
  | "MATRICULA_CONFIRMADA"
  | "PAGAMENTO_MATRICULA_CONFIRMADO"
  | "PRIMEIRA_MENSALIDADE_PAGA"
  | "MENSALIDADE_PAGA"
  | "MANUAL";
  percentual?: number | string | null;
  valorFixo?: number | string | null;
  quantidadeMinima?: number | null;
  quantidadeMaxima?: number | null;
  usarValorLiquidoRecebido: boolean;
  estornarEmCancelamento: boolean;
  estornarEmInadimplencia: boolean;
  diasCarenciaEstorno?: number | null;
  ordem: number;
  ativo: boolean;
  curso?: {
    id: number;
    nome: string;
  } | null;
  regraBase?: {
    id: number;
    nome: string;
    escopoAplicacao: EscopoRegra;
  } | null;
  _count?: {
    variacoes: number;
  };
};

type RegraForm = {
  nome: string;
  descricao: string;
  escopoAplicacao: EscopoRegra;
  regraBaseId: string;
  departamentoAlvoId: string;
  cargoAlvo: string;
  funcionarioAlvoId: string;
  tipo: "PERCENTUAL" | "VALOR_FIXO";
  baseCalculo: Regra["baseCalculo"];
  gatilho: Regra["gatilho"];
  percentual: string;
  valorFixo: string;
  cursoId: string;
  quantidadeMinima: string;
  quantidadeMaxima: string;
  usarValorLiquidoRecebido: boolean;
  estornarEmCancelamento: boolean;
  estornarEmInadimplencia: boolean;
  diasCarenciaEstorno: string;
  ordem: string;
  ativo: boolean;
};

const FORM_INICIAL: RegraForm = {
  nome: "",
  descricao: "",
  escopoAplicacao: "GERAL",
  regraBaseId: "",
  departamentoAlvoId: "",
  cargoAlvo: "",
  funcionarioAlvoId: "",
  tipo: "PERCENTUAL",
  baseCalculo: "VALOR_RECEBIDO",
  gatilho: "PRIMEIRA_MENSALIDADE_PAGA",
  percentual: "5",
  valorFixo: "",
  cursoId: "",
  quantidadeMinima: "",
  quantidadeMaxima: "",
  usarValorLiquidoRecebido: true,
  estornarEmCancelamento: true,
  estornarEmInadimplencia: false,
  diasCarenciaEstorno: "30",
  ordem: "0",
  ativo: true,
};


const ESTILOS_TEMA_CONFIGURACOES = `
.phanyx-comercial-config-page[data-theme-mode="dark"] {
  color: #eff6ff;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-section,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-plan-card,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comissao-painel-excecao,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-option,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-stat,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-empty,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comissao-card-opcao-inativa {
  background: #0b1f36 !important;
  border-color: #27496b !important;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comissao-card-opcao-ativa {
  background: #12355b !important;
  border-color: #3b82f6 !important;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] input:not([type="checkbox"]),
.phanyx-comercial-config-page[data-theme-mode="dark"] select,
.phanyx-comercial-config-page[data-theme-mode="dark"] textarea {
  background: #071525 !important;
  border-color: #31506f !important;
  color: #ffffff !important;
  color-scheme: dark;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] select option {
  background: #071525;
  color: #ffffff;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:bg-slate-950"],
.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:bg-slate-900"],
.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:bg-slate-800"] {
  background: #08192d !important;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:border-slate-700"] {
  border-color: #31506f !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] {
  color: #f5f5f5;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-section,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-plan-card,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comissao-painel-excecao,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-option,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-stat,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-empty,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comissao-card-opcao-inativa {
  background: #1f1f1f !important;
  border-color: #525252 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comissao-card-opcao-ativa {
  background: #303030 !important;
  border-color: #737373 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] input:not([type="checkbox"]),
.phanyx-comercial-config-page[data-theme-mode="system-dark"] select,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] textarea {
  background: #303030 !important;
  border-color: #5a5a5a !important;
  color: #ffffff !important;
  color-scheme: dark;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] select option {
  background: #303030;
  color: #ffffff;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:bg-slate-950"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:bg-slate-900"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:bg-slate-800"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="bg-white"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="bg-slate-50"] {
  background: #262626 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:border-slate-700"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="border-slate-200"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="border-slate-300"] {
  border-color: #525252 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-950"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-900"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:text-white"] {
  color: #ffffff !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-700"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-600"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-500"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:text-slate-300"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:text-slate-400"] {
  color: #d4d4d4 !important;
}
`;

type Tema = "light" | "dark" | "system";

type ModoTemaConfiguracoes =
  | "light"
  | "dark"
  | "system-dark";

function useTemaConfiguracoesComerciais(): {
  temaAtual: Tema;
  sistemaEscuro: boolean;
  modoTema: ModoTemaConfiguracoes;
} {
  const [temaAtual, setTemaAtual] = useState<Tema>("light");
  const [sistemaEscuro, setSistemaEscuro] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function sincronizarTema() {
      const salvo = localStorage.getItem("phanyx_tema");

      const escolha = (
        salvo === "light" ||
          salvo === "dark" ||
          salvo === "system"
          ? salvo
          : document.documentElement.dataset.themeChoice || "system"
      ) as Tema;

      setTemaAtual(escolha);
      setSistemaEscuro(media.matches);
    }

    sincronizarTema();

    window.addEventListener("storage", sincronizarTema);
    window.addEventListener("phanyx-theme-change", sincronizarTema);
    media.addEventListener("change", sincronizarTema);

    const observer = new MutationObserver(sincronizarTema);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-theme-choice"],
    });

    return () => {
      window.removeEventListener("storage", sincronizarTema);
      window.removeEventListener("phanyx-theme-change", sincronizarTema);
      media.removeEventListener("change", sincronizarTema);
      observer.disconnect();
    };
  }, []);

  const modoTema: ModoTemaConfiguracoes =
    temaAtual === "dark"
      ? "dark"
      : temaAtual === "system" && sistemaEscuro
        ? "system-dark"
        : "light";

  return {
    temaAtual,
    sistemaEscuro,
    modoTema,
  };
}


type OpcaoSelectTema = {
  value: string;
  label: string;
};

function SelectTema({
  value,
  options,
  onChange,
  modoTema,
  disabled = false,
}: {
  value: string;
  options: OpcaoSelectTema[];
  onChange: (value: string) => void;
  modoTema: "light" | "dark" | "system-dark";
  disabled?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharAoClicarFora(evento: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(evento.target as Node)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setAberto(false);
    }
  }, [disabled]);

  const selecionada =
    options.find((option) => option.value === value) ?? options[0];

  const classesControle =
    modoTema === "dark"
      ? "border-[#31506f] bg-[#071525] text-white"
      : modoTema === "system-dark"
        ? "border-[#5a5a5a] bg-[#303030] text-white"
        : "border-slate-300 bg-white text-slate-950";

  const classesMenu =
    modoTema === "dark"
      ? "border-[#31506f] bg-[#071525]"
      : modoTema === "system-dark"
        ? "border-[#5a5a5a] bg-[#303030]"
        : "border-slate-300 bg-white";

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${classesControle}`}
      >
        <span className="min-w-0 truncate">{selecionada?.label ?? "—"}</span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto && !disabled && (
        <div
          className={`absolute left-0 right-0 top-full z-[120] mt-1 max-h-72 overflow-y-auto rounded-2xl border p-1 shadow-2xl ${classesMenu}`}
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
                className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${modoTema === "dark"
                  ? ativa
                    ? "bg-blue-800 text-white"
                    : "text-blue-50 hover:bg-blue-950"
                  : modoTema === "system-dark"
                    ? ativa
                      ? "bg-neutral-500 text-white"
                      : "text-neutral-100 hover:bg-neutral-600"
                    : ativa
                      ? "bg-slate-200 text-slate-950"
                      : "text-slate-900 hover:bg-slate-100"
                  }`}
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

const CHAVES_BASE: Record<Regra["baseCalculo"], string> = {
  VALOR_MATRICULA: "labels.base.enrollmentValue",
  VALOR_MENSALIDADE: "labels.base.monthlyFeeValue",
  VALOR_TOTAL_CONTRATO: "labels.base.totalContractValue",
  VALOR_RECEBIDO: "labels.base.receivedValue",
  LUCRO: "labels.base.profit",
  QUANTIDADE_MATRICULAS: "labels.base.enrollmentCount",
};

const CHAVES_GATILHO: Record<Regra["gatilho"], string> = {
  MATRICULA_CONFIRMADA: "labels.trigger.enrollmentConfirmed",
  PAGAMENTO_MATRICULA_CONFIRMADO:
    "labels.trigger.enrollmentPaymentConfirmed",
  PRIMEIRA_MENSALIDADE_PAGA: "labels.trigger.firstMonthlyFeePaid",
  MENSALIDADE_PAGA: "labels.trigger.eachMonthlyFeePaid",
  MANUAL: "labels.trigger.manual",
};

const CHAVES_ESCOPO: Record<EscopoRegra, string> = {
  GERAL: "labels.scope.general",
  DEPARTAMENTO: "labels.scope.department",
  CARGO: "labels.scope.role",
  FUNCIONARIO: "labels.scope.employee",
};

function formatarValorRegra(
  regra: Regra,
  locale: string,
) {
  if (regra.tipo === "PERCENTUAL") {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 4,
    }).format(Number(regra.percentual || 0))}%`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(Number(regra.valorFixo || 0));
}

function dataHojeLocal() {
  const agora = new Date();
  const compensado = new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60_000,
  );

  return compensado.toISOString().slice(0, 10);
}

function formatarData(
  valor: string | null | undefined,
  locale: string,
  semLimite: string,
  dataInvalida: string,
) {
  if (!valor) {
    return semLimite;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return dataInvalida;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
  }).format(data);
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function alvoDaRegra(
  regra: Regra,
  tr: (
    chave: string,
    valores?: Record<string, string | number>,
  ) => string,
) {
  switch (regra.escopoAplicacao) {
    case "DEPARTAMENTO":
      return (
        regra.departamentoAlvoNomeSnapshot ||
        tr("targets.departmentUnknown")
      );

    case "CARGO":
      return (
        regra.cargoAlvo ||
        tr("targets.roleUnknown")
      );

    case "FUNCIONARIO":
      return (
        regra.funcionarioAlvoNomeSnapshot ||
        tr("targets.employeeUnknown")
      );

    case "GERAL":
    default:
      return tr("targets.general");
  }
}

export default function RegrasPlanoComissaoPage() {
  const params = useParams();
  const planoId = Number(params.id);

  const t = useTranslations(
    "AdminCommercialCommissionSettings.plan",
  );
  const locale = useLocale();
  const { modoTema } = useTemaConfiguracoesComerciais();

  const tr = (
    chave: string,
    valores?: Record<string, string | number>,
  ) =>
    t(
      chave as any,
      valores as any,
    );

  const [plano, setPlano] = useState<Plano | null>(null);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [form, setForm] = useState<RegraForm>(FORM_INICIAL);

  const [funcionarios, setFuncionarios] = useState<FuncionarioOption[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [vinculos, setVinculos] = useState<VinculoVendedor[]>([]);

  const [tipoVinculo, setTipoVinculo] = useState<
    "INDIVIDUAL" | "DEPARTAMENTO"
  >("INDIVIDUAL");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [inicioVigenciaVendedor, setInicioVigenciaVendedor] =
    useState(dataHojeLocal);
  const [fimVigenciaVendedor, setFimVigenciaVendedor] = useState("");
  const [observacoesVendedor, setObservacoesVendedor] = useState("");

  const [vinculandoVendedor, setVinculandoVendedor] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoModo, setSalvandoModo] = useState(false);

  const [
    regraEmEdicaoId,
    setRegraEmEdicaoId,
  ] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  const regrasGerais = useMemo(
    () =>
      regras.filter(
        (regra) =>
          regra.escopoAplicacao === "GERAL" &&
          !regra.regraBaseId,
      ),
    [regras],
  );

  const cargosDisponiveis = useMemo(() => {
    const cargos = new Map<string, string>();

    for (const funcionario of funcionarios) {
      const cargo = String(funcionario.cargo || "").trim();
      const chave = normalizarTexto(cargo);

      if (cargo && chave && !cargos.has(chave)) {
        cargos.set(chave, cargo);
      }
    }

    return [...cargos.values()].sort((a, b) =>
      a.localeCompare(b, locale),
    );
  }, [funcionarios, locale]);

  const regraBaseSelecionada = useMemo(
    () =>
      regrasGerais.find(
        (regra) => String(regra.id) === form.regraBaseId,
      ) || null,
    [form.regraBaseId, regrasGerais],
  );

  const tipoEfetivo = regraBaseSelecionada?.tipo || form.tipo;

  async function carregarDados() {
    try {
      setCarregando(true);

      const [resRegras, resCursos, resVendedores] = await Promise.all([
        fetch(
          `/api/admin/comercial/planos-comissao/${planoId}/regras`,
          {
            credentials: "include",
            cache: "no-store",
          },
        ),
        fetch("/api/admin/cursos", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(
          `/api/admin/comercial/planos-comissao/${planoId}/vendedores`,
          {
            credentials: "include",
            cache: "no-store",
          },
        ),
      ]);

      const dadosRegras = await resRegras.json();
      const dadosCursos = await resCursos.json();
      const dadosVendedores = await resVendedores.json();

      if (!resRegras.ok) {
        throw new Error(
          dadosRegras?.error ||
          tr("errors.loadRules"),
        );
      }

      if (!resVendedores.ok) {
        throw new Error(
          dadosVendedores?.error ||
          tr("errors.loadParticipants"),
        );
      }

      setPlano(dadosRegras?.plano || null);
      setRegras(
        Array.isArray(dadosRegras?.regras)
          ? dadosRegras.regras
          : [],
      );

      const listaCursos = Array.isArray(dadosCursos)
        ? dadosCursos
          .map((curso: any) => ({
            id: Number(curso.id),
            nome: String(curso.nome || tr("common.course")),
          }))
          .filter(
            (curso: CursoOption) =>
              Number.isFinite(curso.id) && curso.id > 0,
          )
        : [];

      setCursos(listaCursos);
      setFuncionarios(
        Array.isArray(dadosVendedores?.funcionarios)
          ? dadosVendedores.funcionarios
          : [],
      );
      setDepartamentos(
        Array.isArray(dadosVendedores?.departamentos)
          ? dadosVendedores.departamentos
          : [],
      );
      setVinculos(
        Array.isArray(dadosVendedores?.vinculos)
          ? dadosVendedores.vinculos
          : [],
      );
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          tr("errors.loadConfiguration"),
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (Number.isInteger(planoId) && planoId > 0) {
      carregarDados();
    }
  }, [planoId]);

  function alterarEscopo(escopoAplicacao: EscopoRegra) {
    setForm((anterior) => ({
      ...anterior,
      escopoAplicacao,
      regraBaseId:
        escopoAplicacao === "GERAL"
          ? ""
          : anterior.regraBaseId,
      departamentoAlvoId: "",
      cargoAlvo: "",
      funcionarioAlvoId: "",
    }));
  }

  function selecionarRegraBase(regraBaseId: string) {
    const regraBase = regrasGerais.find(
      (regra) => String(regra.id) === regraBaseId,
    );

    setForm((anterior) => ({
      ...anterior,
      regraBaseId,
      tipo: regraBase?.tipo || anterior.tipo,
      baseCalculo:
        regraBase?.baseCalculo || anterior.baseCalculo,
      gatilho: regraBase?.gatilho || anterior.gatilho,
      percentual:
        regraBase?.tipo === "PERCENTUAL"
          ? String(regraBase.percentual ?? "")
          : "",
      valorFixo:
        regraBase?.tipo === "VALOR_FIXO"
          ? String(regraBase.valorFixo ?? "")
          : "",
      cursoId: regraBase?.curso?.id
        ? String(regraBase.curso.id)
        : "",
      quantidadeMinima:
        regraBase?.quantidadeMinima === null ||
          regraBase?.quantidadeMinima === undefined
          ? ""
          : String(regraBase.quantidadeMinima),
      quantidadeMaxima:
        regraBase?.quantidadeMaxima === null ||
          regraBase?.quantidadeMaxima === undefined
          ? ""
          : String(regraBase.quantidadeMaxima),
      usarValorLiquidoRecebido:
        regraBase?.usarValorLiquidoRecebido ??
        anterior.usarValorLiquidoRecebido,
      estornarEmCancelamento:
        regraBase?.estornarEmCancelamento ??
        anterior.estornarEmCancelamento,
      estornarEmInadimplencia:
        regraBase?.estornarEmInadimplencia ??
        anterior.estornarEmInadimplencia,
      diasCarenciaEstorno:
        regraBase?.diasCarenciaEstorno === null ||
          regraBase?.diasCarenciaEstorno === undefined
          ? ""
          : String(regraBase.diasCarenciaEstorno),
      ordem:
        regraBase?.ordem === undefined
          ? anterior.ordem
          : String(regraBase.ordem),
    }));
  }

  async function atualizarModoParticipacao(
    modoParticipacao: ModoParticipacaoPlano,
  ) {
    if (!plano || plano.modoParticipacao === modoParticipacao) {
      return;
    }

    try {
      setSalvandoModo(true);

      const resposta = await fetch(
        `/api/admin/comercial/planos-comissao/${planoId}/regras`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modoParticipacao }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          tr("errors.updateParticipationMode"),
        );
      }

      setPlano((anterior) =>
        anterior
          ? {
            ...anterior,
            modoParticipacao,
          }
          : anterior,
      );

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          tr("success.participationModeUpdated"),
      });
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          tr("errors.updateParticipationMode"),
      });
    } finally {
      setSalvandoModo(false);
    }
  }

  function criarFormularioDaRegra(
    regra: Regra,
  ): RegraForm {
    return {
      nome: regra.nome,
      descricao: regra.descricao || "",
      escopoAplicacao: regra.escopoAplicacao,
      regraBaseId: regra.regraBaseId
        ? String(regra.regraBaseId)
        : "",
      departamentoAlvoId: regra.departamentoAlvoId
        ? String(regra.departamentoAlvoId)
        : "",
      cargoAlvo: regra.cargoAlvo || "",
      funcionarioAlvoId: regra.funcionarioAlvoId
        ? String(regra.funcionarioAlvoId)
        : "",
      tipo: regra.tipo,
      baseCalculo: regra.baseCalculo,
      gatilho: regra.gatilho,
      percentual:
        regra.tipo === "PERCENTUAL"
          ? String(regra.percentual ?? "")
          : "",
      valorFixo:
        regra.tipo === "VALOR_FIXO"
          ? String(regra.valorFixo ?? "")
          : "",
      cursoId: regra.curso?.id
        ? String(regra.curso.id)
        : "",
      quantidadeMinima:
        regra.quantidadeMinima === null ||
          regra.quantidadeMinima === undefined
          ? ""
          : String(regra.quantidadeMinima),
      quantidadeMaxima:
        regra.quantidadeMaxima === null ||
          regra.quantidadeMaxima === undefined
          ? ""
          : String(regra.quantidadeMaxima),
      usarValorLiquidoRecebido:
        regra.usarValorLiquidoRecebido,
      estornarEmCancelamento:
        regra.estornarEmCancelamento,
      estornarEmInadimplencia:
        regra.estornarEmInadimplencia,
      diasCarenciaEstorno:
        regra.diasCarenciaEstorno === null ||
          regra.diasCarenciaEstorno === undefined
          ? ""
          : String(regra.diasCarenciaEstorno),
      ordem: String(regra.ordem ?? 0),
      ativo: regra.ativo,
    };
  }

  function iniciarEdicaoRegra(
    regra: Regra,
  ) {
    setRegraEmEdicaoId(regra.id);
    setForm(criarFormularioDaRegra(regra));
    setToast(null);

    window.setTimeout(() => {
      document
        .getElementById(
          "formulario-regra-comissao",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  }

  function cancelarEdicaoRegra() {
    setRegraEmEdicaoId(null);
    setForm(FORM_INICIAL);
    setToast(null);
  }

  async function salvarRegra(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!form.nome.trim()) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.ruleName"),
      });
      return;
    }

    if (
      form.escopoAplicacao !== "GERAL" &&
      !form.regraBaseId
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          tr("validation.baseRule"),
      });
      return;
    }

    if (
      form.escopoAplicacao === "DEPARTAMENTO" &&
      !form.departamentoAlvoId
    ) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.department"),
      });
      return;
    }

    if (
      form.escopoAplicacao === "CARGO" &&
      !form.cargoAlvo
    ) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.role"),
      });
      return;
    }

    if (
      form.escopoAplicacao === "FUNCIONARIO" &&
      !form.funcionarioAlvoId
    ) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.employee"),
      });
      return;
    }

    if (
      tipoEfetivo === "PERCENTUAL" &&
      (!Number(form.percentual) || Number(form.percentual) > 100)
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          tr("validation.percentage"),
      });
      return;
    }

    if (
      tipoEfetivo === "VALOR_FIXO" &&
      !Number(form.valorFixo)
    ) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.fixedValue"),
      });
      return;
    }

    try {
      setSalvando(true);

      const editandoRegra =
        regraEmEdicaoId !== null;

      const endereco = editandoRegra
        ? `/api/admin/comercial/planos-comissao/${planoId}/regras/${regraEmEdicaoId}`
        : `/api/admin/comercial/planos-comissao/${planoId}/regras`;

      const resposta = await fetch(
        endereco,
        {
          method: editandoRegra
            ? "PATCH"
            : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            descricao: form.descricao.trim() || null,
            escopoAplicacao: form.escopoAplicacao,
            regraBaseId: form.regraBaseId
              ? Number(form.regraBaseId)
              : null,
            departamentoAlvoId: form.departamentoAlvoId
              ? Number(form.departamentoAlvoId)
              : null,
            cargoAlvo: form.cargoAlvo || null,
            funcionarioAlvoId: form.funcionarioAlvoId
              ? Number(form.funcionarioAlvoId)
              : null,
            tipo: tipoEfetivo,
            baseCalculo:
              regraBaseSelecionada?.baseCalculo ||
              form.baseCalculo,
            gatilho:
              regraBaseSelecionada?.gatilho || form.gatilho,
            percentual:
              tipoEfetivo === "PERCENTUAL"
                ? Number(form.percentual)
                : null,
            valorFixo:
              tipoEfetivo === "VALOR_FIXO"
                ? Number(form.valorFixo)
                : null,
            cursoId: form.cursoId
              ? Number(form.cursoId)
              : null,
            quantidadeMinima:
              form.quantidadeMinima === ""
                ? null
                : Number(form.quantidadeMinima),
            quantidadeMaxima:
              form.quantidadeMaxima === ""
                ? null
                : Number(form.quantidadeMaxima),
            usarValorLiquidoRecebido:
              form.usarValorLiquidoRecebido,
            estornarEmCancelamento:
              form.estornarEmCancelamento,
            estornarEmInadimplencia:
              form.estornarEmInadimplencia,
            diasCarenciaEstorno:
              form.diasCarenciaEstorno === ""
                ? null
                : Number(form.diasCarenciaEstorno),
            ordem: Number(form.ordem || 0),
            ativo: form.ativo,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          (editandoRegra
            ? tr("errors.updateRule")
            : tr("errors.createRule")),
        );
      }

      setRegraEmEdicaoId(null);
      setForm(FORM_INICIAL);

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          (editandoRegra
            ? tr("success.ruleUpdated")
            : tr("success.ruleCreated")),
      });

      await carregarDados();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          (regraEmEdicaoId !== null
            ? tr("errors.updateRule")
            : tr("errors.createRule")),
      });
    } finally {
      setSalvando(false);
    }
  }

  async function vincularVendedor(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (tipoVinculo === "INDIVIDUAL" && !funcionarioId) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.participantEmployee"),
      });
      return;
    }

    if (tipoVinculo === "DEPARTAMENTO" && !departamentoId) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.participantDepartment"),
      });
      return;
    }

    if (!inicioVigenciaVendedor) {
      setToast({
        tipo: "erro",
        mensagem: tr("validation.linkStartDate"),
      });
      return;
    }

    try {
      setVinculandoVendedor(true);

      const resposta = await fetch(
        `/api/admin/comercial/planos-comissao/${planoId}/vendedores`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipoVinculo,
            funcionarioId:
              tipoVinculo === "INDIVIDUAL"
                ? Number(funcionarioId)
                : null,
            departamentoId:
              tipoVinculo === "DEPARTAMENTO"
                ? Number(departamentoId)
                : null,
            inicioVigencia: inicioVigenciaVendedor,
            fimVigencia: fimVigenciaVendedor || null,
            observacoes: observacoesVendedor.trim() || null,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          tr("errors.linkParticipants"),
        );
      }

      setFuncionarioId("");
      setDepartamentoId("");
      setInicioVigenciaVendedor(dataHojeLocal());
      setFimVigenciaVendedor("");
      setObservacoesVendedor("");

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          tr("success.participantsLinked"),
      });

      await carregarDados();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          tr("errors.linkParticipants"),
      });
    } finally {
      setVinculandoVendedor(false);
    }
  }

  if (!Number.isInteger(planoId) || planoId <= 0) {
    return (
      <main
        data-theme-mode={modoTema}
        className="phanyx-comercial-config-page min-h-screen p-6"
      >
        <style
          dangerouslySetInnerHTML={{
            __html: ESTILOS_TEMA_CONFIGURACOES,
          }}
        />
        <p>{tr("invalidPlan")}</p>
      </main>
    );
  }

  const escopoEhGeral = form.escopoAplicacao === "GERAL";
  const semRegraGeral = regrasGerais.length === 0;

  return (
    <main
      data-theme-mode={modoTema}
      className="phanyx-comercial-config-page mx-auto min-h-screen w-full max-w-7xl space-y-7 p-6 lg:p-8"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: ESTILOS_TEMA_CONFIGURACOES,
        }}
      />
      {toast && (
        <PhanyxToast
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}

      <header>
        <Link
          href="/admin/comercial/configuracoes"
          className="phanyx-comercial-voltar-planos mb-5 inline-flex items-center rounded-xl border px-4 py-2 text-sm font-bold transition"
        >{tr("header.back")}</Link>

        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">{tr("header.section")}</p>

        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          ⚙️ {plano?.nome || tr("header.configureRulesFallback")}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tr("header.description")}</p>
      </header>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">{tr("participation.title")}</h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">{tr("participation.description")}</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            disabled={salvandoModo}
            onClick={() =>
              atualizarModoParticipacao(
                "SOMENTE_PARTICIPANTES_MATRICULA",
              )
            }
            className={[
              "phanyx-comissao-card-opcao rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
              plano?.modoParticipacao ===
                "SOMENTE_PARTICIPANTES_MATRICULA"
                ? "phanyx-comissao-card-opcao-ativa"
                : "phanyx-comissao-card-opcao-inativa",
            ].join(" ")}
          >
            <strong className="phanyx-comissao-card-titulo block">{tr("participation.onlyEnrollment.title")}</strong>

            <span className="phanyx-comissao-card-descricao mt-2 block text-sm leading-6">{tr("participation.onlyEnrollment.description")}</span>
          </button>

          <button
            type="button"
            disabled={salvandoModo}
            onClick={() =>
              atualizarModoParticipacao(
                "TODOS_VINCULADOS_PLANO",
              )
            }
            className={[
              "phanyx-comissao-card-opcao rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
              plano?.modoParticipacao ===
                "TODOS_VINCULADOS_PLANO"
                ? "phanyx-comissao-card-opcao-ativa"
                : "phanyx-comissao-card-opcao-inativa",
            ].join(" ")}
          >
            <strong className="phanyx-comissao-card-titulo block">{tr("participation.allLinked.title")}</strong>
            <span className="phanyx-comissao-card-descricao mt-2 block text-sm leading-6">{tr("participation.allLinked.description")}</span>
          </button>
        </div>

        <div className="phanyx-comissao-aviso mt-4 rounded-2xl border !border-amber-300 !bg-amber-50 p-4 text-sm !text-amber-950 dark:!border-amber-800 dark:!bg-amber-950/30 dark:!text-amber-100">{tr("participation.warning")}</div>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">
          {regraEmEdicaoId !== null
            ? tr("ruleForm.editTitle")
            : escopoEhGeral
              ? tr("ruleForm.newGeneralTitle")
              : tr("ruleForm.newExceptionTitle")}
        </h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
          {regraEmEdicaoId !== null
            ? tr("ruleForm.editDescription")
            : tr("ruleForm.precedenceDescription")}
        </p>

        <form
          id="formulario-regra-comissao"
          onSubmit={salvarRegra}
          className="mt-6 space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-bold">{tr("ruleForm.application")}</label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  [
                    "GERAL",
                    tr("ruleForm.scope.general.title"),
                    tr("ruleForm.scope.general.description"),
                  ],
                  [
                    "DEPARTAMENTO",
                    tr("ruleForm.scope.department.title"),
                    tr("ruleForm.scope.department.description"),
                  ],
                  [
                    "CARGO",
                    tr("ruleForm.scope.role.title"),
                    tr("ruleForm.scope.role.description"),
                  ],
                  [
                    "FUNCIONARIO",
                    tr("ruleForm.scope.employee.title"),
                    tr("ruleForm.scope.employee.description"),
                  ],
                ] as const
              ).map(([valor, titulo, descricao]) => {
                const selecionado =
                  form.escopoAplicacao === valor;

                const desabilitado =
                  regraEmEdicaoId !== null ||
                  (valor !== "GERAL" &&
                    semRegraGeral);

                return (
                  <button
                    key={valor}
                    type="button"
                    disabled={desabilitado}
                    onClick={() => alterarEscopo(valor)}
                    className={[
                      "phanyx-comissao-card-opcao rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed",
                      selecionado
                        ? "phanyx-comissao-card-opcao-ativa"
                        : "phanyx-comissao-card-opcao-inativa",
                    ].join(" ")}
                  >
                    <strong className="phanyx-comissao-card-titulo block text-sm">
                      {titulo}
                    </strong>

                    <span className="phanyx-comissao-card-descricao mt-1 block text-xs">
                      {descricao}
                    </span>
                  </button>
                );
              })}
            </div>

            {semRegraGeral && (
              <p className="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-200">{tr("ruleForm.createGeneralFirst")}</p>
            )}
          </div>

          {!escopoEhGeral && (
            <div className="phanyx-comissao-painel-excecao rounded-2xl border p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.baseRule")}</label>

                  <SelectTema
                    value={form.regraBaseId}
                    disabled={regraEmEdicaoId !== null}
                    onChange={selecionarRegraBase}
                    modoTema={modoTema}
                    options={[
                      { value: "", label: tr("ruleForm.selectBaseRule") },
                      ...regrasGerais.map((regra) => ({
                        value: String(regra.id),
                        label: `${regra.nome} — ${formatarValorRegra(regra, locale)}`,
                      })),
                    ]}
                  />
                </div>

                {form.escopoAplicacao === "DEPARTAMENTO" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">{tr("common.department")}</label>

                    <SelectTema
                      value={form.departamentoAlvoId}
                      onChange={(valor) =>
                        setForm((anterior) => ({
                          ...anterior,
                          departamentoAlvoId: valor,
                        }))
                      }
                      modoTema={modoTema}
                      options={[
                        { value: "", label: tr("common.selectDepartment") },
                        ...departamentos.map((departamento) => ({
                          value: String(departamento.id),
                          label: `${departamento.nome} — ${tr("common.activeEmployees", {
                            count: departamento.quantidadeFuncionarios,
                          })}`,
                        })),
                      ]}
                    />
                  </div>
                )}

                {form.escopoAplicacao === "CARGO" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">{tr("common.role")}</label>

                    <SelectTema
                      value={form.cargoAlvo}
                      onChange={(valor) =>
                        setForm((anterior) => ({
                          ...anterior,
                          cargoAlvo: valor,
                        }))
                      }
                      modoTema={modoTema}
                      options={[
                        { value: "", label: tr("common.selectRole") },
                        ...cargosDisponiveis.map((cargo) => ({
                          value: cargo,
                          label: cargo,
                        })),
                      ]}
                    />
                  </div>
                )}

                {form.escopoAplicacao === "FUNCIONARIO" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">{tr("common.employee")}</label>

                    <SelectTema
                      value={form.funcionarioAlvoId}
                      onChange={(valor) =>
                        setForm((anterior) => ({
                          ...anterior,
                          funcionarioAlvoId: valor,
                        }))
                      }
                      modoTema={modoTema}
                      options={[
                        { value: "", label: tr("common.selectEmployee") },
                        ...funcionarios.map((funcionario) => ({
                          value: String(funcionario.id),
                          label: `${funcionario.nome}${funcionario.cargo ? ` — ${funcionario.cargo}` : ""
                            }${funcionario.departamento?.nome
                              ? ` — ${funcionario.departamento.nome}`
                              : ""
                            }`,
                        })),
                      ]}
                    />
                  </div>
                )}
              </div>

              {regraBaseSelecionada && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">{tr("ruleForm.inheritedBase")}</p>
                    <p className="mt-1 font-bold">
                      {tr(CHAVES_BASE[regraBaseSelecionada.baseCalculo])}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">{tr("ruleForm.inheritedTrigger")}</p>
                    <p className="mt-1 font-bold">
                      {tr(CHAVES_GATILHO[regraBaseSelecionada.gatilho])}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">{tr("ruleForm.currentGeneralValue")}</p>
                    <p className="mt-1 font-bold">
                      {formatarValorRegra(regraBaseSelecionada, locale)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">{tr("ruleForm.ruleName")}</label>

              <input
                value={form.nome}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    nome: evento.target.value,
                  }))
                }
                placeholder={
                  escopoEhGeral
                    ? tr("ruleForm.placeholders.generalRule")
                    : form.escopoAplicacao === "CARGO"
                      ? tr("ruleForm.placeholders.managerRule")
                      : tr("ruleForm.placeholders.exceptionRule")
                }
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            {escopoEhGeral && (
              <div>
                <label className="mb-2 block text-sm font-bold">{tr("ruleForm.specificCourse")}</label>

                <SelectTema
                  value={form.cursoId}
                  onChange={(valor) =>
                    setForm((anterior) => ({
                      ...anterior,
                      cursoId: valor,
                    }))
                  }
                  modoTema={modoTema}
                  options={[
                    { value: "", label: tr("ruleForm.allCourses") },
                    ...cursos.map((curso) => ({
                      value: String(curso.id),
                      label: curso.nome,
                    })),
                  ]}
                />
              </div>
            )}

            <div className={escopoEhGeral ? "md:col-span-2" : ""}>
              <label className="mb-2 block text-sm font-bold">{tr("common.description")}</label>

              <textarea
                rows={3}
                value={form.descricao}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    descricao: evento.target.value,
                  }))
                }
                placeholder={tr("ruleForm.placeholders.description")}
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {escopoEhGeral && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.commissionType")}</label>

                  <SelectTema
                    value={form.tipo}
                    onChange={(valor) =>
                      setForm((anterior) => ({
                        ...anterior,
                        tipo: valor as RegraForm["tipo"],
                      }))
                    }
                    modoTema={modoTema}
                    options={[
                      { value: "PERCENTUAL", label: tr("ruleForm.percentage") },
                      { value: "VALOR_FIXO", label: tr("ruleForm.fixedValue") },
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.calculationBase")}</label>

                  <SelectTema
                    value={form.baseCalculo}
                    onChange={(valor) =>
                      setForm((anterior) => ({
                        ...anterior,
                        baseCalculo: valor as RegraForm["baseCalculo"],
                        tipo:
                          valor === "QUANTIDADE_MATRICULAS"
                            ? "VALOR_FIXO"
                            : anterior.tipo,
                      }))
                    }
                    modoTema={modoTema}
                    options={Object.entries(CHAVES_BASE).map(
                      ([valor, chave]) => ({
                        value: valor,
                        label: tr(chave),
                      }),
                    )}
                  />
                </div>
              </>
            )}

            {tipoEfetivo === "PERCENTUAL" ? (
              <div>
                <label className="mb-2 block text-sm font-bold">{tr("ruleForm.percentage")}</label>

                <input
                  type="number"
                  min="0.0001"
                  max="100"
                  step="0.0001"
                  value={form.percentual}
                  onChange={(evento) =>
                    setForm((anterior) => ({
                      ...anterior,
                      percentual: evento.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border px-4 py-3"
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-bold">{tr("ruleForm.fixedValue")}</label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.valorFixo}
                  onChange={(evento) =>
                    setForm((anterior) => ({
                      ...anterior,
                      valorFixo: evento.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border px-4 py-3"
                />
              </div>
            )}

            {escopoEhGeral && (
              <div>
                <label className="mb-2 block text-sm font-bold">{tr("ruleForm.trigger")}</label>

                <SelectTema
                  value={form.gatilho}
                  onChange={(valor) =>
                    setForm((anterior) => ({
                      ...anterior,
                      gatilho: valor as RegraForm["gatilho"],
                    }))
                  }
                  modoTema={modoTema}
                  options={Object.entries(CHAVES_GATILHO).map(
                    ([valor, chave]) => ({
                      value: valor,
                      label: tr(chave),
                    }),
                  )}
                />
              </div>
            )}
          </div>

          {escopoEhGeral && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.minimumQuantity")}</label>

                  <input
                    type="number"
                    min="0"
                    value={form.quantidadeMinima}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        quantidadeMinima: evento.target.value,
                      }))
                    }
                    placeholder={tr("ruleForm.noMinimum")}
                    className="w-full rounded-2xl border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.maximumQuantity")}</label>

                  <input
                    type="number"
                    min="0"
                    value={form.quantidadeMaxima}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        quantidadeMaxima: evento.target.value,
                      }))
                    }
                    placeholder={tr("ruleForm.noMaximum")}
                    className="w-full rounded-2xl border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.refundGrace")}</label>

                  <input
                    type="number"
                    min="0"
                    value={form.diasCarenciaEstorno}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        diasCarenciaEstorno: evento.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{tr("ruleForm.applicationOrder")}</label>

                  <input
                    type="number"
                    min="0"
                    value={form.ordem}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        ordem: evento.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border px-4 py-3"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
                  <input
                    type="checkbox"
                    checked={form.usarValorLiquidoRecebido}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        usarValorLiquidoRecebido: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">{tr("ruleForm.useNetReceived.title")}</strong>
                    <span className="mt-1 block text-xs">{tr("ruleForm.useNetReceived.description")}</span>
                  </span>
                </label>

                <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
                  <input
                    type="checkbox"
                    checked={form.estornarEmCancelamento}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        estornarEmCancelamento: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">{tr("ruleForm.refundCancellation.title")}</strong>
                    <span className="mt-1 block text-xs">{tr("ruleForm.refundCancellation.description")}</span>
                  </span>
                </label>

                <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
                  <input
                    type="checkbox"
                    checked={form.estornarEmInadimplencia}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        estornarEmInadimplencia: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">{tr("ruleForm.refundDelinquency.title")}</strong>
                    <span className="mt-1 block text-xs">{tr("ruleForm.refundDelinquency.description")}</span>
                  </span>
                </label>

                <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(evento) =>
                      setForm((anterior) => ({
                        ...anterior,
                        ativo: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">{tr("ruleForm.activeRule.title")}</strong>
                    <span className="mt-1 block text-xs">{tr("ruleForm.activeRule.description")}</span>
                  </span>
                </label>
              </div>
            </>
          )}

          {!escopoEhGeral && (
            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    ativo: evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm">{tr("ruleForm.activeException.title")}</strong>
                <span className="mt-1 block text-xs">{tr("ruleForm.activeException.description")}</span>
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando
                ? regraEmEdicaoId !== null
                  ? tr("ruleForm.savingChanges")
                  : tr("ruleForm.savingRule")
                : regraEmEdicaoId !== null
                  ? tr("ruleForm.saveChanges")
                  : escopoEhGeral
                    ? tr("ruleForm.createGeneral")
                    : tr("ruleForm.createException")}
            </button>

            {regraEmEdicaoId !== null && (
              <button
                type="button"
                disabled={salvando}
                onClick={cancelarEdicaoRegra}
                className="phanyx-comissao-cancelar-edicao rounded-2xl border px-6 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
              >{tr("ruleForm.cancelEdit")}</button>
            )}
          </div>
        </form>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black">{tr("participants.title")}</h2>

          <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">{tr("participants.description")}</p>
        </div>

        <div className="phanyx-comissao-aviso mt-5 rounded-2xl border !border-amber-300 !bg-amber-50 p-4 text-sm !text-amber-950 dark:!border-amber-800 dark:!bg-amber-950/30 dark:!text-amber-100">{tr("participants.warning")}</div>

        <form onSubmit={vincularVendedor} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold">{tr("participants.linkType")}</label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setTipoVinculo("INDIVIDUAL");
                  setDepartamentoId("");
                }}
                className={[
                  "phanyx-comissao-card-opcao rounded-2xl border px-4 py-4 text-left transition",
                  tipoVinculo === "INDIVIDUAL"
                    ? "phanyx-comissao-card-opcao-ativa"
                    : "phanyx-comissao-card-opcao-inativa",
                ].join(" ")}
              >
                <strong className="phanyx-comissao-card-titulo block text-sm">{tr("participants.individual.title")}</strong>

                <span className="phanyx-comissao-card-descricao mt-1 block text-xs">{tr("participants.individual.description")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoVinculo("DEPARTAMENTO");
                  setFuncionarioId("");
                }}
                className={[
                  "phanyx-comissao-card-opcao rounded-2xl border px-4 py-4 text-left transition",
                  tipoVinculo === "DEPARTAMENTO"
                    ? "phanyx-comissao-card-opcao-ativa"
                    : "phanyx-comissao-card-opcao-inativa",
                ].join(" ")}
              >
                <strong className="phanyx-comissao-card-titulo block text-sm">{tr("participants.department.title")}</strong>

                <span className="phanyx-comissao-card-descricao mt-1 block text-xs">{tr("participants.department.description")}</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tipoVinculo === "INDIVIDUAL" ? (
              <div>
                <label className="mb-2 block text-sm font-bold">{tr("common.employee")}</label>

                <SelectTema
                  value={funcionarioId}
                  onChange={setFuncionarioId}
                  modoTema={modoTema}
                  options={[
                    { value: "", label: tr("participants.selectParticipant") },
                    ...funcionarios.map((funcionario) => ({
                      value: String(funcionario.id),
                      label: `${funcionario.nome}${funcionario.cargo ? ` — ${funcionario.cargo}` : ""
                        }${funcionario.departamento?.nome
                          ? ` — ${funcionario.departamento.nome}`
                          : ""
                        }`,
                    })),
                  ]}
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-bold">{tr("common.department")}</label>

                <SelectTema
                  value={departamentoId}
                  onChange={setDepartamentoId}
                  modoTema={modoTema}
                  options={[
                    { value: "", label: tr("common.selectDepartment") },
                    ...departamentos.map((departamento) => ({
                      value: String(departamento.id),
                      label: `${departamento.nome} — ${tr("common.activeEmployees", {
                        count: departamento.quantidadeFuncionarios,
                      })}`,
                    })),
                  ]}
                />

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{tr("participants.duplicateNote")}</p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold">{tr("common.startDate")}</label>

              <input
                type="date"
                value={inicioVigenciaVendedor}
                onChange={(evento) =>
                  setInicioVigenciaVendedor(evento.target.value)
                }
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">{tr("common.endDate")}</label>

              <input
                type="date"
                value={fimVigenciaVendedor}
                onChange={(evento) =>
                  setFimVigenciaVendedor(evento.target.value)
                }
                className="w-full rounded-2xl border px-4 py-3"
              />

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{tr("participants.endDateHelp")}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">{tr("common.notes")}</label>

              <input
                value={observacoesVendedor}
                onChange={(evento) =>
                  setObservacoesVendedor(evento.target.value)
                }
                placeholder={
                  tipoVinculo === "DEPARTAMENTO"
                    ? tr("participants.placeholders.departmentBatch")
                    : tr("participants.placeholders.individual")
                }
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={vinculandoVendedor}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {vinculandoVendedor
              ? tr("participants.linking")
              : tipoVinculo === "DEPARTAMENTO"
                ? tr("participants.linkDepartment")
                : tr("participants.linkEmployee")}
          </button>
        </form>

        <div className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="text-lg font-black">{tr("participants.linkedTitle")}</h3>

          {vinculos.length === 0 ? (
            <div className="phanyx-comercial-config-empty mt-4 rounded-2xl border border-dashed p-6 text-center">{tr("participants.empty")}</div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {vinculos.map((vinculo) => (
                <article
                  key={vinculo.id}
                  className="phanyx-comercial-config-plan-card rounded-3xl border p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black">
                        {vinculo.funcionario.nome}
                      </h4>

                      <p className="mt-1 text-sm">
                        {vinculo.funcionario.cargo ||
                          tr("participants.roleNotProvided")}
                        {vinculo.funcionario.departamento?.nome
                          ? ` • ${vinculo.funcionario.departamento.nome}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-black",
                        vinculo.ativo
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {vinculo.ativo
                        ? tr("common.active")
                        : tr("common.ended")}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {vinculo.origemVinculo === "DEPARTAMENTO"
                        ? tr("participants.includedByDepartment", {
                          name:
                            vinculo.departamentoNomeSnapshot ||
                            vinculo.funcionario.departamento?.nome ||
                            tr("common.department"),
                        })
                        : tr("participants.individualLink")}
                    </span>
                  </div>

                  <div className="mt-4 text-sm">
                    <p>
                      {tr("common.validityLabel")}{" "}
                      <strong>
                        {formatarData(
                          vinculo.inicioVigencia,
                          locale,
                          tr("common.noLimit"),
                          tr("common.invalidDate"),
                        )}{" "}
                        {tr("common.until")}{" "}
                        {formatarData(
                          vinculo.fimVigencia,
                          locale,
                          tr("common.noLimit"),
                          tr("common.invalidDate"),
                        )}
                      </strong>
                    </p>

                    {vinculo.observacoes && (
                      <p className="mt-2">
                        {tr("common.notesLabel")}{" "}
                        {vinculo.observacoes}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">{tr("rules.title")}</h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">{tr("rules.description")}</p>

        {carregando ? (
          <p className="mt-5 text-sm">{tr("rules.loading")}</p>
        ) : regras.length === 0 ? (
          <div className="phanyx-comercial-config-empty mt-5 rounded-2xl border border-dashed p-8 text-center">{tr("rules.empty")}</div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {regras.map((regra) => (
              <article
                key={regra.id}
                className={[
                  "phanyx-comercial-config-plan-card rounded-3xl border p-5",
                  regraEmEdicaoId === regra.id
                    ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{regra.nome}</h3>

                    <p className="mt-1 text-sm">
                      {regra.descricao || tr("common.noDescription")}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-black",
                      regra.ativo
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {regra.ativo
                      ? tr("common.activeFeminine")
                      : tr("common.inactiveFeminine")}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="phanyx-comissao-chip-escopo rounded-full border px-3 py-1 text-xs font-bold">
                    {tr(CHAVES_ESCOPO[regra.escopoAplicacao])}
                  </span>

                  {regra.regraBase && (
                    <span className="phanyx-comissao-chip-grupo rounded-full border px-3 py-1 text-xs font-bold">
                      {tr("rules.group", { name: regra.regraBase.nome })}
                    </span>
                  )}

                  {regra.escopoAplicacao === "GERAL" &&
                    Number(regra._count?.variacoes || 0) > 0 && (
                      <span className="phanyx-comissao-chip-excecoes rounded-full border px-3 py-1 text-xs font-bold">
                        {tr("rules.exceptions", { count: regra._count?.variacoes || 0 })}
                      </span>
                    )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase text-slate-500">{tr("rules.application")}</p>
                  <p className="mt-1 font-black">{alvoDaRegra(regra, tr)}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase">{tr("rules.commission")}</p>
                    <p className="mt-1 font-black">
                      {formatarValorRegra(regra, locale)}
                    </p>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase">{tr("rules.base")}</p>
                    <p className="mt-1 font-black">
                      {tr(CHAVES_BASE[regra.baseCalculo])}
                    </p>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3 sm:col-span-2">
                    <p className="text-xs font-bold uppercase">{tr("rules.trigger")}</p>
                    <p className="mt-1 font-black">
                      {tr(CHAVES_GATILHO[regra.gatilho])}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <p>{tr("rules.course", { name: regra.curso?.nome || tr("common.all") })}</p>
                  <p>
                    {tr("rules.refundGrace", {
                      count: regra.diasCarenciaEstorno ?? 0,
                    })}
                  </p>
                  <p>
                    {tr("rules.refundCancellation", {
                      value: regra.estornarEmCancelamento
                        ? tr("common.yes")
                        : tr("common.no"),
                    })}
                  </p>
                  <p>
                    {tr("rules.refundDelinquency", {
                      value: regra.estornarEmInadimplencia
                        ? tr("common.yes")
                        : tr("common.no"),
                    })}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                      iniciarEdicaoRegra(regra)
                    }
                    className="phanyx-comissao-editar-regra inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black transition"
                  >{tr("rules.edit")}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}