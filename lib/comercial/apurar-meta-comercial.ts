import {
  EscopoMetaComercial,
  IndicadorMetaComercial,
  Prisma,
  StatusMatricula,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MetaComercialParaApuracao = {
  id: number;
  instituicaoId: number;
  equipeId: number | null;
  funcionarioId: number | null;
  cursoId: number | null;
  poloId: number | null;
  escopo: EscopoMetaComercial;
  indicador: IndicadorMetaComercial;
  valorAlvo:
  | Prisma.Decimal
  | number
  | string;
  dataInicio: Date;
  dataFim: Date;
};

export type ResultadoApuracaoMetaComercial = {
  valorAlvo: number;
  valorRealizado: number;
  valorRestante: number;
  percentualAtingido: number;
  atingida: boolean;
  unidade:
  | "QUANTIDADE"
  | "VALOR";
  matriculasConsideradas: number;
  pagamentosConsiderados: number;
  membrosEquipeConsiderados: number;
  apuradoEm: string;
};

type ParticipanteMetaApuracao = {
  funcionarioId: number;
  inicioVigencia: Date;
  fimVigencia: Date | null;
};

type MatriculaApuracao = {
  id: number;
  createdAt: Date;
  confirmadaEm: Date | null;
  cursoId: number | null;
  poloId: number | null;
  status: StatusMatricula;
  vendedorResponsavelId:
  | number
  | null;
  leadOrigemId: number | null;
  valorMatricula:
  | Prisma.Decimal
  | null;
  valorMensalidade:
  | Prisma.Decimal
  | null;
  quantidadeParcelas:
  | number
  | null;
  quantidadeMensalidades:
  | number
  | null;
};

const STATUS_MATRICULAS_VALIDAS:
  StatusMatricula[] = [
    StatusMatricula.ATIVA,
    StatusMatricula.A_INICIAR,
    StatusMatricula.CONCLUIDA,
  ];

function numero(
  valor:
    | Prisma.Decimal
    | number
    | string
    | null
    | undefined
) {
  const convertido =
    Number(valor ?? 0);

  return Number.isFinite(
    convertido
  )
    ? convertido
    : 0;
}

function arredondar(
  valor: number,
  casas = 2
) {
  const fator =
    10 ** casas;

  return (
    Math.round(
      (valor +
        Number.EPSILON) *
      fator
    ) / fator
  );
}

function dataComercialMatricula(
  matricula: Pick<
    MatriculaApuracao,
    "confirmadaEm" | "createdAt"
  >
) {
  return (
    matricula.confirmadaEm ??
    matricula.createdAt
  );
}

function participanteValidoNaData(
  participante: ParticipanteMetaApuracao,
  data: Date
) {
  if (
    data.getTime() <
    participante
      .inicioVigencia
      .getTime()
  ) {
    return false;
  }

  if (
    participante.fimVigencia &&
    data.getTime() >
    participante
      .fimVigencia
      .getTime()
  ) {
    return false;
  }

  return true;
}

async function carregarParticipantesMeta(
  meta: MetaComercialParaApuracao
) {
  if (
    meta.escopo !==
    EscopoMetaComercial.EQUIPE
  ) {
    return [] as ParticipanteMetaApuracao[];
  }

  return prisma
    .metaComercialParticipante
    .findMany({
      where: {
        instituicaoId:
          meta.instituicaoId,

        metaId:
          meta.id,

        inicioVigencia: {
          lte: meta.dataFim,
        },

        OR: [
          {
            fimVigencia:
              null,
          },
          {
            fimVigencia: {
              gte:
                meta.dataInicio,
            },
          },
        ],
      },

      select: {
        funcionarioId: true,
        inicioVigencia: true,
        fimVigencia: true,
      },

      orderBy: [
        {
          funcionarioId:
            "asc",
        },
        {
          inicioVigencia:
            "asc",
        },
      ],
    });
}

function pertenceAoEscopo({
  meta,
  matricula,
  participantesMeta,
}: {
  meta: MetaComercialParaApuracao;
  matricula: MatriculaApuracao;
  participantesMeta:
  ParticipanteMetaApuracao[];
}) {
  if (
    meta.escopo ===
    EscopoMetaComercial.INSTITUICAO
  ) {
    return true;
  }

  if (
    meta.escopo ===
    EscopoMetaComercial.FUNCIONARIO
  ) {
    return (
      !!meta.funcionarioId &&
      matricula
        .vendedorResponsavelId ===
      meta.funcionarioId
    );
  }

  if (
    meta.escopo ===
    EscopoMetaComercial.EQUIPE
  ) {
    if (
      !matricula
        .vendedorResponsavelId
    ) {
      return false;
    }

    const dataVenda =
      dataComercialMatricula(
        matricula
      );

    return participantesMeta.some(
      (participante) =>
        participante.funcionarioId ===
        matricula
          .vendedorResponsavelId &&
        participanteValidoNaData(
          participante,
          dataVenda
        )
    );
  }

  return false;
}

function correspondeSegmentacao({
  meta,
  matricula,
}: {
  meta: MetaComercialParaApuracao;
  matricula: MatriculaApuracao;
}) {
  if (
    meta.cursoId &&
    matricula.cursoId !==
    meta.cursoId
  ) {
    return false;
  }

  if (
    meta.poloId &&
    matricula.poloId !==
    meta.poloId
  ) {
    return false;
  }

  return true;
}

function valorVendidoMatricula(
  matricula: MatriculaApuracao
) {
  const valorMatricula =
    numero(
      matricula.valorMatricula
    );

  const valorMensalidade =
    numero(
      matricula.valorMensalidade
    );

  const quantidade =
    Number(
      matricula
        .quantidadeMensalidades ??
      matricula
        .quantidadeParcelas ??
      0
    );

  const quantidadeValida =
    Number.isFinite(
      quantidade
    ) &&
      quantidade > 0
      ? quantidade
      : 0;

  return arredondar(
    valorMatricula +
    valorMensalidade *
    quantidadeValida
  );
}

async function buscarMatriculasPeriodo({
  meta,
  participantesMeta,
}: {
  meta: MetaComercialParaApuracao;
  participantesMeta:
  ParticipanteMetaApuracao[];
}) {
  const idsParticipantesMeta =
    Array.from(
      new Set<number>(
        participantesMeta.map(
          (participante) =>
            participante
              .funcionarioId
        )
      )
    );

  if (
    meta.escopo ===
    EscopoMetaComercial.EQUIPE &&
    idsParticipantesMeta.length ===
    0
  ) {
    return [] as MatriculaApuracao[];
  }

  const where: Prisma.MatriculaWhereInput =
  {
    instituicaoId:
      meta.instituicaoId,

    status: {
      in:
        STATUS_MATRICULAS_VALIDAS,
    },

    ...(meta.cursoId
      ? {
        cursoId:
          meta.cursoId,
      }
      : {}),

    ...(meta.poloId
      ? {
        poloId:
          meta.poloId,
      }
      : {}),

    ...(meta.escopo ===
      EscopoMetaComercial
        .FUNCIONARIO &&
      meta.funcionarioId
      ? {
        vendedorResponsavelId:
          meta.funcionarioId,
      }
      : {}),

    ...(meta.escopo ===
      EscopoMetaComercial
        .EQUIPE
      ? {
        vendedorResponsavelId:
        {
          in:
            idsParticipantesMeta,
        },
      }
      : {}),

    OR: [
      {
        confirmadaEm: {
          gte:
            meta.dataInicio,
          lte:
            meta.dataFim,
        },
      },
      {
        confirmadaEm:
          null,

        createdAt: {
          gte:
            meta.dataInicio,
          lte:
            meta.dataFim,
        },
      },
    ],
  };

  const matriculas =
    await prisma.matricula
      .findMany({
        where,

        select: {
          id: true,
          createdAt: true,
          confirmadaEm: true,
          cursoId: true,
          poloId: true,
          status: true,
          vendedorResponsavelId:
            true,
          leadOrigemId: true,
          valorMatricula: true,
          valorMensalidade: true,
          quantidadeParcelas:
            true,
          quantidadeMensalidades:
            true,
        },
      });

  return matriculas.filter(
    (matricula) =>
      pertenceAoEscopo({
        meta,
        matricula,
        participantesMeta,
      })
  );
}

async function apurarValorRecebido({
  meta,
  participantesMeta,
}: {
  meta: MetaComercialParaApuracao;
  participantesMeta:
  ParticipanteMetaApuracao[];
}) {
  const pagamentos =
    await prisma.pagamento
      .findMany({
        where: {
          instituicaoId:
            meta.instituicaoId,

          pagoEm: {
            gte:
              meta.dataInicio,
            lte:
              meta.dataFim,
          },
        },

        select: {
          valorPago: true,

          lancamento: {
            select: {
              matricula: {
                select: {
                  id: true,
                  createdAt:
                    true,
                  confirmadaEm:
                    true,
                  cursoId:
                    true,
                  poloId:
                    true,
                  status:
                    true,
                  vendedorResponsavelId:
                    true,
                  leadOrigemId:
                    true,
                  valorMatricula:
                    true,
                  valorMensalidade:
                    true,
                  quantidadeParcelas:
                    true,
                  quantidadeMensalidades:
                    true,
                },
              },
            },
          },
        },
      });

  let valorRealizado = 0;
  let pagamentosConsiderados =
    0;

  const matriculasIds =
    new Set<number>();

  for (
    const pagamento of
    pagamentos
  ) {
    const matricula =
      pagamento.lancamento
        .matricula as
      | MatriculaApuracao
      | null;

    if (!matricula) {
      continue;
    }

    if (
      !STATUS_MATRICULAS_VALIDAS.includes(
        matricula.status
      )
    ) {
      continue;
    }

    if (
      !correspondeSegmentacao({
        meta,
        matricula,
      })
    ) {
      continue;
    }

    if (
      !pertenceAoEscopo({
        meta,
        matricula,
        participantesMeta,
      })
    ) {
      continue;
    }

    valorRealizado +=
      numero(
        pagamento.valorPago
      );

    pagamentosConsiderados +=
      1;

    matriculasIds.add(
      matricula.id
    );
  }

  return {
    valorRealizado:
      arredondar(
        valorRealizado
      ),

    pagamentosConsiderados,

    matriculasConsideradas:
      matriculasIds.size,
  };
}

function montarResultado({
  meta,
  valorRealizado,
  matriculasConsideradas,
  pagamentosConsiderados,
  membrosEquipeConsiderados,
}: {
  meta: MetaComercialParaApuracao;
  valorRealizado: number;
  matriculasConsideradas: number;
  pagamentosConsiderados: number;
  membrosEquipeConsiderados: number;
}): ResultadoApuracaoMetaComercial {
  const valorAlvo =
    numero(meta.valorAlvo);

  const valorRealizadoFinal =
    arredondar(
      valorRealizado
    );

  const valorRestante =
    arredondar(
      Math.max(
        valorAlvo -
        valorRealizadoFinal,
        0
      )
    );

  const percentualAtingido =
    valorAlvo > 0
      ? arredondar(
        (
          valorRealizadoFinal /
          valorAlvo
        ) * 100
      )
      : 0;

  const unidade =
    meta.indicador ===
      IndicadorMetaComercial
        .VALOR_VENDIDO ||
      meta.indicador ===
      IndicadorMetaComercial
        .VALOR_RECEBIDO
      ? "VALOR"
      : "QUANTIDADE";

  return {
    valorAlvo:
      arredondar(valorAlvo),

    valorRealizado:
      valorRealizadoFinal,

    valorRestante,

    percentualAtingido,

    atingida:
      valorRealizadoFinal >=
      valorAlvo,

    unidade,

    matriculasConsideradas,

    pagamentosConsiderados,

    membrosEquipeConsiderados,

    apuradoEm:
      new Date().toISOString(),
  };
}

export async function apurarMetaComercial(
  meta: MetaComercialParaApuracao
): Promise<ResultadoApuracaoMetaComercial> {
  const participantesMeta =
    await carregarParticipantesMeta(
      meta
    );

  const participantesUnicos =
    new Set<number>(
      participantesMeta.map(
        (participante) =>
          participante.funcionarioId
      )
    ).size;

  if (
    meta.indicador ===
    IndicadorMetaComercial
      .VALOR_RECEBIDO
  ) {
    const resultado =
      await apurarValorRecebido({
        meta,
        participantesMeta,
      });

    return montarResultado({
      meta,

      valorRealizado:
        resultado
          .valorRealizado,

      matriculasConsideradas:
        resultado
          .matriculasConsideradas,

      pagamentosConsiderados:
        resultado
          .pagamentosConsiderados,

      membrosEquipeConsiderados:
        participantesUnicos,
    });
  }

  const matriculas =
    await buscarMatriculasPeriodo({
      meta,
      participantesMeta,
    });

  let valorRealizado = 0;

  if (
    meta.indicador ===
    IndicadorMetaComercial
      .QUANTIDADE_MATRICULAS
  ) {
    valorRealizado =
      matriculas.length;
  }

  if (
    meta.indicador ===
    IndicadorMetaComercial
      .LEADS_CONVERTIDOS
  ) {
    valorRealizado =
      matriculas.filter(
        (matricula) =>
          matricula
            .leadOrigemId !==
          null
      ).length;
  }

  if (
    meta.indicador ===
    IndicadorMetaComercial
      .VALOR_VENDIDO
  ) {
    valorRealizado =
      matriculas.reduce(
        (
          total,
          matricula
        ) =>
          total +
          valorVendidoMatricula(
            matricula
          ),
        0
      );
  }

  return montarResultado({
    meta,

    valorRealizado,

    matriculasConsideradas:
      matriculas.length,

    pagamentosConsiderados:
      0,

    membrosEquipeConsiderados:
      participantesUnicos,
  });
}