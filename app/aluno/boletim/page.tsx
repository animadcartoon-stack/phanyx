"use client";

import { useEffect, useState } from "react";

type ProvaBoletim = {
  tentativaId: number;
  provaId: number;
  titulo: string;
  nota: number;
  notaMaxima: number;
  finalizada: boolean;
  startedAt?: string;
  finishedAt?: string | null;
  status: "FINALIZADA" | "EM_ANDAMENTO";
};

type DisciplinaBoletim = {
  disciplinaId: number;
  disciplinaNome: string;
  media: number;
  provas: ProvaBoletim[];
};

type BoletimResponse = {
  aluno: {
    id: number;
    userId: number;
  };
  totalDisciplinas: number;
  boletim: DisciplinaBoletim[];
};

export default function AlunoBoletimPage() {
  const [data, setData] = useState<BoletimResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarBoletim() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/boletim");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar boletim");
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar boletim");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarBoletim();
  }, []);

  function getMediaClass(media: number) {
    if (media >= 7) return "text-green-700 bg-green-100";
    if (media >= 5) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Boletim</h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe suas notas por disciplina e o desempenho nas provas.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando boletim...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Disciplinas
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {data.totalDisciplinas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Resumo
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Aqui você visualiza as provas finalizadas e a média calculada
                  por disciplina.
                </p>
              </div>
            </div>

            {data.boletim.length === 0 && (
              <div className="rounded-2xl border bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nenhuma nota encontrada
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Assim que você concluir provas, elas aparecerão aqui no seu
                  boletim.
                </p>
              </div>
            )}

            {data.boletim.map((disciplina) => (
              <div
                key={disciplina.disciplinaId}
                className="rounded-2xl border bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {disciplina.disciplinaNome}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {disciplina.provas.length} prova(s) registrada(s)
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getMediaClass(
                      disciplina.media
                    )}`}
                  >
                    Média: {disciplina.media}
                  </span>
                </div>

                <div className="divide-y">
                  {disciplina.provas.map((prova) => (
                    <div
                      key={prova.tentativaId}
                      className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">
                          {prova.titulo}
                        </h3>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            <strong className="font-medium text-gray-700">
                              Nota:
                            </strong>{" "}
                            {prova.nota} / {prova.notaMaxima}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              Status:
                            </strong>{" "}
                            {prova.status === "FINALIZADA"
                              ? "Finalizada"
                              : "Em andamento"}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              Finalização:
                            </strong>{" "}
                            {formatarData(prova.finishedAt)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            prova.nota >= 7
                              ? "bg-green-100 text-green-700"
                              : prova.nota >= 5
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {prova.nota >= 7
                            ? "Bom desempenho"
                            : prova.nota >= 5
                            ? "Atenção"
                            : "Baixo desempenho"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}