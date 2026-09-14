import { NextResponse } from "next/server";

import {
  SituacaoItemTransferenciaMatricula,
  StatusItemMatricula,
  StatusMatricula,
  StatusTransferenciaMatricula,
  TipoTransferenciaMatricula,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

class ErroApi extends Error {
  status: number;
  codigo: string;
  detalhes?: unknown;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: unknown
  ) {
    super(mensagem);

    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function inteiroPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
      transferenciaId: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "SEM_PERMISSAO",
          error:
            "Sem permissao.",
        },
        {
          status: 403,
        }
      );
    }

    const matriculaId =
      inteiroPositivo(
        params.id
      );

    const transferenciaId =
      inteiroPositivo(
        params.transferenciaId
      );

    if (
      !matriculaId ||
      !transferenciaId
    ) {
      throw new ErroApi(
        400,
        "Identificadores invalidos.",
        "IDENTIFICADOR_INVALIDO"
      );
    }

    const body =
      await req.json();

    const turmaDestinoId =
      inteiroPositivo(
        body?.turmaDestinoId
      );

    if (!turmaDestinoId) {
      throw new ErroApi(
        400,
        "Informe a turma de destino.",
        "TURMA_DESTINO_OBRIGATORIA"
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const transferencia =
            await tx
              .transferenciaMatricula
              .findFirst({
                where: {
                  id:
                    transferenciaId,

                  matriculaId,

                  instituicaoId:
                    user.instituicaoId,

                  status:
                    StatusTransferenciaMatricula.PENDENTE,
                },

                select: {
                  id: true,
                  tipo: true,

                  instituicaoId:
                    true,

                  matriculaId:
                    true,

                  poloDestinoId:
                    true,

                  poloDestinoNomeSnapshot:
                    true,

                  cursoDestinoId:
                    true,

                  turmaDestinoId:
                    true,

                  snapshotPosterior:
                    true,

                  itens: {
                    where: {
                      situacao: {
                        in: [
                          SituacaoItemTransferenciaMatricula.AGUARDANDO_TURMA,
                          SituacaoItemTransferenciaMatricula.AGUARDANDO_COMPATIBILIDADE,
                        ],
                      },
                    },

                    orderBy: {
                      id: "asc",
                    },

                    select: {
                      id: true,

                      itemMatriculaOrigemId:
                        true,

                      itemMatriculaDestinoId:
                        true,

                      disciplinaId:
                        true,

                      disciplinaNomeSnapshot:
                        true,

                      statusOrigem:
                        true,

                      tipoItem:
                        true,

                      situacao:
                        true,
                    },
                  },
                },
              });

          if (!transferencia) {
            throw new ErroApi(
              404,
              "Transferencia pendente nao encontrada.",
              "TRANSFERENCIA_PENDENTE_NAO_ENCONTRADA"
            );
          }

          if (
            transferencia.tipo !==
            TipoTransferenciaMatricula.POLO
          ) {
            throw new ErroApi(
              400,
              "Este tipo de transferencia ainda nao suporta alocacao por esta rota.",
              "TIPO_NAO_SUPORTADO"
            );
          }

          if (
            !transferencia
              .poloDestinoId
          ) {
            throw new ErroApi(
              409,
              "A transferencia nao possui polo de destino.",
              "POLO_DESTINO_AUSENTE"
            );
          }

          if (
            transferencia.itens
              .length === 0
          ) {
            throw new ErroApi(
              409,
              "Nao existem disciplinas pendentes nesta transferencia.",
              "SEM_ITENS_PENDENTES"
            );
          }

          const matricula =
            await tx.matricula.findFirst({
              where: {
                id:
                  transferencia.matriculaId,

                instituicaoId:
                  user.instituicaoId,
              },

              select: {
                id: true,
                cursoId: true,
                poloId: true,
                status: true,
              },
            });

          if (!matricula) {
            throw new ErroApi(
              404,
              "Matricula nao encontrada.",
              "MATRICULA_NAO_ENCONTRADA"
            );
          }

          if (
            matricula.poloId !==
            transferencia.poloDestinoId
          ) {
            throw new ErroApi(
              409,
              "O polo atual da matricula nao corresponde ao polo da transferencia pendente.",
              "POLO_MATRICULA_DIVERGENTE"
            );
          }

          const turma =
            await tx.turma.findFirst({
              where: {
                id:
                  turmaDestinoId,

                instituicaoId:
                  user.instituicaoId,

                poloId:
                  transferencia
                    .poloDestinoId,

                ativa: true,

                ...(transferencia
                  .cursoDestinoId
                  ? {
                      cursoId:
                        transferencia
                          .cursoDestinoId,
                    }
                  : matricula.cursoId
                    ? {
                        cursoId:
                          matricula.cursoId,
                      }
                    : {}),
              },

              select: {
                id: true,
                nome: true,
                poloId: true,
                cursoId: true,

                disciplinas: {
                  select: {
                    disciplinaId:
                      true,
                  },
                },
              },
            });

          if (!turma) {
            throw new ErroApi(
              400,
              "A turma nao pertence ao polo ou curso de destino.",
              "TURMA_DESTINO_INVALIDA"
            );
          }

          const disciplinasTurma =
            new Set(
              turma.disciplinas.map(
                (item) =>
                  item.disciplinaId
              )
            );

          const faltantes =
            transferencia.itens
              .filter(
                (item) =>
                  !disciplinasTurma.has(
                    item.disciplinaId
                  )
              )
              .map(
                (item) => ({
                  disciplinaId:
                    item.disciplinaId,

                  nome:
                    item.disciplinaNomeSnapshot,
                })
              );

          /*
           * Regra de seguranca:
           * nada e migrado parcialmente.
           */
          if (
            faltantes.length > 0
          ) {
            throw new ErroApi(
              409,
              "A turma selecionada nao possui todas as disciplinas pendentes.",
              "TURMA_INCOMPATIVEL",
              {
                disciplinasFaltantes:
                  faltantes,
              }
            );
          }

          const disciplinaIds =
            transferencia.itens.map(
              (item) =>
                item.disciplinaId
            );

          const existentes =
            await tx.itemMatricula.findMany({
              where: {
                matriculaId:
                  matricula.id,

                turmaId:
                  turma.id,

                disciplinaId: {
                  in:
                    disciplinaIds,
                },
              },

              select: {
                id: true,
                disciplinaId:
                  true,
              },
            });

          if (
            existentes.length > 0
          ) {
            throw new ErroApi(
              409,
              "A matricula ja possui disciplinas vinculadas a turma selecionada.",
              "VINCULO_DESTINO_EXISTENTE",
              {
                itens:
                  existentes,
              }
            );
          }

          const criados: Array<{
            transferenciaItemId:
              number;
            itemDestinoId:
              number;
            disciplinaId:
              number;
            status:
              StatusItemMatricula;
          }> = [];

          for (
            const item
            of transferencia.itens
          ) {
            const statusDestino =
              item.statusOrigem ===
              StatusItemMatricula.EM_CURSO
                ? StatusItemMatricula.EM_CURSO
                : StatusItemMatricula.A_CURSAR;

            const itemDestino =
              await tx.itemMatricula.create({
                data: {
                  instituicaoId:
                    transferencia
                      .instituicaoId,

                  matriculaId:
                    matricula.id,

                  turmaId:
                    turma.id,

                  disciplinaId:
                    item.disciplinaId,

                  tipoItem:
                    item.tipoItem,

                  status:
                    statusDestino,
                },

                select: {
                  id: true,
                  status: true,
                },
              });

            await tx
              .transferenciaMatriculaItem
              .update({
                where: {
                  id:
                    item.id,
                },

                data: {
                  itemMatriculaDestinoId:
                    itemDestino.id,

                  turmaDestinoId:
                    turma.id,

                  turmaDestinoNomeSnapshot:
                    turma.nome,

                  statusDestino:
                    itemDestino.status,

                  situacao:
                    SituacaoItemTransferenciaMatricula.MIGRADO,
                },
              });

            criados.push({
              transferenciaItemId:
                item.id,

              itemDestinoId:
                itemDestino.id,

              disciplinaId:
                item.disciplinaId,

              status:
                itemDestino.status,
            });
          }

          const agora =
            new Date();

          const matriculaAtualizada =
            await tx.matricula.update({
              where: {
                id:
                  matricula.id,
              },

              data: {
                turmaPrincipalId:
                  turma.id,

                status:
                  StatusMatricula.ATIVA,
              },

              select: {
                id: true,
                status: true,
                poloId: true,
                turmaPrincipalId:
                  true,
              },
            });

          const transferenciaAtualizada =
            await tx
              .transferenciaMatricula
              .update({
                where: {
                  id:
                    transferencia.id,
                },

                data: {
                  turmaDestinoId:
                    turma.id,

                  turmaDestinoNomeSnapshot:
                    turma.nome,

                  status:
                    StatusTransferenciaMatricula.CONCLUIDA,

                  concluidaEm:
                    agora,

                  snapshotPosterior: {
                    matriculaId:
                      matricula.id,

                    status:
                      StatusMatricula.ATIVA,

                    poloDestinoId:
                      transferencia
                        .poloDestinoId,

                    poloDestinoNome:
                      transferencia
                        .poloDestinoNomeSnapshot,

                    turmaDestinoId:
                      turma.id,

                    turmaDestinoNome:
                      turma.nome,

                    quantidadeMigrada:
                      criados.length,

                    quantidadeAguardando:
                      0,

                    itens:
                      criados,
                  },
                },

                select: {
                  id: true,
                  status: true,

                  turmaDestinoId:
                    true,

                  turmaDestinoNomeSnapshot:
                    true,

                  concluidaEm:
                    true,
                },
              });

          return {
            transferencia:
              transferenciaAtualizada,

            matricula:
              matriculaAtualizada,

            resumo: {
              quantidadeMigrada:
                criados.length,

              turma: {
                id:
                  turma.id,

                nome:
                  turma.nome,
              },
            },
          };
        },
        {
          maxWait: 5000,
          timeout: 20000,
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Transferencia concluida e matricula alocada na turma de destino.",

        ...resultado,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (
      error instanceof ErroApi
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            error.codigo,

          error:
            error.message,

          detalhes:
            error.detalhes ??
            null,
        },
        {
          status:
            error.status,
        }
      );
    }

    console.error(
      "Erro ao alocar transferencia em turma:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        codigo:
          "ERRO_ALOCACAO_TRANSFERENCIA",

        error:
          "Nao foi possivel concluir a alocacao da transferencia.",
      },
      {
        status: 500,
      }
    );
  }
}
