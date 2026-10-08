import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TipoResultado =
  | "Aluno"
  | "Professor"
  | "Curso"
  | "Disciplina"
  | "Turma"
  | "Matrícula";

type ResultadoBusca = {
  id: number;
  nome: string;
  tipo: TipoResultado;
  href: string;
};

function hrefBusca(base: string, nome: string) {
  return `${base}?busca=${encodeURIComponent(nome)}`;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const termo = String(searchParams.get("q") || "").trim().slice(0, 80);

    if (termo.length < 2) {
      return NextResponse.json({ resultados: [] });
    }

    const texto = {
      contains: termo,
      mode: "insensitive" as const,
    };

    const [
      alunos,
      professores,
      cursos,
      disciplinas,
      turmas,
      matriculas,
    ] = await Promise.all([
      prisma.aluno.findMany({
        where: {
          instituicaoId,
          OR: [
            { nome: texto },
            { nomeSocial: texto },
            { matricula: texto },
          ],
        },
        select: {
          id: true,
          nome: true,
          nomeSocial: true,
        },
        orderBy: { nome: "asc" },
        take: 2,
      }),

      prisma.professor.findMany({
        where: {
          instituicaoId,
          nome: texto,
        },
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
        take: 2,
      }),

      prisma.curso.findMany({
        where: {
          instituicaoId,
          OR: [
            { nome: texto },
            { codigo: texto },
          ],
        },
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
        take: 2,
      }),

      prisma.disciplina.findMany({
        where: {
          instituicaoId,
          OR: [
            { nome: texto },
            { codigo: texto },
          ],
        },
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
        take: 2,
      }),

      prisma.turma.findMany({
        where: {
          instituicaoId,
          OR: [
            { nome: texto },
            { codigo: texto },
          ],
        },
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
        take: 2,
      }),

      prisma.matricula.findMany({
        where: {
          instituicaoId,
          excluidaEm: null,
          OR: [
            { numeroMatricula: texto },
            {
              aluno: {
                nome: texto,
              },
            },
          ],
        },
        select: {
          id: true,
          numeroMatricula: true,
          aluno: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: { id: "desc" },
        take: 2,
      }),
    ]);

    const resultados: ResultadoBusca[] = [
      ...alunos.map((item) => {
        const nome = item.nomeSocial?.trim() || item.nome;

        return {
          id: item.id,
          nome,
          tipo: "Aluno" as const,
          href: hrefBusca("/admin/alunos", nome),
        };
      }),

      ...professores.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: "Professor" as const,
        href: hrefBusca("/admin/professores", item.nome),
      })),

      ...cursos.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: "Curso" as const,
        href: hrefBusca("/admin/cursos", item.nome),
      })),

      ...disciplinas.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: "Disciplina" as const,
        href: hrefBusca("/admin/disciplinas", item.nome),
      })),

      ...turmas.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: "Turma" as const,
        href: hrefBusca("/admin/turmas", item.nome),
      })),

      ...matriculas.map((item) => {
        const nome =
          item.aluno?.nome ||
          item.numeroMatricula ||
          `Matrícula #${item.id}`;

        return {
          id: item.id,
          nome,
          tipo: "Matrícula" as const,
          href: hrefBusca("/admin/matriculas", nome),
        };
      }),
    ].slice(0, 12);

    return NextResponse.json(
      { resultados },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Erro na busca rápida do dashboard:", error);

    return NextResponse.json(
      { error: "Erro na busca rápida do dashboard." },
      { status: 500 },
    );
  }
}
