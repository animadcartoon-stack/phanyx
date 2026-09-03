import crypto from "node:crypto";

import {
  OrigemAnaliseStudentSuccess,
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

type IndicadoresStudentSuccess = {
  frequenciaPercentual:
  | number
  | null;

  quantidadeAulas:
  number;

  mediaPercentual:
  | number
  | null;

  quantidadeAvaliacoes:
  number;

  atividadesVencidas:
  number;

  totalAtividadesConsideradas:
  number;

  mediaAnteriorPercentual:
  | number
  | null;

  mediaRecentePercentual:
  | number
  | null;

  quedaDesempenhoPercentual:
  | number
  | null;
};

type ComponenteAnaliseHistorica = {
  codigo:
  string;

  titulo?:
  string;

  pontos:
  number;

  maximo:
  number;

  disponivel:
  boolean;

  detalhe?:
  string;
};

type AnaliseHistorica = {
  nivel:
  string;

  pontuacao:
  number;

  pontuacaoBruta:
  number;

  maximoDisponivel:
  number;

  coberturaPercentual:
  number;

  confiabilidade:
  string;

  componentes:
  ComponenteAnaliseHistorica[];

  fatoresPrincipais:
  ComponenteAnaliseHistorica[];
};

type RegistrarAnaliseHistoricaParams = {
  instituicaoId:
  number;

  alunoId:
  number;

  origem?:
  OrigemAnaliseStudentSuccess;

  executadoPorId?:
  number |
  null;

  versaoMotor?:
  string;

  analise:
  AnaliseHistorica;

  indicadores:
  IndicadoresStudentSuccess;
};

function jsonPrisma(
  valor:
    unknown
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return Prisma.JsonNull;
  }

  return valor as Prisma.InputJsonValue;
}

/*
 * Gera uma representação estável
 * do estado acadêmico.
 *
 * Não usamos textos como título/detalhe
 * na assinatura, pois uma tradução ou
 * alteração editorial não deve criar
 * uma nova fotografia acadêmica.
 */
function gerarAssinaturaEstado(
  params: {
    versaoMotor:
    string;

    analise:
    AnaliseHistorica;

    indicadores:
    IndicadoresStudentSuccess;
  }
) {
  const componentes =
    [...params.analise.componentes]
      .map(
        (
          componente
        ) => ({
          codigo:
            componente.codigo,

          pontos:
            componente.pontos,

          maximo:
            componente.maximo,

          disponivel:
            componente.disponivel,
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          a.codigo.localeCompare(
            b.codigo
          )
      );

  const estado = {
    versaoMotor:
      params.versaoMotor,

    analise: {
      nivel:
        params.analise.nivel,

      pontuacao:
        params.analise.pontuacao,

      pontuacaoBruta:
        params.analise.pontuacaoBruta,

      maximoDisponivel:
        params.analise.maximoDisponivel,

      coberturaPercentual:
        params.analise.coberturaPercentual,

      confiabilidade:
        params.analise.confiabilidade,

      componentes,
    },

    indicadores: {
      frequenciaPercentual:
        params.indicadores
          .frequenciaPercentual,

      quantidadeAulas:
        params.indicadores
          .quantidadeAulas,

      mediaPercentual:
        params.indicadores
          .mediaPercentual,

      quantidadeAvaliacoes:
        params.indicadores
          .quantidadeAvaliacoes,

      atividadesVencidas:
        params.indicadores
          .atividadesVencidas,

      totalAtividadesConsideradas:
        params.indicadores
          .totalAtividadesConsideradas,

      mediaAnteriorPercentual:
        params.indicadores
          .mediaAnteriorPercentual,

      mediaRecentePercentual:
        params.indicadores
          .mediaRecentePercentual,

      quedaDesempenhoPercentual:
        params.indicadores
          .quedaDesempenhoPercentual,
    },
  };

  return crypto
    .createHash(
      "sha256"
    )
    .update(
      JSON.stringify(
        estado
      )
    )
    .digest(
      "hex"
    );
}

export async function registrarAnaliseHistorica(
  params:
    RegistrarAnaliseHistoricaParams
) {
  const versaoMotor =
    params.versaoMotor ??
    "v1";

  const assinaturaEstado =
    gerarAssinaturaEstado({
      versaoMotor,

      analise:
        params.analise,

      indicadores:
        params.indicadores,
    });

  /*
   * Buscamos somente a fotografia mais recente.
   *
   * Estados antigos podem se repetir no futuro:
   *
   * ATENÇÃO → NORMAL → ATENÇÃO
   *
   * O terceiro estado deve ser gravado.
   */
  const ultimaAnalise =
    await prisma
      .studentSuccessAnaliseHistorico
      .findFirst({
        where: {
          instituicaoId:
            params.instituicaoId,

          alunoId:
            params.alunoId,
        },

        orderBy: [
          {
            analisadoEm:
              "desc",
          },

          {
            id:
              "desc",
          },
        ],

        select: {
          id:
            true,

          assinaturaEstado:
            true,

          analisadoEm:
            true,
        },
      });

  /*
   * Não gravamos duas fotografias
   * consecutivas idênticas.
   */
  if (
    ultimaAnalise
      ?.assinaturaEstado ===
    assinaturaEstado
  ) {
    return {
      gravou:
        false,

      motivo:
        "ESTADO_SEM_ALTERACAO" as const,

      analiseId:
        ultimaAnalise.id,

      analisadoEm:
        ultimaAnalise.analisadoEm,
    };
  }

  const registro =
    await prisma
      .studentSuccessAnaliseHistorico
      .create({
        data: {
          instituicaoId:
            params.instituicaoId,

          alunoId:
            params.alunoId,

          origem:
            ultimaAnalise
              ? (
                params.origem ??
                OrigemAnaliseStudentSuccess.AUTOMATICA
              )
              : OrigemAnaliseStudentSuccess.INICIAL,

          executadoPorId:
            params.executadoPorId ??
            null,

          versaoMotor,

          nivelRisco:
            params.analise.nivel,

          /*
           * Quando há dados insuficientes,
           * a pontuação normalizada não deve
           * ser interpretada como risco válido.
           */
          pontuacaoRisco:
            params.analise.nivel ===
              "DADOS_INSUFICIENTES"
              ? null
              : params.analise
                .pontuacao,

          pontuacaoBruta:
            params.analise
              .pontuacaoBruta,

          maximoDisponivel:
            params.analise
              .maximoDisponivel,

          coberturaPercentual:
            params.analise
              .coberturaPercentual,

          confiabilidade:
            params.analise
              .confiabilidade,

          componentes:
            jsonPrisma(
              params.analise
                .componentes
            ),

          fatoresPrincipais:
            jsonPrisma(
              params.analise
                .fatoresPrincipais
            ),

          indicadores:
            jsonPrisma(
              params.indicadores
            ),

          assinaturaEstado,
        },

        select: {
          id:
            true,

          origem:
            true,

          versaoMotor:
            true,

          nivelRisco:
            true,

          pontuacaoRisco:
            true,

          coberturaPercentual:
            true,

          confiabilidade:
            true,

          analisadoEm:
            true,
        },
      });

  return {
    gravou:
      true,

    motivo:
      "NOVO_ESTADO_ACADEMICO" as const,

    analiseId:
      registro.id,

    analisadoEm:
      registro.analisadoEm,

    registro,
  };
}