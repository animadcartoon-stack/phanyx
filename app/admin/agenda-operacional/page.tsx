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

const [linhaAberta, setLinhaAberta] = useState<number | null>(null);

  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const colunasDisponiveis = [
  { id: "data", nome: "Data" },
  { id: "hora", nome: "Hora" },
  { id: "tipo", nome: "Tipo" },
  { id: "curso", nome: "Curso" },
  { id: "turma", nome: "Turma" },
  { id: "disciplina", nome: "Disciplina" },
  { id: "evento", nome: "Evento" },
  { id: "professor", nome: "Professor" },
  { id: "funcionario", nome: "Funcionário" },
  { id: "departamento", nome: "Departamento" },
  { id: "polo", nome: "Polo" },
  { id: "responsavel", nome: "Responsável" },
  { id: "status", nome: "Status" },
  { id: "local", nome: "Local" },
  { id: "observacoes", nome: "Observações" },
];

const [colunasVisiveis, setcolunasVisiveis] = useState<string[]>([
  "data",
  "hora",
  "tipo",
  "evento",
  "turma",
  "professor",
  "funcionario",
  "status",
]);

const colunasPdfDisponiveis = [
  { id: "data", nome: "Data" },
  { id: "hora", nome: "Hora" },
  { id: "tipo", nome: "Tipo" },
  { id: "curso", nome: "Curso" },
  { id: "turma", nome: "Turma" },
  { id: "disciplina", nome: "Disciplina" },
  { id: "evento", nome: "Evento" },
  { id: "professor", nome: "Professor" },
  { id: "funcionario", nome: "Funcionário" },
  { id: "departamento", nome: "Departamento" },
  { id: "polo", nome: "Polo" },
  { id: "responsavel", nome: "Responsável" },
  { id: "status", nome: "Status" },
  { id: "local", nome: "Local" },
  { id: "observacoes", nome: "Observações" },
];

const [colunasPdf, setColunasPdf] = useState<string[]>([
  "data",
  "hora",
  "tipo",
  "evento",
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

async function carregarPreferencias() {
  try {
    const res = await fetch("/api/admin/agenda-operacional/preferencias", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao carregar preferências.");
    }

    if (Array.isArray(data.colunasTabela)) {
      setcolunasVisiveis(data.colunasTabela);
    }

    if (Array.isArray(data.colunasPdf)) {
      setColunasPdf(data.colunasPdf);
    }
  } catch (error) {
    console.error(error);
  }
}

async function salvarPreferencias(novasColunasTabela: string[]) {
  try {
    await fetch("/api/admin/agenda-operacional/preferencias", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        colunasTabela: novasColunasTabela,
        colunasPdf,
        colunasExcel: novasColunasTabela,
      }),
    });
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
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
  carregarPreferencias();
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
  <div className="mb-4">
  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
    Personalização da Agenda Operacional
  </h2>

  <p className="text-sm text-slate-600 dark:text-slate-400">
    Escolha quais informações deseja visualizar na tela e, futuramente,
    configurar também as colunas do PDF e do Excel.
  </p>
</div>

<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
  Tabela
</h3>

  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
    {colunasDisponiveis.map((coluna) => (
      <label
  key={coluna.id}
  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
>
        <input
          type="checkbox"
          checked={colunasVisiveis.includes(coluna.id)}
          onChange={() => {
            setcolunasVisiveis((atuais) => {
  const novasColunas = atuais.includes(coluna.id)
    ? atuais.filter((id) => id !== coluna.id)
    : [...atuais, coluna.id];

  salvarPreferencias(novasColunas);

  return novasColunas;
});
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
  <tr>
    {colunasVisiveis.includes("data") && <th>Data</th>}
    {colunasVisiveis.includes("hora") && <th>Hora</th>}
    {colunasVisiveis.includes("tipo") && <th>Tipo</th>}
    {colunasVisiveis.includes("curso") && <th>Curso</th>}
    {colunasVisiveis.includes("turma") && <th>Turma</th>}
    {colunasVisiveis.includes("disciplina") && <th>Disciplina</th>}
    {colunasVisiveis.includes("evento") && <th>Evento</th>}
    {colunasVisiveis.includes("professor") && <th>Professor</th>}
    {colunasVisiveis.includes("funcionario") && <th>Funcionário</th>}
    {colunasVisiveis.includes("departamento") && <th>Departamento</th>}
    {colunasVisiveis.includes("polo") && <th>Polo</th>}
    {colunasVisiveis.includes("responsavel") && <th>Responsável</th>}
    {colunasVisiveis.includes("status") && <th>Status</th>}
    {colunasVisiveis.includes("local") && <th>Local</th>}
    {colunasVisiveis.includes("observacoes") && <th>Observações</th>}
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
  <>
  
    <tr
      key={item.id}
  onClick={() =>
    setLinhaAberta(linhaAberta === item.id ? null : item.id)
  }
  className="cursor-pointer border-b border-slate-200 text-slate-900 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
>
    {colunasVisiveis.includes("data") && (
  <td className="px-3 py-3">
  <div className="flex items-center gap-2">
    <span>
      {linhaAberta === item.id ? "▼" : "▶"}
    </span>

    <span>
      {item.data
        ? new Date(item.data).toLocaleDateString("pt-BR")
        : "-"}
    </span>
  </div>
</td>
)}

{colunasVisiveis.includes("hora") && (
  <td className="px-3 py-3">{item.hora || "-"}</td>
)}

{colunasVisiveis.includes("tipo") && (
  <td className="px-3 py-3">{item.tipo || "-"}</td>
)}

{colunasVisiveis.includes("curso") && (
  <td className="px-3 py-3">{item.curso || item.descricao || "-"}</td>
)}

{colunasVisiveis.includes("turma") && (
  <td className="px-3 py-3">{item.turma || "-"}</td>
)}

{colunasVisiveis.includes("disciplina") && (
  <td className="px-3 py-3">{item.disciplina || "-"}</td>
)}

{colunasVisiveis.includes("evento") && (
  <td className="px-3 py-3">
    <div className="font-semibold text-slate-900 dark:text-slate-100">
      {item.titulo || "-"}
    </div>
    <div className="text-xs text-slate-700 dark:text-slate-400">
      {item.descricao || "-"}
    </div>
  </td>
)}

{colunasVisiveis.includes("professor") && (
  <td className="px-3 py-3">{item.professor || "-"}</td>
)}

{colunasVisiveis.includes("funcionario") && (
  <td className="px-3 py-3">{item.funcionario || "-"}</td>
)}

{colunasVisiveis.includes("departamento") && (
  <td className="px-3 py-3">{item.departamento || "-"}</td>
)}

{colunasVisiveis.includes("polo") && (
  <td className="px-3 py-3">{item.polo || "-"}</td>
)}

{colunasVisiveis.includes("responsavel") && (
  <td className="px-3 py-3">{item.responsavel || "-"}</td>
)}

{colunasVisiveis.includes("status") && (
  <td className="px-3 py-3">{item.status || "-"}</td>
)}

{colunasVisiveis.includes("local") && (
  <td className="px-3 py-3">{item.local || "-"}</td>
)}

{colunasVisiveis.includes("observacoes") && (
  <td className="px-3 py-3">{item.observacoes || "-"}</td>
)}
    </tr>

    {linhaAberta === item.id && (
  <tr className="border-b border-slate-200 dark:border-slate-700">
    <td
      colSpan={colunasVisiveis.length}
      className="bg-slate-50 px-6 py-4 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Curso
          </p>
          <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
            {item.curso || "-"}
          </p>
        </div>

        <div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Turma
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.turma || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Disciplina
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.disciplina || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Professor
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.professor || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Funcionário
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.funcionario || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Departamento
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.departamento || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Polo
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.polo || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Local
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.local || "-"}
  </p>
</div>

<div>
  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Observações
  </p>
  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
    {item.observacoes || "-"}
  </p>
</div>
      </div>
    </td>
  </tr>
)}
  </>
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