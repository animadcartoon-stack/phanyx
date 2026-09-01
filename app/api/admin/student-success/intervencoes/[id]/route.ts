import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

const STATUS_VALIDOS = [
  "REGISTRADA",
  "AGUARDANDO_RETORNO",
  "EM_ACOMPANHAMENTO",
  "RESOLVIDA",
  "CANCELADA",
] as const;

type StatusIntervencao =
  typeof STATUS_VALIDOS[number];

function usuarioAdmin(
  role:
    | string
    | null
    | undefined
) {
  const normalizado =
    String(
      role ?? ""
    ).toUpperCase();

  return (
    normalizado ===
      "ADMIN" ||
    normalizado ===
      "SUPER_ADMIN"
  );
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !usuarioAdmin(
        user.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão",
        },
        {
          status: 403,
        }
      );
    }

    const intervencaoId =
      Number(
        context.params.id
      );

    if (
      !Number.isInteger(
        intervencaoId
      ) ||
      intervencaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Intervenção inválida",
        },
        {
          status: 400,
        }
      );
    }

    const atual =
      await prisma
        .studentSuccessIntervencao
        .findFirst({
          where: {
            id:
              intervencaoId,

            instituicaoId:
              user.instituicaoId,
          },
        });

    if (!atual) {
      return NextResponse.json(
        {
          error:
            "Intervenção não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const statusRecebido =
      body?.status !==
        undefined
        ? String(
            body.status
          ).toUpperCase()
        : atual.status;

    if (
      !STATUS_VALIDOS.includes(
        statusRecebido as
          StatusIntervencao
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Status inválido",
        },
        {
          status: 400,
        }
      );
    }

    const status =
      statusRecebido as
        StatusIntervencao;

    let resultado:
      | string
      | null =
      atual.resultado;

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "resultado"
      )
    ) {
      const texto =
        String(
          body?.resultado ??
            ""
        ).trim();

      resultado =
        texto ||
        null;
    }

    /*
     * Uma intervenção encerrada precisa
     * registrar o resultado da atuação.
     */
    if (
      (
        status ===
          "RESOLVIDA" ||
        status ===
          "CANCELADA"
      ) &&
      (
        !resultado ||
        resultado.length <
          3
      )
    ) {
      return NextResponse.json(
        {
          error:
            status ===
            "RESOLVIDA"
              ? "Informe o resultado da intervenção"
              : "Informe o motivo do cancelamento",
        },
        {
          status: 400,
        }
      );
    }

    if (
      resultado &&
      resultado.length >
        5000
    ) {
      return NextResponse.json(
        {
          error:
            "Resultado muito longo",
        },
        {
          status: 400,
        }
      );
    }

    let retornoEm:
      | Date
      | null =
      atual.retornoEm;

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "retornoEm"
      )
    ) {
      if (
        body?.retornoEm
      ) {
        const data =
          new Date(
            body.retornoEm
          );

        if (
          Number.isNaN(
            data.getTime()
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Data de retorno inválida",
            },
            {
              status: 400,
            }
          );
        }

        retornoEm =
          data;
      }
      else {
        retornoEm =
          null;
      }
    }

    const encerrada =
      status ===
        "RESOLVIDA" ||
      status ===
        "CANCELADA";

    let concluidoEm:
      | Date
      | null =
      atual.concluidoEm;

    if (encerrada) {
      if (
        !concluidoEm
      ) {
        concluidoEm =
          new Date();
      }
    }
    else {
      /*
       * Se a intervenção for reaberta,
       * deixa de ser considerada concluída.
       */
      concluidoEm =
        null;
    }

    const atualizada =
      await prisma
        .studentSuccessIntervencao
        .update({
          where: {
            id:
              atual.id,
          },

          data: {
            status,
            resultado,
            retornoEm,
            concluidoEm,
          },

          select: {
            id:
              true,

            tipo:
              true,

            canal:
              true,

            status:
              true,

            observacao:
              true,

            retornoEm:
              true,

            resultado:
              true,

            nivelRiscoNoRegistro:
              true,

            pontuacaoNoRegistro:
              true,

            coberturaNoRegistro:
              true,

            confiabilidadeNoRegistro:
              true,

            fatoresNoRegistro:
              true,

            criadoEm:
              true,

            atualizadoEm:
              true,

            concluidoEm:
              true,

            criadoPor: {
              select: {
                id:
                  true,

                nome:
                  true,

                email:
                  true,
              },
            },
          },
        });

    return NextResponse.json({
      ok:
        true,

      intervencao:
        atualizada,
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_INTERVENCAO_PATCH]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar intervenção",
      },
      {
        status: 500,
      }
    );
  }
}