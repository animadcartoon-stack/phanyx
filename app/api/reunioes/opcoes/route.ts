import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const [funcionarios, professores, alunos, turmas, cursos, departamentos] =
  await Promise.all([
        prisma.funcionario.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            ativo: true,
            user: { ativo: true },
          },
          include: { user: true },
          orderBy: { nome: "asc" },
        }),

        prisma.professor.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            ativo: true,
            user: { ativo: true },
          },
          include: { user: true },
          orderBy: { nome: "asc" },
        }),

        prisma.aluno.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            ativo: true,
          },
          include: { user: true },
          orderBy: { nome: "asc" },
          take: 200,
        }),

        prisma.turma.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            ativa: true,
          },
          orderBy: { nome: "asc" },
        }),

        prisma.curso.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            ativo: true,
          },
          orderBy: { nome: "asc" },
        }),

        prisma.departamento.findMany({
  where: {
    instituicaoId: user.instituicaoId,
  },
  orderBy: { nome: "asc" },
}),

      ]);

    const setores: string[] = Array.from(
  new Set([
    ...departamentos.map((d) => d.nome),
    ...funcionarios
      .map((f) => f.setor)
      .filter((setor): setor is string => Boolean(setor?.trim())),
  ].filter(Boolean))
);

setores.sort((a, b) => a.localeCompare(b, "pt-BR"));

    return NextResponse.json({
      setores,
      funcionarios: funcionarios.map((f) => ({
        id: f.id,
        userId: f.userId,
        nome: f.nome,
        email: f.user?.email || null,
        telefone: f.telefone || null,
        setor: f.setor || null,
        role: f.user?.role || "FUNCIONARIO",
      })),
      professores: professores.map((p) => ({
        id: p.id,
        userId: p.userId,
        nome: p.nome,
        email: p.user?.email || null,
        telefone: p.telefone || null,
        role: "PROFESSOR",
      })),
      alunos: alunos.map((a) => ({
        id: a.id,
        userId: a.userId,
        nome: a.nome,
        email: a.user?.email || null,
        telefone: a.telefone || null,
        matricula: a.matricula || null,
        role: "ALUNO",
      })),
      turmas: turmas.map((t) => ({
        id: t.id,
        nome: t.nome,
        semestre: t.semestre,
        periodoLetivo: t.periodoLetivo || null,
      })),
      cursos: cursos.map((c) => ({
        id: c.id,
        nome: c.nome,
        codigo: c.codigo || null,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao carregar opções de reuniões:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao carregar opções de reuniões" },
      { status: 500 }
    );
  }
}