"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DisciplinaAluno = {
  id: number;
  nome: string;
  turmaId?: number;
  turmaNome?: string;
  totalAulas?: number;
  totalPresencas?: number;
  bloqueadaPorAulas?: boolean;
  mensagemBloqueio?: string | null;
};

type AulasAlunoResponse = {
  curso?: {
    id: number;
    nome: string;
  } | null;
  disciplinas: DisciplinaAluno[];
};

export default function DisciplinasAluno() {
  const router = useRouter();
  const [disciplinasMatriculadas, setDisciplinasMatriculadas] = useState<
    DisciplinaAluno[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calcularPontuacaoBusca(nome: string, busca: string) {
  const textoNome = normalizarTexto(nome);
  const textoBusca = normalizarTexto(busca);

  if (!textoBusca) return 0;

  // prioridade máxima: começa com a busca
  if (textoNome.startsWith(textoBusca)) return 1000;

  // prioridade alta: qualquer palavra começa com a busca
  const palavras = textoNome.split(" ");
  if (palavras.some((p) => p.startsWith(textoBusca))) return 900;

  // prioridade média: contém a busca
  if (textoNome.includes(textoBusca)) return 800;

  // fuzzy leve (erro de digitação)
  let iguais = 0;
  for (const letra of textoBusca) {
    if (textoNome.includes(letra)) iguais++;
  }

  return (iguais / textoBusca.length) * 100;
}

  async function carregarDisciplinas() {
    try {
      setLoading(true);

      const res = await fetch("/api/aluno/aulas", {
        credentials: "include",
        cache: "no-store",
      });

      const json: AulasAlunoResponse = await res.json();

      if (!res.ok || !Array.isArray(json?.disciplinas)) {
        setDisciplinasMatriculadas([]);
        return;
      }

      setDisciplinasMatriculadas(json.disciplinas);
    } catch {
      setDisciplinasMatriculadas([]);
    } finally {
      setLoading(false);
    }
  }

  const disciplinasFiltradas = disciplinasMatriculadas.filter((disciplina) => {
  if (!busca.trim()) return true;

  const textoBusca = normalizarTexto(busca);

  return (
    normalizarTexto(disciplina.nome || "").includes(textoBusca) ||
    normalizarTexto(disciplina.turmaNome || "").includes(textoBusca) ||
    calcularPontuacaoBusca(disciplina.nome || "", textoBusca) >= 45
  );
});

const sugestoesDisciplinas = busca.trim()
  ? [...disciplinasMatriculadas]
      .map((disciplina) => ({
        ...disciplina,
        score: calcularPontuacaoBusca(disciplina.nome || "", busca),
      }))
      .filter((disciplina) => disciplina.score >= 45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              📘 Minhas Disciplinas
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Visualize suas disciplinas, acompanhe aulas cadastradas e consulte
              o histórico de chamadas registradas.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {loading ? "Carregando..." : `${disciplinasMatriculadas.length} disciplina(s)`}
          </span>
        </div>
      </div>

<div className="relative">
  <input
    type="text"
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    placeholder="Pesquisar disciplina ou turma..."
    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  />

  {sugestoesDisciplinas.length > 0 && (
    <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      {sugestoesDisciplinas.map((disciplina) => (
        <button
          key={disciplina.id}
          type="button"
          onClick={() => setBusca(disciplina.nome)}
          className="block w-full px-5 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
        >
          {disciplina.nome}
        </button>
      ))}
    </div>
  )}
</div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando disciplinas...
        </div>
      ) : disciplinasMatriculadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Você ainda não está matriculado em nenhuma disciplina.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {disciplinasFiltradas.map((disciplina) => (
            <div
              key={`${disciplina.id}-${disciplina.turmaId ?? "sem-turma"}`}
              onClick={() => {
  if (disciplina.bloqueadaPorAulas) return;
  router.push(`/aluno/disciplinas/${disciplina.id}?turmaId=${disciplina.turmaId}`);
}}
className={[
  "rounded-2xl border bg-white p-6 shadow-sm transition",
  disciplina.bloqueadaPorAulas
    ? "cursor-not-allowed border-amber-200 bg-amber-50/40"
    : "cursor-pointer border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {disciplina.nome}
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {disciplina.totalAulas ?? 0} aula(s)
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <strong className="font-medium text-slate-800">
                    Chamadas registradas:
                  </strong>{" "}
                  {disciplina.totalPresencas ?? 0}
                </p>

                <p>
                  <strong className="font-medium text-slate-800">Turma:</strong>{" "}
                  {disciplina.turmaNome || "Não informada"}
                </p>
              </div>

              {disciplina.bloqueadaPorAulas ? (
  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
    🔒{" "}
    {disciplina.mensagemBloqueio ||
      "Assim que a aula for publicada, o acesso será liberado automaticamente."}
  </div>
) : (
  <div className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600">
    Acessar disciplina →
  </div>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}