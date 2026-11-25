import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import PortalNavigation from "@/components/layout/PortalNavigation";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import PhanyxNotificationBell from "@/components/notificacoes/PhanyxNotificationBell";
import AlunoSidebar from "@/components/layout/AlunoSidebar";
import { AlunoProvider } from "@/app/context/AlunoContext";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";
import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";
import { paginaVisivel } from "@/lib/portal-config";
import ImpersonacaoBanner from "@/components/suporte/ImpersonacaoBanner";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";
import { bibliotecaDisponivel } from "@/lib/biblioteca-catalogo-leitor";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tAluno =
    await getTranslations(
      "StudentLayout"
    );
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?portal=aluno");
  }

  let decoded: {
    id: number;
    role: string;
    email: string;
    instituicaoId: number;
  };

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      role: string;
      email: string;
      instituicaoId: number;
    };
  } catch {
    redirect("/login?portal=aluno");
  }

  if (
    String(decoded.role).toUpperCase() !== "ALUNO"
  ) {
    redirect("/login?portal=aluno");
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: decoded.id,
      instituicaoId: decoded.instituicaoId,
    },
    select: {
      id: true,
      nome: true,
      fotoPerfil: true,
      statusAluno: true,
      instituicaoId: true,
    },
  });

  if (!aluno) {
    redirect("/login?portal=aluno");
  }

  const configFinanceira =
    await prisma.configuracaoFinanceiraInstituicao.findUnique({
      where: {
        instituicaoId: aluno.instituicaoId,
      },
      select: {
        bloquearAlunoInadimplente: true,
      },
    });

  const bloqueioFinanceiroAtivo = Boolean(
    configFinanceira?.bloquearAlunoInadimplente
  );

  if (
    bloqueioFinanceiroAtivo &&
    aluno.statusAluno === "INADIMPLENTE"
  ) {
    return (
      <>
        <ImpersonacaoBanner />

        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-amber-50 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-red-950">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl dark:border-red-900 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-red-600 to-amber-500 px-8 py-8 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                  🚫
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/90">
                    {tAluno(
                      "academicAccessBlocked"
                    )}
                  </p>

                  <h1 className="text-2xl font-bold text-white md:text-3xl">
                    {tAluno(
                      "financialRegularizationRequired"
                    )}
                  </h1>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-8 md:p-10">
              <div className="space-y-3">
                <p className="text-lg text-slate-900 dark:text-white">
                  {tAluno("greeting", {
                    name: aluno.nome,
                  })}
                </p>

                <p className="leading-7 text-slate-700 dark:text-slate-200">
                  {tAluno(
                    "blockedDescription"
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/40">
                  <h2 className="mb-2 font-semibold text-red-900 dark:text-red-100">
                    {tAluno(
                      "meaningTitle"
                    )}
                  </h2>

                  <p className="text-sm leading-6 text-red-800 dark:text-red-200">
                    {tAluno(
                      "meaningDescription"
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
                  <h2 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
                    {tAluno(
                      "unlockTitle"
                    )}
                  </h2>

                  <p className="text-sm leading-6 text-amber-800 dark:text-amber-200">
                    {tAluno(
                      "unlockDescription"
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-2 font-semibold text-slate-950 dark:text-white">
                  {tAluno(
                    "importantTitle"
                  )}
                </h2>

                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {tAluno(
                    "importantDescription"
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <a
                  href="/login?portal=aluno"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {tAluno(
                    "backToLogin"
                  )}
                </a>

                <form
                  action="/api/auth/logout-aluno"
                  method="post"
                >
                  <button
                    type="submit"
                    className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    {tAluno("logout")}
                  </button>
                </form>
              </div>

              <div className="pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {tAluno("footer")}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const configuracaoManualRematricula =
    await prisma.configuracaoPortalInstituicao.findFirst({
      where: {
        instituicaoId: aluno.instituicaoId,
        portal: "ALUNO",
        chavePagina: "aluno.rematricula",
      },
      select: {
        visivel: true,
        modoVisibilidade: true,
      },
    });

  const matriculaAtual = await prisma.matricula.findFirst({
    where: {
      alunoId: aluno.id,
      instituicaoId: aluno.instituicaoId,
      cursoId: {
        not: null,
      },
      OR: [
        {
          status: "ATIVA",
        },
        {
          status: "A_INICIAR",
        },
      ],
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      cursoId: true,
      semestre: true,
      cursoSemestre: {
        select: {
          numero: true,
        },
      },
    },
  });

  const semestreAtual =
    matriculaAtual?.cursoSemestre?.numero ??
    matriculaAtual?.semestre ??
    null;

  const proximoSemestreNumero =
    semestreAtual !== null
      ? semestreAtual + 1
      : null;

  const agora = new Date();

  const periodoRematriculaAberto =
    matriculaAtual?.cursoId
      ? await prisma.periodoMatricula.findFirst({
        where: {
          instituicaoId: aluno.instituicaoId,
          tipo: "REMATRICULA",
          status: "PUBLICADO",
          ativo: true,
          permiteAluno: true,
          dataInicio: {
            lte: agora,
          },
          dataFim: {
            gte: agora,
          },
          OR: [
            {
              cursoId: null,
            },
            {
              cursoId: matriculaAtual.cursoId,
            },
          ],
          ...(proximoSemestreNumero !== null
            ? {
              semestreNumero:
                proximoSemestreNumero,
            }
            : {}),
        },
        select: {
          id: true,
          periodoLetivo: true,
          dataInicio: true,
          dataFim: true,
        },
      })
      : null;

  const modoVisibilidadeRematricula = String(
    configuracaoManualRematricula?.modoVisibilidade ||
    (configuracaoManualRematricula?.visivel
      ? "SEMPRE_VISIVEL"
      : "AUTOMATICO"),
  ).toUpperCase();

  const mostrarRematricula =
    modoVisibilidadeRematricula === "OCULTO"
      ? false
      : modoVisibilidadeRematricula === "SEMPRE_VISIVEL"
        ? true
        : periodoRematriculaAberto !== null;

  const visibilidadeAluno = {
    biblioteca:
      await bibliotecaDisponivel(
        aluno.instituicaoId
      ) &&
      await paginaVisivel(
        aluno.instituicaoId,
        "ALUNO",
        "aluno.biblioteca"
      ),
    painel: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.painel"),
    rematricula: mostrarRematricula,
    disciplinas: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.disciplinas"),
    progresso: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.progresso"),
    desenvolvimento: await paginaVisivel(aluno.instituicaoId,"ALUNO","aluno.desenvolvimento",false),
    trabalhos: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.trabalhos"),
    presenca: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.presenca"),
    boletim: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.boletim"),
    certificados: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.certificados"),

    mobilidade: await paginaVisivel(
      aluno.instituicaoId,
      "ALUNO",
      "aluno.mobilidade"
    ),
    reunioes: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.reunioes"),
    dados: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.dados"),
    historico: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.historico"),
    ouvidoria: await paginaVisivel(aluno.instituicaoId, "ALUNO", "aluno.ouvidoria"),
  };

  const caminhoAluno = (await headers()).get("x-phanyx-rota-aluno") || "";
  if ((caminhoAluno === "/aluno/desenvolvimento" || caminhoAluno.startsWith("/aluno/desenvolvimento/")) && !visibilidadeAluno.desenvolvimento) redirect("/aluno/sem-acesso");
  const preferencias = (
    <>
      <SeletorIdioma className="phanyx-aluno-seletor-idioma w-full sm:w-64" />
      <PhanyxThemeToggle />
    </>
  );

  return (
    <>
      <ImpersonacaoBanner />

      <AlunoProvider>
        <Header />
        <div className="min-h-[calc(100dvh-56px)] bg-slate-100 dark:bg-slate-950 lg:flex">
          <PortalNavigation preferences={preferencias} actions={(
            <div className="flex items-center gap-2 lg:contents">
              <PhanyxNotificationBell mostrarLinkTodas={false} />
              <ChatGlobalWidget mobileInline />
            </div>
          )}>
            <AlunoSidebar aluno={aluno} visibilidade={visibilidadeAluno} />
          </PortalNavigation>

          <form
            action="/api/auth/logout-aluno"
            method="post"
            className="hidden lg:fixed lg:right-20 lg:top-4 lg:z-[80] lg:block"
          >
            <button
              type="submit"
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {tAluno("logout")}
            </button>
          </form>

          <main className="phanyx-aluno-conteudo w-full min-w-0 flex-1 px-3 py-4 lg:ml-64 lg:p-8">
            <div className="mb-4 hidden flex-row items-end justify-end gap-3 lg:flex">
              {preferencias}
            </div>

            {visibilidadeAluno.dados && (
              <div className="phanyx-aluno-dados-cadastrais mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                      {tAluno(
                        "registrationData"
                      )}
                    </h2>

                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {tAluno(
                        "registrationDescription"
                      )}
                    </p>
                  </div>

                  <a
                    href="/aluno/completar-cadastro"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {tAluno(
                      "updateMyData"
                    )}
                  </a>
                </div>
              </div>
            )}


            {children}
            <InstallPromptPHANYX />
          </main>
        </div>
      </AlunoProvider>
    </>
  );
}
