import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const instituicaoId = 1; // IBE

    const curso = await prisma.curso.findFirst({
      where: {
        instituicaoId,
        nome: {
          contains: "Bacharel Livre em Teologia",
          mode: "insensitive",
        },
        ativo: true,
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
      return NextResponse.json([]);
    }

    const modulos = curso.semestres.map((semestre) => ({
      id: semestre.id,
      numero: semestre.numero,
      titulo: semestre.titulo || `Módulo ${semestre.numero}`,
      descricao: semestre.descricao,
      disciplinas: semestre.disciplinas
        .map((item) => ({
          id: item.disciplina.id,
          nome: item.disciplina.nome,
          descricao: item.disciplina.descricao,
          cargaHoraria: item.disciplina.cargaHoraria,
          valor: 120,
          prerequisitos: item.disciplina.prerequisitosDaDisciplina.map(
            (pre) => ({
              id: pre.prerequisito.id,
              nome: pre.prerequisito.nome,
            })
          ),
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    }));

    return NextResponse.json({
      curso: {
        id: curso.id,
        nome: curso.nome,
        descricao: curso.descricao,
      },
      modulos,
    });
  } catch (error) {
    console.error("Erro ao buscar disciplinas IBE:", error);

    return NextResponse.json(
      { error: "Erro ao buscar disciplinas" },
      { status: 500 }
    );
  }
}