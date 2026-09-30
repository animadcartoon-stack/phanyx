import {
  StatusDocumentoAtividadeExterna,
  TipoDocumentoAtividadeExterna,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type ContextoRota = {
  params: {
    id: string;
  };
};

type ContextoUsuario = {
  id: number;

  instituicaoId: number;

  podeGerenciar: boolean;

  polosPermitidos:
    | number[]
    | null;
};

const TIPOS_DOCUMENTO =
  Object.values(
    TipoDocumentoAtividadeExterna
  );

const STATUS_DOCUMENTO =
  Object.values(
    StatusDocumentoAtividadeExterna
  );

const TRINTA_DIAS_MS =
  30 *
  24 *
  60 *
  60 *
  1000;

function obterIdAtividade(
  contexto: ContextoRota
) {
  const atividadeId =
    Number(
      contexto.params.id
    );

  if (
    !Number.isInteger(
      atividadeId
    ) ||
    atividadeId <= 0
  ) {
    return null;
  }

  return atividadeId;
}

function obterId(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(
      valor
    );

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function limparTexto(
  valor: unknown,
  limite: number
) {
  if (
    typeof valor !==
    "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

function obterBooleano(
  valor: unknown
) {
  return (
    valor === true ||
    valor === "true" ||
    valor === 1 ||
    valor === "1"
  );
}

function valorEnum<
  T extends string
>(
  valor: unknown,
  valores: readonly T[]
): T | null {
  const texto =
    String(
      valor || ""
    )
      .trim()
      .toUpperCase() as T;

  if (
    !valores.includes(
      texto
    )
  ) {
    return null;
  }

  return texto;
}

function parseData(
  valor: unknown
):
  | Date
  | null
  | "INVALIDA" {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const texto =
    String(
      valor
    ).trim();

  if (!texto) {
    return null;
  }

  const data =
    /^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
      ? new Date(
          texto +
            "T12:00:00.000Z"
        )
      : new Date(
          texto
        );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "INVALIDA";
  }

  return data;
}

async function obterContextoUsuario(): Promise<
  ContextoUsuario | null
> {
  const token =
    await getUserFromToken();

  if (!token) {
    return null;
  }

  const usuario =
    await prisma.user.findFirst({
      where: {
        id:
          token.id,

        instituicaoId:
          token.instituicaoId,

        ativo:
          true,
      },

      select: {
        id:
          true,

        instituicaoId:
          true,

        role:
          true,

        acessoTodosPolos:
          true,

        funcionario: {
          select: {
            ativo:
              true,

            statusFuncionario:
              true,

            permissoes: {
              where: {
                ativo:
                  true,
              },

              select: {
                chave:
                  true,
              },
            },

            departamento: {
              select: {
                permissoes: {
                  where: {
                    ativo:
                      true,
                  },

                  select: {
                    chave:
                      true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!usuario) {
    return null;
  }

  const role =
    String(
      usuario.role ||
        ""
    ).toUpperCase();

  const administrador =
    role === "ADMIN" ||
    role ===
      "SUPER_ADMIN";

  let podeVer =
    administrador;

  let podeGerenciar =
    administrador;

  if (!administrador) {
    const funcionario =
      usuario.funcionario;

    if (
      funcionario &&
      funcionario.ativo &&
      funcionario
        .statusFuncionario ===
        "ATIVO"
    ) {
      const permissoes =
        new Set([
          ...(
            funcionario
              .permissoes ||
            []
          ).map(
            (item) =>
              item.chave
          ),

          ...(
            funcionario
              .departamento
              ?.permissoes ||
            []
          ).map(
            (item) =>
              item.chave
          ),
        ]);

      podeVer =
        permissoes.has(
          "atividades-externas.ver"
        ) ||
        permissoes.has(
          "atividades-externas.gerenciar"
        );

      podeGerenciar =
        permissoes.has(
          "atividades-externas.gerenciar"
        );
    }
  }

  if (!podeVer) {
    return null;
  }

  let polosPermitidos:
    | number[]
    | null = null;

  if (
    !usuario
      .acessoTodosPolos
  ) {
    const acessos =
      await prisma
        .userPolo
        .findMany({
          where: {
            userId:
              usuario.id,

            instituicaoId:
              usuario
                .instituicaoId,

            ativo:
              true,
          },

          select: {
            poloId:
              true,
          },
        });

    polosPermitidos =
      acessos.map(
        (item) =>
          item.poloId
      );
  }

  return {
    id:
      usuario.id,

    instituicaoId:
      usuario
        .instituicaoId,

    podeGerenciar,

    polosPermitidos,
  };
}

async function obterAtividade(
  atividadeId: number,
  usuario: ContextoUsuario
) {
  return prisma
    .atividadeExterna
    .findFirst({
      where: {
        id:
          atividadeId,

        instituicaoId:
          usuario
            .instituicaoId,

        ...(
          usuario
            .polosPermitidos !==
          null
            ? {
                OR: [
                  {
                    poloId:
                      null,
                  },

                  {
                    poloId: {
                      in:
                        usuario
                          .polosPermitidos,
                    },
                  },
                ],
              }
            : {}
        ),
      },

      select: {
        id:
          true,

        instituicaoId:
          true,

        poloId:
          true,
      },
    });
}

async function validarVinculos({
  usuario,
  atividadeId,
  participanteId,
  prestadorTransporteId,
  veiculoId,
}: {
  usuario: ContextoUsuario;
  atividadeId: number;
  participanteId: number | null;
  prestadorTransporteId: number | null;
  veiculoId: number | null;
}) {
  let participante:
    | {
        id: number;
      }
    | null = null;

  let prestador:
    | {
        id: number;
      }
    | null = null;

  let veiculo:
    | {
        id: number;
        prestadorTransporteId:
          number | null;
      }
    | null = null;

  if (
    participanteId !==
    null
  ) {
    participante =
      await prisma
        .atividadeExternaParticipante
        .findFirst({
          where: {
            id:
              participanteId,

            atividadeExternaId:
              atividadeId,

            instituicaoId:
              usuario
                .instituicaoId,
          },

          select: {
            id:
              true,
          },
        });

    if (!participante) {
      return {
        ok:
          false as const,

        error:
          "PARTICIPANTE_INVALIDO",
      };
    }
  }

  if (
    prestadorTransporteId !==
    null
  ) {
    prestador =
      await prisma
        .prestadorTransporte
        .findFirst({
          where: {
            id:
              prestadorTransporteId,

            instituicaoId:
              usuario
                .instituicaoId,

            ativo:
              true,
          },

          select: {
            id:
              true,
          },
        });

    if (!prestador) {
      return {
        ok:
          false as const,

        error:
          "PRESTADOR_INVALIDO",
      };
    }
  }

  if (
    veiculoId !==
    null
  ) {
    veiculo =
      await prisma
        .veiculoTransporte
        .findFirst({
          where: {
            id:
              veiculoId,

            instituicaoId:
              usuario
                .instituicaoId,

            ativo:
              true,
          },

          select: {
            id:
              true,

            prestadorTransporteId:
              true,
          },
        });

    if (!veiculo) {
      return {
        ok:
          false as const,

        error:
          "VEICULO_INVALIDO",
      };
    }

    if (
      prestadorTransporteId !==
        null &&
      veiculo
        .prestadorTransporteId !==
        prestadorTransporteId
    ) {
      return {
        ok:
          false as const,

        error:
          "VEICULO_NAO_PERTENCE_AO_PRESTADOR",
      };
    }
  }

  return {
    ok:
      true as const,
  };
}

function informacoesValidade(
  validoAte:
    | Date
    | null,
  status:
    StatusDocumentoAtividadeExterna
) {
  const agora =
    new Date();

  const ignorarValidade =
    status ===
      StatusDocumentoAtividadeExterna
        .ARQUIVADO ||
    status ===
      StatusDocumentoAtividadeExterna
        .SUBSTITUIDO;

  if (
    !validoAte ||
    ignorarValidade
  ) {
    return {
      vencidoPorData:
        false,

      venceEmBreve:
        false,

      diasParaVencer:
        null as number | null,
    };
  }

  const diferenca =
    validoAte.getTime() -
    agora.getTime();

  const diasParaVencer =
    Math.ceil(
      diferenca /
        (
          24 *
          60 *
          60 *
          1000
        )
    );

  return {
    vencidoPorData:
      diferenca < 0,

    venceEmBreve:
      diferenca >= 0 &&
      diferenca <=
        TRINTA_DIAS_MS,

    diasParaVencer,
  };
}

export async function GET(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const atividadeId =
      obterIdAtividade(
        contexto
      );

    if (!atividadeId) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ID_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status:
            403,
        }
      );
    }

    const atividade =
      await obterAtividade(
        atividadeId,
        usuario
      );

    if (!atividade) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ATIVIDADE_NAO_ENCONTRADA",
        },
        {
          status:
            404,
        }
      );
    }

    const [
      documentosBanco,
      participantes,
      prestadores,
      veiculos,
    ] =
      await Promise.all([
        prisma
          .atividadeExternaDocumento
          .findMany({
            where: {
              atividadeExternaId:
                atividadeId,

              instituicaoId:
                usuario
                  .instituicaoId,
            },

            select: {
              id:
                true,

              tipo:
                true,

              titulo:
                true,

              descricao:
                true,

              arquivoUrl:
                true,

              arquivoNome:
                true,

              mimeType:
                true,

              tamanho:
                true,

              numeroDocumento:
                true,

              emitidoEm:
                true,

              validoAte:
                true,

              obrigatorio:
                true,

              confidencial:
                true,

              status:
                true,

              observacao:
                true,

              participanteId:
                true,

              prestadorTransporteId:
                true,

              veiculoId:
                true,

              createdAt:
                true,

              updatedAt:
                true,

              participante: {
                select: {
                  id:
                    true,

                  aluno: {
                    select: {
                      id:
                        true,

                      nome:
                        true,

                      nomeSocial:
                        true,

                      matricula:
                        true,
                    },
                  },
                },
              },

              prestadorTransporte: {
                select: {
                  id:
                    true,

                  nome:
                    true,

                  nomeFantasia:
                    true,
                },
              },

              veiculo: {
                select: {
                  id:
                    true,

                  nomeIdentificacao:
                    true,

                  placa:
                    true,

                  marca:
                    true,

                  modelo:
                    true,
                },
              },

              enviadoPor: {
                select: {
                  id:
                    true,

                  nome:
                    true,
                },
              },

              atualizadoPor: {
                select: {
                  id:
                    true,

                  nome:
                    true,
                },
              },
            },

            orderBy: [
              {
                createdAt:
                  "desc",
              },

              {
                id:
                  "desc",
              },
            ],
          }),

        prisma
          .atividadeExternaParticipante
          .findMany({
            where: {
              atividadeExternaId:
                atividadeId,

              instituicaoId:
                usuario
                  .instituicaoId,
            },

            select: {
              id:
                true,

              statusParticipacao:
                true,

              aluno: {
                select: {
                  id:
                    true,

                  nome:
                    true,

                  nomeSocial:
                    true,

                  matricula:
                    true,
                },
              },
            },

            orderBy: {
              id:
                "asc",
            },
          }),

        prisma
          .prestadorTransporte
          .findMany({
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              ativo:
                true,
            },

            select: {
              id:
                true,

              nome:
                true,

              nomeFantasia:
                true,

              tipo:
                true,
            },

            orderBy: {
              nome:
                "asc",
            },
          }),

        prisma
          .veiculoTransporte
          .findMany({
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              ativo:
                true,
            },

            select: {
              id:
                true,

              prestadorTransporteId:
                true,

              nomeIdentificacao:
                true,

              placa:
                true,

              marca:
                true,

              modelo:
                true,

              tipo:
                true,

              prestadorTransporte: {
                select: {
                  id:
                    true,

                  nome:
                    true,

                  nomeFantasia:
                    true,
                },
              },
            },

            orderBy: [
              {
                nomeIdentificacao:
                  "asc",
              },

              {
                placa:
                  "asc",
              },
            ],
          }),
      ]);

    const documentos =
      documentosBanco.map(
        (documento) => {
          const validade =
            informacoesValidade(
              documento
                .validoAte,
              documento
                .status
            );

          return {
            id:
              documento.id,

            tipo:
              documento.tipo,

            titulo:
              documento.titulo,

            descricao:
              documento
                .descricao,

            arquivoNome:
              documento
                .arquivoNome,

            mimeType:
              documento
                .mimeType,

            tamanho:
              documento
                .tamanho,

            temArquivo:
              Boolean(
                documento
                  .arquivoUrl
              ),

            conteudoUrl:
              documento
                .arquivoUrl
                ? `/api/admin/atividades-externas/${atividadeId}/documentos/${documento.id}/conteudo`
                : null,

            numeroDocumento:
              documento
                .numeroDocumento,

            emitidoEm:
              documento
                .emitidoEm,

            validoAte:
              documento
                .validoAte,

            obrigatorio:
              documento
                .obrigatorio,

            confidencial:
              documento
                .confidencial,

            status:
              documento
                .status,

            observacao:
              documento
                .observacao,

            participanteId:
              documento
                .participanteId,

            prestadorTransporteId:
              documento
                .prestadorTransporteId,

            veiculoId:
              documento
                .veiculoId,

            participante:
              documento
                .participante
                ? {
                    id:
                      documento
                        .participante
                        .id,

                    nome:
                      documento
                        .participante
                        .aluno
                        .nomeSocial ||
                      documento
                        .participante
                        .aluno
                        .nome,

                    matricula:
                      documento
                        .participante
                        .aluno
                        .matricula,
                  }
                : null,

            prestadorTransporte:
              documento
                .prestadorTransporte,

            veiculo:
              documento
                .veiculo,

            enviadoPor:
              documento
                .enviadoPor,

            atualizadoPor:
              documento
                .atualizadoPor,

            createdAt:
              documento
                .createdAt,

            updatedAt:
              documento
                .updatedAt,

            ...validade,
          };
        }
      );

    const documentosAtuais =
      documentos.filter(
        (item) =>
          item.status !==
            StatusDocumentoAtividadeExterna
              .ARQUIVADO &&
          item.status !==
            StatusDocumentoAtividadeExterna
              .SUBSTITUIDO
      );

    const vencidos =
      documentosAtuais.filter(
        (item) =>
          item.status ===
            StatusDocumentoAtividadeExterna
              .VENCIDO ||
          item.vencidoPorData
      ).length;

    const vencemEmBreve =
      documentosAtuais.filter(
        (item) =>
          !item
            .vencidoPorData &&
          item
            .venceEmBreve
      ).length;

    return NextResponse.json({
      ok:
        true,

      podeGerenciar:
        usuario
          .podeGerenciar,

      tipos:
        TIPOS_DOCUMENTO,

      statusDisponiveis:
        STATUS_DOCUMENTO,

      resumo: {
        total:
          documentosAtuais
            .length,

        obrigatorios:
          documentosAtuais.filter(
            (item) =>
              item
                .obrigatorio
          ).length,

        pendentesOuEmAnalise:
          documentosAtuais.filter(
            (item) =>
              item.status ===
                StatusDocumentoAtividadeExterna
                  .PENDENTE ||
              item.status ===
                StatusDocumentoAtividadeExterna
                  .EM_ANALISE
          ).length,

        vencidos,

        vencemEmBreve,

        confidenciais:
          documentosAtuais.filter(
            (item) =>
              item
                .confidencial
          ).length,
      },

      documentos,

      participantes:
        participantes.map(
          (item) => ({
            id:
              item.id,

            statusParticipacao:
              item
                .statusParticipacao,

            alunoId:
              item
                .aluno.id,

            nome:
              item
                .aluno
                .nomeSocial ||
              item
                .aluno.nome,

            matricula:
              item
                .aluno
                .matricula,
          })
        ),

      prestadores,

      veiculos,
    });
  } catch (erro) {
    console.error(
      "ERRO_GET_DOCUMENTOS_ATIVIDADE_EXTERNA",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_AO_CARREGAR_DOCUMENTOS",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const atividadeId =
      obterIdAtividade(
        contexto
      );

    if (!atividadeId) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ID_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status:
            403,
        }
      );
    }

    if (
      !usuario
        .podeGerenciar
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "SEM_PERMISSAO_PARA_GERENCIAR",
        },
        {
          status:
            403,
        }
      );
    }

    const atividade =
      await obterAtividade(
        atividadeId,
        usuario
      );

    if (!atividade) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ATIVIDADE_NAO_ENCONTRADA",
        },
        {
          status:
            404,
        }
      );
    }

    const corpo =
      await request.json();

    const acao =
      String(
        corpo?.acao ||
          ""
      )
        .trim()
        .toUpperCase();

    if (
      acao ===
      "ALTERAR_STATUS"
    ) {
      const documentoId =
        obterId(
          corpo
            ?.documentoId
        );

      const status =
        valorEnum(
          corpo?.status,
          STATUS_DOCUMENTO
        );

      if (
        !documentoId ||
        !status
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DADOS_INVALIDOS",
          },
          {
            status:
              400,
          }
        );
      }

      const existente =
        await prisma
          .atividadeExternaDocumento
          .findFirst({
            where: {
              id:
                documentoId,

              atividadeExternaId:
                atividadeId,

              instituicaoId:
                usuario
                  .instituicaoId,
            },

            select: {
              id:
                true,
            },
          });

      if (!existente) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_NAO_ENCONTRADO",
          },
          {
            status:
              404,
          }
        );
      }

      const documento =
        await prisma
          .atividadeExternaDocumento
          .update({
            where: {
              id:
                documentoId,
            },

            data: {
              status,

              atualizadoPorId:
                usuario.id,
            },
          });

      return NextResponse.json({
        ok:
          true,

        documento,
      });
    }

    if (
      acao ===
      "PREPARAR_SUBSTITUICAO"
    ) {
      const documentoAnteriorId =
        obterId(
          corpo?.documentoId
        );

      if (
        !documentoAnteriorId
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_INVALIDO",
          },
          {
            status:
              400,
          }
        );
      }

      const anterior =
        await prisma
          .atividadeExternaDocumento
          .findFirst({
            where: {
              id:
                documentoAnteriorId,

              atividadeExternaId:
                atividadeId,

              instituicaoId:
                usuario
                  .instituicaoId,
            },

            select: {
              id:
                true,

              tipo:
                true,

              titulo:
                true,

              descricao:
                true,

              numeroDocumento:
                true,

              emitidoEm:
                true,

              validoAte:
                true,

              obrigatorio:
                true,

              confidencial:
                true,

              observacao:
                true,

              participanteId:
                true,

              prestadorTransporteId:
                true,

              veiculoId:
                true,

              arquivoUrl:
                true,

              status:
                true,
            },
          });

      if (!anterior) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_NAO_ENCONTRADO",
          },
          {
            status:
              404,
          }
        );
      }

      if (
        anterior.status ===
          StatusDocumentoAtividadeExterna
            .ARQUIVADO ||
        anterior.status ===
          StatusDocumentoAtividadeExterna
            .SUBSTITUIDO
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_NAO_PODE_SER_SUBSTITUIDO",
          },
          {
            status:
              409,
          }
        );
      }

      if (
        !anterior
          .arquivoUrl
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_SEM_ARQUIVO_PARA_SUBSTITUIR",
          },
          {
            status:
              409,
          }
        );
      }

      const novo =
        await prisma
          .atividadeExternaDocumento
          .create({
            data: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividadeId,

              tipo:
                anterior.tipo,

              titulo:
                anterior.titulo,

              descricao:
                anterior
                  .descricao,

              numeroDocumento:
                anterior
                  .numeroDocumento,

              emitidoEm:
                anterior
                  .emitidoEm,

              validoAte:
                anterior
                  .validoAte,

              obrigatorio:
                anterior
                  .obrigatorio,

              confidencial:
                anterior
                  .confidencial,

              observacao:
                anterior
                  .observacao,

              participanteId:
                anterior
                  .participanteId,

              prestadorTransporteId:
                anterior
                  .prestadorTransporteId,

              veiculoId:
                anterior
                  .veiculoId,

              status:
                StatusDocumentoAtividadeExterna
                  .PENDENTE,

              enviadoPorId:
                usuario.id,

              atualizadoPorId:
                usuario.id,
            },

            select: {
              id:
                true,

              tipo:
                true,

              titulo:
                true,

              status:
                true,

              participanteId:
                true,

              prestadorTransporteId:
                true,

              veiculoId:
                true,

              createdAt:
                true,
            },
          });

      return NextResponse.json({
        ok:
          true,

        substituicao: {
          documentoAnteriorId:
            anterior.id,

          documentoNovoId:
            novo.id,
        },

        documento:
          novo,
      });
    }

    if (
      acao ===
      "FINALIZAR_SUBSTITUICAO"
    ) {
      const documentoAnteriorId =
        obterId(
          corpo
            ?.documentoAnteriorId
        );

      const documentoNovoId =
        obterId(
          corpo
            ?.documentoNovoId
        );

      if (
        !documentoAnteriorId ||
        !documentoNovoId ||
        documentoAnteriorId ===
          documentoNovoId
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "SUBSTITUICAO_INVALIDA",
          },
          {
            status:
              400,
          }
        );
      }

      const [
        anterior,
        novo,
      ] =
        await Promise.all([
          prisma
            .atividadeExternaDocumento
            .findFirst({
              where: {
                id:
                  documentoAnteriorId,

                atividadeExternaId:
                  atividadeId,

                instituicaoId:
                  usuario
                    .instituicaoId,
              },

              select: {
                id:
                  true,

                tipo:
                  true,

                participanteId:
                  true,

                prestadorTransporteId:
                  true,

                veiculoId:
                  true,

                status:
                  true,

                arquivoUrl:
                  true,
              },
            }),

          prisma
            .atividadeExternaDocumento
            .findFirst({
              where: {
                id:
                  documentoNovoId,

                atividadeExternaId:
                  atividadeId,

                instituicaoId:
                  usuario
                    .instituicaoId,
              },

              select: {
                id:
                  true,

                tipo:
                  true,

                participanteId:
                  true,

                prestadorTransporteId:
                  true,

                veiculoId:
                  true,

                status:
                  true,

                arquivoUrl:
                  true,

                arquivoNome:
                  true,

                mimeType:
                  true,

                tamanho:
                  true,
              },
            }),
        ]);

      if (
        !anterior ||
        !novo
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_NAO_ENCONTRADO",
          },
          {
            status:
              404,
          }
        );
      }

      if (
        anterior.status ===
          StatusDocumentoAtividadeExterna
            .ARQUIVADO ||
        anterior.status ===
          StatusDocumentoAtividadeExterna
            .SUBSTITUIDO
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_ANTERIOR_NAO_PODE_SER_SUBSTITUIDO",
          },
          {
            status:
              409,
          }
        );
      }

      if (
        novo.status ===
          StatusDocumentoAtividadeExterna
            .ARQUIVADO ||
        novo.status ===
          StatusDocumentoAtividadeExterna
            .SUBSTITUIDO
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTO_NOVO_INVALIDO",
          },
          {
            status:
              409,
          }
        );
      }

      if (
        !novo.arquivoUrl ||
        !novo.arquivoNome ||
        !novo.mimeType ||
        !novo.tamanho
      ) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "NOVO_DOCUMENTO_SEM_ARQUIVO_VALIDADO",
          },
          {
            status:
              409,
          }
        );
      }

      /*
       * Sem relacao explicita de substituicao
       * no schema, exigimos que ambos sejam
       * semanticamente equivalentes.
       *
       * Assim um documento qualquer nao pode
       * ser usado para substituir outro.
       */
      const mesmosVinculos =
        anterior.tipo ===
          novo.tipo &&
        anterior.participanteId ===
          novo.participanteId &&
        anterior.prestadorTransporteId ===
          novo.prestadorTransporteId &&
        anterior.veiculoId ===
          novo.veiculoId;

      if (!mesmosVinculos) {
        return NextResponse.json(
          {
            ok:
              false,

            error:
              "DOCUMENTOS_NAO_CORRESPONDEM_PARA_SUBSTITUICAO",
          },
          {
            status:
              409,
          }
        );
      }

      const resultado =
        await prisma.$transaction(
          async (
            tx
          ) => {
            const anteriorAtual =
              await tx
                .atividadeExternaDocumento
                .findFirst({
                  where: {
                    id:
                      documentoAnteriorId,

                    atividadeExternaId:
                      atividadeId,

                    instituicaoId:
                      usuario
                        .instituicaoId,
                  },

                  select: {
                    id:
                      true,

                    status:
                      true,
                  },
                });

            const novoAtual =
              await tx
                .atividadeExternaDocumento
                .findFirst({
                  where: {
                    id:
                      documentoNovoId,

                    atividadeExternaId:
                      atividadeId,

                    instituicaoId:
                      usuario
                        .instituicaoId,
                  },

                  select: {
                    id:
                      true,

                    arquivoUrl:
                      true,

                    status:
                      true,
                  },
                });

            if (
              !anteriorAtual ||
              !novoAtual ||
              !novoAtual
                .arquivoUrl
            ) {
              throw new Error(
                "SUBSTITUICAO_CONCORRENTE_INVALIDA"
              );
            }

            if (
              anteriorAtual
                .status ===
                StatusDocumentoAtividadeExterna
                  .ARQUIVADO ||
              anteriorAtual
                .status ===
                StatusDocumentoAtividadeExterna
                  .SUBSTITUIDO
            ) {
              throw new Error(
                "DOCUMENTO_ANTERIOR_JA_FINALIZADO"
              );
            }

            const anteriorAtualizado =
              await tx
                .atividadeExternaDocumento
                .update({
                  where: {
                    id:
                      documentoAnteriorId,
                  },

                  data: {
                    status:
                      StatusDocumentoAtividadeExterna
                        .SUBSTITUIDO,

                    atualizadoPorId:
                      usuario.id,
                  },

                  select: {
                    id:
                      true,

                    status:
                      true,

                    updatedAt:
                      true,
                  },
                });

            const novoAtualizado =
              await tx
                .atividadeExternaDocumento
                .update({
                  where: {
                    id:
                      documentoNovoId,
                  },

                  data: {
                    status:
                      StatusDocumentoAtividadeExterna
                        .ATIVO,

                    atualizadoPorId:
                      usuario.id,
                  },

                  select: {
                    id:
                      true,

                    status:
                      true,

                    arquivoNome:
                      true,

                    mimeType:
                      true,

                    tamanho:
                      true,

                    updatedAt:
                      true,
                  },
                });

            return {
              anterior:
                anteriorAtualizado,

              novo:
                novoAtualizado,
            };
          }
        );

      return NextResponse.json({
        ok:
          true,

        substituicao:
          resultado,
      });
    }

    if (
      acao !== "CRIAR" &&
      acao !==
        "ATUALIZAR"
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ACAO_INVALIDA",
        },
        {
          status:
            400,
        }
      );
    }

    const documentoId =
      acao ===
      "ATUALIZAR"
        ? obterId(
            corpo
              ?.documentoId
          )
        : null;

    if (
      acao ===
        "ATUALIZAR" &&
      !documentoId
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "DOCUMENTO_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const tipo =
      valorEnum(
        corpo?.tipo,
        TIPOS_DOCUMENTO
      );

    const titulo =
      limparTexto(
        corpo?.titulo,
        240
      );

    const descricao =
      limparTexto(
        corpo
          ?.descricao,
        5000
      );

    const numeroDocumento =
      limparTexto(
        corpo
          ?.numeroDocumento,
        160
      );

    const observacao =
      limparTexto(
        corpo
          ?.observacao,
        5000
      );

    const emitidoEm =
      parseData(
        corpo
          ?.emitidoEm
      );

    const validoAte =
      parseData(
        corpo
          ?.validoAte
      );

    const participanteId =
      obterId(
        corpo
          ?.participanteId
      );

    const prestadorTransporteId =
      obterId(
        corpo
          ?.prestadorTransporteId
      );

    const veiculoId =
      obterId(
        corpo
          ?.veiculoId
      );

    const obrigatorio =
      obterBooleano(
        corpo
          ?.obrigatorio
      );

    const confidencial =
      obterBooleano(
        corpo
          ?.confidencial
      );

    const statusInformado =
      corpo?.status
        ? valorEnum(
            corpo.status,
            STATUS_DOCUMENTO
          )
        : null;

    if (
      !tipo ||
      !titulo
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "TIPO_E_TITULO_SAO_OBRIGATORIOS",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      emitidoEm ===
        "INVALIDA" ||
      validoAte ===
        "INVALIDA"
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "DATA_INVALIDA",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      corpo?.status &&
      !statusInformado
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "STATUS_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      emitidoEm &&
      validoAte &&
      validoAte.getTime() <
        emitidoEm.getTime()
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "VALIDADE_ANTERIOR_A_EMISSAO",
        },
        {
          status:
            400,
        }
      );
    }

    const vinculos =
      await validarVinculos({
        usuario,
        atividadeId,
        participanteId,
        prestadorTransporteId,
        veiculoId,
      });

    if (!vinculos.ok) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            vinculos.error,
        },
        {
          status:
            400,
        }
      );
    }

    if (
      acao === "CRIAR"
    ) {
      const documento =
        await prisma
          .atividadeExternaDocumento
          .create({
            data: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividadeId,

              tipo,

              titulo,

              descricao,

              numeroDocumento,

              emitidoEm,

              validoAte,

              obrigatorio,

              confidencial,

              observacao,

              participanteId,

              prestadorTransporteId,

              veiculoId,

              status:
                statusInformado ??
                StatusDocumentoAtividadeExterna
                  .PENDENTE,

              enviadoPorId:
                usuario.id,

              atualizadoPorId:
                usuario.id,
            },
          });

      return NextResponse.json({
        ok:
          true,

        documento,
      });
    }

    const existente =
      await prisma
        .atividadeExternaDocumento
        .findFirst({
          where: {
            id:
              documentoId!,

            atividadeExternaId:
              atividadeId,

            instituicaoId:
              usuario
                .instituicaoId,
          },

          select: {
            id:
              true,
          },
        });

    if (!existente) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "DOCUMENTO_NAO_ENCONTRADO",
        },
        {
          status:
            404,
        }
      );
    }

    const documento =
      await prisma
        .atividadeExternaDocumento
        .update({
          where: {
            id:
              documentoId!,
          },

          data: {
            tipo,

            titulo,

            descricao,

            numeroDocumento,

            emitidoEm,

            validoAte,

            obrigatorio,

            confidencial,

            observacao,

            participanteId,

            prestadorTransporteId,

            veiculoId,

            ...(
              statusInformado
                ? {
                    status:
                      statusInformado,
                  }
                : {}
            ),

            atualizadoPorId:
              usuario.id,
          },
        });

    return NextResponse.json({
      ok:
        true,

      documento,
    });
  } catch (erro) {
    console.error(
      "ERRO_POST_DOCUMENTOS_ATIVIDADE_EXTERNA",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_AO_SALVAR_DOCUMENTO",
      },
      {
        status:
          500,
      }
    );
  }
}
