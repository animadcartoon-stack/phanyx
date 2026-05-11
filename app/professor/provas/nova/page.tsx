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

export default function NovaProvaPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [tempoMin, setTempoMin] = useState("");
  const [tentativasMax, setTentativasMax] = useState("1");
  const [disponivelEm, setDisponivelEm] = useState("");
  const [expiraEm, setExpiraEm] = useState("");

  const [disciplinaId, setDisciplinaId] = useState("");
  const [turmaId, setTurmaId] = useState("");

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoadingInicial(true);
        setErro("");

        const [resDisciplinas, resTurmas] = await Promise.all([
          fetch("/api/professor/disciplinas"),
          fetch("/api/professor/turmas"),
        ]);

        const disciplinasData = resDisciplinas.ok
          ? await resDisciplinas.json()
          : [];

        const turmasData = resTurmas.ok ? await resTurmas.json() : [];

        setDisciplinas(Array.isArray(disciplinasData) ? disciplinasData : []);
        setTurmas(Array.isArray(turmasData) ? turmasData : []);
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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