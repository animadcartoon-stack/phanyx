import {
  OrigemAnaliseStudentSuccess,
} from "@prisma/client";

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
 * acompanhar a versão utilizada pela
 * reanálise manual.
 */
const VERSAO_MOTOR =
  "student-success-v1";

type ParametrosReanaliseAlteracaoAcademica = {
  instituicaoId:
    number;

  alunoIds:
    number[];

  executadoPorId?:
    number | null;
};

type ResultadoAlunoReanaliseAlteracaoAcademica = {
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

export type ResultadoReanaliseAlteracaoAcademica = {
  solicitados:
    number;

  encontrados:
    number;

  gravadas:
    number;

  semAlteracao:
    number;

  alunoIdsNaoEncontrados:
    number[];

  resultados:
    ResultadoAlunoReanaliseAlteracaoAcademica[];
};

export async function solicitarReanalisePorAlteracaoAcademica(
  parametros:
    ParametrosReanaliseAlteracaoAcademica
): Promise<ResultadoReanaliseAlteracaoAcademica> {
  const alunoIds =
    Array.from(
      new Set(
        parametros.alunoIds
          .filter(
            (
              alunoId
            ) =>
              Number.isInteger(
                alunoId
              ) &&
              alunoId > 0
          )
      )
    );

  if (
    alunoIds.length ===
    0
  ) {
    return {
      solicitados:
        0,

      encontrados:
        0,

      gravadas:
        0,

      semAlteracao:
        0,

      alunoIdsNaoEncontrados:
        [],

      resultados:
        [],
    };
  }

  /*
   * Calculamos o painel uma única vez.
   *
   * Isso é especialmente importante
   * para chamadas em lote, como o
   * lançamento de presenças de uma aula.
   */
  const painel =
    await obterPainelStudentSuccess(
      parametros.instituicaoId
    );

  const idsSolicitados =
    new Set(
      alunoIds
    );

  const alunosAfetados =
    painel.alunos.filter(
      (
        aluno
      ) =>
        idsSolicitados.has(
          aluno.alunoId
        )
    );

  const idsEncontrados =
    new Set(
      alunosAfetados.map(
        (
          aluno
        ) =>
          aluno.alunoId
      )
    );

  const alunoIdsNaoEncontrados =
    alunoIds.filter(
      (
        alunoId
      ) =>
        !idsEncontrados.has(
          alunoId
        )
    );

  let gravadas =
    0;

  let semAlteracao =
    0;

  const resultados:
    ResultadoAlunoReanaliseAlteracaoAcademica[] =
    [];

  /*
   * Mantemos o processamento sequencial
   * pelo mesmo motivo da reanálise manual:
   * evitar rajadas de operações simultâneas
   * contra o banco.
   */
  for (
    const aluno
    of alunosAfetados
  ) {
    const registro =
      await registrarAnaliseHistorica({
        instituicaoId:
          parametros.instituicaoId,

        alunoId:
          aluno.alunoId,

        origem:
          OrigemAnaliseStudentSuccess
            .ALTERACAO_ACADEMICA,

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
    solicitados:
      alunoIds.length,

    encontrados:
      alunosAfetados.length,

    gravadas,

    semAlteracao,

    alunoIdsNaoEncontrados,

    resultados,
  };
}