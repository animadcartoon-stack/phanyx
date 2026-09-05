import {
  OrigemAnaliseStudentSuccess,
} from "@prisma/client";

import {
  obterPainelStudentSuccess,
} from "@/lib/student-success/obter-painel-student-success";

import {
  registrarAnaliseHistorica,
} from "@/lib/student-success/registrar-analise-historica";

const VERSAO_MOTOR =
  "student-success-v1";

type ParametrosReanaliseInstituicao = {
  instituicaoId:
    number;

  origem:
    OrigemAnaliseStudentSuccess;

  executadoPorId?:
    number | null;
};

type ResultadoAlunoReanaliseInstituicao = {
  alunoId:
    number;

  nome:
    string;

  gravou:
    boolean;

  motivo:
    | "NOVO_ESTADO_ACADEMICO"
    | "ESTADO_SEM_ALTERACAO";

  analiseId:
    number;

  origem:
    string | null;

  nivelRisco:
    string;

  pontuacaoRisco:
    number | null;

  coberturaPercentual:
    number;

  analisadoEm:
    string;
};

export type ResultadoReanaliseInstituicaoStudentSuccess = {
  reanalisadoEm:
    string;

  versaoMotor:
    string;

  resumo: {
    monitorados:
      number;

    gravadas:
      number;

    semAlteracao:
      number;

    iniciais:
      number;

    alteracoes:
      number;
  };

  diagnostico:
    Awaited<
      ReturnType<
        typeof obterPainelStudentSuccess
      >
    >["diagnostico"];

  resultados:
    ResultadoAlunoReanaliseInstituicao[];
};

export async function reanalisarInstituicaoStudentSuccess(
  parametros:
    ParametrosReanaliseInstituicao
): Promise<ResultadoReanaliseInstituicaoStudentSuccess> {
  const painel =
    await obterPainelStudentSuccess(
      parametros.instituicaoId
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
    ResultadoAlunoReanaliseInstituicao[] =
    [];

  /*
   * Processamento sequencial proposital.
   *
   * Evita rajadas de operações simultâneas
   * contra o banco e mantém o mesmo padrão
   * já validado pela reanálise manual.
   */
  for (
    const aluno
    of painel.alunos
  ) {
    const registro =
      await registrarAnaliseHistorica({
        instituicaoId:
          parametros.instituicaoId,

        alunoId:
          aluno.alunoId,

        origem:
          parametros.origem,

        executadoPorId:
          parametros
            .executadoPorId ??
          null,

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
        OrigemAnaliseStudentSuccess
          .INICIAL
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

  return {
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
  };
}