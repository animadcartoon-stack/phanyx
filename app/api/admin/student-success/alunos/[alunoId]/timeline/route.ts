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

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

import {
  avaliarEvolucaoIntervencao,
} from "@/lib/student-success/avaliar-evolucao-intervencao";

type ContextoRota = {
  params: {
    alunoId:
      string;
  };
};

type EventoTimeline = {
  id:
    string;

  tipo:
    | "INTERVENCAO_REGISTRADA"
    | "RETORNO_AGENDADO"
    | "INTERVENCAO_ENCERRADA";

  data:
    string;

  intervencaoId:
    number;

  tipoIntervencao:
    string;

  canal:
    string;

  status:
    string;

  observacao:
    string | null;

  resultado:
    string | null;

  risco: {
    nivel:
      string | null;

    pontuacao:
      number | null;

    cobertura:
      number | null;

    confiabilidade:
      string | null;
  } | null;

  indicadores:
    unknown;

  evolucao:
    ReturnType<
      typeof avaliarEvolucaoIntervencao
    > | null;
};

export async function GET(
  request:
    NextRequest,
  contexto:
    ContextoRota
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

    const alunoId =
      Number(
        contexto.params
          .alunoId
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
     * Confirma que o aluno pertence
     * à instituição autorizada.
     */
    const aluno =
      await prisma.aluno
        .findFirst({
          where: {
            id:
              alunoId,

            instituicaoId,
          },

          select: {
            id:
              true,

            nome:
              true,

            matricula:
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

    /*
     * Usamos apenas dados realmente
     * persistidos nas intervenções.
     */
    const intervencoes =
      await prisma
        .studentSuccessIntervencao
        .findMany({
          where: {
            instituicaoId,

            alunoId,
          },

          orderBy: {
            criadoEm:
              "asc",
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

            resultado:
              true,

            retornoEm:
              true,

            criadoEm:
              true,

            concluidoEm:
              true,

            nivelRiscoNoRegistro:
              true,

            pontuacaoNoRegistro:
              true,

            coberturaNoRegistro:
              true,

            confiabilidadeNoRegistro:
              true,

            indicadoresNoRegistro:
              true,

            nivelRiscoNoEncerramento:
              true,

            pontuacaoNoEncerramento:
              true,

            coberturaNoEncerramento:
              true,

            confiabilidadeNoEncerramento:
              true,

            indicadoresNoEncerramento:
              true,
          },
        });

    const eventos:
      EventoTimeline[] =
      [];

    for (
      const intervencao
      of intervencoes
    ) {
      /*
       * 1. REGISTRO DA INTERVENÇÃO
       */
      eventos.push({
        id:
          `intervencao-${intervencao.id}-registro`,

        tipo:
          "INTERVENCAO_REGISTRADA",

        data:
          intervencao
            .criadoEm
            .toISOString(),

        intervencaoId:
          intervencao.id,

        tipoIntervencao:
          intervencao.tipo,

        canal:
          intervencao.canal,

        status:
          intervencao.status,

        observacao:
          intervencao
            .observacao,

        resultado:
          null,

        risco: {
          nivel:
            intervencao
              .nivelRiscoNoRegistro,

          pontuacao:
            intervencao
              .pontuacaoNoRegistro,

          cobertura:
            intervencao
              .coberturaNoRegistro,

          confiabilidade:
            intervencao
              .confiabilidadeNoRegistro,
        },

        indicadores:
          intervencao
            .indicadoresNoRegistro,

        evolucao:
          null,
      });

      /*
       * 2. RETORNO PROGRAMADO
       *
       * Isso representa a agenda conhecida
       * atualmente. Não afirmamos que houve
       * contato nessa data.
       */
      if (
        intervencao.retornoEm
      ) {
        eventos.push({
          id:
            `intervencao-${intervencao.id}-retorno`,

          tipo:
            "RETORNO_AGENDADO",

          data:
            intervencao
              .retornoEm
              .toISOString(),

          intervencaoId:
            intervencao.id,

          tipoIntervencao:
            intervencao.tipo,

          canal:
            intervencao.canal,

          status:
            intervencao.status,

          observacao:
            intervencao
              .observacao,

          resultado:
            null,

          risco:
            null,

          indicadores:
            null,

          evolucao:
            null,
        });
      }

      /*
       * 3. ENCERRAMENTO
       */
      if (
        intervencao.concluidoEm
      ) {
        const evolucao =
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

        eventos.push({
          id:
            `intervencao-${intervencao.id}-encerramento`,

          tipo:
            "INTERVENCAO_ENCERRADA",

          data:
            intervencao
              .concluidoEm
              .toISOString(),

          intervencaoId:
            intervencao.id,

          tipoIntervencao:
            intervencao.tipo,

          canal:
            intervencao.canal,

          status:
            intervencao.status,

          observacao:
            intervencao
              .observacao,

          resultado:
            intervencao
              .resultado,

          risco: {
            nivel:
              intervencao
                .nivelRiscoNoEncerramento,

            pontuacao:
              intervencao
                .pontuacaoNoEncerramento,

            cobertura:
              intervencao
                .coberturaNoEncerramento,

            confiabilidade:
              intervencao
                .confiabilidadeNoEncerramento,
          },

          indicadores:
            intervencao
              .indicadoresNoEncerramento,

          evolucao,
        });
      }
    }

    /*
     * Timeline mais recente primeiro.
     */
    eventos.sort(
      (
        a,
        b
      ) =>
        new Date(
          b.data
        ).getTime() -
        new Date(
          a.data
        ).getTime()
    );

    return NextResponse.json({
      ok:
        true,

      aluno,

      resumo: {
        intervencoes:
          intervencoes.length,

        eventos:
          eventos.length,

        abertas:
          intervencoes.filter(
            (
              item
            ) =>
              item.status ===
                "REGISTRADA" ||
              item.status ===
                "AGUARDANDO_RETORNO" ||
              item.status ===
                "EM_ACOMPANHAMENTO"
          ).length,

        encerradas:
          intervencoes.filter(
            (
              item
            ) =>
              item.status ===
                "RESOLVIDA" ||
              item.status ===
                "CANCELADA"
          ).length,
      },

      eventos,
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_ALUNO_TIMELINE]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar histórico do aluno",
      },
      {
        status: 500,
      }
    );
  }
}