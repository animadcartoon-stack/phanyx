import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { etapasParaMatricula } from "@/lib/matriculas/configuracao-curso";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(req: Request) {
  const user = await getUserFromToken();
  if (!user || !isAdminLike(user.role)) return NextResponse.json({ error: "SEM_PERMISSAO" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("cursoId"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "CURSO_INVALIDO" }, { status: 400 });
  const curso = await prisma.curso.findFirst({ where: { id, instituicaoId: user.instituicaoId },
    select: { id: true, organizacaoCurricular: true, quantidadeEtapas: true } });
  if (!curso) return NextResponse.json({ error: "CURSO_INVALIDO" }, { status: 404 });
  const etapas = await prisma.cursoSemestre.findMany({ where: { cursoId: id, instituicaoId: user.instituicaoId },
    include: { disciplinas: { where: { disciplina: { instituicaoId: user.instituicaoId, ativo: true } }, include: { disciplina: true } } }, orderBy: { numero: "asc" } });
  const disciplinas = curso.organizacaoCurricular === "ANUAL" && !etapas.length
    ? await prisma.disciplina.findMany({ where: { cursoId: id, instituicaoId: user.instituicaoId, ativo: true },
      select: { id: true, nome: true, codigo: true, cargaHoraria: true }, orderBy: { nome: "asc" } }) : [];
  return NextResponse.json(etapasParaMatricula(curso, etapas, disciplinas), { headers: { "Cache-Control": "private, no-store" } });
}
