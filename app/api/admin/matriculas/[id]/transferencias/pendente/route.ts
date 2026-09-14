import { NextResponse } from "next/server";
import { StatusTransferenciaMatricula } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Sem permissao.",
        },
        {
          status: 403,
        }
      );
    }

    const matriculaId =
      Number(params.id);

    if (
      !Number.isInteger(
        matriculaId
      ) ||
      matriculaId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Matricula invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const transferencia =
      await prisma
        .transferenciaMatricula
        .findFirst({
          where: {
            matriculaId,

            instituicaoId:
              user.instituicaoId,

            status:
              StatusTransferenciaMatricula.PENDENTE,
          },

          orderBy: {
            id: "desc",
          },

          select: {
            id: true,
            tipo: true,
            status: true,

            dataTransferencia:
              true,

            motivo: true,
            observacoes: true,

            poloOrigemId: true,
            poloOrigemNomeSnapshot:
              true,

            poloDestinoId: true,
            poloDestinoNomeSnapshot:
              true,

            turmaOrigemId: true,
            turmaOrigemNomeSnapshot:
              true,

            turmaDestinoId: true,
            turmaDestinoNomeSnapshot:
              true,

            cursoDestinoId: true,
            cursoDestinoNomeSnapshot:
              true,

            createdAt: true,

            itens: {
              orderBy: {
                id: "asc",
              },

              select: {
                id: true,

                itemMatriculaOrigemId:
                  true,

                itemMatriculaDestinoId:
                  true,

                disciplinaId:
                  true,

                disciplinaNomeSnapshot:
                  true,

                turmaOrigemId:
                  true,

                turmaOrigemNomeSnapshot:
                  true,

                turmaDestinoId:
                  true,

                statusOrigem:
                  true,

                statusDestino:
                  true,

                situacao:
                  true,
              },
            },
          },
        });

    return NextResponse.json({
      success: true,
      transferencia,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar transferencia pendente:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nao foi possivel consultar a transferencia pendente.",
      },
      {
        status: 500,
      }
    );
  }
}
