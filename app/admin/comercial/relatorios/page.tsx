"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TemaEscolhido = "light" | "dark" | "system";
type ModoTema = "light" | "dark" | "system-dark";

type ResumoComercial = {
  leadsRecebidos: number;
  leadsConvertidos: number;
  taxaConversao: number;
  matriculas: number;
  valorVendido: number;
  valorRecebido: number;
  ticketMedio: number;
  cancelamentos: number;
};

type VendedorRelatorio = {
  funcionarioId: number;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  leads: number;
  conversoes: number;
  matriculas: number;
  taxaConversao: number;
  valorVendido: number;
  valorRecebido: number;
};

type LeadRelatorio = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string;
  interesse: string | null;
  status: string;
  recebidoEm: string;
  responsavelId: number | null;
  responsavelNome: string | null;
  convertido: boolean;
  matriculaId: number | null;
  convertidoEm: string | null;
  cursoId: number | null;
  cursoNome: string | null;
  poloId: number | null;
  poloNome: string | null;
};

type MatriculaRelatorio = {
  id: number;
  numero: string;
  alunoId: number;
  alunoNome: string;
  dataMatricula: string;
  status: string;
  cursoId: number | null;
  cursoNome: string | null;
  poloId: number | null;
  poloNome: string | null;
  vendedorId: number | null;
  vendedorNome: string | null;
  leadId: number | null;
  origem: string | null;
  valorMatricula: number;
  valorMensalidade: number;
  quantidadeMensalidades: number;
  contabilizadaComoVenda: boolean;
  valorContratado: number;
  valorVendido: number;
  valorRecebido: number;
};

type CursoRelatorio = {
  cursoId: number | null;
  cursoNome: string;
  matriculas: number;
  leadsConvertidos: number;
  cancelamentos: number;
  valorVendido: number;
  valorRecebido: number;
  ticketMedio: number;
  participacao: number;
};

type OpcaoFiltro = {
  id: number;
  nome: string;
};

type RelatorioResponse = {
  resumo: ResumoComercial;
  vendedores: VendedorRelatorio[];
  leads: LeadRelatorio[];
  matriculas: MatriculaRelatorio[];
  filtros: {
    vendedores: OpcaoFiltro[];
    cursos: OpcaoFiltro[];
    polos: OpcaoFiltro[];
  };
};

type Aba =
  | "visao-geral"
  | "vendedores"
  | "leads"
  | "matriculas"
  | "cursos";

type OpcaoSelectTema = {
  value: string;
  label: string;
};

const RESUMO_INICIAL: ResumoComercial = {
  leadsRecebidos: 0,
  leadsConvertidos: 0,
  taxaConversao: 0,
  matriculas: 0,
  valorVendido: 0,
  valorRecebido: 0,
  ticketMedio: 0,
  cancelamentos: 0,
};

function formatarMoeda(valor: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function formatarNumero(valor: number, locale: string) {
  return new Intl.NumberFormat(locale).format(Number(valor || 0));
}

function formatarPercentual(valor: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(valor || 0));
}

function formatarData(
  valor: string | null | undefined,
  locale: string
) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleDateString(locale);
}

function formatarDataInputLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function SelectTema({
  value,
  options,
  onChange,
  modoTema,
  ariaLabel,
}: {
  value: string;
  options: OpcaoSelectTema[];
  onChange: (value: string) => void;
  modoTema: ModoTema;
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
        aria-label={ariaLabel}
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm outline-none transition ${botao}`}
      >
        <span className="truncate">{selecionada?.label ?? ""}</span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto && (
        <div
          className={`absolute left-0 right-0 top-full z-[160] mt-1 max-h-72 overflow-y-auto rounded-xl border p-1 shadow-2xl ${menu}`}
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
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${classeOpcao(
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

function CardIndicador({
  titulo,
  valor,
  descricao,
  panelClass,
  primaryClass,
  mutedClass,
}: {
  titulo: string;
  valor: string;
  descricao?: string;
  panelClass: string;
  primaryClass: string;
  mutedClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${panelClass}`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-wide ${mutedClass}`}
      >
        {titulo}
      </p>

      <p className={`mt-2 text-2xl font-black ${primaryClass}`}>
        {valor}
      </p>

      {descricao && (
        <p className={`mt-2 text-xs ${mutedClass}`}>
          {descricao}
        </p>
      )}
    </div>
  );
}

export default function RelatoriosComerciaisPage() {
  const t = useTranslations("AdminCommercialReports");
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
        tableHead: "bg-blue-950",
        rowHover: "hover:bg-blue-900/35",
        input:
          "border-blue-800 bg-blue-950 text-blue-50",
        primary: "text-white",
        secondary: "text-blue-100/80",
        muted: "text-blue-200/60",
        divider: "divide-blue-900/70",
        border: "border-blue-900/80",
        ghostButton:
          "border-blue-800 bg-blue-950 text-blue-50 hover:bg-blue-900",
        activeTab: "bg-blue-700 text-white",
        inactiveTab: "text-blue-100/80 hover:bg-blue-900",
      };
    }

    if (modoTema === "system-dark") {
      return {
        page: "bg-neutral-900 text-white",
        panel: "border-neutral-700 bg-neutral-900",
        panelStrong: "border-neutral-600 bg-neutral-800",
        tableHead: "bg-neutral-800",
        rowHover: "hover:bg-neutral-800/80",
        input:
          "border-neutral-600 bg-neutral-800 text-white",
        primary: "text-white",
        secondary: "text-neutral-200",
        muted: "text-neutral-400",
        divider: "divide-neutral-700",
        border: "border-neutral-700",
        ghostButton:
          "border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700",
        activeTab: "bg-neutral-200 text-neutral-950",
        inactiveTab: "text-neutral-300 hover:bg-neutral-800",
      };
    }

    return {
      page: "bg-slate-50 text-slate-900",
      panel: "border-slate-200 bg-white",
      panelStrong: "border-slate-300 bg-white",
      tableHead: "bg-slate-50",
      rowHover: "hover:bg-slate-50",
      input:
        "border-slate-300 bg-white text-slate-900",
      primary: "text-slate-950",
      secondary: "text-slate-600",
      muted: "text-slate-500",
      divider: "divide-slate-100",
      border: "border-slate-200",
      ghostButton:
        "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
      activeTab: "bg-slate-900 text-white",
      inactiveTab: "text-slate-600 hover:bg-slate-100",
    };
  }, [modoTema]);

  const hoje = useMemo(() => {
    return formatarDataInputLocal(new Date());
  }, []);

  const primeiroDiaMes = useMemo(() => {
    const data = new Date();
    data.setDate(1);

    return formatarDataInputLocal(data);
  }, []);

  const [aba, setAba] =
    useState<Aba>("visao-geral");
  const [dataInicial, setDataInicial] =
    useState(primeiroDiaMes);
  const [dataFinal, setDataFinal] =
    useState(hoje);
  const [vendedorId, setVendedorId] =
    useState("");
  const [cursoId, setCursoId] =
    useState("");
  const [poloId, setPoloId] =
    useState("");
  const [carregando, setCarregando] =
    useState(true);
  const [erro, setErro] =
    useState("");

  const [dados, setDados] =
    useState<RelatorioResponse>({
      resumo: RESUMO_INICIAL,
      vendedores: [],
      leads: [],
      matriculas: [],
      filtros: {
        vendedores: [],
        cursos: [],
        polos: [],
      },
    });

  const carregarRelatorio =
    useCallback(async () => {
      setCarregando(true);
      setErro("");

      try {
        const params = new URLSearchParams();

        if (dataInicial) {
          params.set("dataInicial", dataInicial);
        }

        if (dataFinal) {
          params.set("dataFinal", dataFinal);
        }

        if (vendedorId) {
          params.set("vendedorId", vendedorId);
        }

        if (cursoId) {
          params.set("cursoId", cursoId);
        }

        if (poloId) {
          params.set("poloId", poloId);
        }

        const resposta = await fetch(
          `/api/admin/comercial/relatorios?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const json = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            json?.error || t("errors.load")
          );
        }

        setDados({
          resumo: {
            ...RESUMO_INICIAL,
            ...(json?.resumo || {}),
          },
          vendedores: Array.isArray(json?.vendedores)
            ? json.vendedores
            : [],
          leads: Array.isArray(json?.leads)
            ? json.leads
            : [],
          matriculas: Array.isArray(json?.matriculas)
            ? json.matriculas
            : [],
          filtros: {
            vendedores: Array.isArray(
              json?.filtros?.vendedores
            )
              ? json.filtros.vendedores
              : [],
            cursos: Array.isArray(
              json?.filtros?.cursos
            )
              ? json.filtros.cursos
              : [],
            polos: Array.isArray(
              json?.filtros?.polos
            )
              ? json.filtros.polos
              : [],
          },
        });
      } catch (error: unknown) {
        setErro(
          error instanceof Error
            ? error.message
            : t("errors.loadGeneric")
        );
      } finally {
        setCarregando(false);
      }
    }, [
      dataInicial,
      dataFinal,
      vendedorId,
      cursoId,
      poloId,
      t,
    ]);

  useEffect(() => {
    void carregarRelatorio();
  }, [carregarRelatorio]);

  function limparFiltros() {
    setDataInicial(primeiroDiaMes);
    setDataFinal(hoje);
    setVendedorId("");
    setCursoId("");
    setPoloId("");
  }

  function rotuloStatus(valor: string) {
    const status = String(valor || "").toUpperCase();

    const mapa: Record<string, string> = {
      ATIVA: t("status.active"),
      A_INICIAR: t("status.toStart"),
      CONCLUIDA: t("status.completed"),
      CANCELADA: t("status.canceled"),
      PENDENTE: t("status.pending"),
      CONVERTIDO: t("status.converted"),
      CONVERTIDA: t("status.converted"),
      PERDIDO: t("status.lost"),
      PERDIDA: t("status.lost"),
      NOVO: t("status.new"),
      NOVA: t("status.new"),
    };

    return mapa[status] ?? valor;
  }

  const cursosRelatorio =
    useMemo<CursoRelatorio[]>(() => {
      const mapa = new Map<string, CursoRelatorio>();

      const statusValidos = new Set([
        "ATIVA",
        "A_INICIAR",
        "CONCLUIDA",
      ]);

      function obterCurso(
        cursoIdValor: number | null,
        cursoNome: string | null
      ) {
        const chave =
          cursoIdValor != null
            ? String(cursoIdValor)
            : "SEM_CURSO";

        if (!mapa.has(chave)) {
          mapa.set(chave, {
            cursoId: cursoIdValor,
            cursoNome:
              cursoNome || t("common.noCourseProvided"),
            matriculas: 0,
            leadsConvertidos: 0,
            cancelamentos: 0,
            valorVendido: 0,
            valorRecebido: 0,
            ticketMedio: 0,
            participacao: 0,
          });
        }

        return mapa.get(chave)!;
      }

      for (const matricula of dados.matriculas) {
        const item = obterCurso(
          matricula.cursoId,
          matricula.cursoNome
        );

        const status = String(
          matricula.status
        ).toUpperCase();

        if (statusValidos.has(status)) {
          item.matriculas += 1;
          item.valorVendido += Number(
            matricula.valorVendido || 0
          );
        }

        item.valorRecebido += Number(
          matricula.valorRecebido || 0
        );

        if (status === "CANCELADA") {
          item.cancelamentos += 1;
        }
      }

      for (const lead of dados.leads) {
        if (!lead.convertido) {
          continue;
        }

        const item = obterCurso(
          lead.cursoId,
          lead.cursoNome
        );

        item.leadsConvertidos += 1;
      }

      const totalMatriculasValidas = Array.from(
        mapa.values()
      ).reduce(
        (total, item) => total + item.matriculas,
        0
      );

      const resultado = Array.from(
        mapa.values()
      ).map((item) => {
        const ticketMedio =
          item.matriculas > 0
            ? item.valorVendido / item.matriculas
            : 0;

        const participacao =
          totalMatriculasValidas > 0
            ? (item.matriculas /
                totalMatriculasValidas) *
              100
            : 0;

        return {
          ...item,
          valorVendido: Number(
            item.valorVendido.toFixed(2)
          ),
          valorRecebido: Number(
            item.valorRecebido.toFixed(2)
          ),
          ticketMedio: Number(
            ticketMedio.toFixed(2)
          ),
          participacao: Number(
            participacao.toFixed(1)
          ),
        };
      });

      resultado.sort((a, b) => {
        if (b.valorVendido !== a.valorVendido) {
          return b.valorVendido - a.valorVendido;
        }

        if (b.matriculas !== a.matriculas) {
          return b.matriculas - a.matriculas;
        }

        return a.cursoNome.localeCompare(
          b.cursoNome,
          locale
        );
      });

      return resultado;
    }, [
      dados.matriculas,
      dados.leads,
      locale,
      t,
    ]);

  const abas = useMemo<
    Array<{
      id: Aba;
      nome: string;
    }>
  >(
    () => [
      {
        id: "visao-geral",
        nome: t("tabs.overview"),
      },
      {
        id: "vendedores",
        nome: t("tabs.salespeople"),
      },
      {
        id: "leads",
        nome: t("tabs.leads"),
      },
      {
        id: "matriculas",
        nome: t("tabs.enrollments"),
      },
      {
        id: "cursos",
        nome: t("tabs.courses"),
      },
    ],
    [t]
  );

  const opcoesVendedores: OpcaoSelectTema[] = [
    {
      value: "",
      label: t("filters.all"),
    },
    ...dados.filtros.vendedores.map((item) => ({
      value: String(item.id),
      label: item.nome,
    })),
  ];

  const opcoesCursos: OpcaoSelectTema[] = [
    {
      value: "",
      label: t("filters.all"),
    },
    ...dados.filtros.cursos.map((item) => ({
      value: String(item.id),
      label: item.nome,
    })),
  ];

  const opcoesPolos: OpcaoSelectTema[] = [
    {
      value: "",
      label: t("filters.all"),
    },
    ...dados.filtros.polos.map((item) => ({
      value: String(item.id),
      label: item.nome,
    })),
  ];

  return (
    <main className={`min-h-screen w-full ${c.page}`}>
      <div className="phanyx-comercial-relatorios-page mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <header
          className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between ${c.panel}`}
        >
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-[0.18em] ${c.muted}`}
            >
              {t("header.kicker")}
            </p>

            <h1
              className={`mt-1 text-2xl font-black md:text-3xl ${c.primary}`}
            >
              {t("header.title")}
            </h1>

            <p
              className={`mt-2 max-w-3xl text-sm ${c.secondary}`}
            >
              {t("header.description")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void carregarRelatorio()}
            disabled={carregando}
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando
              ? t("header.updating")
              : t("header.update")}
          </button>
        </header>

        <section
          className={`rounded-2xl border p-5 shadow-sm ${c.panel}`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className={`font-black ${c.primary}`}>
                {t("filters.title")}
              </h2>

              <p className={`text-xs ${c.muted}`}>
                {t("filters.description")}
              </p>
            </div>

            <button
              type="button"
              onClick={limparFiltros}
              className={`text-sm font-bold transition ${c.secondary}`}
            >
              {t("filters.clear")}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1">
              <span
                className={`text-xs font-bold ${c.secondary}`}
              >
                {t("filters.startDate")}
              </span>

              <input
                type="date"
                value={dataInicial}
                onChange={(event) =>
                  setDataInicial(event.target.value)
                }
                className={`min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-blue-600 ${c.input}`}
              />
            </label>

            <label className="space-y-1">
              <span
                className={`text-xs font-bold ${c.secondary}`}
              >
                {t("filters.endDate")}
              </span>

              <input
                type="date"
                value={dataFinal}
                onChange={(event) =>
                  setDataFinal(event.target.value)
                }
                className={`min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-blue-600 ${c.input}`}
              />
            </label>

            <div className="space-y-1">
              <span
                className={`block text-xs font-bold ${c.secondary}`}
              >
                {t("filters.salesperson")}
              </span>

              <SelectTema
                value={vendedorId}
                onChange={setVendedorId}
                modoTema={modoTema}
                options={opcoesVendedores}
                ariaLabel={t("filters.salesperson")}
              />
            </div>

            <div className="space-y-1">
              <span
                className={`block text-xs font-bold ${c.secondary}`}
              >
                {t("filters.course")}
              </span>

              <SelectTema
                value={cursoId}
                onChange={setCursoId}
                modoTema={modoTema}
                options={opcoesCursos}
                ariaLabel={t("filters.course")}
              />
            </div>

            <div className="space-y-1">
              <span
                className={`block text-xs font-bold ${c.secondary}`}
              >
                {t("filters.campus")}
              </span>

              <SelectTema
                value={poloId}
                onChange={setPoloId}
                modoTema={modoTema}
                options={opcoesPolos}
                ariaLabel={t("filters.campus")}
              />
            </div>
          </div>
        </section>

        {erro && (
          <div className="rounded-2xl border border-red-700 bg-red-950/15 p-4 text-sm font-semibold text-red-700 dark:text-red-100">
            {erro}
          </div>
        )}

        <section
          className={`overflow-x-auto rounded-2xl border p-2 shadow-sm ${c.panel}`}
        >
          <div className="flex min-w-max gap-2">
            {abas.map((item) => {
              const ativa = aba === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAba(item.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    ativa ? c.activeTab : c.inactiveTab
                  }`}
                >
                  {item.nome}
                </button>
              );
            })}
          </div>
        </section>

        {aba === "visao-geral" && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardIndicador
              titulo={t("indicators.leadsReceived")}
              valor={formatarNumero(
                dados.resumo.leadsRecebidos,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.leadsConverted")}
              valor={formatarNumero(
                dados.resumo.leadsConvertidos,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.conversionRate")}
              valor={`${formatarPercentual(
                dados.resumo.taxaConversao,
                locale
              )}%`}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.enrollments")}
              valor={formatarNumero(
                dados.resumo.matriculas,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.soldAmount")}
              valor={formatarMoeda(
                dados.resumo.valorVendido,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.receivedAtEnrollment")}
              valor={formatarMoeda(
                dados.resumo.valorRecebido,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.averageTicket")}
              valor={formatarMoeda(
                dados.resumo.ticketMedio,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />

            <CardIndicador
              titulo={t("indicators.cancellations")}
              valor={formatarNumero(
                dados.resumo.cancelamentos,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
          </section>
        )}

        {aba === "leads" && (
          <section className="grid gap-4 sm:grid-cols-3">
            <CardIndicador
              titulo={t("indicators.leadsReceived")}
              valor={formatarNumero(
                dados.resumo.leadsRecebidos,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
            <CardIndicador
              titulo={t("indicators.leadsConverted")}
              valor={formatarNumero(
                dados.resumo.leadsConvertidos,
                locale
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
            <CardIndicador
              titulo={t("indicators.conversionRate")}
              valor={`${formatarPercentual(
                dados.resumo.taxaConversao,
                locale
              )}%`}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
          </section>
        )}

        {aba === "matriculas" && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <CardIndicador
              titulo={t("indicators.enrollments")}
              valor={formatarNumero(
                dados.resumo.matriculas,
                locale
              )}
              descricao={t(
                "indicators.enrollmentsDescription"
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
            <CardIndicador
              titulo={t("indicators.soldAmount")}
              valor={formatarMoeda(
                dados.resumo.valorVendido,
                locale
              )}
              descricao={t(
                "indicators.soldAmountDescription"
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
            <CardIndicador
              titulo={t("indicators.receivedAtEnrollment")}
              valor={formatarMoeda(
                dados.resumo.valorRecebido,
                locale
              )}
              descricao={t(
                "indicators.receivedDescription"
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
            <CardIndicador
              titulo={t("indicators.averageTicket")}
              valor={formatarMoeda(
                dados.resumo.ticketMedio,
                locale
              )}
              descricao={t(
                "indicators.averageTicketDescription"
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
            <CardIndicador
              titulo={t("indicators.cancellations")}
              valor={formatarNumero(
                dados.resumo.cancelamentos,
                locale
              )}
              descricao={t(
                "indicators.cancellationsDescription"
              )}
              panelClass={c.panel}
              primaryClass={c.primary}
              mutedClass={c.muted}
            />
          </section>
        )}

        {(aba === "visao-geral" ||
          aba === "vendedores") && (
          <section
            className={`overflow-hidden rounded-2xl border shadow-sm ${c.panel}`}
          >
            <div
              className={`border-b p-5 ${c.border}`}
            >
              <h2
                className={`text-lg font-black ${c.primary}`}
              >
                {t("salespeople.title")}
              </h2>

              <p className={`mt-1 text-sm ${c.muted}`}>
                {t("salespeople.description")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={c.tableHead}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("salespeople.columns.salesperson")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("salespeople.columns.leads")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("salespeople.columns.conversions")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("salespeople.columns.enrollments")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("salespeople.columns.conversion")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("salespeople.columns.sold")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("salespeople.columns.received")}
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${c.divider}`}>
                  {!carregando &&
                    dados.vendedores.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className={`px-4 py-10 text-center ${c.muted}`}
                        >
                          {t("salespeople.empty")}
                        </td>
                      </tr>
                    )}

                  {dados.vendedores.map((item) => (
                    <tr
                      key={item.funcionarioId}
                      className={c.rowHover}
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold">
                          {item.nome}
                        </p>

                        {(item.cargo ||
                          item.departamento) && (
                          <p
                            className={`text-xs ${c.muted}`}
                          >
                            {[
                              item.cargo,
                              item.departamento,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarNumero(
                          item.leads,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarNumero(
                          item.conversoes,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarNumero(
                          item.matriculas,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-bold">
                        {formatarPercentual(
                          item.taxaConversao,
                          locale
                        )}
                        %
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarMoeda(
                          item.valorVendido,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarMoeda(
                          item.valorRecebido,
                          locale
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {aba === "leads" && (
          <section
            className={`overflow-hidden rounded-2xl border shadow-sm ${c.panel}`}
          >
            <div
              className={`border-b p-5 ${c.border}`}
            >
              <h2
                className={`text-lg font-black ${c.primary}`}
              >
                {t("leads.title")}
              </h2>

              <p className={`mt-1 text-sm ${c.muted}`}>
                {t("leads.description")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={c.tableHead}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.lead")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.contact")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.source")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.responsible")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.status")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.receivedAt")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("leads.columns.conversion")}
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${c.divider}`}>
                  {!carregando &&
                    dados.leads.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className={`px-4 py-10 text-center ${c.muted}`}
                        >
                          {t("leads.empty")}
                        </td>
                      </tr>
                    )}

                  {dados.leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={c.rowHover}
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold">
                          {lead.nome}
                        </p>

                        {lead.interesse && (
                          <p
                            className={`mt-1 text-xs ${c.muted}`}
                          >
                            {lead.interesse}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p>{lead.telefone || "-"}</p>
                        <p
                          className={`text-xs ${c.muted}`}
                        >
                          {lead.email || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {lead.origem || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {lead.responsavelNome ||
                          t("common.noResponsible")}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${c.panelStrong} ${c.secondary}`}
                        >
                          {rotuloStatus(lead.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {formatarData(
                          lead.recebidoEm,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {lead.convertido ? (
                          <div>
                            <p className="font-bold text-emerald-600">
                              {t("leads.converted")}
                            </p>

                            {(lead.cursoNome ||
                              lead.poloNome) && (
                              <p
                                className={`mt-1 text-xs ${c.muted}`}
                              >
                                {[
                                  lead.cursoNome,
                                  lead.poloNome,
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            )}

                            {lead.convertidoEm && (
                              <p
                                className={`text-xs ${c.muted}`}
                              >
                                {formatarData(
                                  lead.convertidoEm,
                                  locale
                                )}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`font-semibold ${c.muted}`}
                          >
                            {t("leads.notConverted")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {aba === "matriculas" && (
          <section
            className={`overflow-hidden rounded-2xl border shadow-sm ${c.panel}`}
          >
            <div
              className={`border-b p-5 ${c.border}`}
            >
              <h2
                className={`text-lg font-black ${c.primary}`}
              >
                {t("enrollments.title")}
              </h2>

              <p className={`mt-1 text-sm ${c.muted}`}>
                {t("enrollments.description")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={c.tableHead}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("enrollments.columns.enrollment")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("enrollments.columns.student")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("enrollments.columns.courseCampus")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("enrollments.columns.salesperson")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("enrollments.columns.source")}
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("enrollments.columns.status")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("enrollments.columns.sold")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("enrollments.columns.received")}
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${c.divider}`}>
                  {!carregando &&
                    dados.matriculas.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className={`px-4 py-10 text-center ${c.muted}`}
                        >
                          {t("enrollments.empty")}
                        </td>
                      </tr>
                    )}

                  {dados.matriculas.map(
                    (matricula) => (
                      <tr
                        key={matricula.id}
                        className={c.rowHover}
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold">
                            {matricula.numero}
                          </p>

                          <p
                            className={`mt-1 text-xs ${c.muted}`}
                          >
                            {formatarData(
                              matricula.dataMatricula,
                              locale
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-3 font-bold">
                          {matricula.alunoNome}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold">
                            {matricula.cursoNome ||
                              t("common.noCourse")}
                          </p>

                          <p
                            className={`mt-1 text-xs ${c.muted}`}
                          >
                            {matricula.poloNome ||
                              t("common.noCampus")}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          {matricula.vendedorNome ||
                            t("common.notProvided")}
                        </td>

                        <td className="px-4 py-3">
                          {matricula.origem || "-"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${c.panelStrong} ${c.secondary}`}
                          >
                            {rotuloStatus(
                              matricula.status
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {matricula.contabilizadaComoVenda ? (
                            <span className="font-bold">
                              {formatarMoeda(
                                matricula.valorVendido,
                                locale
                              )}
                            </span>
                          ) : (
                            <div>
                              <p
                                className={`text-xs font-bold ${c.muted}`}
                              >
                                {t(
                                  "enrollments.notCounted"
                                )}
                              </p>

                              <p
                                className={`mt-1 text-xs ${c.muted}`}
                              >
                                {t("enrollments.expected")}:{" "}
                                {formatarMoeda(
                                  matricula.valorContratado,
                                  locale
                                )}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {formatarMoeda(
                            matricula.valorRecebido,
                            locale
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {aba === "cursos" && (
          <section
            className={`overflow-hidden rounded-2xl border shadow-sm ${c.panel}`}
          >
            <div
              className={`border-b p-5 ${c.border}`}
            >
              <h2
                className={`text-lg font-black ${c.primary}`}
              >
                {t("courses.title")}
              </h2>

              <p className={`mt-1 text-sm ${c.muted}`}>
                {t("courses.description")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={c.tableHead}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">
                      {t("courses.columns.course")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.enrollments")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.convertedLeads")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.share")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.sold")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.received")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.averageTicket")}
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      {t("courses.columns.cancellations")}
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${c.divider}`}>
                  {!carregando &&
                    cursosRelatorio.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className={`px-4 py-10 text-center ${c.muted}`}
                        >
                          {t("courses.empty")}
                        </td>
                      </tr>
                    )}

                  {cursosRelatorio.map((curso) => (
                    <tr
                      key={
                        curso.cursoId ?? "sem-curso"
                      }
                      className={c.rowHover}
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold">
                          {curso.cursoNome}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-right font-bold">
                        {formatarNumero(
                          curso.matriculas,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarNumero(
                          curso.leadsConvertidos,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-bold">
                        {formatarPercentual(
                          curso.participacao,
                          locale
                        )}
                        %
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold">
                        {formatarMoeda(
                          curso.valorVendido,
                          locale
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {formatarMoeda(
                          curso.valorRecebido,
                          locale
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {formatarMoeda(
                          curso.ticketMedio,
                          locale
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatarNumero(
                          curso.cancelamentos,
                          locale
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
