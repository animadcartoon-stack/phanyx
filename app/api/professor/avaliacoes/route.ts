import {
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  montarFiltroProvasProfessor,
} from "@/lib/services/provaProfessor.service";

export async function GET() {
  const user =
    await getUserFromToken();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "N\u00e3o autenticado",
      },
      {
        status: 401,
      }
    );
  }

  const professor =
    await prisma.professor.findFirst({
      where: {
        userId:
          user.id,

        instituicaoId:
          user.instituicaoId,
      },

      select: {
        id: true,
      },
    });

  if (!professor) {
    return NextResponse.json(
      {
        error:
          "Professor n\u00e3o encontrado",
      },
      {
        status: 404,
      }
    );
  }

  const filtroProvas =
    await montarFiltroProvasProfessor({
      professorId:
        professor.id,

      instituicaoId:
        user.instituicaoId,
    });

  const tentativas =
    await prisma
      .tentativaProva
      .findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          prova:
            filtroProvas,
        },

        include: {
          aluno: {
            include: {
              user: true,
            },
          },

          prova: true,
        },

        orderBy: {
          finishedAt:
            "desc",
        },
      });

  const resultado =
    tentativas.map(
      (tentativa) => ({
        tentativaId:
          tentativa.id,

        aluno:
          tentativa.aluno
            .user.nome ??
          tentativa.aluno
            .user.email,

        prova:
          tentativa.prova
            .titulo,

        nota:
          tentativa.notaFinal,

        /*
         * Mantida a regra existente.
         * A media minima sera auditada
         * separadamente.
         */
        status:
          tentativa.notaFinal ==
          null
            ? "PENDENTE"
            : tentativa.notaFinal >=
                7
              ? "APROVADO"
              : "REPROVADO",
      })
    );

  return NextResponse.json(
    resultado
  );
}
