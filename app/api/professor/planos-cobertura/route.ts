import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function dataAulaValida(valor: unknown): Date | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(`${valor}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== valor ? null : d;
}
function texto(valor: unknown, limite: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}
function materiaisValidos(valor: unknown): string[] | null {
  const entrada = typeof valor === "string" ? valor : "";
  const links = entrada.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  if (links.length > 10 || entrada.length > 4500) return null;
  for (const link of links) {
    try { const url = new URL(link); if (!["https:", "http:"].includes(url.protocol) || link.length > 450) return null; }
    catch { return null; }
  }
  return links;
}
async function identidade() {
  const user = await getUserFromToken();
  if (!user || user.role !== "PROFESSOR" || !user.instituicaoId || user.impersonacao) return null;
  const professor = await prisma.professor.findFirst({
    where: { userId: user.id, instituicaoId: user.instituicaoId, ativo: true }, select: { id: true },
  });
  return professor ? { instituicaoId: user.instituicaoId, professorId: professor.id } : null;
}
const vinculoTitular = (professorId: number) => ({
  OR: [
    { professorId },
    { turma: { professorId } },
    { disciplina: { professorId } },
    { disciplina: { professoresHabilitados: { some: { professorId } } } },
  ],
});

export async function GET() {
  const ctx = await identidade();
  if (!ctx) return NextResponse.json({ error: "Acesso docente não autorizado." }, { status: 403 });
  const [vinculos, planos] = await Promise.all([
    prisma.turmaDisciplina.findMany({
      where: { instituicaoId: ctx.instituicaoId, ...vinculoTitular(ctx.professorId) },
      select: { turmaId: true, disciplinaId: true, turma: { select: { nome: true } }, disciplina: { select: { nome: true } } },
      orderBy: { turmaId: "asc" },
    }),
    prisma.planoCoberturaDocente.findMany({
      where: { instituicaoId: ctx.instituicaoId, professorTitularId: ctx.professorId },
      orderBy: { criadoEm: "desc" }, take: 50,
      include: { turma: { select: { nome: true } }, disciplina: { select: { nome: true } }, substituicaoDocente: { select: { professorSubstituto: { select: { nome: true } } } } },
    }),
  ]);
  return NextResponse.json({ vinculos, planos }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const ctx = await identidade();
  if (!ctx) return NextResponse.json({ error: "Acesso docente não autorizado." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const turmaId = Number(body?.turmaId), disciplinaId = Number(body?.disciplinaId);
  const dataAula = dataAulaValida(body?.dataAula);
  const titulo = texto(body?.titulo, 150);
  const orientacoes = texto(body?.orientacoes, 6000);
  const materiais = materiaisValidos(body?.materiais);
  if (![turmaId, disciplinaId].every(n => Number.isSafeInteger(n) && n > 0) || !dataAula || !titulo || !orientacoes || !materiais) {
    return NextResponse.json({ error: "Informe turma, disciplina, data, título, orientações e links válidos." }, { status: 400 });
  }
  const autorizado = await prisma.turmaDisciplina.findFirst({
    where: { instituicaoId: ctx.instituicaoId, turmaId, disciplinaId, ...vinculoTitular(ctx.professorId) }, select: { id: true },
  });
  if (!autorizado) return NextResponse.json({ error: "Turma/disciplina não vinculada ao docente." }, { status: 403 });
  const duplicado = await prisma.planoCoberturaDocente.findFirst({
    where: { instituicaoId: ctx.instituicaoId, professorTitularId: ctx.professorId, turmaId, disciplinaId, dataAula }, select: { id: true },
  });
  if (duplicado) return NextResponse.json({ error: "Já existe plano para essa data, turma e disciplina. Edite o registro devolvido, se necessário." }, { status: 409 });
  try {
    const plano = await prisma.planoCoberturaDocente.create({ data: {
      instituicaoId: ctx.instituicaoId, professorTitularId: ctx.professorId,
      turmaId, disciplinaId, dataAula, titulo, orientacoes, materiais: materiais.join("\n") || null, status: "ENVIADO",
    } });
    return NextResponse.json({ plano, message: "Plano enviado à coordenação para organizar a cobertura." }, { status: 201 });
  } catch (error) {
    console.error("PLANO_COBERTURA_CRIAR", error);
    return NextResponse.json({ error: "Não foi possível registrar o plano; confira se já existe outro para esta data." }, { status: 409 });
  }
}

export async function PATCH(req: Request) {
  const ctx = await identidade();
  if (!ctx) return NextResponse.json({ error: "Acesso docente não autorizado." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const titulo = texto(body?.titulo, 150);
  const orientacoes = texto(body?.orientacoes, 6000);
  const materiais = materiaisValidos(body?.materiais);
  if (!Number.isSafeInteger(id) || id <= 0 || !titulo || !orientacoes || !materiais)
    return NextResponse.json({ error: "Preencha os dados para reenviar o plano." }, { status: 400 });
  const alterado = await prisma.planoCoberturaDocente.updateMany({
    where: { id, instituicaoId: ctx.instituicaoId, professorTitularId: ctx.professorId, status: "DEVOLVIDO", substituicaoDocenteId: null },
    data: { titulo, orientacoes, materiais: materiais.join("\n") || null, status: "ENVIADO", devolutiva: null },
  });
  if (alterado.count !== 1) return NextResponse.json({ error: "Somente um plano devolvido pode ser reenviado." }, { status: 409 });
  return NextResponse.json({ message: "Plano reenviado à coordenação." });
}
