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

const TIPOS_VALIDOS = [
  "CONTATO",
  "ORIENTACAO",
  "REUNIAO",
  "ENCAMINHAMENTO",
  "ACOMPANHAMENTO",
  "OUTRO",
] as const;

const CANAIS_VALIDOS = [
  "WHATSAPP",
  "LIGACAO",
  "EMAIL",
  "PRESENCIAL",
  "VIDEOCHAMADA",
  "SISTEMA",
  "OUTRO",
] as const;

const STATUS_VALIDOS = [
  "REGISTRADA",
  "AGUARDANDO_RETORNO",
  "EM_ACOMPANHAMENTO",
  "RESOLVIDA",
  "CANCELADA",
] as const;

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

/* =========================================================
   GET
   Histórico de intervenções de um aluno
   ========================================================= */

export async function GET(
  request: NextRequest
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

    const alunoIdTexto =
      request.nextUrl
        .searchParams
        .get(
          "alunoId"
        );

    const alunoId =
      Number(
        alunoIdTexto
      );

    if (
      !Number.isInteger(
        alunoId
      ) ||
      alunoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Aluno inválido",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Garante o isolamento
     * por instituição.
     */
    const aluno =
      await prisma.aluno.findFirst({
        where: {
          id:
            alunoId,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id:
            true,

          nome:
            true,
        },
      });

    if (!aluno) {
      return NextResponse.json(
        {
          error:
            "Aluno não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const intervencoes =
      await prisma
        .studentSuccessIntervencao
        .findMany({
          where: {
            instituicaoId:
              user.instituicaoId,

            alunoId:
              aluno.id,
          },

          orderBy: {
            criadoEm:
              "desc",
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

            /* Fotografia no registro */

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

            /* Fotografia no encerramento */

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

            /* Datas */

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

      aluno: {
        id:
          aluno.id,

        nome:
          aluno.nome,
      },

      intervencoes,
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_INTERVENCOES_GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar intervenções",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   Registra uma nova intervenção
   ========================================================= */

export async function POST(
  request: NextRequest
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

    const body =
      await request.json();

    /* -----------------------------------------------------
       ALUNO
       ----------------------------------------------------- */

    const alunoId =
      Number(
        body?.alunoId
      );

    if (
      !Number.isInteger(
        alunoId
      ) ||
      alunoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Aluno inválido",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       TIPO / CANAL / STATUS
       ----------------------------------------------------- */

    const tipo =
      String(
        body?.tipo ?? ""
      ).toUpperCase();

    const canal =
      String(
        body?.canal ?? ""
      ).toUpperCase();

    const status =
      String(
        body?.status ??
          "REGISTRADA"
      ).toUpperCase();

    if (
      !TIPOS_VALIDOS.includes(
        tipo as
          typeof TIPOS_VALIDOS[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Tipo de intervenção inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !CANAIS_VALIDOS.includes(
        canal as
          typeof CANAIS_VALIDOS[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Canal de intervenção inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !STATUS_VALIDOS.includes(
        status as
          typeof STATUS_VALIDOS[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Status de intervenção inválido",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       OBSERVAÇÃO
       ----------------------------------------------------- */

    const observacao =
      String(
        body?.observacao ??
          ""
      ).trim();

    if (
      observacao.length <
      3
    ) {
      return NextResponse.json(
        {
          error:
            "Informe uma observação",
        },
        {
          status: 400,
        }
      );
    }

    if (
      observacao.length >
      5000
    ) {
      return NextResponse.json(
        {
          error:
            "Observação muito longa",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       CONFIRMA O ALUNO NA INSTITUIÇÃO
       ----------------------------------------------------- */

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          id:
            alunoId,

          instituicaoId:
            user.instituicaoId,

          ativo:
            true,
        },

        select: {
          id:
            true,

          nome:
            true,
        },
      });

    if (!aluno) {
      return NextResponse.json(
        {
          error:
            "Aluno não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       RETORNO
       ----------------------------------------------------- */

    let retornoEm:
      | Date
      | null =
      null;

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

    /* =====================================================
       FOTOGRAFIA ACADÊMICA NO MOMENTO DO REGISTRO
       ===================================================== */

    const nivelRisco =
      String(
        body
          ?.analise
          ?.nivel ??
          "DADOS_INSUFICIENTES"
      );

    const cobertura =
      Number(
        body
          ?.analise
          ?.coberturaPercentual ??
          0
      );

    const confiabilidade =
      String(
        body
          ?.analise
          ?.confiabilidade ??
          "BAIXA"
      );

    const pontuacaoRecebida =
      body
        ?.analise
        ?.pontuacao;

    const pontuacao =
      nivelRisco ===
      "DADOS_INSUFICIENTES"
        ? null
        : Number.isFinite(
            Number(
              pontuacaoRecebida
            )
          )
        ? Math.round(
            Number(
              pontuacaoRecebida
            )
          )
        : null;

    const fatores =
      Array.isArray(
        body
          ?.analise
          ?.fatoresPrincipais
      )
        ? body
            .analise
            .fatoresPrincipais
        : [];

    /*
     * Os indicadores são uma fotografia
     * dos valores acadêmicos naquele momento.
     */
    const indicadores =
      body?.indicadores &&
      typeof body.indicadores ===
        "object" &&
      !Array.isArray(
        body.indicadores
      )
        ? body.indicadores
        : null;

    const coberturaNormalizada =
      Number.isFinite(
        cobertura
      )
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                cobertura
              )
            )
          )
        : 0;

    /* =====================================================
       CRIA A INTERVENÇÃO
       ===================================================== */

    const intervencao =
      await prisma
        .studentSuccessIntervencao
        .create({
          data: {
            instituicaoId:
              user.instituicaoId,

            alunoId:
              aluno.id,

            criadoPorId:
              user.id,

            tipo:
              tipo as
                typeof TIPOS_VALIDOS[number],

            canal:
              canal as
                typeof CANAIS_VALIDOS[number],

            status:
              status as
                typeof STATUS_VALIDOS[number],

            observacao,

            retornoEm,

            /* Fotografia inicial */

            nivelRiscoNoRegistro:
              nivelRisco,

            pontuacaoNoRegistro:
              pontuacao,

            coberturaNoRegistro:
              coberturaNormalizada,

            confiabilidadeNoRegistro:
              confiabilidade,

            fatoresNoRegistro:
              fatores,

            /*
             * Para Json? usamos undefined
             * quando nenhum objeto foi recebido.
             * Assim evitamos conflito com
             * JsonNull/DbNull do Prisma.
             */
            indicadoresNoRegistro:
              indicadores ??
              undefined,
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

            /* Fotografia no registro */

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

            /* Encerramento ainda estará vazio */

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

            /* Datas */

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

    return NextResponse.json(
      {
        ok:
          true,

        intervencao,
      },
      {
        status: 201,
      }
    );
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_INTERVENCOES_POST]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao registrar intervenção",
      },
      {
        status: 500,
      }
    );
  }
}