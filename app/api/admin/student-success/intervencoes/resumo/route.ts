import {
  NextRequest,
  NextResponse,
} from "next/server";

import type {
  Prisma,
  StatusIntervencaoStudentSuccess,
  TipoIntervencaoStudentSuccess,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  avaliarEvolucaoIntervencao,
} from "@/lib/student-success/avaliar-evolucao-intervencao";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

const AMOSTRA_MINIMA_EFETIVIDADE =
  5;

const STATUS_VALIDOS =
  [
    "REGISTRADA",
    "AGUARDANDO_RETORNO",
    "EM_ACOMPANHAMENTO",
    "RESOLVIDA",
    "CANCELADA",
  ] as const;

const TIPOS_VALIDOS =
  [
    "CONTATO",
    "ORIENTACAO",
    "REUNIAO",
    "ENCAMINHAMENTO",
    "ACOMPANHAMENTO",
    "OUTRO",
  ] as const;

function valorPermitido<
  T extends
  readonly string[]
>(
  valor:
    string,
  opcoes:
    T
): valor is T[number] {
  return (
    opcoes as
    readonly string[]
  ).includes(
    valor
  );
}

function arredondar(
  valor:
    number,
  casas =
    1
) {
  const fator =
    10 **
    casas;

  return (
    Math.round(
      valor *
      fator
    ) /
    fator
  );
}

export async function GET(
  request:
    NextRequest
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

    const acesso =
      await verificarAcessoStudentSuccess(
        user,
        "VER"
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

    /*
     * FILTROS
     *
     * O frontend enviará:
     *
     * status
     * tipo
     * inicio
     * fim
     *
     * As datas são enviadas em ISO já
     * considerando o horário local do
     * usuário.
     *
     * Exemplo:
     *
     * ?status=RESOLVIDA
     * &tipo=CONTATO
     * &inicio=2026-08-01T03:00:00.000Z
     * &fim=2026-09-01T03:00:00.000Z
     */

    const parametros =
      request.nextUrl
        .searchParams;

    const status =
      parametros
        .get(
          "status"
        )
        ?.trim() ||
      null;

    const tipo =
      parametros
        .get(
          "tipo"
        )
        ?.trim() ||
      null;

    const inicioTexto =
      parametros
        .get(
          "inicio"
        )
        ?.trim() ||
      null;

    const fimTexto =
      parametros
        .get(
          "fim"
        )
        ?.trim() ||
      null;

    /*
     * STATUS
     */

    if (
      status &&
      !valorPermitido(
        status,
        STATUS_VALIDOS
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

    /*
     * TIPO
     */

    if (
      tipo &&
      !valorPermitido(
        tipo,
        TIPOS_VALIDOS
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

    /*
     * PERÍODO
     *
     * O fim é exclusivo.
     *
     * Exemplo:
     *
     * início de 02/09
     * até início de 03/09
     *
     * representa todo o dia 02/09.
     */

    let inicio:
      Date |
      null =
      null;

    let fim:
      Date |
      null =
      null;

    if (
      inicioTexto
    ) {
      const data =
        new Date(
          inicioTexto
        );

      if (
        Number.isNaN(
          data.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Data inicial inválida",
          },
          {
            status: 400,
          }
        );
      }

      inicio =
        data;
    }

    if (
      fimTexto
    ) {
      const data =
        new Date(
          fimTexto
        );

      if (
        Number.isNaN(
          data.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Data final inválida",
          },
          {
            status: 400,
          }
        );
      }

      fim =
        data;
    }

    if (
      inicio &&
      fim &&
      fim.getTime() <=
      inicio.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "O fim do período deve ser posterior ao início",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * WHERE
     */

    const where:
      Prisma.StudentSuccessIntervencaoWhereInput =
    {
      instituicaoId,
    };

    if (
      status
    ) {
      where.status =
        status as
        StatusIntervencaoStudentSuccess;
    }

    if (
      tipo
    ) {
      where.tipo =
        tipo as
        TipoIntervencaoStudentSuccess;
    }

    if (
      inicio ||
      fim
    ) {
      where.criadoEm =
        {};

      if (
        inicio
      ) {
        where.criadoEm.gte =
          inicio;
      }

      if (
        fim
      ) {
        where.criadoEm.lt =
          fim;
      }
    }

    const intervencoes =
      await prisma
        .studentSuccessIntervencao
        .findMany({
          where,

          select: {
            id:
              true,

            alunoId:
              true,

            status:
              true,

            tipo:
              true,

            criadoEm:
              true,

            concluidoEm:
              true,

            nivelRiscoNoRegistro:
              true,

            pontuacaoNoRegistro:
              true,

            indicadoresNoRegistro:
              true,

            nivelRiscoNoEncerramento:
              true,

            pontuacaoNoEncerramento:
              true,

            indicadoresNoEncerramento:
              true,
          },
        });

    /*
     * ACOMPANHAMENTO
     */

    const registradas =
      intervencoes.filter(
        (
          item
        ) =>
          item.status ===
          "REGISTRADA"
      ).length;

    const aguardandoRetorno =
      intervencoes.filter(
        (
          item
        ) =>
          item.status ===
          "AGUARDANDO_RETORNO"
      ).length;

    const emAcompanhamento =
      intervencoes.filter(
        (
          item
        ) =>
          item.status ===
          "EM_ACOMPANHAMENTO"
      ).length;

    const resolvidas =
      intervencoes.filter(
        (
          item
        ) =>
          item.status ===
          "RESOLVIDA"
      );

    const canceladas =
      intervencoes.filter(
        (
          item
        ) =>
          item.status ===
          "CANCELADA"
      ).length;

    const abertas =
      registradas +
      aguardandoRetorno +
      emAcompanhamento;

    /*
     * EFETIVIDADE
     */

    let evolucaoPositiva =
      0;

    let evolucaoNegativa =
      0;

    let evolucaoNeutra =
      0;

    let naoMensuravel =
      0;

    const alunosPiora =
      new Set<number>();

    for (
      const intervencao
      of resolvidas
    ) {
      const resultado =
        avaliarEvolucaoIntervencao({
          nivelRiscoNoRegistro:
            intervencao
              .nivelRiscoNoRegistro,

          pontuacaoNoRegistro:
            intervencao
              .pontuacaoNoRegistro,

          indicadoresNoRegistro:
            intervencao
              .indicadoresNoRegistro,

          nivelRiscoNoEncerramento:
            intervencao
              .nivelRiscoNoEncerramento,

          pontuacaoNoEncerramento:
            intervencao
              .pontuacaoNoEncerramento,

          indicadoresNoEncerramento:
            intervencao
              .indicadoresNoEncerramento,
        });

      if (
        resultado
          .classificacao ===
        "POSITIVA"
      ) {
        evolucaoPositiva +=
          1;
      }
      else if (
        resultado
          .classificacao ===
        "NEGATIVA"
      ) {
        evolucaoNegativa +=
          1;

        alunosPiora.add(
          intervencao
            .alunoId
        );
      }
      else if (
        resultado
          .classificacao ===
        "NEUTRA"
      ) {
        evolucaoNeutra +=
          1;
      }
      else {
        naoMensuravel +=
          1;
      }
    }

    const resolvidasMensuraveis =
      evolucaoPositiva +
      evolucaoNegativa +
      evolucaoNeutra;

    const amostraSuficiente =
      resolvidasMensuraveis >=
      AMOSTRA_MINIMA_EFETIVIDADE;

    const percentualEvolucaoPositiva =
      amostraSuficiente
        ? arredondar(
          (
            evolucaoPositiva /
            resolvidasMensuraveis
          ) *
          100,
          1
        )
        : null;

    /*
     * TEMPO MÉDIO DE RESOLUÇÃO
     */

    const duracoesEmDias =
      resolvidas
        .filter(
          (
            item
          ) =>
            item.concluidoEm
        )
        .map(
          (
            item
          ) => {
            const inicio =
              item
                .criadoEm
                .getTime();

            const fim =
              item
                .concluidoEm!
                .getTime();

            return Math.max(
              0,
              (
                fim -
                inicio
              ) /
              (
                1000 *
                60 *
                60 *
                24
              )
            );
          }
        );

    const tempoMedioResolucaoDias =
      duracoesEmDias.length >
        0
        ? arredondar(
          duracoesEmDias.reduce(
            (
              acumulado,
              valor
            ) =>
              acumulado +
              valor,
            0
          ) /
          duracoesEmDias.length,
          3
        )
        : null;

    return NextResponse.json({
      ok:
        true,

      /*
       * Retornamos também os filtros
       * aplicados. Isso ajuda a validar
       * o comportamento da API e poderá
       * ser útil no frontend.
       */
      filtros: {
        status,

        tipo,

        inicio:
          inicio
            ?.toISOString() ??
          null,

        fim:
          fim
            ?.toISOString() ??
          null,
      },

      acompanhamento: {
        total:
          intervencoes.length,

        abertas,

        registradas,

        aguardandoRetorno,

        emAcompanhamento,

        resolvidas:
          resolvidas.length,

        canceladas,
      },

      efetividade: {
        resolvidasMensuraveis,

        evolucaoPositiva,

        evolucaoNegativa,

        evolucaoNeutra,

        naoMensuravel,

        percentualEvolucaoPositiva,

        tempoMedioResolucaoDias,

        alunosComPiora:
          alunosPiora.size,

        amostraSuficiente,

        amostraMinima:
          AMOSTRA_MINIMA_EFETIVIDADE,
      },
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_INTERVENCOES_RESUMO]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar resumo das intervenções",
      },
      {
        status: 500,
      }
    );
  }
}