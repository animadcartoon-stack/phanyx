import { randomUUID } from "node:crypto";

import {
  Prisma,
  StatusMatricula,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temPermissao,
  type UsuarioLogado,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const STATUS_TRANCAMENTO = {
  RASCUNHO: "RASCUNHO",
  CONFIRMADO: "CONFIRMADO",
  ENCERRADO: "ENCERRADO",
  CANCELADO: "CANCELADO",
} as const;

const UNIDADE_TRANCAMENTO = {
  DIAS: "DIAS",
  MESES: "MESES",
  SEMESTRES: "SEMESTRES",
  INDETERMINADO: "INDETERMINADO",
} as const;

type UnidadeTrancamentoValor =
  (typeof UNIDADE_TRANCAMENTO)[
    keyof typeof UNIDADE_TRANCAMENTO
  ];

type UsuarioComInstituicao =
  UsuarioLogado & {
    instituicaoId: number;
  };

class ErroApi extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<
    string,
    unknown
  >;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<
      string,
      unknown
    >
  ) {
    super(mensagem);

    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

const STATUS_NAO_TRANCAVEIS =
  new Set<StatusMatricula>([
    StatusMatricula.CANCELADA,
    StatusMatricula.CONCLUIDA,
    StatusMatricula.TRANSFERIDA,
    StatusMatricula.TRANCADA,
  ]);

function numeroInteiroPositivo(
  valor: unknown
): number | null {
  const numero =
    Number(valor);

  return Number.isInteger(
    numero
  ) &&
    numero > 0
    ? numero
    : null;
}

function textoObrigatorio(
  valor: unknown,
  minimo = 1
) {
  const texto =
    typeof valor === "string"
      ? valor.trim()
      : "";

  return texto.length >= minimo
    ? texto
    : null;
}

function textoOpcional(
  valor: unknown
): string | null {
  const texto =
    typeof valor === "string"
      ? valor.trim()
      : "";

  return texto || null;
}

function lerData(
  valor: unknown
): Date | null {
  const texto =
    typeof valor === "string"
      ? valor.trim()
      : "";

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    return null;
  }

  /*
   * Meio-dia UTC evita que a data
   * recue um dia em fusos negativos.
   */
  const data =
    new Date(
      `${texto}T12:00:00.000Z`
    );

  return Number.isNaN(
    data.getTime()
  )
    ? null
    : data;
}

function lerUnidadeDuracao(
  valor: unknown
):
  | UnidadeTrancamentoValor
  | null {
  const unidade =
    String(
      valor || ""
    )
      .trim()
      .toUpperCase();

  switch (unidade) {
    case UNIDADE_TRANCAMENTO.DIAS:
    case UNIDADE_TRANCAMENTO.MESES:
    case UNIDADE_TRANCAMENTO.SEMESTRES:
    case UNIDADE_TRANCAMENTO.INDETERMINADO:
      return unidade;

    default:
      return null;
  }
}

function validarDadosTrancamento(
  body: unknown
) {
  const corpo =
    body &&
    typeof body === "object" &&
    !Array.isArray(body)
      ? body as Record<
          string,
          unknown
        >
      : {};

  const motivo =
    textoObrigatorio(
      corpo.motivo,
      3
    );

  if (!motivo) {
    throw new ErroApi(
      400,
      "Informe o motivo do trancamento.",
      "MOTIVO_TRANCAMENTO_OBRIGATORIO"
    );
  }

  const dataInicio =
    lerData(
      corpo.dataInicio
    );

  if (!dataInicio) {
    throw new ErroApi(
      400,
      "Informe uma data valida para o inicio do trancamento.",
      "DATA_INICIO_TRANCAMENTO_INVALIDA"
    );
  }

  const duracaoUnidade =
    lerUnidadeDuracao(
      corpo.duracaoUnidade
    );

  if (!duracaoUnidade) {
    throw new ErroApi(
      400,
      "Informe a unidade de duracao do trancamento.",
      "DURACAO_UNIDADE_OBRIGATORIA"
    );
  }

  let duracaoQuantidade:
    | number
    | null = null;

  let dataRetornoPrevista:
    | Date
    | null = null;

  if (
    duracaoUnidade ===
    UNIDADE_TRANCAMENTO.INDETERMINADO
  ) {
    if (
      corpo.dataRetornoPrevista
    ) {
      dataRetornoPrevista =
        lerData(
          corpo.dataRetornoPrevista
        );

      if (
        !dataRetornoPrevista
      ) {
        throw new ErroApi(
          400,
          "A previsao de retorno informada e invalida.",
          "DATA_RETORNO_INVALIDA"
        );
      }
    }
  } else {
    duracaoQuantidade =
      numeroInteiroPositivo(
        corpo.duracaoQuantidade
      );

    if (!duracaoQuantidade) {
      throw new ErroApi(
        400,
        "Informe a duracao do trancamento.",
        "DURACAO_QUANTIDADE_INVALIDA"
      );
    }

    dataRetornoPrevista =
      lerData(
        corpo.dataRetornoPrevista
      );

    if (
      !dataRetornoPrevista
    ) {
      throw new ErroApi(
        400,
        "Informe a previsao de retorno.",
        "DATA_RETORNO_OBRIGATORIA"
      );
    }
  }

  if (
    dataRetornoPrevista &&
    dataRetornoPrevista
      .getTime() <
      dataInicio.getTime()
  ) {
    throw new ErroApi(
      400,
      "A previsao de retorno nao pode ser anterior ao inicio do trancamento.",
      "DATA_RETORNO_ANTERIOR_INICIO"
    );
  }

  return {
    motivo,

    observacoes:
      textoOpcional(
        corpo.observacoes
      ),

    dataInicio,
    dataRetornoPrevista,
    duracaoQuantidade,
    duracaoUnidade,
  };
}

function obterIp(
  req: Request
) {
  const encaminhado =
    req.headers.get(
      "x-forwarded-for"
    );

  const primeiro =
    encaminhado
      ?.split(",")[0]
      ?.trim();

  return (
    primeiro ||
    req.headers.get(
      "x-real-ip"
    ) ||
    null
  );
}

function obterUserAgent(
  req: Request
) {
  const valor =
    req.headers.get(
      "user-agent"
    );

  return valor
    ?.trim()
    .slice(
      0,
      4000
    ) || null;
}

async function exigirUsuario(
  mutacao = false
):
  Promise<UsuarioComInstituicao> {
  const user =
    await getUserFromToken();

  if (
    !user ||
    !user.instituicaoId
  ) {
    throw new ErroApi(
      401,
      "Usuario nao autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  if (
    !temPermissao(
      user,
      "matriculas.trancar"
    )
  ) {
    throw new ErroApi(
      403,
      "Sem permissao para gerenciar trancamentos.",
      "SEM_PERMISSAO_TRANCAMENTO"
    );
  }

  if (
    mutacao &&
    user.impersonacao
  ) {
    throw new ErroApi(
      403,
      "Operacao bloqueada durante sessao de suporte.",
      "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
    );
  }

  return user as
    UsuarioComInstituicao;
}

function responderErro(
  erro: unknown
) {
  if (
    erro instanceof ErroApi
  ) {
    return NextResponse.json(
      {
        success: false,
        codigo:
          erro.codigo,
        error:
          erro.message,

        ...(erro.detalhes
          ? {
              detalhes:
                erro.detalhes,
            }
          : {}),
      },
      {
        status:
          erro.status,
      }
    );
  }

  console.error(
    "Erro no fluxo de trancamento:",
    erro
  );

  return NextResponse.json(
    {
      success: false,
      codigo:
        "ERRO_TRANCAMENTO_MATRICULA",
      error:
        "Nao foi possivel processar o trancamento.",
    },
    {
      status: 500,
    }
  );
}

async function bloquearMatricula(
  tx: Prisma.TransactionClient,
  matriculaId: number,
  instituicaoId: number
) {
  /*
   * Serializa os processos estruturados
   * da mesma matricula.
   */
  await tx.$queryRaw<
    Array<{
      id: number;
    }>
  >`
    SELECT "id"
    FROM "Matricula"
    WHERE "id" = ${matriculaId}
      AND "instituicaoId" = ${instituicaoId}
    FOR UPDATE
  `;
}

async function buscarMatricula(
  tx: Prisma.TransactionClient,
  matriculaId: number,
  instituicaoId: number
) {
  return tx.matricula.findFirst({
    where: {
      id:
        matriculaId,

      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId:
        true,

      numeroMatricula:
        true,

      status: true,

      excluidaEm:
        true,

      canceladaEm:
        true,

      alunoId:
        true,

      periodoLetivo:
        true,

      semestre:
        true,

      modalidade:
        true,

      aluno: {
        select: {
          id: true,
          nome: true,
          nomeSocial:
            true,
          cpf: true,
        },
      },

      curso: {
        select: {
          id: true,
          nome: true,
        },
      },

      polo: {
        select: {
          id: true,
          nome: true,
        },
      },

      turmaPrincipal: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });
}

type MatriculaTrancamento =
  Awaited<
    ReturnType<
      typeof buscarMatricula
    >
  >;

function validarMatriculaTrancavel(
  matricula:
    MatriculaTrancamento
) {
  if (!matricula) {
    throw new ErroApi(
      404,
      "Matricula nao encontrada.",
      "MATRICULA_NAO_ENCONTRADA"
    );
  }

  if (
    matricula.excluidaEm
  ) {
    throw new ErroApi(
      409,
      "Matricula em quarentena nao pode ser trancada.",
      "MATRICULA_EM_QUARENTENA"
    );
  }

  if (
    matricula.canceladaEm ||
    STATUS_NAO_TRANCAVEIS
      .has(
        matricula.status
      )
  ) {
    throw new ErroApi(
      409,
      "Matricula nao pode ser trancada no status atual.",
      "STATUS_MATRICULA_NAO_TRANCAVEL",
      {
        status:
          matricula.status,
      }
    );
  }
}

async function obterResponsavel(
  tx: Prisma.TransactionClient,
  user:
    UsuarioComInstituicao
) {
  const usuario =
    await tx.user.findFirst({
      where: {
        id:
          user.id,

        instituicaoId:
          user.instituicaoId,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        role: true,

        funcionario: {
          select: {
            cargo: true,

            cargoCadastro: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

  const nome =
    usuario?.nome?.trim() ||
    usuario?.email?.trim() ||
    user.nome?.trim() ||
    user.email ||
    `User ${user.id}`;

  const cargo =
    usuario?.funcionario
      ?.cargoCadastro
      ?.nome
      ?.trim() ||
    usuario?.funcionario
      ?.cargo
      ?.trim() ||
    usuario?.role ||
    user.role ||
    null;

  return {
    nome,
    cargo,
  };
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await exigirUsuario();

    const matriculaId =
      numeroInteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      throw new ErroApi(
        400,
        "Matricula invalida.",
        "MATRICULA_INVALIDA"
      );
    }

    const matricula =
      await buscarMatricula(
        prisma,
        matriculaId,
        user.instituicaoId
      );

    if (!matricula) {
      throw new ErroApi(
        404,
        "Matricula nao encontrada.",
        "MATRICULA_NAO_ENCONTRADA"
      );
    }

    const trancamentos =
      await prisma
        .trancamentoMatricula
        .findMany({
          where: {
            instituicaoId:
              user.instituicaoId,

            matriculaId,
          },

          orderBy: [
            {
              criadoEm:
                "desc",
            },
            {
              id:
                "desc",
            },
          ],

          select: {
            id: true,

            numeroProtocolo:
              true,

            status: true,

            statusAnterior:
              true,

            motivo: true,

            observacoes:
              true,

            dataInicio:
              true,

            dataRetornoPrevista:
              true,

            duracaoQuantidade:
              true,

            duracaoUnidade:
              true,

            registradoPorId:
              true,

            registradoPorNomeSnapshot:
              true,

            registradoPorCargoSnapshot:
              true,

            confirmadoPorId:
              true,

            confirmadoPorNomeSnapshot:
              true,

            confirmadoPorCargoSnapshot:
              true,

            confirmadoEm:
              true,

            encerradoEm:
              true,

            canceladoEm:
              true,

            criadoEm:
              true,

            atualizadoEm:
              true,

            _count: {
              select: {
                documentosGerados:
                  true,
              },
            },
          },
        });

    const rascunho =
      trancamentos.find(
        (item) =>
          item.status ===
          STATUS_TRANCAMENTO.RASCUNHO
      ) || null;

    return NextResponse.json({
      success: true,
      matricula,
      rascunho,
      trancamentos,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await exigirUsuario(
        true
      );

    const matriculaId =
      numeroInteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      throw new ErroApi(
        400,
        "Matricula invalida.",
        "MATRICULA_INVALIDA"
      );
    }

    const body =
      await req.json();

    const dados =
      validarDadosTrancamento(
        body
      );

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await bloquearMatricula(
            tx,
            matriculaId,
            user.instituicaoId
          );

          const matricula =
            await buscarMatricula(
              tx,
              matriculaId,
              user.instituicaoId
            );

          validarMatriculaTrancavel(
            matricula
          );

          const existente =
            await tx
              .trancamentoMatricula
              .findFirst({
                where: {
                  instituicaoId:
                    user.instituicaoId,

                  matriculaId,

                  status: {
                    in: [
                      STATUS_TRANCAMENTO.RASCUNHO,

                      STATUS_TRANCAMENTO.CONFIRMADO,
                    ],
                  },
                },

                orderBy: {
                  id:
                    "desc",
                },

                select: {
                  id: true,

                  numeroProtocolo:
                    true,

                  status: true,
                },
              });

          if (existente) {
            const ehRascunho =
              existente.status ===
              STATUS_TRANCAMENTO.RASCUNHO;

            throw new ErroApi(
              409,

              ehRascunho
                ? "Ja existe um rascunho de trancamento para esta matricula."
                : "Ja existe um trancamento confirmado em aberto.",

              ehRascunho
                ? "RASCUNHO_TRANCAMENTO_EXISTENTE"
                : "TRANCAMENTO_ATIVO_EXISTENTE",

              {
                trancamentoId:
                  existente.id,

                numeroProtocolo:
                  existente
                    .numeroProtocolo,
              }
            );
          }

          const responsavel =
            await obterResponsavel(
              tx,
              user
            );

          const protocoloTemporario =
            `PENDENTE-${randomUUID()}`;

          const criado =
            await tx
              .trancamentoMatricula
              .create({
                data: {
                  instituicaoId:
                    user.instituicaoId,

                  matriculaId,

                  numeroProtocolo:
                    protocoloTemporario,

                  status:
                    STATUS_TRANCAMENTO.RASCUNHO,

                  statusAnterior:
                    matricula!
                      .status,

                  motivo:
                    dados.motivo,

                  observacoes:
                    dados.observacoes,

                  dataInicio:
                    dados.dataInicio,

                  dataRetornoPrevista:
                    dados
                      .dataRetornoPrevista,

                  duracaoQuantidade:
                    dados
                      .duracaoQuantidade,

                  duracaoUnidade:
                    dados
                      .duracaoUnidade,

                  registradoPorId:
                    user.id,

                  registradoPorNomeSnapshot:
                    responsavel.nome,

                  registradoPorCargoSnapshot:
                    responsavel.cargo,
                },

                select: {
                  id: true,
                },
              });

          const ano =
            new Date()
              .getUTCFullYear();

          const numeroProtocolo =
            [
              "TRC",
              String(
                user.instituicaoId
              ),
              String(ano),
              String(
                criado.id
              ).padStart(
                8,
                "0"
              ),
            ].join("-");

          return tx
            .trancamentoMatricula
            .update({
              where: {
                id:
                  criado.id,
              },

              data: {
                numeroProtocolo,
              },
            });
        }
      );

    return NextResponse.json(
      {
        success: true,

        trancamento:
          resultado,
      },
      {
        status: 201,
      }
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await exigirUsuario(
        true
      );

    const matriculaId =
      numeroInteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      throw new ErroApi(
        400,
        "Matricula invalida.",
        "MATRICULA_INVALIDA"
      );
    }

    const body =
      await req.json();

    const corpo =
      body &&
      typeof body ===
        "object" &&
      !Array.isArray(body)
        ? body as Record<
            string,
            unknown
          >
        : {};

    const trancamentoId =
      numeroInteiroPositivo(
        corpo.trancamentoId
      );

    if (!trancamentoId) {
      throw new ErroApi(
        400,
        "Trancamento invalido.",
        "TRANCAMENTO_INVALIDO"
      );
    }

    const acao =
      String(
        corpo.acao ||
        "SALVAR_RASCUNHO"
      )
        .trim()
        .toUpperCase();

    if (
      acao !==
        "SALVAR_RASCUNHO" &&
      acao !==
        "CONFIRMAR"
    ) {
      throw new ErroApi(
        400,
        "Acao de trancamento invalida.",
        "ACAO_TRANCAMENTO_INVALIDA"
      );
    }

    const dados =
      validarDadosTrancamento(
        corpo
      );

    const ip =
      obterIp(
        req
      );

    const userAgent =
      obterUserAgent(
        req
      );

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await bloquearMatricula(
            tx,
            matriculaId,
            user.instituicaoId
          );

          const matricula =
            await buscarMatricula(
              tx,
              matriculaId,
              user.instituicaoId
            );

          validarMatriculaTrancavel(
            matricula
          );

          const trancamento =
            await tx
              .trancamentoMatricula
              .findFirst({
                where: {
                  id:
                    trancamentoId,

                  instituicaoId:
                    user.instituicaoId,

                  matriculaId,
                },

                select: {
                  id: true,

                  numeroProtocolo:
                    true,

                  status: true,

                  statusAnterior:
                    true,
                },
              });

          if (!trancamento) {
            throw new ErroApi(
              404,
              "Trancamento nao encontrado.",
              "TRANCAMENTO_NAO_ENCONTRADO"
            );
          }

          if (
            trancamento.status !==
            STATUS_TRANCAMENTO.RASCUNHO
          ) {
            throw new ErroApi(
              409,
              "Somente rascunhos podem ser alterados ou confirmados.",
              "TRANCAMENTO_NAO_E_RASCUNHO"
            );
          }

          if (
            acao ===
            "SALVAR_RASCUNHO"
          ) {
            return tx
              .trancamentoMatricula
              .update({
                where: {
                  id:
                    trancamento.id,
                },

                data: {
                  motivo:
                    dados.motivo,

                  observacoes:
                    dados.observacoes,

                  dataInicio:
                    dados.dataInicio,

                  dataRetornoPrevista:
                    dados
                      .dataRetornoPrevista,

                  duracaoQuantidade:
                    dados
                      .duracaoQuantidade,

                  duracaoUnidade:
                    dados
                      .duracaoUnidade,
                },
              });
          }

          /*
           * O status da matricula deve
           * continuar igual ao registrado
           * quando o rascunho foi criado.
           *
           * Se outro processo alterou a
           * matricula depois disso, o
           * trancamento precisa ser revisto
           * antes da confirmacao.
           */
          if (
            matricula!.status !==
            trancamento.statusAnterior
          ) {
            throw new ErroApi(
              409,
              "A situacao da matricula mudou depois da criacao deste rascunho. Revise o processo antes de confirmar.",
              "MATRICULA_ALTERADA_APOS_RASCUNHO",
              {
                numeroProtocolo:
                  trancamento
                    .numeroProtocolo,

                statusRascunho:
                  trancamento
                    .statusAnterior,

                statusAtual:
                  matricula!
                    .status,
              }
            );
          }
          const outroAtivo =
            await tx
              .trancamentoMatricula
              .findFirst({
                where: {
                  instituicaoId:
                    user.instituicaoId,

                  matriculaId,

                  id: {
                    not:
                      trancamento.id,
                  },

                  status:
                    STATUS_TRANCAMENTO.CONFIRMADO,
                },

                select: {
                  id: true,

                  numeroProtocolo:
                    true,
                },
              });

          if (outroAtivo) {
            throw new ErroApi(
              409,
              "Ja existe um trancamento confirmado em aberto.",
              "TRANCAMENTO_ATIVO_EXISTENTE",
              {
                trancamentoId:
                  outroAtivo.id,

                numeroProtocolo:
                  outroAtivo
                    .numeroProtocolo,
              }
            );
          }

          const responsavel =
            await obterResponsavel(
              tx,
              user
            );

          /*
           * A linha da Matricula ja esta
           * bloqueada por FOR UPDATE.
           *
           * Mesmo assim usamos updateMany
           * condicional para garantir que o
           * status esperado continua valido.
           */
          const matriculaAtualizada =
            await tx
              .matricula
              .updateMany({
                where: {
                  id:
                    matriculaId,

                  instituicaoId:
                    user.instituicaoId,

                  excluidaEm:
                    null,

                  status:
                    matricula!
                      .status,
                },

                data: {
                  status:
                    StatusMatricula
                      .TRANCADA,
                },
              });

          if (
            matriculaAtualizada
              .count !== 1
          ) {
            throw new ErroApi(
              409,
              "A matricula foi alterada por outro processo. Recarregue os dados.",
              "MATRICULA_ALTERADA_DURANTE_TRANCAMENTO"
            );
          }

          const agora =
            new Date();

          return tx
            .trancamentoMatricula
            .update({
              where: {
                id:
                  trancamento.id,
              },

              data: {
                status:
                  STATUS_TRANCAMENTO.CONFIRMADO,


                motivo:
                  dados.motivo,

                observacoes:
                  dados.observacoes,

                dataInicio:
                  dados.dataInicio,

                dataRetornoPrevista:
                  dados
                    .dataRetornoPrevista,

                duracaoQuantidade:
                  dados
                    .duracaoQuantidade,

                duracaoUnidade:
                  dados
                    .duracaoUnidade,

                confirmadoPorId:
                  user.id,

                confirmadoPorNomeSnapshot:
                  responsavel.nome,

                confirmadoPorCargoSnapshot:
                  responsavel.cargo,

                ipConfirmacao:
                  ip,

                userAgentConfirmacao:
                  userAgent,

                confirmadoEm:
                  agora,
              },
            });
        }
      );

    return NextResponse.json({
      success: true,
      acao,

      trancamento:
        resultado,

      matriculaStatus:
        acao ===
        "CONFIRMAR"
          ? StatusMatricula
              .TRANCADA
          : undefined,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}