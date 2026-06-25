"use client";

import { useEffect, useMemo, useState } from "react";

type PeriodoFiltro =
  | "DIA"
  | "SEMANA"
  | "MES"
  | "SEMESTRE_1"
  | "SEMESTRE_2"
  | "ANO";

export default function AgendaOperacionalPage() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("SEMANA");

  const [cursoId, setCursoId] = useState("");
const [turmaId, setTurmaId] = useState("");
const [professorId, setProfessorId] = useState("");
const [funcionarioId, setFuncionarioId] = useState("");
const [disciplinaId, setDisciplinaId] = useState("");
const [departamentoId, setDepartamentoId] = useState("");
const [poloId, setPoloId] = useState("");
const [pesquisa, setPesquisa] = useState("");

const [cursos, setCursos] = useState<any[]>([]);
const [turmas, setTurmas] = useState<any[]>([]);
const [professores, setProfessores] = useState<any[]>([]);
const [funcionarios, setFuncionarios] = useState<any[]>([]);
const [departamentos, setDepartamentos] = useState<any[]>([]);
const [disciplinas, setDisciplinas] = useState<any[]>([]);
const [polos, setPolos] = useState<any[]>([]);

  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [colunasPdf, setColunasPdf] = useState<string[]>([
  "data",
  "hora",
  "tipo",
  "evento",
  "turma",
  "professor",
  "funcionario",
  "status",
]);

  async function carregarAgenda() {
    try {
      setLoading(true);
      setErro("");

      const params = new URLSearchParams();
        params.set("periodo", periodo);

if (cursoId) params.set("cursoId", cursoId);
if (turmaId) params.set("turmaId", turmaId);
if (professorId) params.set("professorId", professorId);
if (funcionarioId) params.set("funcionarioId", funcionarioId);
if (disciplinaId) params.set("disciplinaId", disciplinaId);
if (departamentoId) params.set("departamentoId", departamentoId);
if (poloId) params.set("poloId", poloId);
if (pesquisa.trim()) params.set("pesquisa", pesquisa.trim());

const res = await fetch(`/api/admin/agenda-operacional?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar agenda.");
      }

      setDados(data);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar agenda.");
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

async function carregarFiltros() {
  try {
    const res = await fetch("/api/admin/agenda-operacional/filtros", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao carregar filtros.");
    }

    setCursos(data.cursos || []);
    setTurmas(data.turmas || []);
    setProfessores(data.professores || []);
    setFuncionarios(data.funcionarios || []);
    setDepartamentos(data.departamentos || []);
    setDisciplinas(data.disciplinas || []);
    setPolos(data.polos || []);
  } catch (error) {
    console.error(error);
  }
}

  useEffect(() => {
  carregarAgenda();
}, [
  periodo,
  cursoId,
  turmaId,
  professorId,
  funcionarioId,
  disciplinaId,
  departamentoId,
  poloId,
]);

  useEffect(() => {
  carregarFiltros();
}, []);

  const cards = useMemo(() => {
    const resumo = dados?.resumo || {};

    return [
      ["Aulas", resumo.aulas || 0],
      ["Provas", resumo.provas || 0],
      ["Atividades", resumo.atividades || 0],
      ["Reuniões", resumo.reunioes || 0],
      ["Férias RH", resumo.ferias || 0],
      ["Escalas RH", resumo.escalasRH || 0],
      ["Sem professor", resumo.disciplinasSemProfessor || 0],
    ];
  }, [dados]);

  const colunasDisponiveis = [
  { id: "data", nome: "Data" },
  { id: "hora", nome: "Hora" },
  { id: "tipo", nome: "Tipo" },
  { id: "evento", nome: "Evento" },
  { id: "curso", nome: "Curso" },
  { id: "turma", nome: "Turma" },
  { id: "disciplina", nome: "Disciplina" },
  { id: "professor", nome: "Professor" },
  { id: "funcionario", nome: "Funcionário" },
  { id: "departamento", nome: "Departamento" },
  { id: "polo", nome: "Polo" },
  { id: "responsavel", nome: "Responsável" },
  { id: "status", nome: "Status" },
];

  return (
    <div className="agenda-operacional-page space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111111]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Secretaria / Coordenação
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">
          Agenda Operacional
        </h1>

        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Acompanhe aulas, professores, disciplinas, reuniões, provas, atividades,
          férias e escalas da instituição.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
  { id: "DIA", label: "Hoje" },
  { id: "SEMANA", label: "Semana" },
  { id: "MES", label: "Mês" },
  { id: "SEMESTRE_1", label: "1º semestre" },
  { id: "SEMESTRE_2", label: "2º semestre" },
  { id: "ANO", label: "Ano" },
].map((item) => (
  <button
    key={item.id}
    type="button"
    onClick={() => setPeriodo(item.id as PeriodoFiltro)}
    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
      periodo === item.id
        ? "bg-blue-600 text-white"
        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    }`}
  >
    {item.label}
  </button>
))}
<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <input
    type="text"
    value={pesquisa}
    onChange={(e) => setPesquisa(e.target.value)}
    placeholder="Pesquisar professor, disciplina, turma..."
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  />

  <select
  value={cursoId}
  onChange={(e) => setCursoId(e.target.value)}
  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
>
  <option value="">Todos os cursos</option>

  {cursos.map((curso) => (
    <option key={curso.id} value={curso.id}>
      {curso.nome}
    </option>
  ))}
</select>

  <select
    value={turmaId}
    onChange={(e) => setTurmaId(e.target.value)}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  >
    <option value="">Todas as turmas</option>
    {turmas.map((turma) => (
  <option key={turma.id} value={turma.id}>
    {turma.nome}
  </option>
))}
  </select>

  <select
    value={professorId}
    onChange={(e) => setProfessorId(e.target.value)}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  >
    <option value="">Todos os professores</option>
    {professores.map((professor) => (
  <option key={professor.id} value={professor.id}>
    {professor.nome}
  </option>
))}
  </select>

  <select
    value={disciplinaId}
    onChange={(e) => setDisciplinaId(e.target.value)}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  >
    <option value="">Todas as disciplinas</option>
    {disciplinas.map((disciplina) => (
  <option key={disciplina.id} value={disciplina.id}>
    {disciplina.nome}
  </option>
))}
  </select>

  <select
    value={departamentoId}
    onChange={(e) => setDepartamentoId(e.target.value)}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  >
    <option value="">Todos os departamentos</option>
    {departamentos.map((departamento) => (
  <option key={departamento.id} value={departamento.id}>
    {departamento.nome}
  </option>
))}
  </select>

  <select
    value={funcionarioId}
    onChange={(e) => setFuncionarioId(e.target.value)}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  >
    <option value="">Todos os funcionários</option>
    {funcionarios.map((funcionario) => (
  <option key={funcionario.id} value={funcionario.id}>
    {funcionario.nome}
  </option>
))}
  </select>

  <select
    value={poloId}
    onChange={(e) => setPoloId(e.target.value)}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  >
    <option value="">Todos os polos</option>
    {polos.map((polo) => (
  <option key={polo.id} value={polo.id}>
    {polo.nome}
  </option>
))}
  </select>
</div>
        </div>
      </section>

<div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
  <p className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
    Colunas para o PDF
  </p>

  <div className="flex flex-wrap gap-3">
    {colunasDisponiveis.map((coluna) => (
      <label
        key={coluna.id}
        className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200"
      >
        <input
          type="checkbox"
          checked={colunasPdf.includes(coluna.id)}
          onChange={() => {
            setColunasPdf((atuais) =>
              atuais.includes(coluna.id)
                ? atuais.filter((id) => id !== coluna.id)
                : [...atuais, coluna.id]
            );
          }}
        />
        {coluna.nome}
      </label>
    ))}
  </div>
</div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([titulo, valor]) => (
          <div
            key={String(titulo)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111111]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-400">
              {titulo}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {valor}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111111]">
        <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">
  Linha do tempo operacional
</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
  <tr className="border-b border-slate-300 text-left text-slate-800 dark:border-slate-700 dark:text-slate-300">
    <th className="px-3 py-3">Data</th>
    <th className="px-3 py-3">Hora</th>
    <th className="px-3 py-3">Tipo</th>
    <th className="px-3 py-3">Evento</th>
    <th className="px-3 py-3">Responsável</th>
    <th className="px-3 py-3">Status</th>
  </tr>
</thead>

            <tbody>
              {loading && !dados ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Carregando agenda...
                  </td>
                </tr>
              ) : dados?.agenda?.length ? (
                dados.agenda.map((item: any) => (
  <tr
  key={item.id}
  className="border-b border-slate-200 text-slate-900 dark:border-slate-800 dark:text-slate-100"
>
    <td className="px-3 py-3">
      {item.data
        ? new Date(item.data).toLocaleDateString("pt-BR")
        : "-"}
    </td>

    <td className="px-3 py-3">
      {item.hora || "-"}
    </td>

    <td className="px-3 py-3">
      {item.tipo}
    </td>

    <td className="px-3 py-3">
      <div className="font-semibold text-slate-900 dark:text-slate-100">
        {item.titulo}
      </div>

      <div className="text-xs text-slate-700 dark:text-slate-400">
        {item.descricao || "-"}
      </div>
    </td>

    <td className="px-3 py-3">
      {item.responsavel || "-"}
    </td>

    <td className="px-3 py-3">
      {item.status || "-"}
    </td>
  </tr>
))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Nenhum evento encontrado para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}