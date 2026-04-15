"use client";

import { useEffect, useMemo, useState } from "react";

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

function formatarData(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

function getMediaClass(media: number) {
  if (media >= 7) return "text-emerald-700 bg-emerald-100";
  if (media >= 5) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

function getDesempenhoClass(nota: number) {
  if (nota >= 7) return "bg-emerald-100 text-emerald-700";
  if (nota >= 5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function getDesempenhoLabel(nota: number) {
  if (nota >= 7) return "Bom desempenho";
  if (nota >= 5) return "Atenção";
  return "Baixo desempenho";
}

export default function AlunoBoletimPage() {
  const [data, setData] = useState<BoletimResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarBoletim() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/boletim", {
        credentials: "include",
        cache: "no-store",
      });

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

  const mediaGeral = useMemo(() => {
    if (!data || data.boletim.length === 0) return 0;

    const soma = data.boletim.reduce((acc, item) => acc + Number(item.media || 0), 0);
    return Number((soma / data.boletim.length).toFixed(1));
  }, [data]);

  const totalProvas = useMemo(() => {
    if (!data) return 0;

    return data.boletim.reduce((acc, item) => acc + item.provas.length, 0);
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-sm">
          <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.3fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
                Boletim acadêmico
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                Acompanhe suas notas, médias e desempenho por disciplina
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 md:text-base">
                Visualize suas provas concluídas, sua média por disciplina e seu
                panorama acadêmico em um ambiente claro, organizado e profissional.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Voltar ao painel
                </a>

                <a
                  href="/aluno/boletim"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Atualizar boletim
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                  Disciplinas
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {loading ? "..." : data?.totalDisciplinas ?? 0}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  Total de disciplinas no seu boletim.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                  Média geral
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {loading ? "..." : mediaGeral}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  Média consolidada com base nas disciplinas registradas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando boletim...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Disciplinas
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {data.totalDisciplinas}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Quantidade de disciplinas com notas registradas.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Provas registradas
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalProvas}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Total de provas vinculadas ao seu histórico atual.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Média geral
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {mediaGeral}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Panorama consolidado do seu desempenho acadêmico.
                </p>
              </div>
            </section>

            {data.boletim.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Nenhuma nota encontrada
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Assim que você concluir provas, elas aparecerão aqui no seu
                  boletim.
                </p>
              </div>
            )}

            <section className="space-y-6">
              {data.boletim.map((disciplina) => (
                <div
                  key={disciplina.disciplinaId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {disciplina.disciplinaNome}
                      </h2>
                      <p className="text-sm text-slate-500">
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

                  <div className="divide-y divide-slate-200">
                    {disciplina.provas.map((prova) => (
                      <div
                        key={prova.tentativaId}
                        className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-2">
                          <h3 className="font-medium text-slate-900">
                            {prova.titulo}
                          </h3>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span>
                              <strong className="font-medium text-slate-700">
                                Nota:
                              </strong>{" "}
                              {prova.nota} / {prova.notaMaxima}
                            </span>

                            <span>
                              <strong className="font-medium text-slate-700">
                                Status:
                              </strong>{" "}
                              {prova.status === "FINALIZADA"
                                ? "Finalizada"
                                : "Em andamento"}
                            </span>

                            <span>
                              <strong className="font-medium text-slate-700">
                                Finalização:
                              </strong>{" "}
                              {formatarData(prova.finishedAt)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDesempenhoClass(
                              prova.nota
                            )}`}
                          >
                            {getDesempenhoLabel(prova.nota)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}