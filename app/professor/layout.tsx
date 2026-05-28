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

  return (
  <ProfessorProvider>
    <InstallPromptPHANYX />
    <ToastProvider>
      <ConfirmDialogProvider>
        <Header />
        <div className="min-h-[calc(100dvh-56px)] bg-gray-100 lg:flex">
          <div className="hidden lg:block">
  <ProfessorSidebar professor={professor} />
</div>

<nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_25px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
  <div className="grid grid-cols-7 gap-1 text-[9px] font-semibold text-slate-600">
   <a href="/professor" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">📊</span>
  Painel
</a>

<a href="/professor/turmas" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">🏫</span>
  Turmas
</a>

<a href="/professor/alunos" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">👥</span>
  Alunos
</a>

<a href="/professor/aulas" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">🎬</span>
  Aulas
</a>

<a href="/professor/atividades" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">📝</span>
  Atividades
</a>

<a href="/professor/provas" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">✅</span>
  Avaliações
</a>

<a href="/professor/trabalhos" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
  <span className="text-lg">📄</span>
  Trabalhos
</a>
  </div>
</nav>

          <main className="w-full px-3 py-4 pb-28 lg:min-w-0 lg:flex-1 lg:p-8">
  <PhanyxFeriadoAviso />

  <div className="mb-4 flex flex-wrap items-center justify-end gap-3 lg:mb-6">
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
  
);
}