import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

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
    /* =====================================================
       AUTENTICAÇÃO
       ===================================================== */

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

    const acesso =
  await verificarAcessoStudentSuccess(
    user,
    "GERENCIAR"
  );

if (
  acesso.permitido ===
  false
) {
  return NextResponse.json(
    {
      error:
        acesso.motivo,
    },
    {
      status: 403,
    }
  );
}

const instituicaoId =
  acesso.instituicaoId;

    /* =====================================================
       INTERVENÇÃO
       ===================================================== */

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

    /*
     * Importante:
     * a intervenção precisa pertencer
     * à mesma instituição do usuário.
     */
    const atual =
      await prisma
        .studentSuccessIntervencao
        .findFirst({
          where: {
            id:
              intervencaoId,

            instituicaoId:
              instituicaoId,
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

    /* =====================================================
       STATUS
       ===================================================== */

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

    /* =====================================================
       RESULTADO
       ===================================================== */

    let resultado:
      | string
      | null =
      atual.resultado;

    if (
      Object.prototype
        .hasOwnProperty.call(
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
     * Uma intervenção resolvida
     * precisa explicar o resultado.
     *
     * Uma intervenção cancelada
     * precisa explicar o motivo.
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

    /* =====================================================
       DATA DE RETORNO
       ===================================================== */

    let retornoEm:
      | Date
      | null =
      atual.retornoEm;

    if (
      Object.prototype
        .hasOwnProperty.call(
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

    /* =====================================================
       SITUAÇÃO DE ENCERRAMENTO
       ===================================================== */

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
      /*
       * Se ainda não tinha sido encerrada,
       * registra o momento da conclusão.
       */
      if (
        !concluidoEm
      ) {
        concluidoEm =
          new Date();
      }
    }
    else {
      /*
       * Se foi reaberta,
       * deixa de ser considerada concluída.
       */
      concluidoEm =
        null;
    }

    /* =====================================================
       FOTOGRAFIA ACADÊMICA ATUAL
       ===================================================== */

    const analiseAtual =
      body?.analiseAtual &&
      typeof body.analiseAtual ===
        "object" &&
      !Array.isArray(
        body.analiseAtual
      )
        ? body.analiseAtual
        : null;

    const indicadoresAtuais =
      body?.indicadoresAtuais &&
      typeof body.indicadoresAtuais ===
        "object" &&
      !Array.isArray(
        body.indicadoresAtuais
      )
        ? body.indicadoresAtuais
        : null;

    let nivelRiscoNoEncerramento:
      string | null =
      atual.nivelRiscoNoEncerramento;

    let pontuacaoNoEncerramento:
      number | null =
      atual.pontuacaoNoEncerramento;

    let coberturaNoEncerramento:
      number | null =
      atual.coberturaNoEncerramento;

    let confiabilidadeNoEncerramento:
      string | null =
      atual.confiabilidadeNoEncerramento;

    let fatoresNoEncerramento:
      Prisma.InputJsonValue |
      typeof Prisma.DbNull =
      Prisma.DbNull;

    let indicadoresNoEncerramento:
      Prisma.InputJsonValue |
      typeof Prisma.DbNull =
      Prisma.DbNull;

    /*
     * Quando a intervenção é encerrada,
     * congelamos uma segunda fotografia
     * acadêmica do aluno.
     */
    if (encerrada) {
      if (!analiseAtual) {
        return NextResponse.json(
          {
            error:
              "Análise acadêmica atual não informada",
          },
          {
            status: 400,
          }
        );
      }

      nivelRiscoNoEncerramento =
        String(
          analiseAtual.nivel ??
            "DADOS_INSUFICIENTES"
        );

      const pontuacaoAtual =
        Number(
          analiseAtual.pontuacao
        );

      pontuacaoNoEncerramento =
        nivelRiscoNoEncerramento ===
        "DADOS_INSUFICIENTES"
          ? null
          : Number.isFinite(
              pontuacaoAtual
            )
          ? Math.round(
              pontuacaoAtual
            )
          : null;

      const coberturaAtual =
        Number(
          analiseAtual
            .coberturaPercentual
        );

      coberturaNoEncerramento =
        Number.isFinite(
          coberturaAtual
        )
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  coberturaAtual
                )
              )
            )
          : 0;

      confiabilidadeNoEncerramento =
        String(
          analiseAtual
            .confiabilidade ??
            "BAIXA"
        );

      fatoresNoEncerramento =
        Array.isArray(
          analiseAtual
            .fatoresPrincipais
        )
          ? analiseAtual
              .fatoresPrincipais as Prisma.InputJsonValue
          : [];

      indicadoresNoEncerramento =
        indicadoresAtuais
          ? indicadoresAtuais as Prisma.InputJsonValue
          : Prisma.DbNull;
    }
    else {
      /*
       * Se a intervenção for reaberta,
       * apagamos a fotografia antiga
       * de encerramento.
       *
       * Uma nova fotografia será gravada
       * quando ela for encerrada novamente.
       */
      nivelRiscoNoEncerramento =
        null;

      pontuacaoNoEncerramento =
        null;

      coberturaNoEncerramento =
        null;

      confiabilidadeNoEncerramento =
        null;

      fatoresNoEncerramento =
        Prisma.DbNull;

      indicadoresNoEncerramento =
        Prisma.DbNull;
    }

    /* =====================================================
       ATUALIZA
       ===================================================== */

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

            nivelRiscoNoEncerramento,

            pontuacaoNoEncerramento,

            coberturaNoEncerramento,

            confiabilidadeNoEncerramento,

            fatoresNoEncerramento,

            indicadoresNoEncerramento,
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

            /* Fotografia inicial */

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

            indicadoresNoRegistro:
              true,

            /* Fotografia de encerramento */

            nivelRiscoNoEncerramento:
              true,

            pontuacaoNoEncerramento:
              true,

            coberturaNoEncerramento:
              true,

            confiabilidadeNoEncerramento:
              true,

            fatoresNoEncerramento:
              true,

            indicadoresNoEncerramento:
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