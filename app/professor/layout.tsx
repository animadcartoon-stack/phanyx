import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import PortalNavigation from "@/components/layout/PortalNavigation";
import ProfessorSidebar from "@/components/layout/ProfessorSidebar";
import { ProfessorProvider } from "@/app/context/ProfessorContext";
import { ConfirmDialogProvider } from "@/components/providers/ConfirmDialogProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";
import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";
import { paginaProfessorVisivel, PAGINAS_PROFESSOR } from "@/lib/portal-professor-permissoes";
import { chavePaginaProfessorPorRota } from "@/lib/rota-portal-professor";
import { headers } from "next/headers";
import { CHAVE_MOBILIDADE_DOCENTE } from "@/lib/mobilidade-docente-config";
import ImpersonacaoBanner from "@/components/suporte/ImpersonacaoBanner";
import PhanyxNotificationBell from "@/components/notificacoes/PhanyxNotificationBell";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import { getTranslations } from "next-intl/server";
import { bibliotecaDisponivel } from "@/lib/biblioteca-catalogo-leitor";

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
          ativo: true,
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

  // A rota é definida pelo middleware; o cabeçalho não pode vir do navegador.
  const caminhoProfessor = (await headers()).get("x-phanyx-rota-professor") || "";
  const chaveSolicitada = chavePaginaProfessorPorRota(caminhoProfessor);
  if (chaveSolicitada && !(await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", chaveSolicitada, professor.id, (PAGINAS_PROFESSOR.find(p => p.chave === chaveSolicitada)?.padrao ?? false)))) {
    redirect("/professor/sem-acesso");
  }

  const visibilidadeProfessor =
    {
      biblioteca:
        await bibliotecaDisponivel(
          professor.instituicaoId
        ) &&
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.biblioteca", professor.id),
      painel:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.painel", professor.id),

      turmas:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.turmas", professor.id),

      substituicoes:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.substituicoes", professor.id),

      alunos:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.alunos", professor.id),

      atividades:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.atividades", professor.id),

      provas:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.provas", professor.id),

      trabalhos:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.trabalhos", professor.id),

      reunioes:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.reunioes", professor.id),

      mobilidade: professor.ativo && await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", CHAVE_MOBILIDADE_DOCENTE, professor.id, false),
      ouvidoria:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.ouvidoria", professor.id),

      materiais:
        await paginaProfessorVisivel(professor.instituicaoId, "PROFESSOR", "professor.materiais", professor.id),
      planejamento: await paginaProfessorVisivel(professor.instituicaoId,"PROFESSOR","professor.planejamento",professor.id,false),
      relatorios: await paginaProfessorVisivel(professor.instituicaoId,"PROFESSOR","professor.relatorios",professor.id,false),
      desenvolvimento: await paginaProfessorVisivel(professor.instituicaoId,"PROFESSOR","professor.desenvolvimento",professor.id,false),
      documentos: await paginaProfessorVisivel(professor.instituicaoId,"PROFESSOR","professor.documentos",professor.id,false),
    };

  const preferencias = (
    <>
      <div className="w-full sm:w-auto"><SeletorIdioma /></div>
      <PhanyxThemeToggle />
    </>
  );

  return (
    <>
      <ImpersonacaoBanner />

      <ProfessorProvider>

        <ToastProvider>
          <ConfirmDialogProvider>
            <Header />

            <div className="min-h-[calc(100dvh-56px)] bg-gray-100 dark:bg-slate-950 lg:flex">
              <PortalNavigation preferences={preferencias} actions={(
                <div className="flex items-center gap-2 lg:contents">
                  <PhanyxNotificationBell mostrarLinkTodas={false} modoSuporte={Boolean((decoded as typeof decoded & { impersonacao?: boolean }).impersonacao)} />
                  <ChatGlobalWidget mobileInline />
                </div>
              )}>
                <ProfessorSidebar professor={professor} visibilidade={visibilidadeProfessor} />
              </PortalNavigation>

              <main className="w-full min-w-0 px-3 py-4 lg:flex-1 lg:p-8">
                <div className="hidden flex-wrap items-center justify-end gap-3 lg:mb-6 lg:flex">
                  {preferencias}

                  <form
                    action="/api/auth/logout-professor"
                    method="post"
                    className="hidden lg:block"
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
                <InstallPromptPHANYX />
              </main>
            </div>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ProfessorProvider>
    </>
  );
}
