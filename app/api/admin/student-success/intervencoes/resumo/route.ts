import {
  NextResponse,
} from "next/server";

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

export async function GET() {
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

    const intervencoes =
      await prisma
        .studentSuccessIntervencao
        .findMany({
          where: {
            instituicaoId,
          },

          select: {
            id:
              true,

            alunoId:
              true,

            status:
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
              item.criadoEm.getTime();

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