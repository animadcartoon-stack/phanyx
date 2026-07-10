"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Disciplina = {
  id: number;
  nome?: string;
  titulo?: string;
};

type Turma = {
  id: number;
  nome?: string;
  disciplinaId?: number;
};

type AlunoTurma = {
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
};

export default function NovaProvaPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [tempoMin, setTempoMin] = useState("");
  const [tentativasMax, setTentativasMax] = useState("1");
  const [disponivelEm, setDisponivelEm] = useState("");
  const [expiraEm, setExpiraEm] = useState("");
  const [notaDisponivelEm, setNotaDisponivelEm] = useState("");
  const [mostrarNotaAoFinal, setMostrarNotaAoFinal] = useState(false);

  const [tipoPublico, setTipoPublico] = useState<"TURMA" | "ALUNOS_SELECIONADOS">("TURMA");
  const [exigirAulasConcluidas, setExigirAulasConcluidas] = useState(false);
  const [alunosTurma, setAlunosTurma] = useState<AlunoTurma[]>([]);
  const [alunosSelecionadosIds, setAlunosSelecionadosIds] = useState<number[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  const [disciplinaId, setDisciplinaId] = useState("");
  const [turmaId, setTurmaId] = useState("");

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [cursos, setCursos] = useState<any[]>([]);

  const [cursoFiltroId, setCursoFiltroId] = useState("");
  const [turmaFiltroId, setTurmaFiltroId] = useState("");
  const [disciplinaFiltroId, setDisciplinaFiltroId] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoadingInicial(true);
        setErro("");

        const [resDisciplinas, resTurmas, resCursos] = await Promise.all([
          fetch("/api/professor/disciplinas"),
          fetch("/api/professor/turmas"),
          fetch("/api/professor/cursos"),
        ]);

        const disciplinasData = resDisciplinas.ok
          ? await resDisciplinas.json()
          : [];

        const turmasData = resTurmas.ok ? await resTurmas.json() : [];
        const cursosData = resCursos.ok ? await resCursos.json() : [];

        setDisciplinas(Array.isArray(disciplinasData) ? disciplinasData : []);
        setTurmas(Array.isArray(turmasData) ? turmasData : []);
        setCursos(Array.isArray(cursosData) ? cursosData : []);
      } catch {
        setErro("Erro ao carregar dados do formulário");
      } finally {
        setLoadingInicial(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!disciplinaId) {
      setTurmaId("");
      return;
    }

    const turmaSelecionadaAindaExiste = turmas.some(
      (turma) =>
        String(turma.id) === String(turmaId) &&
        String(turma.disciplinaId) === String(disciplinaId)
    );

    if (!turmaSelecionadaAindaExiste) {
      setTurmaId("");
    }
  }, [disciplinaId, turmaId, turmas]);

  useEffect(() => {
  async function carregarAlunosDaTurma() {
    if (!turmaId) {
      setAlunosTurma([]);
      setAlunosSelecionadosIds([]);
      return;
    }

    try {
      setLoadingAlunos(true);

      const params = new URLSearchParams();

if (cursoFiltroId) params.set("cursoId", cursoFiltroId);
if (turmaFiltroId || turmaId) params.set("turmaId", turmaFiltroId || turmaId);
if (disciplinaFiltroId || disciplinaId) params.set("disciplinaId", disciplinaFiltroId || disciplinaId);
if (buscaAluno.trim()) params.set("busca", buscaAluno.trim());

const res = await fetch(`/api/professor/alunos?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar alunos da turma");
      }

      setAlunosTurma(Array.isArray(data?.alunos) ? data.alunos : []);
      setAlunosSelecionadosIds([]);
    } catch {
      setAlunosTurma([]);
      setAlunosSelecionadosIds([]);
    } finally {
      setLoadingAlunos(false);
    }
  }

  carregarAlunosDaTurma();
}, [turmaId, cursoFiltroId, turmaFiltroId, disciplinaFiltroId, buscaAluno, disciplinaId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!disciplinaId) {
  setErro("Selecione uma disciplina.");
  return;
}

if (!turmaId) {
  setErro("Selecione uma turma.");
  return;
}

if (tipoPublico === "ALUNOS_SELECIONADOS" && alunosSelecionadosIds.length === 0) {
  setErro("Selecione pelo menos um aluno para liberar esta prova.");
  return;
}

    if (
      disponivelEm &&
      expiraEm &&
      new Date(expiraEm).getTime() <= new Date(disponivelEm).getTime()
    ) {
      setErro("A data de encerramento deve ser maior que a data de abertura.");
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/provas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descricao: descricao || null,
          notaMaxima: Number(notaMaxima),
          tempoMin: tempoMin ? Number(tempoMin) : null,
          tentativasMax: tentativasMax ? Number(tentativasMax) : 1,
          disponivelEm: disponivelEm
            ? new Date(disponivelEm).toISOString()
            : null,
          expiraEm: expiraEm ? new Date(expiraEm).toISOString() : null,
          notaDisponivelEm: notaDisponivelEm
            ? new Date(notaDisponivelEm).toISOString()
          : null,
          mostrarNotaAoFinal,
          tipoPublico,
          exigirAulasConcluidas,
          alunosIds: alunosSelecionadosIds,
          disciplinaId: Number(disciplinaId),
          turmaId: turmaId ? Number(turmaId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar prova");
      }

      router.push(`/professor/provas/${data.id}`);
    } catch (e: any) {
      setErro(e.message || "Erro ao criar prova");
    } finally {
      setLoading(false);
    }
  }

  const disciplinaSelecionada = useMemo(() => {
    return disciplinas.find((d) => String(d.id) === String(disciplinaId));
  }, [disciplinas, disciplinaId]);

  const turmasFiltradas = useMemo(() => {
    if (!disciplinaId) return [];
    return turmas.filter(
      (turma) => String(turma.disciplinaId) === String(disciplinaId)
    );
  }, [turmas, disciplinaId]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <a
              href="/professor/provas"
              className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Voltar para provas
            </a>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nova prova</h1>
              <p className="mt-1 text-sm text-gray-500">
                Crie uma nova avaliação e depois adicione as questões.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            A prova será criada inicialmente como <strong>Rascunho</strong>.
          </div>
        </div>

        {loadingInicial ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando formulário...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2"
            >
              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Dados da prova
                </h2>
                <p className="text-sm text-gray-500">
                  Preencha as informações principais da avaliação.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Prova 1 - Introdução ao Direito"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Instruções da prova, conteúdo cobrado, observações..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Disciplina
                  </label>
                  <select
  value={disciplinaId}
  onChange={(e) => setDisciplinaId(e.target.value)}
  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
  required
>
  <option value="">Selecione uma disciplina</option>
  {disciplinas.map((disciplina) => (
    <option key={disciplina.id} value={disciplina.id}>
      {disciplina.nome ||
        disciplina.titulo ||
        `Disciplina ${disciplina.id}`}
    </option>
  ))}
</select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Turma
                  </label>
                  <select
  value={turmaId}
  onChange={(e) => setTurmaId(e.target.value)}
  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
  disabled={!disciplinaId}
>
  <option value="">Selecione uma turma</option>
  {turmasFiltradas.map((turma) => (
    <option key={turma.id} value={turma.id}>
      {turma.nome || `Turma ${turma.id}`}
    </option>
  ))}
</select>
                  {!disciplinaId && (
                    <p className="text-xs text-gray-500">
                      Selecione uma disciplina para listar as turmas.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nota máxima
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={notaMaxima}
                    onChange={(e) => setNotaMaxima(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tempo (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tempoMin}
                    onChange={(e) => setTempoMin(e.target.value)}
                    placeholder="Ex.: 60"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Máx. tentativas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tentativasMax}
                    onChange={(e) => setTentativasMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Disponível em
                  </label>
                  <input
                    type="datetime-local"
                    value={disponivelEm}
                    onChange={(e) => setDisponivelEm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Encerra em
                  </label>
                  <input
                    type="datetime-local"
                    value={expiraEm}
                    onChange={(e) => setExpiraEm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

<div className="nova-prova-publico-card rounded-2xl border p-4">  
  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
    Disponibilização da prova
  </h3>

  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
    Escolha se a prova será liberada para toda a turma ou apenas para alunos específicos.
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <input
        type="radio"
        name="tipoPublico"
        checked={tipoPublico === "TURMA"}
        onChange={() => {
          setTipoPublico("TURMA");
          setAlunosSelecionadosIds([]);
        }}
      />
      Para toda a turma
    </label>

    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <input
        type="radio"
        name="tipoPublico"
        checked={tipoPublico === "ALUNOS_SELECIONADOS"}
        onChange={() => setTipoPublico("ALUNOS_SELECIONADOS")}
      />
      Somente alunos selecionados
    </label>
  </div>

  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
    <input
      type="checkbox"
      checked={exigirAulasConcluidas}
      onChange={(e) => setExigirAulasConcluidas(e.target.checked)}
    />
    Exigir conclusão das aulas antes de liberar a prova
  </label>

  {tipoPublico === "ALUNOS_SELECIONADOS" && (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
  <div>
    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
      Alunos liberados
    </h4>
    <p className="text-xs text-slate-500 dark:text-slate-400">
      Filtre por curso, turma, disciplina ou busque diretamente pelo aluno.
    </p>
  </div>

  {loadingAlunos && (
    <span className="text-xs font-semibold text-blue-600 dark:text-sky-300">
      Carregando...
    </span>
  )}
</div>

<div className="mt-4 grid gap-3 md:grid-cols-2">
  <select
    value={cursoFiltroId}
    onChange={(e) => setCursoFiltroId(e.target.value)}
    className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
  >
    <option value="">Todos os cursos</option>
    {cursos.map((curso) => (
      <option key={curso.id} value={curso.id}>
        {curso.nome || `Curso ${curso.id}`}
      </option>
    ))}
  </select>

  <select
    value={turmaFiltroId}
    onChange={(e) => setTurmaFiltroId(e.target.value)}
    className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
  >
    <option value="">Todas as turmas</option>
    {turmas.map((turma) => (
      <option key={turma.id} value={turma.id}>
        {turma.nome || `Turma ${turma.id}`}
      </option>
    ))}
  </select>

  <select
    value={disciplinaFiltroId}
    onChange={(e) => setDisciplinaFiltroId(e.target.value)}
    className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
  >
    <option value="">Todas as disciplinas</option>
    {disciplinas.map((disciplina) => (
      <option key={disciplina.id} value={disciplina.id}>
        {disciplina.nome || disciplina.titulo || `Disciplina ${disciplina.id}`}
      </option>
    ))}
  </select>

  <input
    value={buscaAluno}
    onChange={(e) => setBuscaAluno(e.target.value)}
    placeholder="Buscar aluno..."
    className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
  />
</div>

{!loadingAlunos && alunosTurma.length === 0 && (
  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
    Nenhum aluno encontrado com os filtros selecionados.
  </p>
)}

{alunosTurma.length > 0 && (
  <div className="mt-4 grid max-h-72 gap-2 overflow-auto pr-1">
    {alunosTurma.map((aluno) => {
      const marcado = alunosSelecionadosIds.includes(aluno.alunoId);

      return (
        <label
          key={aluno.alunoId}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => {
              if (e.target.checked) {
                setAlunosSelecionadosIds((prev) => [...prev, aluno.alunoId]);
              } else {
                setAlunosSelecionadosIds((prev) =>
                  prev.filter((id) => id !== aluno.alunoId)
                );
              }
            }}
          />

          <span>
            <span className="block font-semibold">{aluno.nome}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {aluno.matricula || "Sem matrícula"}{" "}
              {aluno.email ? `• ${aluno.email}` : ""}
            </span>
          </span>
        </label>
      );
    })}
  </div>
)}
    </div>
  )}
</div>

                <div className="nova-prova-nota-card rounded-2xl border p-4">
  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
    Liberação da nota para o aluno
  </h3>

  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
    Defina se o aluno verá a nota ao finalizar a prova ou somente em uma data futura.
  </p>

  <label className="nova-prova-nota-opcao mt-4 flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold">
    <input
      type="checkbox"
      checked={mostrarNotaAoFinal}
      onChange={(e) => setMostrarNotaAoFinal(e.target.checked)}
    />
    Mostrar nota ao aluno assim que finalizar a prova
  </label>

  {!mostrarNotaAoFinal && (
    <div className="mt-4 space-y-2">
      <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
        Data e hora para liberar a nota
      </label>
      <input
        type="datetime-local"
        value={notaDisponivelEm}
        onChange={(e) => setNotaDisponivelEm(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      <p className="text-xs text-slate-600 dark:text-slate-300">
        Enquanto essa data não chegar, o aluno verá apenas “Nota ainda não liberada”.
      </p>
    </div>
  )}
</div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <a
                  href="/professor/provas"
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </a>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar prova"}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Resumo</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Título</p>
                    <p className="font-medium text-gray-900">
                      {titulo || "Ainda não definido"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Descrição</p>
                    <p className="font-medium text-gray-900">
                      {descricao || "Sem descrição"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Disciplina</p>
                    <p className="font-medium text-gray-900">
                      {disciplinaSelecionada?.nome ||
                        disciplinaSelecionada?.titulo ||
                        "Não selecionada"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Nota máxima</p>
                    <p className="font-medium text-gray-900">
                      {notaMaxima || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Tempo</p>
                    <p className="font-medium text-gray-900">
                      {tempoMin ? `${tempoMin} min` : "Sem limite"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Tentativas</p>
                    <p className="font-medium text-gray-900">
                      {tentativasMax || "1"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Abertura</p>
                    <p className="font-medium text-gray-900">
                      {disponivelEm || "Imediata"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Encerramento</p>
                    <p className="font-medium text-gray-900">
                      {expiraEm || "Sem data limite"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Status inicial</p>
                    <p className="font-medium text-yellow-700">Rascunho</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Próximo passo
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Depois de criar a prova, você poderá adicionar questões,
                  alternativas e publicar quando estiver pronta.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}