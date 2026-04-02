"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";

type DashboardAlunoResponse = {
  aluno: {
    id: number;
    userId: number;
  };
  resumo: {
    totalDisciplinas: number;
    totalProvasConcluidas: number;
    mediaGeral: number;
  };
  ultimasProvas: {
    tentativaId: number;
    provaId: number;
    titulo: string;
    disciplinaNome: string;
    nota: number;
    notaMaxima: number;
    finishedAt?: string | null;
  }[];
};

type MatriculaDisciplinaResponse = any[];

type AuthMeResponse = {
  plano?: string;
  user?: {
    plano?: string;
  };
};

function AlunoDashboardPage() {
  const [data, setData] = useState<DashboardAlunoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [totalDisciplinasMatriculadas, setTotalDisciplinasMatriculadas] =
    useState(0);
  const [plano, setPlano] = useState<string>("ESSENCIAL");
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [matricula, setMatricula] = useState<any>(null);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);

  useEffect(() => {
    carregarDashboard();
    carregarDisciplinasMatriculadas();
    carregarPlano();
    carregarMatricula();
    carregarAulas();
  }, []);

  async function carregarDashboard() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/dashboard", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        if (json?.error === "INADIMPLENTE") {
          setErro(json.message || "Acesso bloqueado por inadimplência.");
          setData(null);
          return;
        }

        throw new Error(json.error || "Erro ao carregar dashboard");
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function carregarAulas() {
    try {
      const res = await fetch("/api/aluno/aulas", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (res.ok) {
        setDisciplinas(json.disciplinas || []);
      }
    } catch {}
  }

  async function carregarMatricula() {
    try {
      const res = await fetch("/api/aluno/matricula", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (res.ok) {
        setMatricula(json.matricula);
      }
    } catch {}
  }

  async function carregarDisciplinasMatriculadas() {
    try {
      const res = await fetch("/api/aluno/disciplinas", {
        credentials: "include",
        cache: "no-store",
      });

      const json: MatriculaDisciplinaResponse = await res.json();

      if (!res.ok || !Array.isArray(json)) {
        setTotalDisciplinasMatriculadas(0);
        return;
      }

      setTotalDisciplinasMatriculadas(json.length);
    } catch {
      setTotalDisciplinasMatriculadas(0);
    }
  }

  async function carregarPlano() {
    try {
      setLoadingPlano(true);

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      const json: AuthMeResponse = await res.json();

      const planoRecebido = json?.plano || json?.user?.plano || "ESSENCIAL";
      setPlano(planoRecebido);
    } catch {
      setPlano("ESSENCIAL");
    } finally {
      setLoadingPlano(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  function getMediaClass(media: number) {
    if (media >= 7) return "text-emerald-600";
    if (media >= 5) return "text-amber-500";
    return "text-red-500";
  }

  function getNotaBadgeClass(nota: number) {
    if (nota >= 7) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (nota >= 5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  }

  const mediaGeral = data?.resumo?.mediaGeral ?? 0;
  const totalProvas = data?.resumo?.totalProvasConcluidas ?? 0;

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-sm">
          <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
                Painel acadêmico do aluno
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                {saudacao}, acompanhe sua jornada acadêmica com clareza e
                organização
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 md:text-base">
                Visualize seu curso, disciplinas, desempenho, últimas avaliações
                e atalhos principais em um ambiente pensado para uma experiência
                acadêmica profissional.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/aluno/boletim"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Ver boletim
                </a>

                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Atualizar painel
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                  Curso atual
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {matricula?.curso?.nome || "Curso não identificado"}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  Status: {matricula?.status || "Não informado"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                  Plano
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {loadingPlano ? "Carregando..." : plano}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  Ambiente acadêmico conectado ao seu perfil.
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando dashboard...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700">
              Acesso bloqueado
            </h2>

            <p className="mt-2 text-sm text-red-600">{erro}</p>

            <p className="mt-4 text-xs text-red-500">
              Entre em contato com a instituição para regularizar sua situação.
            </p>
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Disciplinas matriculadas
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {totalDisciplinasMatriculadas}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Total atual de disciplinas vinculadas à sua matrícula.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Média geral
                </p>
                <p className={`mt-3 text-3xl font-bold ${getMediaClass(mediaGeral)}`}>
                  {mediaGeral}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Desempenho acadêmico consolidado até o momento.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Provas concluídas
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {!loadingPlano && plano !== "ESSENCIAL" ? totalProvas : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {!loadingPlano && plano !== "ESSENCIAL"
                    ? "Quantidade de avaliações já finalizadas."
                    : "Disponível em planos superiores."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Status da matrícula
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {matricula?.status || "—"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Situação acadêmica atual do seu vínculo institucional.
                </p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Suas disciplinas
                      </h2>
                      <p className="text-sm text-slate-500">
                        Acesse rapidamente os conteúdos, materiais e atividades.
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {disciplinas.length} disciplina(s)
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {disciplinas.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 md:col-span-2">
                        Nenhuma disciplina disponível no momento.
                      </div>
                    ) : (
                      disciplinas.map((disc: any) => (
                        <div
                          key={disc.id}
                          className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
                        >
                          <h3 className="text-base font-semibold text-slate-900">
                            {disc.nome}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Acesse os conteúdos disponíveis e acompanhe suas
                            atividades acadêmicas.
                          </p>

                          <a
                            href={`/aluno/disciplina/${disc.id}`}
                            className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Acessar disciplina →
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Últimas provas
                      </h2>
                      <p className="text-sm text-slate-500">
                        Suas avaliações concluídas mais recentes.
                      </p>
                    </div>

                    <a
                      href="/aluno/boletim"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Ver boletim
                    </a>
                  </div>

                  {!loadingPlano && plano === "ESSENCIAL" ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                      O detalhamento de provas concluídas está disponível em
                      planos superiores.
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {data.ultimasProvas.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                          Você ainda não possui provas concluídas.
                        </div>
                      ) : (
                        data.ultimasProvas.map((prova) => (
                          <div
                            key={prova.tentativaId}
                            className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                  {prova.titulo}
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                  <span>
                                    <strong className="font-medium text-slate-700">
                                      Disciplina:
                                    </strong>{" "}
                                    {prova.disciplinaNome}
                                  </span>

                                  <span>
                                    <strong className="font-medium text-slate-700">
                                      Finalização:
                                    </strong>{" "}
                                    {formatarData(prova.finishedAt)}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getNotaBadgeClass(
                                  prova.nota
                                )}`}
                              >
                                Nota: {prova.nota} / {prova.notaMaxima}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Atalhos rápidos
                  </h2>

                  <div className="mt-4 space-y-3">
                    <a
                      href="/aluno/boletim"
                      className="block rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Abrir boletim
                    </a>

                    <a
                      href="/aluno"
                      className="block rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Atualizar dashboard
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Resumo acadêmico
                  </h2>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <p>
                      Você possui <strong>{totalDisciplinasMatriculadas}</strong>{" "}
                      disciplina(s) matriculada(s).
                    </p>

                    {!loadingPlano && plano !== "ESSENCIAL" && (
                      <p>
                        Já concluiu <strong>{totalProvas}</strong> prova(s).
                      </p>
                    )}

                    <p>
                      Sua média geral atual é <strong>{mediaGeral}</strong>.
                    </p>

                    <p>
                      Curso atual:{" "}
                      <strong>
                        {matricula?.curso?.nome || "Não identificado"}
                      </strong>
                      .
                    </p>

                    <p>
                      Status da matrícula:{" "}
                      <strong>{matricula?.status || "Não informado"}</strong>.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Situação institucional
                  </h2>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    Seu ambiente acadêmico está vinculado ao curso e à matrícula
                    ativos no sistema. Sempre que necessário, acompanhe seu
                    boletim, disciplinas e atualizações por este painel.
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(AlunoDashboardPage, ["aluno"]);