import {
  Prisma,
  SituacaoItemTransferenciaMatricula,
  StatusItemMatricula,
  StatusMatricula,
  StatusTransferenciaMatricula,
  TipoTransferenciaMatricula,
} from "@prisma/client";

import {
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

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

    this.status =
      status;

    this.codigo =
      codigo;

    this.detalhes =
      detalhes;
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

function dataTransferencia(
  valor: unknown
) {
  if (
    typeof valor !==
    "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    return null;
  }

  /*
   * Meio-dia UTC evita a data
   * aparecer no dia anterior em
   * fusos negativos.
   */
  const data =
    new Date(
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

function nomeUsuario(
  user: unknown
) {
  const u =
    user as Record<
      string,
      unknown
    >;

  const valor =
    u?.nome ??
    u?.name ??
    u?.email ??
    null;

  if (
    typeof valor ===
      "string" &&
    valor.trim()
  ) {
    return valor.trim();
  }

  return null;
}

function responderErro(
  error: unknown
) {
  if (
    error instanceof
    ErroApi
  ) {
    return NextResponse.json(
      {
        success:
          false,

        codigo:
          error.codigo,

        error:
          error.message,

        detalhes:
          error.detalhes ??
          undefined,
      },
      {
        status:
          error.status,
      }
    );
  }

  if (
    error instanceof
      Prisma
        .PrismaClientKnownRequestError &&
    error.code ===
      "P2034"
  ) {
    return NextResponse.json(
      {
        success:
          false,

        codigo:
          "CONFLITO_CONCORRENCIA",

        error:
          "A matricula foi alterada simultaneamente. Atualize a pagina e tente novamente.",
      },
      {
        status:
          409,
      }
    );
  }

  console.error(
    "Erro ao trocar turma:",
    error
  );

  return NextResponse.json(
    {
      success:
        false,

      codigo:
        "ERRO_TROCA_TURMA",

      error:
        "Nao foi possivel concluir a troca de turma.",
    },
    {
      status:
        500,
    }
  );
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
      throw new ErroApi(
        403,
        "Sem permissao.",
        "SEM_PERMISSAO"
      );
    }

    const matriculaId =
      inteiroPositivo(
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

    const data =
      dataTransferencia(
        body?.dataTransferencia
      );

    if (!data) {
      throw new ErroApi(
        400,
        "Informe uma data de transferencia valida.",
        "DATA_TRANSFERENCIA_INVALIDA"
      );
    }

    const motivo =
      typeof body?.motivo ===
        "string"
        ? body.motivo.trim()
        : "";

    if (
      motivo.length < 3
    ) {
      throw new ErroApi(
        400,
        "Informe o motivo da transferencia.",
        "MOTIVO_OBRIGATORIO"
      );
    }

    const observacoes =
      typeof body
        ?.observacoes ===
        "string"
        ? body.observacoes
            .trim() ||
          null
        : null;

    const forwardedFor =
      req.headers.get(
        "x-forwarded-for"
      );

    const ip =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ||
      req.headers.get(
        "x-real-ip"
      ) ||
      null;

    const userAgent =
      req.headers.get(
        "user-agent"
      ) ||
      null;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          /*
           * =============================================
           * MATRICULA ATUAL
           * =============================================
           */

          const matricula =
            await tx.matricula.findFirst({
              where: {
                id:
                  matriculaId,

                instituicaoId:
                  user.instituicaoId,
              },

              select: {
                id: true,
                instituicaoId:
                  true,

                alunoId:
                  true,

                status:
                  true,

                poloId:
                  true,

                cursoId:
                  true,

                cursoSemestreId:
                  true,

                turmaPrincipalId:
                  true,

                aluno: {
                  select: {
                    id: true,
                    nome: true,
                    nomeSocial:
                      true,
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
                      in: [
                        StatusItemMatricula.A_CURSAR,
                        StatusItemMatricula.EM_CURSO,
                      ],
                    },
                  },

                  orderBy: {
                    id:
                      "asc",
                  },

                  select: {
                    id: true,

                    turmaId:
                      true,

                    disciplinaId:
                      true,

                    tipoItem:
                      true,

                    status:
                      true,

                    disciplina: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },

                    turma: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                  },
                },
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
            matricula.status !==
            StatusMatricula.ATIVA
          ) {
            throw new ErroApi(
              409,
              "Apenas matriculas ativas podem trocar de turma por este fluxo.",
              "MATRICULA_NAO_ATIVA"
            );
          }

          if (
            !matricula
              .turmaPrincipalId ||
            !matricula
              .turmaPrincipal
          ) {
            throw new ErroApi(
              409,
              "A matricula nao possui turma atual.",
              "SEM_TURMA_ORIGEM"
            );
          }

          if (
            turmaDestinoId ===
            matricula
              .turmaPrincipalId
          ) {
            throw new ErroApi(
              400,
              "A turma de destino deve ser diferente da turma atual.",
              "MESMA_TURMA"
            );
          }

          if (
            matricula.itens
              .length === 0
          ) {
            throw new ErroApi(
              409,
              "A matricula nao possui disciplinas ativas para transferir.",
              "SEM_ITENS_ATIVOS"
            );
          }

          /*
           * Nenhuma transferencia pendente
           * pode coexistir com esta troca.
           */
          const pendente =
            await tx
              .transferenciaMatricula
              .findFirst({
                where: {
                  instituicaoId:
                    matricula
                      .instituicaoId,

                  matriculaId:
                    matricula.id,

                  status:
                    StatusTransferenciaMatricula.PENDENTE,
                },

                select: {
                  id: true,
                },
              });

          if (pendente) {
            throw new ErroApi(
              409,
              "Esta matricula possui uma transferencia pendente.",
              "TRANSFERENCIA_PENDENTE_EXISTENTE",
              {
                transferenciaId:
                  pendente.id,
              }
            );
          }

          /*
           * =============================================
           * TURMA DESTINO
           * =============================================
           */

          const turmaDestino =
            await tx.turma.findFirst({
              where: {
                id:
                  turmaDestinoId,

                instituicaoId:
                  matricula
                    .instituicaoId,

                ativa:
                  true,
              },

              select: {
                id: true,
                nome: true,

                poloId:
                  true,

                cursoId:
                  true,

                periodoLetivo:
                  true,

                semestre:
                  true,

                modalidade:
                  true,

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

                disciplinas: {
                  select: {
                    disciplinaId:
                      true,

                    disciplina: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                  },
                },
              },
            });

          if (!turmaDestino) {
            throw new ErroApi(
              404,
              "Turma de destino nao encontrada.",
              "TURMA_DESTINO_NAO_ENCONTRADA"
            );
          }

          /*
           * Este endpoint altera SOMENTE turma.
           */
          if (
            turmaDestino
              .poloId !==
            matricula.poloId
          ) {
            throw new ErroApi(
              409,
              "A turma pertence a outro polo. Utilize o fluxo Outro polo.",
              "POLO_DIFERENTE"
            );
          }

          if (
            turmaDestino
              .cursoId !==
            matricula.cursoId
          ) {
            throw new ErroApi(
              409,
              "A turma pertence a outro curso. Utilize o fluxo Curso e turma.",
              "CURSO_DIFERENTE"
            );
          }

          /*
           * =============================================
           * COMPATIBILIDADE
           * =============================================
           */

          const disciplinasDestino =
            new Set(
              turmaDestino
                .disciplinas
                .map(
                  (item) =>
                    item
                      .disciplinaId
                )
            );

          const faltantes =
            matricula.itens
              .filter(
                (item) =>
                  !disciplinasDestino
                    .has(
                      item
                        .disciplinaId
                    )
              )
              .map(
                (item) => ({
                  disciplinaId:
                    item
                      .disciplinaId,

                  nome:
                    item
                      .disciplina
                      .nome,
                })
              );

          if (
            faltantes.length >
            0
          ) {
            throw new ErroApi(
              409,
              "A turma de destino nao possui todas as disciplinas ativas da matricula.",
              "TURMA_INCOMPATIVEL",
              {
                disciplinasFaltantes:
                  faltantes,
              }
            );
          }

          const idsDisciplinas =
            matricula.itens
              .map(
                (item) =>
                  item
                    .disciplinaId
              );

          /*
           * Evita duplicar vinculos ativos
           * caso a requisicao seja repetida
           * ou a turma ja possua itens.
           */
          const conflitos =
            await tx
              .itemMatricula
              .findMany({
                where: {
                  matriculaId:
                    matricula.id,

                  turmaId:
                    turmaDestino.id,

                  disciplinaId: {
                    in:
                      idsDisciplinas,
                  },

                  status: {
                    in: [
                      StatusItemMatricula.A_CURSAR,
                      StatusItemMatricula.EM_CURSO,
                    ],
                  },
                },

                select: {
                  id: true,
                  disciplinaId:
                    true,
                },
              });

          if (
            conflitos.length >
            0
          ) {
            throw new ErroApi(
              409,
              "A matricula ja possui vinculos ativos na turma de destino.",
              "VINCULOS_DESTINO_EXISTENTES",
              {
                itens:
                  conflitos,
              }
            );
          }

          /*
           * Confirma que a turma principal
           * continua a mesma que foi lida.
           * Com isolamento SERIALIZABLE,
           * uma alteracao concorrente faz a
           * transacao falhar.
           */
          const turmaOrigemId =
            matricula
              .turmaPrincipalId;

          const turmaOrigemNome =
            matricula
              .turmaPrincipal
              .nome;

          const snapshotAnterior = {
            matricula: {
              id:
                matricula.id,

              status:
                matricula.status,

              poloId:
                matricula.poloId,

              cursoId:
                matricula.cursoId,

              cursoSemestreId:
                matricula
                  .cursoSemestreId,

              turmaPrincipalId:
                turmaOrigemId,
            },

            itens:
              matricula.itens
                .map(
                  (item) => ({
                    id:
                      item.id,

                    turmaId:
                      item
                        .turmaId,

                    disciplinaId:
                      item
                        .disciplinaId,

                    tipoItem:
                      item
                        .tipoItem,

                    status:
                      item
                        .status,
                  })
                ),
          };

          /*
           * =============================================
           * REGISTRO DA TRANSFERENCIA
           * =============================================
           */

          const transferencia =
            await tx
              .transferenciaMatricula
              .create({
                data: {
                  instituicaoId:
                    matricula
                      .instituicaoId,

                  matriculaId:
                    matricula.id,

                  tipo:
                    TipoTransferenciaMatricula.CURSO_TURMA,

                  status:
                    StatusTransferenciaMatricula.CONCLUIDA,

                  dataTransferencia:
                    data,

                  motivo,

                  observacoes,

                  alunoOrigemId:
                    matricula
                      .alunoId,

                  alunoOrigemNomeSnapshot:
                    matricula
                      .aluno
                      .nomeSocial ||
                    matricula
                      .aluno
                      .nome,

                  alunoDestinoId:
                    matricula
                      .alunoId,

                  alunoDestinoNomeSnapshot:
                    matricula
                      .aluno
                      .nomeSocial ||
                    matricula
                      .aluno
                      .nome,

                  instituicaoOrigemId:
                    matricula
                      .instituicaoId,

                  instituicaoOrigemNomeSnapshot:
                    matricula
                      .instituicao
                      .nome,

                  instituicaoDestinoId:
                    matricula
                      .instituicaoId,

                  instituicaoDestinoNomeSnapshot:
                    matricula
                      .instituicao
                      .nome,

                  poloOrigemId:
                    matricula
                      .poloId,

                  poloOrigemNomeSnapshot:
                    matricula
                      .polo
                      ?.nome ||
                    null,

                  poloDestinoId:
                    matricula
                      .poloId,

                  poloDestinoNomeSnapshot:
                    matricula
                      .polo
                      ?.nome ||
                    null,

                  cursoOrigemId:
                    matricula
                      .cursoId,

                  cursoOrigemNomeSnapshot:
                    matricula
                      .curso
                      ?.nome ||
                    null,

                  cursoDestinoId:
                    matricula
                      .cursoId,

                  cursoDestinoNomeSnapshot:
                    matricula
                      .curso
                      ?.nome ||
                    null,

                  turmaOrigemId,

                  turmaOrigemNomeSnapshot:
                    turmaOrigemNome,

                  turmaDestinoId:
                    turmaDestino.id,

                  turmaDestinoNomeSnapshot:
                    turmaDestino.nome,

                  realizadoPorId:
                    inteiroPositivo(
                      user.id
                    ),

                  realizadoPorNomeSnapshot:
                    nomeUsuario(
                      user
                    ),

                  ip,

                  userAgent,

                  snapshotAnterior,

                  concluidaEm:
                    new Date(),
                },

                select: {
                  id: true,
                },
              });

          const novosItens: Array<{
            origemId: number;
            destinoId: number;
            disciplinaId: number;
            status: StatusItemMatricula;
          }> = [];

          /*
           * =============================================
           * ITENS ACADEMICOS
           * =============================================
           */

          for (
            const item
            of matricula.itens
          ) {
            const statusDestino =
              item.status ===
              StatusItemMatricula.EM_CURSO
                ? StatusItemMatricula.EM_CURSO
                : StatusItemMatricula.A_CURSAR;

            const novoItem =
              await tx
                .itemMatricula
                .create({
                  data: {
                    instituicaoId:
                      matricula
                        .instituicaoId,

                    matriculaId:
                      matricula.id,

                    turmaId:
                      turmaDestino.id,

                    disciplinaId:
                      item
                        .disciplinaId,

                    tipoItem:
                      item
                        .tipoItem,

                    status:
                      statusDestino,
                  },

                  select: {
                    id: true,
                    status: true,
                  },
                });

            await tx
              .itemMatricula
              .update({
                where: {
                  id:
                    item.id,
                },

                data: {
                  status:
                    StatusItemMatricula.TRANSFERIDO,
                },
              });

            await tx
              .transferenciaMatriculaItem
              .create({
                data: {
                  transferenciaId:
                    transferencia.id,

                  itemMatriculaOrigemId:
                    item.id,

                  itemMatriculaDestinoId:
                    novoItem.id,

                  disciplinaId:
                    item
                      .disciplinaId,

                  disciplinaNomeSnapshot:
                    item
                      .disciplina
                      .nome,

                  turmaOrigemId:
                    turmaOrigemId,

                  turmaOrigemNomeSnapshot:
                    turmaOrigemNome,

                  turmaDestinoId:
                    turmaDestino.id,

                  turmaDestinoNomeSnapshot:
                    turmaDestino.nome,

                  tipoItem:
                    item
                      .tipoItem,

                  statusOrigem:
                    item
                      .status,

                  statusDestino:
                    novoItem
                      .status,

                  situacao:
                    SituacaoItemTransferenciaMatricula.MIGRADO,
                },
              });

            novosItens.push({
              origemId:
                item.id,

              destinoId:
                novoItem.id,

              disciplinaId:
                item
                  .disciplinaId,

              status:
                novoItem
                  .status,
            });
          }

          /*
           * =============================================
           * MATRICULA
           * =============================================
           */

          const matriculaAtualizada =
            await tx
              .matricula
              .update({
                where: {
                  id:
                    matricula.id,
                },

                data: {
                  turmaPrincipalId:
                    turmaDestino.id,

                  /*
                   * Polo, curso e semestre
                   * curricular permanecem.
                   */
                  status:
                    StatusMatricula.ATIVA,
                },

                select: {
                  id: true,
                  status: true,

                  poloId: true,
                  cursoId: true,

                  cursoSemestreId:
                    true,

                  turmaPrincipalId:
                    true,
                },
              });

          const snapshotPosterior = {
            matricula:
              matriculaAtualizada,

            itens:
              novosItens.map(
                (item) => ({
                  id:
                    item.destinoId,

                  itemOrigemId:
                    item.origemId,

                  turmaId:
                    turmaDestino.id,

                  disciplinaId:
                    item
                      .disciplinaId,

                  status:
                    item.status,
                })
              ),
          };

          await tx
            .transferenciaMatricula
            .update({
              where: {
                id:
                  transferencia.id,
              },

              data: {
                snapshotPosterior,
              },
            });

          return {
            transferenciaId:
              transferencia.id,

            matricula:
              matriculaAtualizada,

            origem: {
              turmaId:
                turmaOrigemId,

              turmaNome:
                turmaOrigemNome,
            },

            destino: {
              turmaId:
                turmaDestino.id,

              turmaNome:
                turmaDestino.nome,
            },

            quantidadeMigrada:
              novosItens.length,

            itens:
              novosItens,
          };
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait:
            5000,

          timeout:
            20000,
        }
      );

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Troca de turma concluida com sucesso.",

        resultado,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    return responderErro(
      error
    );
  }
}
