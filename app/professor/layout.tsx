import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ProfessorSidebar from "@/components/layout/ProfessorSidebar";
import { ProfessorProvider } from "@/app/context/ProfessorContext";
import { ConfirmDialogProvider } from "@/components/providers/ConfirmDialogProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

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
    <ToastProvider>
      <ConfirmDialogProvider>
        <Header />
        <div className="flex bg-gray-100 min-h-[calc(100vh-56px)]">
          <ProfessorSidebar professor={professor} />
          <main className="flex-1 p-8">
            <div className="mb-6 flex justify-end">
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