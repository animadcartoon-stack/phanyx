import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { validarPaginaProfessor } from "@/lib/portal-guard";
import CorrecaoTrabalhoClient from "./CorrecaoTrabalhoClient";

export default async function CorrecaoTrabalhoPage({
  params,
}: {
  params: {
    entregaId: string;
  };
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
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    redirect("/login?portal=professor");
  }

  if (String(decoded.role).toUpperCase() !== "PROFESSOR") {
    redirect("/login?portal=professor");
  }

  await validarPaginaProfessor(
    decoded.instituicaoId,
    "professor.trabalhos"
  );

  return (
    <CorrecaoTrabalhoClient
      entregaId={Number(params.entregaId)}
    />
  );
}