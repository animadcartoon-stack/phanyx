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

  constructor(
    status: number,
    mensagem: string,
    codigo: string
  ) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

const STATUS_ITENS_TRANSFERIVEIS: StatusItemMatricula[] = [
  StatusItemMatricula.A_CURSAR,
  StatusItemMatricula.EM_CURSO,
];

const STATUS_MATRICULA_BLOQUEADOS =
  new Set<StatusMatricula>([
    StatusMatricula.CANCELADA,
    StatusMatricula.CONCLUIDA,
    StatusMatricula.TRANSFERIDA,
  ]);

function numeroInteiroPositivo(
  valor: unknown
): number | null {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
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

function lerDataTransferencia(
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
   * Meio-dia UTC evita que a data recue um dia
   * quando exibida em fusos horarios negativos.
   */
  const data = new Date(
    `${texto}T12:00:00.000Z`
  );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data;
}

function obterIp(req: Request) {
  const encaminhado =
    req.headers.get(
      "x-forwarded-for"
    );

  if (encaminhado) {
    const primeiro =
      encaminhado
        .split(",")[0]
        ?.trim();

    if (primeiro) {
      return primeiro;
    }
  }

  return (
    req.headers.get(
      "x-real-ip"
    ) || null
  );
}

function responderErro(
  error: unknown
) {
  if (error instanceof ErroApi) {
    return NextResponse.json(
      {
        success: false,
        codigo: error.codigo,
        error: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(
    "Erro ao transferir matricula:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      codigo:
        "ERRO_TRANSFERENCIA",
      error:
        "Nao foi possivel concluir a transferencia.",
    },
    {
      status: 500,
    }
  );
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
      await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Sem permissao.",
        },
        {
          status: 403,
        }
      );
    }

    const matriculaId =
      numeroInteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Matricula invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const matricula =
      await prisma.matricula.findFirst({
        where: {
          id:
            matriculaId,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          status: true,

          aluno: {
            select: {
              id: true,
              nome: true,
              nomeSocial: true,
            },
          },

          instituicao: {
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

          curso: {
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

    if (!matricula) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Matricula nao encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const transferencias =
      await prisma.transferenciaMatricula.findMany({
        where: {
          matriculaId,

          instituicaoId:
            user.instituicaoId,
        },

        orderBy: [
          {
            dataTransferencia:
              "desc",
          },
          {
            id:
              "desc",
          },
        ],

        select: {
          id: true,
          tipo: true,
          status: true,

          dataTransferencia:
            true,

          motivo: true,
          observacoes: true,

          alunoOrigemNomeSnapshot:
            true,

          alunoDestinoNomeSnapshot:
            true,

          instituicaoOrigemNomeSnapshot:
            true,

          instituicaoDestinoNomeSnapshot:
            true,

          poloOrigemId: true,

          poloOrigemNomeSnapshot:
            true,

          poloDestinoId: true,

          poloDestinoNomeSnapshot:
            true,

          cursoOrigemId: true,

          cursoOrigemNomeSnapshot:
            true,

          cursoDestinoId: true,

          cursoDestinoNomeSnapshot:
            true,

          turmaOrigemId: true,

          turmaOrigemNomeSnapshot:
            true,

          turmaDestinoId: true,

          turmaDestinoNomeSnapshot:
            true,

          instituicaoExternaNome:
            true,

          instituicaoExternaPaisCodigo:
            true,

          realizadoPorId:
            true,

          realizadoPorNomeSnapshot:
            true,

          concluidaEm:
            true,

          canceladaEm:
            true,

          motivoCancelamento:
            true,

          createdAt:
            true,

          itens: {
            orderBy: {
              id:
                "asc",
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

              turmaOrigemId:
                true,

              turmaOrigemNomeSnapshot:
                true,

              turmaDestinoId:
                true,

              turmaDestinoNomeSnapshot:
                true,

              tipoItem:
                true,

              statusOrigem:
                true,

              statusDestino:
                true,

              situacao:
                true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      matricula,
      transferencias,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar historico de transferencias:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nao foi possivel consultar o historico de transferencias.",
      },
      {
        status: 500,
      }
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

    const tipo =
      String(
        body?.tipo || ""
      ).trim();

    /*
     * Nesta primeira etapa,
     * somente transferencia entre polos.
     */
    if (
      tipo !==
      TipoTransferenciaMatricula.POLO
    ) {
      throw new ErroApi(
        400,
        "Tipo de transferencia ainda nao disponivel nesta rota.",
        "TIPO_NAO_SUPORTADO"
      );
    }

    const poloDestinoId =
      numeroInteiroPositivo(
        body?.poloDestinoId
      );

    if (!poloDestinoId) {
      throw new ErroApi(
        400,
        "Informe o polo de destino.",
        "POLO_DESTINO_OBRIGATORIO"
      );
    }

    let turmaDestinoId:
      | number
      | null = null;

    if (
      body?.turmaDestinoId !==
        null &&
      body?.turmaDestinoId !==
        undefined &&
      String(
        body.turmaDestinoId
      ).trim() !== ""
    ) {
      turmaDestinoId =
        numeroInteiroPositivo(
          body.turmaDestinoId
        );

      if (!turmaDestinoId) {
        throw new ErroApi(
          400,
          "Turma de destino invalida.",
          "TURMA_DESTINO_INVALIDA"
        );
      }
    }

    const motivo =
      String(
        body?.motivo || ""
      ).trim();

    if (motivo.length < 3) {
      throw new ErroApi(
        400,
        "Informe o motivo da transferencia.",
        "MOTIVO_OBRIGATORIO"
      );
    }

    const observacoes =
      textoOpcional(
        body?.observacoes
      );

    const dataTransferencia =
      lerDataTransferencia(
        body?.dataTransferencia
      );

    if (!dataTransferencia) {
      throw new ErroApi(
        400,
        "Data da transferencia invalida.",
        "DATA_INVALIDA"
      );
    }

    const ip =
      obterIp(req);

    const userAgent =
      req.headers.get(
        "user-agent"
      );

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Leitura da matricula sempre limitada
           * a instituicao autenticada.
           */
          const matricula =
            await tx.matricula.findFirst(
              {
                where: {
                  id: matriculaId,
                  instituicaoId:
                    user.instituicaoId,
                },

                select: {
                  id: true,
                  instituicaoId:
                    true,
                  alunoId: true,
                  status: true,
                  poloId: true,
                  cursoId: true,
                  turmaPrincipalId:
                    true,
                  cursoSemestreId:
                    true,
                  periodoMatriculaId:
                    true,
                  periodoLetivo:
                    true,
                  semestre: true,
                  modalidade: true,

                  aluno: {
                    select: {
                      id: true,
                      nome: true,
                      nomeSocial: true,
                    },
                  },

                  instituicao: {
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

                  curso: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },

                  turmaPrincipal: {
                    select: {
                      id: true,
                      nome: true,
                      poloId: true,
                      cursoId: true,
                    },
                  },

                  itens: {
                    where: {
                      status: {
                        in: STATUS_ITENS_TRANSFERIVEIS,
                      },
                    },

                    select: {
                      id: true,
                      turmaId: true,
                      disciplinaId:
                        true,
                      tipoItem: true,
                      status: true,

                      turma: {
                        select: {
                          id: true,
                          nome: true,
                          poloId: true,
                          cursoId: true,
                        },
                      },

                      disciplina: {
                        select: {
                          id: true,
                          nome: true,
                        },
                      },
                    },
                  },
                },
              }
            );

          if (!matricula) {
            throw new ErroApi(
              404,
              "Matricula nao encontrada.",
              "MATRICULA_NAO_ENCONTRADA"
            );
          }

          if (
            STATUS_MATRICULA_BLOQUEADOS.has(
              matricula.status
            )
          ) {
            throw new ErroApi(
              409,
              "Esta matricula nao pode ser transferida no status atual.",
              "STATUS_NAO_TRANSFERIVEL"
            );
          }

          /*
           * Uma matricula nao pode possuir duas
           * transferencias pendentes ao mesmo tempo.
           *
           * A transferencia anterior precisa ser
           * concluida ou cancelada antes de iniciar
           * outra movimentacao.
           */
          const transferenciaPendente =
            await tx.transferenciaMatricula.findFirst(
              {
                where: {
                  instituicaoId:
                    matricula.instituicaoId,

                  matriculaId:
                    matricula.id,

                  status:
                    StatusTransferenciaMatricula.PENDENTE,
                },

                select: {
                  id: true,
                  tipo: true,
                  poloDestinoId: true,
                  poloDestinoNomeSnapshot:
                    true,
                  turmaDestinoId: true,
                  turmaDestinoNomeSnapshot:
                    true,
                  dataTransferencia:
                    true,
                },
              }
            );

          if (transferenciaPendente) {
            throw new ErroApi(
              409,
              "Esta matricula ja possui uma transferencia pendente. Conclua a alocacao da transferencia atual antes de iniciar outra.",
              "TRANSFERENCIA_PENDENTE_EXISTENTE"
            );
          }

          if (
            matricula.poloId ===
            poloDestinoId
          ) {
            throw new ErroApi(
              400,
              "O polo de destino deve ser diferente do polo atual.",
              "POLO_DESTINO_IGUAL_ORIGEM"
            );
          }

          const poloDestino =
            await tx.polo.findFirst(
              {
                where: {
                  id: poloDestinoId,
                  instituicaoId:
                    user.instituicaoId,
                  ativo: true,
                },

                select: {
                  id: true,
                  nome: true,
                },
              }
            );

          if (!poloDestino) {
            throw new ErroApi(
              404,
              "Polo de destino nao encontrado ou inativo.",
              "POLO_DESTINO_NAO_ENCONTRADO"
            );
          }

          const turmaDestino =
            turmaDestinoId
              ? await tx.turma.findFirst(
                  {
                    where: {
                      id: turmaDestinoId,
                      instituicaoId:
                        user.instituicaoId,
                      poloId:
                        poloDestinoId,
                      ativa: true,

                      ...(matricula.cursoId
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
                      statusTurma: true,

                      disciplinas: {
                        select: {
                          disciplinaId:
                            true,
                        },
                      },
                    },
                  }
                )
              : null;

          if (
            turmaDestinoId &&
            !turmaDestino
          ) {
            throw new ErroApi(
              400,
              "A turma de destino nao pertence ao polo ou curso selecionado.",
              "TURMA_DESTINO_INCOMPATIVEL"
            );
          }

          const usuarioResponsavel =
            await tx.user.findFirst(
              {
                where: {
                  id: user.id,
                  instituicaoId:
                    user.instituicaoId,
                },

                select: {
                  id: true,
                  nome: true,
                  email: true,
                  role: true,
                },
              }
            );

          const nomeResponsavel =
            usuarioResponsavel?.nome?.trim() ||
            usuarioResponsavel?.email?.trim() ||
            `User ${user.id}`;

          /*
           * Evita duplicar um vinculo que ja exista
           * na turma destino.
           */
          if (
            turmaDestino &&
            matricula.itens.length >
              0
          ) {
            const conflitos =
              await tx.itemMatricula.findMany(
                {
                  where: {
                    matriculaId:
                      matricula.id,
                    turmaId:
                      turmaDestino.id,
                    disciplinaId: {
                      in: matricula.itens.map(
                        (item) =>
                          item.disciplinaId
                      ),
                    },
                  },

                  select: {
                    id: true,
                    disciplinaId:
                      true,
                  },
                }
              );

            if (
              conflitos.length > 0
            ) {
              throw new ErroApi(
                409,
                "Ja existem disciplinas desta matricula vinculadas a turma de destino.",
                "VINCULO_DESTINO_EXISTENTE"
              );
            }
          }

          const disciplinasDestino =
            new Set<number>(
              (
                turmaDestino
                  ?.disciplinas ??
                []
              ).map(
                (item) =>
                  item.disciplinaId
              )
            );

          const snapshotAnterior = {
            matriculaId:
              matricula.id,

            status:
              matricula.status,

            aluno: {
              id:
                matricula.aluno.id,
              nome:
                matricula.aluno
                  .nomeSocial ||
                matricula.aluno
                  .nome,
            },

            instituicao: {
              id:
                matricula.instituicao
                  .id,
              nome:
                matricula.instituicao
                  .nome,
            },

            polo: matricula.polo
              ? {
                  id:
                    matricula.polo.id,
                  nome:
                    matricula.polo
                      .nome,
                }
              : null,

            curso: matricula.curso
              ? {
                  id:
                    matricula.curso.id,
                  nome:
                    matricula.curso
                      .nome,
                }
              : null,

            turmaPrincipal:
              matricula.turmaPrincipal
                ? {
                    id:
                      matricula
                        .turmaPrincipal
                        .id,
                    nome:
                      matricula
                        .turmaPrincipal
                        .nome,
                  }
                : null,

            cursoSemestreId:
              matricula.cursoSemestreId,

            periodoMatriculaId:
              matricula.periodoMatriculaId,

            periodoLetivo:
              matricula.periodoLetivo,

            semestre:
              matricula.semestre,

            modalidade:
              matricula.modalidade,

            itensAtivos:
              matricula.itens.map(
                (item) => ({
                  id: item.id,
                  status:
                    item.status,
                  tipoItem:
                    item.tipoItem,
                  disciplinaId:
                    item.disciplinaId,
                  disciplinaNome:
                    item.disciplina
                      .nome,
                  turmaId:
                    item.turmaId,
                  turmaNome:
                    item.turma.nome,
                })
              ),
          };

          /*
           * Primeiro registra o evento.
           * Ele sera atualizado no final
           * da mesma transacao.
           */
          const transferencia =
            await tx.transferenciaMatricula.create(
              {
                data: {
                  instituicaoId:
                    matricula.instituicaoId,

                  matriculaId:
                    matricula.id,

                  tipo:
                    TipoTransferenciaMatricula.POLO,

                  status:
                    StatusTransferenciaMatricula.PENDENTE,

                  dataTransferencia,

                  motivo,
                  observacoes,

                  alunoOrigemId:
                    matricula.aluno.id,

                  alunoOrigemNomeSnapshot:
                    matricula.aluno
                      .nomeSocial ||
                    matricula.aluno
                      .nome,

                  instituicaoOrigemId:
                    matricula
                      .instituicao.id,

                  instituicaoOrigemNomeSnapshot:
                    matricula
                      .instituicao.nome,

                  instituicaoDestinoId:
                    matricula
                      .instituicao.id,

                  instituicaoDestinoNomeSnapshot:
                    matricula
                      .instituicao.nome,

                  poloOrigemId:
                    matricula.polo?.id ??
                    null,

                  poloOrigemNomeSnapshot:
                    matricula.polo
                      ?.nome ?? null,

                  poloDestinoId:
                    poloDestino.id,

                  poloDestinoNomeSnapshot:
                    poloDestino.nome,

                  cursoOrigemId:
                    matricula.curso?.id ??
                    null,

                  cursoOrigemNomeSnapshot:
                    matricula.curso
                      ?.nome ?? null,

                  cursoDestinoId:
                    matricula.curso?.id ??
                    null,

                  cursoDestinoNomeSnapshot:
                    matricula.curso
                      ?.nome ?? null,

                  turmaOrigemId:
                    matricula
                      .turmaPrincipal?.id ??
                    null,

                  turmaOrigemNomeSnapshot:
                    matricula
                      .turmaPrincipal
                      ?.nome ?? null,

                  turmaDestinoId:
                    turmaDestino?.id ??
                    null,

                  turmaDestinoNomeSnapshot:
                    turmaDestino?.nome ??
                    null,

                  realizadoPorId:
                    user.id,

                  realizadoPorNomeSnapshot:
                    nomeResponsavel,

                  ip,
                  userAgent,

                  snapshotAnterior,
                },

                select: {
                  id: true,
                },
              }
            );

          /*
           * Se nao houver turma de destino,
           * a transferencia de polo acontece,
           * mas a alocacao academica fica pendente.
           */
          let possuiPendencia =
            !turmaDestino;

          let quantidadeMigrada = 0;

          let quantidadeAguardando =
            0;

          const itensPosteriores: Array<{
            origemId: number;
            destinoId: number | null;
            disciplinaId: number;
            statusOrigem: StatusItemMatricula;
            statusDestino:
              | StatusItemMatricula
              | null;
            situacao:
              SituacaoItemTransferenciaMatricula;
          }> = [];

          for (
            const item
            of matricula.itens
          ) {
            let situacao:
              SituacaoItemTransferenciaMatricula;

            let itemDestino:
              | {
                  id: number;
                  status: StatusItemMatricula;
                }
              | null = null;

            if (!turmaDestino) {
              situacao =
                SituacaoItemTransferenciaMatricula.AGUARDANDO_TURMA;

              possuiPendencia =
                true;

              quantidadeAguardando++;
            } else if (
              !disciplinasDestino.has(
                item.disciplinaId
              )
            ) {
              situacao =
                SituacaoItemTransferenciaMatricula.AGUARDANDO_COMPATIBILIDADE;

              possuiPendencia =
                true;

              quantidadeAguardando++;
            } else {
              const statusDestino =
                item.status ===
                StatusItemMatricula.EM_CURSO
                  ? StatusItemMatricula.EM_CURSO
                  : StatusItemMatricula.A_CURSAR;

              itemDestino =
                await tx.itemMatricula.create(
                  {
                    data: {
                      instituicaoId:
                        matricula.instituicaoId,

                      matriculaId:
                        matricula.id,

                      turmaId:
                        turmaDestino.id,

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
                  }
                );

              situacao =
                SituacaoItemTransferenciaMatricula.MIGRADO;

              quantidadeMigrada++;
            }

            /*
             * O vinculo antigo deixa de ser corrente,
             * mas nao e apagado.
             */
            await tx.itemMatricula.update(
              {
                where: {
                  id: item.id,
                },

                data: {
                  status:
                    StatusItemMatricula.TRANSFERIDO,
                },
              }
            );

            await tx.transferenciaMatriculaItem.create(
              {
                data: {
                  transferenciaId:
                    transferencia.id,

                  itemMatriculaOrigemId:
                    item.id,

                  itemMatriculaDestinoId:
                    itemDestino?.id ??
                    null,

                  disciplinaId:
                    item.disciplinaId,

                  disciplinaNomeSnapshot:
                    item.disciplina
                      .nome,

                  turmaOrigemId:
                    item.turma.id,

                  turmaOrigemNomeSnapshot:
                    item.turma.nome,

                  turmaDestinoId:
                    turmaDestino?.id ??
                    null,

                  turmaDestinoNomeSnapshot:
                    turmaDestino?.nome ??
                    null,

                  tipoItem:
                    item.tipoItem,

                  statusOrigem:
                    item.status,

                  statusDestino:
                    itemDestino?.status ??
                    null,

                  situacao,
                },
              }
            );

            itensPosteriores.push(
              {
                origemId:
                  item.id,

                destinoId:
                  itemDestino?.id ??
                  null,

                disciplinaId:
                  item.disciplinaId,

                statusOrigem:
                  item.status,

                statusDestino:
                  itemDestino?.status ??
                  null,

                situacao,
              }
            );
          }

          /*
           * Transferencia entre polos da mesma
           * instituicao NAO cria nova matricula.
           *
           * Tambem nao altera Aluno.poloId.
           */
          let novoStatus =
            matricula.status;

          if (
            possuiPendencia &&
            (
              matricula.status ===
                StatusMatricula.ATIVA ||
              matricula.status ===
                StatusMatricula.A_INICIAR ||
              matricula.status ===
                StatusMatricula.AGUARDANDO
            )
          ) {
            novoStatus =
              StatusMatricula.AGUARDANDO;
          } else if (
            !possuiPendencia &&
            matricula.status ===
              StatusMatricula.AGUARDANDO
          ) {
            novoStatus =
              StatusMatricula.ATIVA;
          }

          const matriculaAtualizada =
            await tx.matricula.update(
              {
                where: {
                  id:
                    matricula.id,
                },

                data: {
                  poloId:
                    poloDestino.id,

                  turmaPrincipalId:
                    turmaDestino?.id ??
                    null,

                  status:
                    novoStatus,
                },

                select: {
                  id: true,
                  status: true,
                  poloId: true,
                  turmaPrincipalId:
                    true,
                  updatedAt: true,
                },
              }
            );

          const statusTransferencia =
            possuiPendencia
              ? StatusTransferenciaMatricula.PENDENTE
              : StatusTransferenciaMatricula.CONCLUIDA;

          const concluidaEm =
            possuiPendencia
              ? null
              : new Date();

          const snapshotPosterior = {
            matriculaId:
              matriculaAtualizada.id,

            status:
              matriculaAtualizada.status,

            polo: {
              id:
                poloDestino.id,
              nome:
                poloDestino.nome,
            },

            turmaPrincipal:
              turmaDestino
                ? {
                    id:
                      turmaDestino.id,
                    nome:
                      turmaDestino.nome,
                  }
                : null,

            quantidadeMigrada,

            quantidadeAguardando,

            itens:
              itensPosteriores,
          };

          const transferenciaFinal =
            await tx.transferenciaMatricula.update(
              {
                where: {
                  id:
                    transferencia.id,
                },

                data: {
                  status:
                    statusTransferencia,

                  concluidaEm,

                  snapshotPosterior,
                },

                select: {
                  id: true,
                  tipo: true,
                  status: true,
                  dataTransferencia:
                    true,
                  poloOrigemId: true,
                  poloOrigemNomeSnapshot:
                    true,
                  poloDestinoId: true,
                  poloDestinoNomeSnapshot:
                    true,
                  turmaOrigemId: true,
                  turmaOrigemNomeSnapshot:
                    true,
                  turmaDestinoId: true,
                  turmaDestinoNomeSnapshot:
                    true,
                  motivo: true,
                  observacoes: true,
                  concluidaEm: true,
                  createdAt: true,
                },
              }
            );

          return {
            transferencia:
              transferenciaFinal,

            matricula:
              matriculaAtualizada,

            resumo: {
              quantidadeItensAtivos:
                matricula.itens
                  .length,

              quantidadeMigrada,

              quantidadeAguardando,

              possuiPendencia,
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
          resultado.resumo
            .possuiPendencia
            ? "Transferencia de polo registrada. Existem vinculos aguardando turma ou compatibilidade."
            : "Transferencia concluida com sucesso.",

        ...resultado,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return responderErro(
      error
    );
  }
}
