import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { validarPaginaAluno } from "@/lib/portal-guard";
import ReunioesAlunoClient from "./ReunioesAlunoClient";

export default async function ReunioesAlunoPage() {
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

  if (String(decoded.role).toUpperCase() !== "ALUNO") {
    redirect("/login?portal=aluno");
  }

  await validarPaginaAluno(
    decoded.instituicaoId,
    "aluno.reunioes"
  );

  return <ReunioesAlunoClient />;
}