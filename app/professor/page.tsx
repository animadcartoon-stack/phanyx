import { redirect } from "next/navigation";
import { paginaProfessorVisivel } from "@/lib/portal-professor-permissoes";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import ProfessorDashboardClient from "./ProfessorDashboardClient";

export default async function ProfessorPage() {
  const user = await getUserFromToken();
  if (!user?.instituicaoId || user.role !== "PROFESSOR") {
    redirect("/login?portal=professor");
  }

  const professor = await prisma.professor.findFirst({ where: { userId: user.id, instituicaoId: user.instituicaoId }, select: { id: true } });
  if (!professor || !(await paginaProfessorVisivel(user.instituicaoId, "PROFESSOR", "professor.painel", professor.id))) {
    redirect("/professor/sem-acesso");
  }

  return <ProfessorDashboardClient />;
}
