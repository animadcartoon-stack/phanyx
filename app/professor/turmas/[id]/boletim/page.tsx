"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BoletimItem = {
  alunoId: number;
  nome: string;
  email: string;
  nota: number | null;
  status: string;
};

type BoletimResponse = {
  turma: {
    id: number;
    nome: string;
  };
  disciplina: {
    id: number | null;
    nome: string;
  };
  resumo: {
    totalAlunos: number;
    mediaTurma: number;
    melhorNota: number;
    piorNota: number;
  };
  boletim: BoletimItem[];
};

type StatusFiltro = "TODOS" | "SEM PROVA" | "APROVADO" | "REPROVADO";

const ITENS_POR_PAGINA = 25;

function normalizarTexto(valor?: string | number | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function statusClasse(status: string) {
  if (status === "APROVADO") {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200";
  }

  if (status === "REPROVADO") {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function formatarNota(nota: number | null) {
  if (nota == null) return "-";
  return Number(nota).toFixed(2).replace(".", ",");
}

export default function BoletimTurmaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params.id;
  const turmaId = Number(id);

  const [data, setData] = useState<BoletimResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("TODOS");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch(`/api/professor/turmas/${turmaId}/boletim`, {
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar boletim");
        }

        setData(json);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar boletim");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(turmaId) && turmaId > 0) {
      carregar();
    } else {
      setErro("Turma inválida");
      setLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, statusFiltro]);

  const disciplinas = useMemo(() => {
    const texto = data?.disciplina?.nome || "";

    return texto
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [data]);

  const boletimFiltrado = useMemo(() => {
    if (!data) return [];

    const termo = normalizarTexto(busca);

    return data.boletim.filter((item) => {
      const status = String(item.status || "").toUpperCase();

      const passaStatus =
        statusFiltro === "TODOS" ? true : status === statusFiltro;

      const textoBusca = normalizarTexto(
        [
          item.nome,
          item.email,
          item.status,
          item.nota == null ? "sem prova" : String(item.nota),
        ].join(" ")
      );

      const passaBusca = !termo || textoBusca.includes(termo);

      return passaStatus && passaBusca;
    });
  }, [data, busca, statusFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(boletimFiltrado.length / ITENS_POR_PAGINA)
  );

  const boletimPaginado = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return boletimFiltrado.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [boletimFiltrado, paginaAtual]);

  const resumoStatus = useMemo(() => {
    const base = data?.boletim || [];

    return {
      todos: base.length,
      semProva: base.filter((item) => item.status === "SEM PROVA").length,
      aprovados: base.filter((item) => item.status === "APROVADO").length,
      reprovados: base.filter((item) => item.status === "REPROVADO").length,
    };
  }, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
        Carregando boletim...
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen space-y-4 bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-bold">Erro</p>
          <p className="mt-1">{erro}</p>
        </div>

        <button
          onClick={() => router.back()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          ← Voltar
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
        Boletim não encontrado.
      </main>
    );
  }

  return (
    <main className="phanyx-professor-boletim-page min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.back()}
            className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            ← Voltar
          </button>

          <a
            href={`/api/professor/turmas/${id}/boletim/csv`}
            download
            className="w-fit rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700"
          >
            ⬇ Exportar CSV
          </a>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300">
                Boletim acadêmico
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                📊 Boletim da turma {data.turma.nome}
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Consulte notas, status e desempenho dos alunos. Use busca e
                filtros para encontrar rapidamente alunos em turmas grandes.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <p className="font-bold text-slate-900 dark:text-white">
                {disciplinas.length || 0} disciplina(s)
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Disciplinas vinculadas à turma
              </p>
            </div>
          </div>

          <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <summary className="cursor-pointer text-sm font-bold text-slate-800 dark:text-white">
              Ver disciplinas da turma
            </summary>

            {disciplinas.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Nenhuma disciplina informada.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {disciplinas.map((disciplina, index) => (
                  <span
                    key={`${disciplina}-${index}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {disciplina}
                  </span>
                ))}
              </div>
            )}
          </details>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Total de alunos
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              {data.resumo.totalAlunos}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Média da turma
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              {formatarNota(data.resumo.mediaTurma)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Melhor nota
            </p>
            <p className="mt-2 text-3xl font-black text-green-600 dark:text-green-300">
              {formatarNota(data.resumo.melhorNota)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Pior nota
            </p>
            <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-300">
              {formatarNota(data.resumo.piorNota)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Alunos
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Exibindo {boletimFiltrado.length} de {data.boletim.length} aluno(s).
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por aluno, e-mail, nota ou status..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 lg:w-[360px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <div className="flex flex-wrap gap-2">
                {[
                  ["TODOS", `Todos (${resumoStatus.todos})`],
                  ["SEM PROVA", `Sem prova (${resumoStatus.semProva})`],
                  ["APROVADO", `Aprovados (${resumoStatus.aprovados})`],
                  ["REPROVADO", `Reprovados (${resumoStatus.reprovados})`],
                ].map(([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setStatusFiltro(valor as StatusFiltro)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      statusFiltro === valor
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {boletimPaginado.map((item) => (
                  <tr
                    key={item.alunoId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-950 dark:text-white">
                        {item.nome}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID aluno: {item.alunoId}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {item.email || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm font-black text-slate-950 dark:text-white">
                      {formatarNota(item.nota)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClasse(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {boletimPaginado.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Nenhum aluno encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {boletimFiltrado.length > ITENS_POR_PAGINA && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Página {paginaAtual} de {totalPaginas}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() =>
                    setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}