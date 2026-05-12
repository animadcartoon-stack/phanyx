"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import withAuth from "@/components/auth/withAuth";

type DashboardAlunoResponse = {
  aluno: {
  id: number;
  userId: number;
  nome?: string;
  fotoPerfil?: string | null;
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
  const inputFotoRef = useRef<HTMLInputElement | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    carregarDashboard();
    carregarDisciplinasMatriculadas();
    carregarPlano();
    carregarMatricula();
    carregarAulas();
  }, []);

async function alterarFotoPerfil(file: File | null) {
  if (!file) return;

  try {
    setEnviandoFoto(true);
    setErro("");

    const formData = new FormData();
    formData.append("file", file);

    const resUpload = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const jsonUpload = await resUpload.json();

    if (!resUpload.ok) {
      throw new Error(jsonUpload?.error || "Erro ao enviar imagem.");
    }

    const fotoUrl = jsonUpload?.url || jsonUpload?.arquivo?.url;

    if (!fotoUrl) {
      throw new Error("Upload feito, mas a URL da imagem não foi retornada.");
    }

    const resSalvar = await fetch("/api/aluno/foto-perfil", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fotoPerfil: fotoUrl,
      }),
    });

    const jsonSalvar = await resSalvar.json();

    if (!resSalvar.ok) {
      throw new Error(jsonSalvar?.error || "Erro ao salvar foto do perfil.");
    }

    setData((prev) =>
      prev
        ? {
            ...prev,
            aluno: {
              ...prev.aluno,
              fotoPerfil: fotoUrl,
            },
          }
        : prev
    );
  } catch (e: any) {
    setErro(e?.message || "Erro ao alterar foto.");
  } finally {
    setEnviandoFoto(false);
  }
}

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

      const total = json.reduce((acc: number, matricula: any) => {
  return acc + (matricula.itens?.length || 0);
}, 0);

setTotalDisciplinasMatriculadas(total);
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

  const disciplinaPrincipal = useMemo(() => {
  return disciplinas?.find((disc: any) => !disc.bloqueadaPorAulas) || null;
}, [disciplinas]);

  const ultimaProva = useMemo(() => {
    return data?.ultimasProvas?.[0] || null;
  }, [data]);

  const progressoAproveitamento = useMemo(() => {
    const percentual = Math.round((mediaGeral / 10) * 100);
    return Math.max(0, Math.min(100, percentual));
  }, [mediaGeral]);

  const mensagemDesempenho = useMemo(() => {
    if (mediaGeral >= 8) return "Excelente desempenho. Continue nesse ritmo.";
    if (mediaGeral >= 7) return "Você está indo muito bem na sua jornada.";
    if (mediaGeral >= 5) return "Bom progresso. Vale revisar os conteúdos recentes.";
    return "Hora de reforçar os estudos e retomar o ritmo.";
  }, [mediaGeral]);

  const proximoPasso = useMemo(() => {
    if (erro) {
      return {
        titulo: "Regularizar acesso",
        descricao:
          "Seu painel acadêmico está com acesso restrito no momento. Regularize sua situação para continuar normalmente.",
        href: "/suporte",
        label: "Abrir suporte",
      };
    }

    if (disciplinaPrincipal) {
      return {
        titulo: "Continuar estudos",
        descricao:
          "Retome sua rotina acadêmica acessando sua disciplina disponível no momento.",
        href: `/aluno/disciplina/${disciplinaPrincipal.id}`,
        label: "Abrir disciplina",
      };
    }

    if (ultimaProva) {
      return {
        titulo: "Revisar resultados",
        descricao:
          "Consulte seu desempenho mais recente e acompanhe sua evolução acadêmica.",
        href: "/aluno/boletim",
        label: "Ver boletim",
      };
    }

    return {
      titulo: "Explorar painel",
      descricao:
        "Acompanhe seus indicadores acadêmicos e mantenha sua rotina organizada.",
      href: "/aluno",
      label: "Atualizar painel",
    };
  }, [erro, disciplinaPrincipal, ultimaProva]);

  return (
    <div className="min-h-screen bg-slate-50">
      <input
  ref={inputFotoRef}
  type="file"
  accept="image/png,image/jpeg,image/jpg,image/webp"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    alterarFotoPerfil(file);
    e.target.value = "";
  }}
/>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-sm">
          <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.45fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
                Painel acadêmico do aluno
              </p>

<div className="mt-5 flex items-center gap-4">
  <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10">
    {data?.aluno?.fotoPerfil ? (
      <img
        src={data.aluno.fotoPerfil}
        alt={data.aluno.nome || "Aluno"}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
        {data?.aluno?.nome?.charAt(0)?.toUpperCase() || "A"}
      </div>
    )}
  </div>

  <div>
    <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
      Aluno
    </p>

    <h2 className="text-2xl font-bold text-white">
      {data?.aluno?.nome || "Aluno"}
    </h2>
    <button
  type="button"
  onClick={() => inputFotoRef.current?.click()}
  disabled={enviandoFoto}
  className="mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
>
  {enviandoFoto ? "Enviando..." : "Alterar foto"}
</button>
<div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
    Dica PHANYX
  </p>

  <p className="mt-1 text-sm leading-6 text-slate-600">
    Para que sua foto fique bem centralizada no perfil, utilize uma imagem
    quadrada (1:1), preferencialmente em 500x500px ou maior.
    <br />
    Formatos aceitos: PNG, JPG, JPEG e WEBP • Tamanho máximo: 5MB.
  </p>
</div>
  </div>
</div>

              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                {saudacao}, acompanhe sua jornada acadêmica com clareza,
                desempenho e foco
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 md:text-base">
                Veja seu curso, seu desempenho, suas disciplinas e seus próximos
                passos em um painel pensado para uma experiência acadêmica
                moderna, organizada e profissional.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={
                    disciplinaPrincipal
                      ? `/aluno/disciplina/${disciplinaPrincipal.id}`
                      : "/aluno/boletim"
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {disciplinaPrincipal ? "Continuar estudos" : "Ver boletim"}
                </a>

                <a
                  href="/aluno/boletim"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Abrir boletim
                </a>

                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
                  Aproveitamento atual
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {progressoAproveitamento}%
                </p>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${progressoAproveitamento}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-blue-100">
                  Baseado na sua média geral atual.
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
          <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
                  Acesso restrito
                </p>

                <h2 className="mt-2 text-2xl font-bold text-red-700">
                  Seu acesso está temporariamente bloqueado
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-red-600">
                  {erro}
                </p>

                <p className="mt-3 text-xs text-red-500">
                  Entre em contato com a instituição para regularizar sua
                  situação financeira e liberar novamente o ambiente acadêmico.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/suporte"
                  className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Falar com suporte
                </a>

                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Atualizar painel
                </a>
              </div>
            </div>
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

                          {disc.bloqueadaPorAulas ? (
  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
    <p className="text-sm font-semibold text-amber-800">
      Aula disponível em breve
    </p>
    <p className="mt-1 text-xs leading-5 text-amber-700">
      {disc.mensagemBloqueio ||
        "Assim que a instituição publicar o conteúdo, esta disciplina será desbloqueada automaticamente."}
    </p>
  </div>
) : (
  <a
    href={`/aluno/disciplina/${disc.id}`}
    className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
  >
    Acessar disciplina →
  </a>
)}
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
                    Próximo passo
                  </h2>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {proximoPasso.titulo}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {proximoPasso.descricao}
                    </p>

                    <a
                      href={proximoPasso.href}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {proximoPasso.label}
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Progresso visual
                  </h2>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Aproveitamento atual
                      </span>
                      <span className="font-semibold text-slate-900">
                        {progressoAproveitamento}%
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all"
                        style={{ width: `${progressoAproveitamento}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {mensagemDesempenho}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Atalhos rápidos
                  </h2>

                  <div className="mt-4 space-y-3">
                    <a
                      href={
                        disciplinaPrincipal
                          ? `/aluno/disciplina/${disciplinaPrincipal.id}`
                          : "/aluno"
                      }
                      className="block rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {disciplinaPrincipal
                        ? "Continuar estudos"
                        : "Atualizar dashboard"}
                    </a>

                    <a
                      href="/aluno/boletim"
                      className="block rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Abrir boletim
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

                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
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