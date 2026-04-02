"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type AlunoBoletim = {
  tentativaId: number;
  alunoId: number;
  alunoNome: string;
  nota: number;
  finalizada: boolean;
  startedAt?: string;
  finishedAt?: string | null;
  status: "FINALIZADA" | "EM_ANDAMENTO";
};

type BoletimProvaResponse = {
  prova: {
    id: number;
    titulo: string;
    notaMaxima: number;
    status: string;
  };
  totalAlunos: number;
  mediaTurma: number;
  alunos: AlunoBoletim[];
};

export default function BoletimProvaPage() {
  const params = useParams();
  const provaId = params.provaId as string;

  const [data, setData] = useState<BoletimProvaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarBoletim() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/provas/${provaId}/boletim`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar boletim da prova");
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar boletim da prova");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarBoletim();
  }, []);

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  function getNotaClass(nota: number) {
    if (nota >= 7) return "bg-green-100 text-green-700";
    if (nota >= 5) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <a
            href={`/professor/provas/${provaId}`}
            className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Voltar para prova
          </a>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Boletim da prova
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Visualize o desempenho dos alunos nesta avaliação.
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
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                {data.prova.titulo}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Nota máxima: {data.prova.notaMaxima} • Status: {data.prova.status}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Alunos com tentativa
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {data.totalAlunos}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Média da turma
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {data.mediaTurma}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Faixa
                </p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {data.mediaTurma >= 7
                    ? "Bom desempenho"
                    : data.mediaTurma >= 5
                    ? "Atenção"
                    : "Baixo desempenho"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Desempenho dos alunos
                </h2>
                <p className="text-sm text-gray-500">
                  Lista dos alunos com tentativa finalizada na prova
                </p>
              </div>

              {data.alunos.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">
                  Nenhuma tentativa finalizada encontrada.
                </div>
              ) : (
                <div className="divide-y">
                  {data.alunos.map((aluno) => (
                    <div
                      key={aluno.tentativaId}
                      className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">
                          {aluno.alunoNome}
                        </h3>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            <strong className="font-medium text-gray-700">
                              Status:
                            </strong>{" "}
                            {aluno.status === "FINALIZADA"
                              ? "Finalizada"
                              : "Em andamento"}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              Finalização:
                            </strong>{" "}
                            {formatarData(aluno.finishedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getNotaClass(
                            aluno.nota
                          )}`}
                        >
                          Nota: {aluno.nota}
                        </span>

                        <a
                          href={`/professor/tentativas/${aluno.tentativaId}`}
                          className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Ver tentativa
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}