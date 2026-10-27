import { incluirGradeOferta } from "@/lib/academico/integridade-ofertas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(request?: Request) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const cursos = await prisma.curso.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      ...(request && new URL(request.url).searchParams.get("somenteAtivos") === "1"
        ? { ativo: true, excluidoEm: null } : {}),
    },
    include: request && new URL(request.url).searchParams.get("gradeOferta") === "1"
      ? incluirGradeOferta(user.instituicaoId) : undefined,
    orderBy: {
      nome: "asc",
    },
  });

  return NextResponse.json(cursos);
}
