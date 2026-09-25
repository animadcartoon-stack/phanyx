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
  {
    params,
  }: {
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
        params.provaId
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
      prova.status !==
        "PUBLICADA" ||
      prova.ativa !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Somente uma prova publicada pode voltar para rascunho.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Depois que um aluno iniciou a prova,
     * voltar para rascunho poderia alterar
     * uma avaliacao em andamento/historica.
     */
    const tentativas =
      await prisma.tentativaProva.count({
        where: {
          provaId,

          instituicaoId:
            user.instituicaoId,
        },
      });

    if (
      tentativas > 0
    ) {
      return NextResponse.json(
        {
          error:
            "N\u00e3o \u00e9 poss\u00edvel despublicar uma prova que j\u00e1 possui tentativas.",
        },
        {
          status: 409,
        }
      );
    }

    const updated =
      await prisma.prova.update({
        where: {
          id: provaId,
        },

        data: {
          ativa:
            false,

          status:
            "RASCUNHO",

          publicadaAt:
            null,

          encerradaAt:
            null,
        },
      });

    return NextResponse.json(
      updated
    );
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao despublicar prova",
      },
      {
        status: 500,
      }
    );
  }
}
