import { redirect } from "next/navigation";
import { paginaVisivel } from "@/lib/portal-config";
import { getUserFromToken } from "@/lib/server-auth";
import ProfessorDashboardClient from "./ProfessorDashboardClient";

export default async function ProfessorPage() {
  const user = await getUserFromToken();
  if (!user?.instituicaoId || user.role !== "PROFESSOR") {
    redirect("/login?portal=professor");
  }

  if (!(await paginaVisivel(user.instituicaoId, "PROFESSOR", "professor.painel"))) {
    redirect("/professor/turmas");
  }

  return <ProfessorDashboardClient />;
}
