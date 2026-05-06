import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALOR_DISCIPLINA = 110;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const instituicaoId = Number(searchParams.get("instituicaoId") || 1);
    const cursoIdParam = searchParams.get("cursoId");
    const cursoId = cursoIdParam ? Number(cursoIdParam) : null;

    if (!Number.isFinite(instituicaoId) || instituicaoId <= 0) {
      return NextResponse.json(
        { error: "Instituição inválida." },
        { status: 400 }
      );
    }

    const curso = await prisma.curso.findFirst({
      where: {
        instituicaoId,
        ativo: true,
        ...(cursoId
          ? { id: cursoId }
          : {
              nome: {
                contains: "Bacharel Livre em Teologia",
                mode: "insensitive",
              },
            }),
      },
      include: {
        semestres: {
          orderBy: { numero: "asc" },
          include: {
            disciplinas: {
              include: {
                disciplina: {
                  include: {
                    prerequisitosDaDisciplina: {
                      include: {
                        prerequisito: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!curso) {
      return NextResponse.json({
        curso: null,
        modulos: [],
      });
    }

    const disciplinasDiretas = await prisma.disciplina.findMany({
      where: {
        instituicaoId,
        cursoId: curso.id,
        ativo: true,
        semestre: {
          not: null,
        },
      },
      include: {
        prerequisitosDaDisciplina: {
          include: {
            prerequisito: true,
          },
        },
      },
      orderBy: [
        { semestre: "asc" },
        { nome: "asc" },
      ],
    });

    const modulos = curso.semestres.map((semestre) => {
      const disciplinasVinculadas = semestre.disciplinas.map(
        (item) => item.disciplina
      );

      const idsVinculadas = new Set(disciplinasVinculadas.map((d) => d.id));

      const disciplinasPorSemestre = disciplinasDiretas.filter(
        (disciplina) =>
          Number(disciplina.semestre) === Number(semestre.numero) &&
          !idsVinculadas.has(disciplina.id)
      );

      const todasDoModulo = [
        ...disciplinasVinculadas,
        ...disciplinasPorSemestre,
      ];

      return {
        id: semestre.id,
        numero: semestre.numero,
        titulo: semestre.titulo || `Módulo ${semestre.numero}`,
        descricao: semestre.descricao,
        disciplinas: todasDoModulo
          .map((disciplina) => ({
            id: disciplina.id,
            nome: disciplina.nome,
            descricao: disciplina.descricao,
            cargaHoraria: disciplina.cargaHoraria,
            valor: VALOR_DISCIPLINA,
            prerequisitos: disciplina.prerequisitosDaDisciplina.map((pre) => ({
              id: pre.prerequisito.id,
              nome: pre.prerequisito.nome,
            })),
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      };
    });

    return NextResponse.json({
      curso: {
        id: curso.id,
        nome: curso.nome,
        descricao: curso.descricao,
      },
      modulos,
    });
  } catch (error) {
    console.error("Erro ao buscar disciplinas do checkout:", error);

    return NextResponse.json(
      { error: "Erro ao buscar disciplinas" },
      { status: 500 }
    );
  }
}