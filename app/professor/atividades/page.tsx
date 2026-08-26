import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

import { validarPaginaProfessor } from "@/lib/portal-guard";
import ProfessorAtividadesClient from "./ProfessorAtividadesClient";

type ProfessorJwtPayload = {
  id: number;
  role: string;
  email: string;
  instituicaoId: number;
};

export default async function ProfessorAtividadesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?portal=professor");
  }

  let decoded: ProfessorJwtPayload;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as ProfessorJwtPayload;
  } catch {
    redirect("/login?portal=professor");
  }

  if (
    String(decoded.role || "").toUpperCase() !==
    "PROFESSOR"
  ) {
    redirect("/login?portal=professor");
  }

  await validarPaginaProfessor(
    decoded.instituicaoId,
    "professor.atividades"
  );

  return <ProfessorAtividadesClient />;
}