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

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?portal=professor");
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
    redirect("/login?portal=professor");
  }

  if (decoded.role !== "PROFESSOR" && decoded.role !== "professor") {
    redirect("/login?portal=professor");
  }

  const professor = await prisma.professor.findFirst({
    where: {
      userId: decoded.id,
      instituicaoId: decoded.instituicaoId,
    },
    select: {
      id: true,
      nome: true,
      fotoPerfil: true,
      instituicaoId: true,
    },
  });

  if (!professor) {
    redirect("/login?portal=professor");
  }

  const visibilidadeProfessor = {
    painel: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.painel"
    ),
    turmas: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.turmas"
    ),
    substituicoes: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.substituicoes"
    ),
    alunos: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.alunos"
    ),
    atividades: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.atividades"
    ),
    provas: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.provas"
    ),
    trabalhos: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.trabalhos"
    ),
    reunioes: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.reunioes"
    ),
    ouvidoria: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.ouvidoria"
    ),
    materiais: await paginaVisivel(
      professor.instituicaoId,
      "PROFESSOR",
      "professor.materiais"
    ),
  };

  return (
    <>
      <ImpersonacaoBanner />

      <ProfessorProvider>
        <InstallPromptPHANYX />
        <ToastProvider>
          <ConfirmDialogProvider>
            <Header />
            <div className="min-h-[calc(100dvh-56px)] bg-gray-100 lg:flex">
              <div className="hidden lg:block">
                <ProfessorSidebar
                  professor={professor}
                  visibilidade={visibilidadeProfessor}
                />
              </div>

              <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_25px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
                <div className="grid grid-cols-9 gap-1 text-[8px] font-semibold text-slate-600">
                  {visibilidadeProfessor.painel && (
                    <a href="/professor" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">📊</span>
                      Painel
                    </a>
                  )}

                  {visibilidadeProfessor.turmas && (
                    <a href="/professor/turmas" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">🏫</span>
                      Turmas
                    </a>
                  )}

                  {visibilidadeProfessor.substituicoes && (
                    <a
                      href="/professor/substituicoes"
                      className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="text-lg">🔁</span>
                      Subst.
                    </a>
                  )}

                  {visibilidadeProfessor.alunos && (
                    <a href="/professor/alunos" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">👥</span>
                      Alunos
                    </a>
                  )}

                  {visibilidadeProfessor.materiais && (
                    <a href="/professor/aulas" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">🎬</span>
                      Aulas
                    </a>
                  )}

                  {visibilidadeProfessor.atividades && (
                    <a href="/professor/atividades" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">📝</span>
                      Atividades
                    </a>
                  )}

                  {visibilidadeProfessor.provas && (
                    <a href="/professor/provas" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">✅</span>
                      Avaliações
                    </a>
                  )}

                  {visibilidadeProfessor.trabalhos && (
                    <a href="/professor/trabalhos" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">📄</span>
                      Trabalhos
                    </a>
                  )}

                  {visibilidadeProfessor.reunioes && (
                    <a href="/professor/reunioes" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                      <span className="text-lg">📅</span>
                      Reuniões
                    </a>
                  )}

                </div>
              </nav>

              <main className="w-full px-3 py-4 pb-28 lg:min-w-0 lg:flex-1 lg:p-8">
                <PhanyxFeriadoAviso />

                <div className="mb-4 flex flex-wrap items-center justify-end gap-3 lg:mb-6">
                  <div className="w-full sm:w-auto">
                    <SeletorIdioma />
                  </div>

                  <PhanyxThemeToggle />

                  <form action="/api/auth/logout-professor" method="post">
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      Sair
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