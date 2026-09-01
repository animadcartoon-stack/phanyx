"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

type PeriodoFiltro =
  | "DIA"
  | "SEMANA"
  | "MES"
  | "SEMESTRE_1"
  | "SEMESTRE_2"
  | "ANO";

type ItemFiltro = {
  id: number | string;
  nome: string;
};

type AgendaItem = {
  id: number;
  data?: string | null;
  hora?: string | null;
  tipo?: string | null;
  curso?: string | null;
  turma?: string | null;
  predio?: string | null;
  ala?: string | null;
  andar?: string | null;
  sala?: string | null;
  disciplina?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  professor?: string | null;
  funcionario?: string | null;
  departamento?: string | null;
  polo?: string | null;
  responsavel?: string | null;
  status?: string | null;
  local?: string | null;
  observacoes?: string | null;
};

type ResumoAgenda = {
  aulas?: number;
  provas?: number;
  atividades?: number;
  reunioes?: number;
  ferias?: number;
  escalasRH?: number;
  disciplinasSemProfessor?: number;
};

type DadosAgenda = {
  agenda?: AgendaItem[];
  resumo?: ResumoAgenda;
};

type DadosFiltros = {
  cursos?: ItemFiltro[];
  turmas?: ItemFiltro[];
  professores?: ItemFiltro[];
  funcionarios?: ItemFiltro[];
  departamentos?: ItemFiltro[];
  disciplinas?: ItemFiltro[];
  polos?: ItemFiltro[];
};

type PreferenciasAgenda = {
  colunasTabela?: string[];
  colunasPdf?: string[];
  colunasExcel?: string[];
};

type ColunaId =
  | "data"
  | "hora"
  | "tipo"
  | "curso"
  | "turma"
  | "predio"
  | "ala"
  | "andar"
  | "sala"
  | "disciplina"
  | "evento"
  | "professor"
  | "funcionario"
  | "departamento"
  | "polo"
  | "responsavel"
  | "status"
  | "local"
  | "observacoes";

type Coluna = {
  id: ColunaId;
  nome: string;
};

type OpcaoSelect = {
  value: string;
  label: string;
};

type AgendaSelectProps = {
  label: string;
  value: string;
  options: OpcaoSelect[];
  onChange: (value: string) => void;
};

const COLUNAS_TABELA_PADRAO: ColunaId[] = [
  "data",
  "hora",
  "tipo",
  "evento",
  "turma",
  "professor",
  "funcionario",
  "status",
];

const COLUNAS_PDF_PADRAO: ColunaId[] = [
  "data",
  "hora",
  "tipo",
  "evento",
  "status",
];

function mensagemDaResposta(valor: unknown) {
  if (!valor || typeof valor !== "object") return null;

  const resposta = valor as Record<string, unknown>;

  if (typeof resposta.error === "string" && resposta.error.trim()) {
    return resposta.error;
  }

  if (typeof resposta.message === "string" && resposta.message.trim()) {
    return resposta.message;
  }

  return null;
}

function apenasColunasValidas(valor: unknown, colunasValidas: Set<string>) {
  if (!Array.isArray(valor)) return null;

  return valor.filter(
    (item): item is string =>
      typeof item === "string" && colunasValidas.has(item)
  );
}

function AgendaSelect({
  label,
  value,
  options,
  onChange,
}: AgendaSelectProps) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const opcaoSelecionada =
    options.find((opcao) => opcao.value === value) || options[0];

  useEffect(() => {
    if (!aberto) return;

    function fecharAoClicarFora(event: MouseEvent) {
      if (raizRef.current && !raizRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [aberto]);

  return (
    <div ref={raizRef} className="agenda-select relative">
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>

      <button
        type="button"
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="agenda-control flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm outline-none transition focus:ring-2"
        onClick={() => setAberto((valorAtual) => !valorAtual)}
      >
        <span className="truncate">{opcaoSelecionada?.label || label}</span>
        <span
          aria-hidden="true"
          className={`agenda-select-arrow ml-3 transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {aberto ? (
        <div
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="agenda-select-menu absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border p-1 shadow-xl"
        >
          {options.map((opcao) => {
            const selecionada = opcao.value === value;

            return (
              <button
                key={`${opcao.value}-${opcao.label}`}
                type="button"
                role="option"
                aria-selected={selecionada}
                className={`agenda-select-option w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selecionada ? "is-selected" : ""
                }`}
                onClick={() => {
                  onChange(opcao.value);
                  setAberto(false);
                }}
              >
                {opcao.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AgendaOperacionalPage() {
  const locale = useLocale();
  const t = useTranslations("AdminOperationalAgenda");

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("SEMANA");
  const [cursoId, setCursoId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [poloId, setPoloId] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [pesquisaAplicada, setPesquisaAplicada] = useState("");

  const [cursos, setCursos] = useState<ItemFiltro[]>([]);
  const [turmas, setTurmas] = useState<ItemFiltro[]>([]);
  const [professores, setProfessores] = useState<ItemFiltro[]>([]);
  const [funcionarios, setFuncionarios] = useState<ItemFiltro[]>([]);
  const [departamentos, setDepartamentos] = useState<ItemFiltro[]>([]);
  const [disciplinas, setDisciplinas] = useState<ItemFiltro[]>([]);
  const [polos, setPolos] = useState<ItemFiltro[]>([]);

  const [linhaAberta, setLinhaAberta] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosAgenda | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [erroPreferencias, setErroPreferencias] = useState("");

  const [colunasVisiveis, setColunasVisiveis] = useState<string[]>(
    COLUNAS_TABELA_PADRAO
  );
  const [colunasPdf, setColunasPdf] = useState<string[]>(COLUNAS_PDF_PADRAO);
  const [colunasExcel, setColunasExcel] = useState<string[]>(
    COLUNAS_TABELA_PADRAO
  );

  const colunasDisponiveis = useMemo<Coluna[]>(
    () => [
      { id: "data", nome: t("columns.date") },
      { id: "hora", nome: t("columns.time") },
      { id: "tipo", nome: t("columns.type") },
      { id: "curso", nome: t("columns.course") },
      { id: "turma", nome: t("columns.class") },
      { id: "predio", nome: t("columns.building") },
      { id: "ala", nome: t("columns.wing") },
      { id: "andar", nome: t("columns.floor") },
      { id: "sala", nome: t("columns.room") },
      { id: "disciplina", nome: t("columns.subject") },
      { id: "evento", nome: t("columns.event") },
      { id: "professor", nome: t("columns.teacher") },
      { id: "funcionario", nome: t("columns.employee") },
      { id: "departamento", nome: t("columns.department") },
      { id: "polo", nome: t("columns.campus") },
      { id: "responsavel", nome: t("columns.responsible") },
      { id: "status", nome: t("columns.status") },
      { id: "local", nome: t("columns.location") },
      { id: "observacoes", nome: t("columns.notes") },
    ],
    [t]
  );

  const idsColunasValidas = useMemo(
    () => new Set(colunasDisponiveis.map((coluna) => coluna.id)),
    [colunasDisponiveis]
  );

  const periodos = useMemo(
    () => [
      { id: "DIA" as const, label: t("periods.today") },
      { id: "SEMANA" as const, label: t("periods.week") },
      { id: "MES" as const, label: t("periods.month") },
      { id: "SEMESTRE_1" as const, label: t("periods.firstSemester") },
      { id: "SEMESTRE_2" as const, label: t("periods.secondSemester") },
      { id: "ANO" as const, label: t("periods.year") },
    ],
    [t]
  );

  const formatadorData = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "short" }),
    [locale]
  );

  const criarParametros = useCallback(
    (pesquisaAtual: string) => {
      const params = new URLSearchParams();

      params.set("periodo", periodo);
      if (cursoId) params.set("cursoId", cursoId);
      if (turmaId) params.set("turmaId", turmaId);
      if (professorId) params.set("professorId", professorId);
      if (funcionarioId) params.set("funcionarioId", funcionarioId);
      if (disciplinaId) params.set("disciplinaId", disciplinaId);
      if (departamentoId) params.set("departamentoId", departamentoId);
      if (poloId) params.set("poloId", poloId);
      if (pesquisaAtual.trim()) params.set("pesquisa", pesquisaAtual.trim());

      return params;
    },
    [
      periodo,
      cursoId,
      turmaId,
      professorId,
      funcionarioId,
      disciplinaId,
      departamentoId,
      poloId,
    ]
  );

  const carregarAgenda = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setErro("");

      try {
        const params = criarParametros(pesquisaAplicada);
        const res = await fetch(
          `/api/admin/agenda-operacional?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
            signal,
          }
        );

        let data: unknown = null;

        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          throw new Error(mensagemDaResposta(data) || t("errors.loadAgenda"));
        }

        setDados((data || {}) as DadosAgenda);
        setLinhaAberta(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setErro(error instanceof Error ? error.message : t("errors.loadAgenda"));
        setDados(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [criarParametros, pesquisaAplicada, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    void carregarAgenda(controller.signal);
    return () => controller.abort();
  }, [carregarAgenda]);

  useEffect(() => {
    const controller = new AbortController();

    async function carregarDadosIniciais() {
      try {
        const [resFiltros, resPreferencias] = await Promise.all([
          fetch("/api/admin/agenda-operacional/filtros", {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/admin/agenda-operacional/preferencias", {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (resFiltros.ok) {
          const filtros = (await resFiltros.json()) as DadosFiltros;
          setCursos(filtros.cursos || []);
          setTurmas(filtros.turmas || []);
          setProfessores(filtros.professores || []);
          setFuncionarios(filtros.funcionarios || []);
          setDepartamentos(filtros.departamentos || []);
          setDisciplinas(filtros.disciplinas || []);
          setPolos(filtros.polos || []);
        } else {
          console.error(t("errors.loadFilters"));
        }

        if (resPreferencias.ok) {
          const preferencias =
            (await resPreferencias.json()) as PreferenciasAgenda;

          const tabela = apenasColunasValidas(
            preferencias.colunasTabela,
            idsColunasValidas
          );
          const pdf = apenasColunasValidas(
            preferencias.colunasPdf,
            idsColunasValidas
          );
          const excel = apenasColunasValidas(
            preferencias.colunasExcel,
            idsColunasValidas
          );

          if (tabela) setColunasVisiveis(tabela);
          if (pdf) setColunasPdf(pdf);
          if (excel) setColunasExcel(excel);
        } else {
          console.error(t("errors.loadPreferences"));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error(error);
      }
    }

    void carregarDadosIniciais();
    return () => controller.abort();
  }, [idsColunasValidas, t]);

  const salvarPreferencias = useCallback(
    async (preferencias: PreferenciasAgenda) => {
      setErroPreferencias("");

      try {
        const res = await fetch("/api/admin/agenda-operacional/preferencias", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferencias),
        });

        if (!res.ok) {
          let data: unknown = null;
          try {
            data = await res.json();
          } catch {
            data = null;
          }

          throw new Error(
            mensagemDaResposta(data) || t("errors.savePreferences")
          );
        }
      } catch (error) {
        setErroPreferencias(
          error instanceof Error ? error.message : t("errors.savePreferences")
        );
      }
    },
    [t]
  );

  function aplicarPesquisa() {
    const novaPesquisa = pesquisa.trim();

    if (novaPesquisa === pesquisaAplicada) {
      void carregarAgenda();
      return;
    }

    setPesquisaAplicada(novaPesquisa);
  }

  function abrirRelatorio(formato: "pdf" | "excel") {
    const params = criarParametros(pesquisaAplicada);
    window.open(
      `/api/admin/agenda-operacional/${formato}?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function alternarColuna(
    colunaId: string,
    tipo: "tabela" | "pdf" | "excel"
  ) {
    const atuais =
      tipo === "tabela"
        ? colunasVisiveis
        : tipo === "pdf"
          ? colunasPdf
          : colunasExcel;

    const novasColunas = atuais.includes(colunaId)
      ? atuais.filter((id) => id !== colunaId)
      : [...atuais, colunaId];

    const preferencias: PreferenciasAgenda = {
      colunasTabela: tipo === "tabela" ? novasColunas : colunasVisiveis,
      colunasPdf: tipo === "pdf" ? novasColunas : colunasPdf,
      colunasExcel: tipo === "excel" ? novasColunas : colunasExcel,
    };

    if (tipo === "tabela") setColunasVisiveis(novasColunas);
    if (tipo === "pdf") setColunasPdf(novasColunas);
    if (tipo === "excel") setColunasExcel(novasColunas);

    void salvarPreferencias(preferencias);
  }

  function formatarData(valor?: string | null) {
    if (!valor) return t("common.notAvailable");
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
      ? t("common.notAvailable")
      : formatadorData.format(data);
  }

  const cards = useMemo(() => {
    const resumo = dados?.resumo || {};

    return [
      { titulo: t("summary.classes"), valor: resumo.aulas || 0 },
      { titulo: t("summary.exams"), valor: resumo.provas || 0 },
      { titulo: t("summary.activities"), valor: resumo.atividades || 0 },
      { titulo: t("summary.meetings"), valor: resumo.reunioes || 0 },
      { titulo: t("summary.hrVacation"), valor: resumo.ferias || 0 },
      { titulo: t("summary.hrShifts"), valor: resumo.escalasRH || 0 },
      {
        titulo: t("summary.withoutTeacher"),
        valor: resumo.disciplinasSemProfessor || 0,
      },
    ];
  }, [dados, t]);

  const criarOpcoes = useCallback(
    (itens: ItemFiltro[], opcaoTodos: string): OpcaoSelect[] => [
      { value: "", label: opcaoTodos },
      ...itens.map((item) => ({
        value: String(item.id),
        label: item.nome,
      })),
    ],
    []
  );

  const colSpanTabela = Math.max(colunasVisiveis.length, 1);

  return (
    <main className="agenda-operacional-page min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="agenda-card rounded-[28px] border p-6 shadow-sm">
          <p className="agenda-eyebrow text-xs font-semibold uppercase tracking-[0.18em]">
            {t("hero.eyebrow")}
          </p>

          <h1 className="agenda-title mt-2 text-3xl font-bold">
            {t("hero.title")}
          </h1>

          <p className="agenda-muted mt-2 max-w-4xl text-sm font-medium leading-6">
            {t("hero.description")}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {periodos.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriodo(item.id)}
                className={`agenda-period rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  periodo === item.id ? "is-active" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex gap-2 md:col-span-2 xl:col-span-4">
              <input
                type="search"
                value={pesquisa}
                onChange={(event) => setPesquisa(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") aplicarPesquisa();
                }}
                placeholder={t("filters.searchPlaceholder")}
                className="agenda-control h-11 min-w-0 flex-1 rounded-xl border px-4 text-sm outline-none transition focus:ring-2"
              />

              <button
                type="button"
                onClick={aplicarPesquisa}
                disabled={loading}
                className="agenda-primary-button h-11 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("filters.loading") : t("filters.apply")}
              </button>
            </div>

            <AgendaSelect
              label={t("filters.allCourses")}
              value={cursoId}
              onChange={setCursoId}
              options={criarOpcoes(cursos, t("filters.allCourses"))}
            />
            <AgendaSelect
              label={t("filters.allClasses")}
              value={turmaId}
              onChange={setTurmaId}
              options={criarOpcoes(turmas, t("filters.allClasses"))}
            />
            <AgendaSelect
              label={t("filters.allTeachers")}
              value={professorId}
              onChange={setProfessorId}
              options={criarOpcoes(professores, t("filters.allTeachers"))}
            />
            <AgendaSelect
              label={t("filters.allSubjects")}
              value={disciplinaId}
              onChange={setDisciplinaId}
              options={criarOpcoes(disciplinas, t("filters.allSubjects"))}
            />
            <AgendaSelect
              label={t("filters.allDepartments")}
              value={departamentoId}
              onChange={setDepartamentoId}
              options={criarOpcoes(
                departamentos,
                t("filters.allDepartments")
              )}
            />
            <AgendaSelect
              label={t("filters.allEmployees")}
              value={funcionarioId}
              onChange={setFuncionarioId}
              options={criarOpcoes(funcionarios, t("filters.allEmployees"))}
            />
            <AgendaSelect
              label={t("filters.allCampuses")}
              value={poloId}
              onChange={setPoloId}
              options={criarOpcoes(polos, t("filters.allCampuses"))}
            />
          </div>
        </section>

        <section className="agenda-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="agenda-title text-base font-bold">
              {t("reports.title")}
            </h2>
            <p className="agenda-muted mt-1 text-sm">
              {t("reports.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => abrirRelatorio("pdf")}
              className="agenda-pdf-button rounded-xl px-4 py-2 text-sm font-bold transition"
            >
              {t("reports.exportPdf")}
            </button>
            <button
              type="button"
              onClick={() => abrirRelatorio("excel")}
              className="agenda-excel-button rounded-xl px-4 py-2 text-sm font-bold transition"
            >
              {t("reports.exportExcel")}
            </button>
          </div>
        </section>

        <section className="agenda-card rounded-2xl border p-5 shadow-sm">
          <h2 className="agenda-title text-lg font-bold">
            {t("customization.title")}
          </h2>
          <p className="agenda-muted mt-1 text-sm leading-6">
            {t("customization.description")}
          </p>

          {erroPreferencias ? (
            <div className="agenda-error mt-4 rounded-xl border p-3 text-sm font-semibold">
              {erroPreferencias}
            </div>
          ) : null}

          {(
            [
              ["tabela", t("customization.table"), colunasVisiveis],
              ["pdf", t("customization.pdf"), colunasPdf],
              ["excel", t("customization.excel"), colunasExcel],
            ] as const
          ).map(([tipo, titulo, selecionadas], indice) => (
            <div
              key={tipo}
              className={indice === 0 ? "mt-5" : "agenda-divider mt-6 border-t pt-5"}
            >
              <h3 className="agenda-eyebrow mb-3 text-sm font-semibold uppercase tracking-wide">
                {titulo}
              </h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                {colunasDisponiveis.map((coluna) => (
                  <label
                    key={`${tipo}-${coluna.id}`}
                    className="agenda-checkbox flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selecionadas.includes(coluna.id)}
                      onChange={() => alternarColuna(coluna.id, tipo)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>{coluna.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>

        {erro ? (
          <div className="agenda-error rounded-2xl border p-4 text-sm font-semibold">
            {erro}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.titulo}
              className="agenda-card rounded-2xl border p-5 shadow-sm"
            >
              <p className="agenda-muted text-xs font-semibold uppercase tracking-[0.16em]">
                {card.titulo}
              </p>
              <p className="agenda-title mt-3 text-3xl font-bold">
                {card.valor}
              </p>
            </div>
          ))}
        </section>

        <section className="agenda-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="p-5">
            <h2 className="agenda-title text-lg font-bold">
              {t("timeline.title")}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="agenda-table-head">
                <tr>
                  {colunasDisponiveis.map((coluna) =>
                    colunasVisiveis.includes(coluna.id) ? (
                      <th key={coluna.id} className="px-3 py-3 font-bold">
                        {coluna.nome}
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>

              <tbody>
                {loading && !dados ? (
                  <tr>
                    <td
                      colSpan={colSpanTabela}
                      className="agenda-empty px-3 py-12 text-center"
                    >
                      <span className="agenda-spinner mx-auto mb-3 block h-7 w-7 rounded-full border-2" />
                      <strong className="agenda-title block">
                        {t("timeline.loading")}
                      </strong>
                    </td>
                  </tr>
                ) : dados?.agenda?.length ? (
                  dados.agenda.map((item) => (
                    <Fragment key={item.id}>
                      <tr
                        onClick={() =>
                          setLinhaAberta((atual) =>
                            atual === item.id ? null : item.id
                          )
                        }
                        className="agenda-row cursor-pointer border-b align-top transition"
                      >
                        {colunasVisiveis.includes("data") ? (
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span aria-hidden="true">
                                {linhaAberta === item.id ? "▼" : "▶"}
                              </span>
                              <span>{formatarData(item.data)}</span>
                            </div>
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("hora") ? (
                          <td className="px-3 py-3">
                            {item.hora || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("tipo") ? (
                          <td className="px-3 py-3">
                            {item.tipo || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("curso") ? (
                          <td className="px-3 py-3">
                            {item.curso ||
                              item.descricao ||
                              t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("turma") ? (
                          <td className="px-3 py-3">
                            {item.turma || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("predio") ? (
                          <td className="px-3 py-3">
                            {item.predio || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("ala") ? (
                          <td className="px-3 py-3">
                            {item.ala || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("andar") ? (
                          <td className="px-3 py-3">
                            {item.andar || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("sala") ? (
                          <td className="px-3 py-3">
                            {item.sala || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("disciplina") ? (
                          <td className="px-3 py-3">
                            {item.disciplina || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("evento") ? (
                          <td className="px-3 py-3">
                            <div className="agenda-title font-semibold">
                              {item.titulo || t("common.notAvailable")}
                            </div>
                            <div className="agenda-muted mt-1 text-xs">
                              {item.descricao || t("common.notAvailable")}
                            </div>
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("professor") ? (
                          <td className="px-3 py-3">
                            {item.professor || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("funcionario") ? (
                          <td className="px-3 py-3">
                            {item.funcionario || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("departamento") ? (
                          <td className="px-3 py-3">
                            {item.departamento || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("polo") ? (
                          <td className="px-3 py-3">
                            {item.polo || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("responsavel") ? (
                          <td className="px-3 py-3">
                            {item.responsavel || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("status") ? (
                          <td className="px-3 py-3">
                            {item.status || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("local") ? (
                          <td className="px-3 py-3">
                            {item.local || t("common.notAvailable")}
                          </td>
                        ) : null}
                        {colunasVisiveis.includes("observacoes") ? (
                          <td className="px-3 py-3">
                            {item.observacoes || t("common.notAvailable")}
                          </td>
                        ) : null}
                      </tr>

                      {linhaAberta === item.id ? (
                        <tr className="agenda-details-row border-b">
                          <td
                            colSpan={colSpanTabela}
                            className="agenda-details px-6 py-5"
                          >
                            <div className="grid gap-4 md:grid-cols-3">
                              {(
                                [
                                  [t("columns.course"), item.curso],
                                  [t("columns.class"), item.turma],
                                  [t("columns.subject"), item.disciplina],
                                  [t("columns.teacher"), item.professor],
                                  [t("columns.employee"), item.funcionario],
                                  [
                                    t("columns.department"),
                                    item.departamento,
                                  ],
                                  [t("columns.campus"), item.polo],
                                  [t("columns.location"), item.local],
                                  [t("columns.notes"), item.observacoes],
                                ] as const
                              ).map(([rotulo, valor]) => (
                                <div key={rotulo}>
                                  <p className="agenda-muted text-xs font-bold uppercase tracking-wide">
                                    {rotulo}
                                  </p>
                                  <p className="agenda-title mt-1 font-medium">
                                    {valor || t("common.notAvailable")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={colSpanTabela}
                      className="agenda-empty px-3 py-12 text-center"
                    >
                      {t("timeline.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style>{`
        .agenda-operacional-page {
          background: #f8fafc;
          color: #0f172a;
        }

        .agenda-operacional-page .agenda-card {
          background: #ffffff;
          border-color: #dbe4f0;
        }

        .agenda-operacional-page .agenda-title {
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
          opacity: 1;
        }

        .agenda-operacional-page .agenda-muted {
          color: #475569;
          -webkit-text-fill-color: #475569;
          opacity: 1;
        }

        .agenda-operacional-page .agenda-eyebrow {
          color: #1d4ed8;
          -webkit-text-fill-color: #1d4ed8;
        }

        .agenda-operacional-page .agenda-control {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
        }

        .agenda-operacional-page .agenda-control::placeholder {
          color: #64748b;
          -webkit-text-fill-color: #64748b;
          opacity: 1;
        }

        .agenda-operacional-page .agenda-control:focus {
          border-color: #2563eb;
          --tw-ring-color: rgba(37, 99, 235, 0.25);
        }

        .agenda-operacional-page .agenda-select-arrow {
          color: #475569;
          -webkit-text-fill-color: #475569;
        }

        .agenda-operacional-page .agenda-select-menu {
          background: #ffffff;
          border-color: #cbd5e1;
        }

        .agenda-operacional-page .agenda-select-option {
          background: #ffffff;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
        }

        .agenda-operacional-page .agenda-select-option:hover,
        .agenda-operacional-page .agenda-select-option:focus-visible,
        .agenda-operacional-page .agenda-select-option.is-selected {
          background: #e2e8f0;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
          outline: none;
        }

        .agenda-operacional-page .agenda-period {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #334155;
          -webkit-text-fill-color: #334155;
        }

        .agenda-operacional-page .agenda-period:hover {
          background: #f1f5f9;
        }

        .agenda-operacional-page .agenda-period.is-active,
        .agenda-operacional-page .agenda-primary-button {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        .agenda-operacional-page .agenda-period.is-active:hover,
        .agenda-operacional-page .agenda-primary-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .agenda-operacional-page .agenda-pdf-button {
          background: #dc2626;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        .agenda-operacional-page .agenda-pdf-button:hover {
          background: #b91c1c;
        }

        .agenda-operacional-page .agenda-excel-button {
          background: #15803d;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        .agenda-operacional-page .agenda-excel-button:hover {
          background: #166534;
        }

        .agenda-operacional-page .agenda-divider,
        .agenda-operacional-page .agenda-row,
        .agenda-operacional-page .agenda-details-row {
          border-color: #e2e8f0;
        }

        .agenda-operacional-page .agenda-checkbox {
          color: #334155;
          -webkit-text-fill-color: #334155;
        }

        .agenda-operacional-page .agenda-checkbox:hover {
          background: #eff6ff;
        }

        .agenda-operacional-page .agenda-error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
          -webkit-text-fill-color: #991b1b;
        }

        .agenda-operacional-page .agenda-table-head {
          background: #f1f5f9;
          color: #334155;
          -webkit-text-fill-color: #334155;
        }

        .agenda-operacional-page .agenda-row {
          background: #ffffff;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
        }

        .agenda-operacional-page .agenda-row:hover {
          background: #eff6ff;
        }

        .agenda-operacional-page .agenda-details {
          background: #f8fafc;
        }

        .agenda-operacional-page .agenda-empty {
          color: #475569;
          -webkit-text-fill-color: #475569;
        }

        .agenda-operacional-page .agenda-spinner {
          border-color: #bfdbfe;
          border-top-color: #2563eb;
          animation: agenda-spin 0.8s linear infinite;
        }

        @keyframes agenda-spin {
          to {
            transform: rotate(360deg);
          }
        }

        html[data-theme="dark"] .agenda-operacional-page {
          background: #020617;
          color: #f8fafc;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-card,
        html[data-theme="dark"] .agenda-operacional-page .agenda-row {
          background: #0f172a;
          border-color: #334155;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-title {
          color: #f8fafc;
          -webkit-text-fill-color: #f8fafc;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-muted {
          color: #cbd5e1;
          -webkit-text-fill-color: #cbd5e1;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-eyebrow {
          color: #93c5fd;
          -webkit-text-fill-color: #93c5fd;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-control,
        html[data-theme="dark"] .agenda-operacional-page .agenda-select-menu,
        html[data-theme="dark"] .agenda-operacional-page .agenda-select-option,
        html[data-theme="dark"] .agenda-operacional-page .agenda-period {
          background: #111c30;
          border-color: #475569;
          color: #f8fafc;
          -webkit-text-fill-color: #f8fafc;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-control::placeholder {
          color: #94a3b8;
          -webkit-text-fill-color: #94a3b8;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-select-arrow {
          color: #cbd5e1;
          -webkit-text-fill-color: #cbd5e1;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-select-option:hover,
        html[data-theme="dark"] .agenda-operacional-page .agenda-select-option:focus-visible,
        html[data-theme="dark"] .agenda-operacional-page .agenda-select-option.is-selected,
        html[data-theme="dark"] .agenda-operacional-page .agenda-period:hover {
          background: #334155;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-period.is-active {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-divider,
        html[data-theme="dark"] .agenda-operacional-page .agenda-row,
        html[data-theme="dark"] .agenda-operacional-page .agenda-details-row {
          border-color: #334155;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-checkbox {
          color: #e2e8f0;
          -webkit-text-fill-color: #e2e8f0;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-checkbox:hover {
          background: #172554;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-table-head {
          background: #162033;
          color: #e2e8f0;
          -webkit-text-fill-color: #e2e8f0;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-row {
          color: #f8fafc;
          -webkit-text-fill-color: #f8fafc;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-row:hover {
          background: #172554;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-details {
          background: #111827;
        }

        html[data-theme="dark"] .agenda-operacional-page .agenda-empty {
          color: #cbd5e1;
          -webkit-text-fill-color: #cbd5e1;
        }

        html[data-theme="system"] .agenda-operacional-page {
          background: #262626;
          color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-card,
        html[data-theme="system"] .agenda-operacional-page .agenda-row {
          background: #2f2f2f;
          border-color: #555555;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-title {
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-muted {
          color: #e5e7eb;
          -webkit-text-fill-color: #e5e7eb;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-eyebrow {
          color: #93c5fd;
          -webkit-text-fill-color: #93c5fd;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-control,
        html[data-theme="system"] .agenda-operacional-page .agenda-select-menu,
        html[data-theme="system"] .agenda-operacional-page .agenda-select-option,
        html[data-theme="system"] .agenda-operacional-page .agenda-period {
          background: #353535;
          border-color: #666666;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-control::placeholder {
          color: #d1d5db;
          -webkit-text-fill-color: #d1d5db;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-select-arrow {
          color: #e5e7eb;
          -webkit-text-fill-color: #e5e7eb;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-select-option:hover,
        html[data-theme="system"] .agenda-operacional-page .agenda-select-option:focus-visible,
        html[data-theme="system"] .agenda-operacional-page .agenda-select-option.is-selected,
        html[data-theme="system"] .agenda-operacional-page .agenda-period:hover {
          background: #525252;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-period.is-active {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-divider,
        html[data-theme="system"] .agenda-operacional-page .agenda-row,
        html[data-theme="system"] .agenda-operacional-page .agenda-details-row {
          border-color: #555555;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-checkbox {
          color: #f3f4f6;
          -webkit-text-fill-color: #f3f4f6;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-checkbox:hover {
          background: #454545;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-table-head {
          background: #404040;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-row {
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-row:hover {
          background: #464646;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-details {
          background: #383838;
        }

        html[data-theme="system"] .agenda-operacional-page .agenda-empty {
          color: #e5e7eb;
          -webkit-text-fill-color: #e5e7eb;
        }
      `}</style>
    </main>
  );
}