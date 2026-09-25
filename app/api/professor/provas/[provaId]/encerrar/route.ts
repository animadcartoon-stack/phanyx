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
            "A prova j\u00e1 est\u00e1 encerrada.",
        },
        {
          status: 400,
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
            "Somente uma prova publicada pode ser encerrada.",
        },
        {
          status: 400,
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
            "ENCERRADA",

          encerradaAt:
            new Date(),
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
          "Erro ao encerrar prova",
      },
      {
        status: 500,
      }
    );
  }
}
