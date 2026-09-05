import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ProfessorSidebar from "@/components/layout/ProfessorSidebar";
import { ProfessorProvider } from "@/app/context/ProfessorContext";
import { ConfirmDialogProvider } from "@/components/providers/ConfirmDialogProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";
import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";
import { paginaVisivel } from "@/lib/portal-config";
import ImpersonacaoBanner from "@/components/suporte/ImpersonacaoBanner";
import { getTranslations } from "next-intl/server";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t =
    await getTranslations(
      "ProfessorLayout"
    );

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "token"
    )?.value;

  if (!token) {
    redirect(
      "/login?portal=professor"
    );
  }

  let decoded: {
    id: number;
    role: string;
    email: string;
    instituicaoId: number;
  };

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: number;
      role: string;
      email: string;
      instituicaoId: number;
    };
  } catch {
    redirect(
      "/login?portal=professor"
    );
  }

  if (
    decoded.role !==
      "PROFESSOR" &&
    decoded.role !==
      "professor"
  ) {
    redirect(
      "/login?portal=professor"
    );
  }

  const professor =
    await prisma.professor.findFirst(
      {
        where: {
          userId:
            decoded.id,

          instituicaoId:
            decoded.instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          fotoPerfil: true,
          instituicaoId:
            true,
        },
      }
    );

  if (!professor) {
    redirect(
      "/login?portal=professor"
    );
  }

  const visibilidadeProfessor =
    {
      painel:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.painel"
        ),

      turmas:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.turmas"
        ),

      substituicoes:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.substituicoes"
        ),

      alunos:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.alunos"
        ),

      atividades:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.atividades"
        ),

      provas:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.provas"
        ),

      trabalhos:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.trabalhos"
        ),

      reunioes:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.reunioes"
        ),

      ouvidoria:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.ouvidoria"
        ),

      materiais:
        await paginaVisivel(
          professor.instituicaoId,
          "PROFESSOR",
          "professor.materiais"
        ),
    };

  const classeItemMobile =
    "flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2 text-center transition hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300";

  return (
    <>
      <ImpersonacaoBanner />

      <ProfessorProvider>
        <InstallPromptPHANYX />

        <ToastProvider>
          <ConfirmDialogProvider>
            <Header />

            <div className="min-h-[calc(100dvh-56px)] bg-gray-100 dark:bg-slate-950 lg:flex">
              <div className="hidden lg:block">
                <ProfessorSidebar
                  professor={
                    professor
                  }
                  visibilidade={
                    visibilidadeProfessor
                  }
                />
              </div>

              <nav
                aria-label={t(
                  "mobileNav.ariaLabel"
                )}
                className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_25px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
              >
                <div className="grid grid-cols-5 gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                  {visibilidadeProfessor.painel && (
                    <a
                      href="/professor"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        📊
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.dashboard"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.turmas && (
                    <a
                      href="/professor/turmas"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        🏫
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.classes"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.substituicoes && (
                    <a
                      href="/professor/substituicoes"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        🔁
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.substitutions"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.alunos && (
                    <a
                      href="/professor/alunos"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        👥
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.students"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.materiais && (
                    <a
                      href="/professor/aulas"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        🎬
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.lessons"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.atividades && (
                    <a
                      href="/professor/atividades"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        📝
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.activities"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.provas && (
                    <a
                      href="/professor/provas"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        ✅
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.assessments"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.trabalhos && (
                    <a
                      href="/professor/trabalhos"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        📄
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.assignments"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.reunioes && (
                    <a
                      href="/professor/reunioes"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        📅
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.meetings"
                        )}
                      </span>
                    </a>
                  )}

                  {visibilidadeProfessor.ouvidoria && (
                    <a
                      href="/professor/ouvidoria"
                      className={
                        classeItemMobile
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg"
                      >
                        💬
                      </span>

                      <span className="mt-0.5 max-w-full truncate">
                        {t(
                          "mobileNav.ombudsman"
                        )}
                      </span>
                    </a>
                  )}
                </div>
              </nav>

              <main className="w-full px-3 py-4 pb-32 lg:min-w-0 lg:flex-1 lg:p-8">
                <PhanyxFeriadoAviso />

                <div className="mb-4 flex flex-wrap items-center justify-end gap-3 lg:mb-6">
                  <div className="w-full sm:w-auto">
                    <SeletorIdioma />
                  </div>

                  <PhanyxThemeToggle />

                  <form
                    action="/api/auth/logout-professor"
                    method="post"
                  >
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      {t(
                        "logout"
                      )}
                    </button>
                  </form>
                </div>

                {children}
              </main>
            </div>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ProfessorProvider>
    </>
  );
}