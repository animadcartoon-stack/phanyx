import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  provaPertenceAoProfessor,
} from "@/lib/services/provaProfessor.service";

export async function POST(
  _req: NextRequest,
  ctx: {
    params: {
      provaId: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      String(user.role).toUpperCase() !==
        "PROFESSOR"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permiss\u00e3o",
        },
        {
          status: 403,
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

    const provaId =
      Number(
        ctx.params.provaId
      );

    if (
      !Number.isFinite(
        provaId
      ) ||
      provaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Prova inv\u00e1lida",
        },
        {
          status: 400,
        }
      );
    }

    let prova: any;

    try {
      prova =
        await provaPertenceAoProfessor({
          provaId,

          professorId:
            professor.id,

          instituicaoId:
            user.instituicaoId,
        });
    }
    catch {
      return NextResponse.json(
        {
          error:
            "Prova n\u00e3o encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      prova.status ===
      "ENCERRADA"
    ) {
      return NextResponse.json(
        {
          error:
            "Uma prova encerrada n\u00e3o pode ser publicada novamente.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      prova.status ===
        "PUBLICADA" &&
      prova.ativa === true
    ) {
      return NextResponse.json(
        {
          error:
            "A prova j\u00e1 est\u00e1 publicada.",
        },
        {
          status: 400,
        }
      );
    }

    const questoes =
      await prisma.questao.findMany({
        where: {
          provaId,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          tipo: true,
          valor: true,

          alternativas: {
            select: {
              id: true,
              correta: true,
            },
          },
        },
      });

    if (
      questoes.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Adicione ao menos 1 quest\u00e3o antes de publicar.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Impede publicar questao objetiva
     * sem alternativas ou sem resposta
     * correta definida.
     */
    const objetivaInvalida =
      questoes.find(
        (questao) =>
          questao.tipo ===
            "multipla_escolha" &&
          (
            questao.alternativas.length <
              2 ||
            !questao.alternativas.some(
              (alternativa) =>
                alternativa.correta
            )
          )
      );

    if (objetivaInvalida) {
      return NextResponse.json(
        {
          error:
            "Todas as quest\u00f5es de m\u00faltipla escolha precisam ter alternativas e ao menos uma resposta correta.",
        },
        {
          status: 400,
        }
      );
    }

    const agora =
      new Date();

    const updated =
      await prisma.prova.update({
        where: {
          id: provaId,
        },

        data: {
          ativa:
            true,

          status:
            "PUBLICADA",

          publicadaAt:
            agora,

          encerradaAt:
            null,
        },

        include: {
          disciplina:
            true,

          turma: {
            include: {
              disciplinas: {
                include: {
                  disciplina:
                    true,
                },
              },
            },
          },

          questoes: {
            select: {
              id: true,
            },
          },
        },
      });

    return NextResponse.json({
      ...updated,

      totalQuestoes:
        updated.questoes.length,
    });
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao publicar prova",
      },
      {
        status: 500,
      }
    );
  }
}
