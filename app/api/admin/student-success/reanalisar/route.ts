import {
  NextResponse,
} from "next/server";

import {
  OrigemAnaliseStudentSuccess,
} from "@prisma/client";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

import {
  obterPainelStudentSuccess,
} from "@/lib/student-success/obter-painel-student-success";

import {
  registrarAnaliseHistorica,
} from "@/lib/student-success/registrar-analise-historica";

/*
 * Sempre que as regras matemáticas
 * do motor forem alteradas de forma
 * significativa, esta versão deverá
 * ser incrementada.
 */
const VERSAO_MOTOR =
  "student-success-v1";

export async function POST() {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "UNAUTHORIZED",
        },
        {
          status:
            401,
        }
      );
    }

    /*
     * Reanalisar e persistir histórico
     * é uma operação de gestão.
     *
     * Permissão somente de leitura
     * não é suficiente.
     */
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
          status:
            403,
        }
      );
    }

    const instituicaoId =
      acesso.instituicaoId;

    /*
     * Utilizamos exatamente o mesmo cálculo
     * acadêmico usado pelo dashboard.
     */
    const painel =
      await obterPainelStudentSuccess(
        instituicaoId
      );

    let gravadas =
      0;

    let semAlteracao =
      0;

    let iniciais =
      0;

    let alteracoes =
      0;

    const resultados:
      Array<{
        alunoId:
          number;

        nome:
          string;

        gravou:
          boolean;

        motivo:
          "NOVO_ESTADO_ACADEMICO" |
          "ESTADO_SEM_ALTERACAO";

        analiseId:
          number;

        origem:
          string |
          null;

        nivelRisco:
          string;

        pontuacaoRisco:
          number |
          null;

        coberturaPercentual:
          number;

        analisadoEm:
          string;
      }> =
      [];

    /*
     * Nesta primeira versão processamos
     * sequencialmente.
     *
     * É deliberado: evita disparar muitas
     * operações simultâneas contra o banco
     * enquanto validamos o fluxo.
     */
    for (
      const aluno
      of painel.alunos
    ) {
      const registro =
        await registrarAnaliseHistorica({
          instituicaoId,

          alunoId:
            aluno.alunoId,

          origem:
            OrigemAnaliseStudentSuccess.MANUAL,

          executadoPorId:
            user.id,

          versaoMotor:
            VERSAO_MOTOR,

          analise:
            aluno.analise,

          indicadores:
            aluno.indicadores,
        });

      if (
        registro.gravou
      ) {
        gravadas +=
          1;

        if (
          registro.registro
            .origem ===
          OrigemAnaliseStudentSuccess.INICIAL
        ) {
          iniciais +=
            1;
        }
        else {
          alteracoes +=
            1;
        }

        resultados.push({
          alunoId:
            aluno.alunoId,

          nome:
            aluno.nome,

          gravou:
            true,

          motivo:
            registro.motivo,

          analiseId:
            registro.analiseId,

          origem:
            registro.registro
              .origem,

          nivelRisco:
            registro.registro
              .nivelRisco,

          pontuacaoRisco:
            registro.registro
              .pontuacaoRisco,

          coberturaPercentual:
            registro.registro
              .coberturaPercentual,

          analisadoEm:
            registro.analisadoEm
              .toISOString(),
        });

        continue;
      }

      semAlteracao +=
        1;

      resultados.push({
        alunoId:
          aluno.alunoId,

        nome:
          aluno.nome,

        gravou:
          false,

        motivo:
          registro.motivo,

        analiseId:
          registro.analiseId,

        origem:
          null,

        nivelRisco:
          aluno.analise.nivel,

        pontuacaoRisco:
          aluno.analise.nivel ===
            "DADOS_INSUFICIENTES"
            ? null
            : aluno.analise
                .pontuacao,

        coberturaPercentual:
          aluno.analise
            .coberturaPercentual,

        analisadoEm:
          registro.analisadoEm
            .toISOString(),
      });
    }

    return NextResponse.json({
      ok:
        true,

      reanalisadoEm:
        new Date()
          .toISOString(),

      versaoMotor:
        VERSAO_MOTOR,

      resumo: {
        monitorados:
          painel.alunos.length,

        gravadas,

        semAlteracao,

        iniciais,

        alteracoes,
      },

      diagnostico:
        painel.diagnostico,

      resultados,
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_REANALISAR]",
      error
    );

    return NextResponse.json(
      {
        error:
          "STUDENT_SUCCESS_REANALYSIS_ERROR",
      },
      {
        status:
          500,
      }
    );
  }
}