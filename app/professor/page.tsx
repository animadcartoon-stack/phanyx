"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

type DashboardResponse = {
  resumo: {
    totalProvas: number;
    provasRascunho: number;
    provasPublicadas: number;
    provasEncerradas: number;
    totalTentativasFinalizadas: number;
    aprovados: number;
    reprovados: number;
    mediaGeral: number;
  };
  provasRecentes: {
    id: number;
    titulo: string;
    status: "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
    notaMaxima: number;
    disciplinaNome: string;
    totalTentativas: number;
    media: number;
  }[];
};

function ProfessorDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDashboard() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/dashboard");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar dashboard");
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  function getStatusLabel(status: string) {
    if (status === "PUBLICADA") return "Publicada";
    if (status === "ENCERRADA") return "Encerrada";
    return "Rascunho";
  }

  function getStatusClasses(status: string) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-700";
    }

    if (status === "ENCERRADA") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard do Professor
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe suas provas, tentativas e desempenho das turmas.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando dashboard...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Total de provas
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {data.resumo.totalProvas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Rascunho
                </p>
                <p className="mt-2 text-2xl font-bold text-yellow-700">
                  {data.resumo.provasRascunho}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Publicadas
                </p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {data.resumo.provasPublicadas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Encerradas
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-700">
                  {data.resumo.provasEncerradas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Tentativas finalizadas
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {data.resumo.totalTentativasFinalizadas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Aprovados
                </p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {data.resumo.aprovados}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Reprovados
                </p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {data.resumo.reprovados}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Média geral
                </p>
                <p className="mt-2 text-2xl font-bold text-indigo-700">
                  {data.resumo.mediaGeral}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Provas recentes
                    </h2>
                    <p className="text-sm text-gray-500">
                      Visão rápida das provas mais recentes do professor
                    </p>
                  </div>

                  <a
                    href="/professor/provas"
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Ver todas
                  </a>
                </div>

                <div className="mt-6 space-y-4">
                  {data.provasRecentes.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
                      Nenhuma prova cadastrada ainda.
                    </div>
                  ) : (
                    data.provasRecentes.map((prova) => (
                      <div
                        key={prova.id}
                        className="rounded-xl border p-5 transition hover:border-gray-300"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">
                                {prova.titulo}
                              </h3>

                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                  prova.status
                                )}`}
                              >
                                {getStatusLabel(prova.status)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span>
                                <strong className="font-medium text-gray-700">
                                  Disciplina:
                                </strong>{" "}
                                {prova.disciplinaNome}
                              </span>

                              <span>
                                <strong className="font-medium text-gray-700">
                                  Tentativas:
                                </strong>{" "}
                                {prova.totalTentativas}
                              </span>

                              <span>
                                <strong className="font-medium text-gray-700">
                                  Média:
                                </strong>{" "}
                                {prova.media}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`/professor/provas/${prova.id}`}
                              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Abrir
                            </a>

                            <a
                              href={`/professor/provas/${prova.id}/boletim`}
                              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Boletim
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Atalhos
                  </h2>

                  <div className="mt-4 space-y-3">
                    <a
                      href="/professor/provas/nova"
                      className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Nova prova
                    </a>

                    <a
                      href="/professor/provas"
                      className="block rounded-lg border px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Gerenciar provas
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resumo acadêmico
                  </h2>

                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <p>
                      Você possui <strong>{data.resumo.totalProvas}</strong>{" "}
                      prova(s) cadastrada(s).
                    </p>
                    <p>
                      Há <strong>{data.resumo.provasPublicadas}</strong> prova(s)
                      publicadas no momento.
                    </p>
                    <p>
                      Foram registradas{" "}
                      <strong>{data.resumo.totalTentativasFinalizadas}</strong>{" "}
                      tentativa(s) finalizada(s).
                    </p>
                    <p>
                      <strong>{data.resumo.aprovados}</strong> aluno(s)
                      aprovado(s) e <strong>{data.resumo.reprovados}</strong>{" "}
                      reprovado(s).
                    </p>
                    <p>
                      A média geral atual é{" "}
                      <strong>{data.resumo.mediaGeral}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(ProfessorDashboardPage, ["professor"]);