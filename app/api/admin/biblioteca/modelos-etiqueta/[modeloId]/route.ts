import {
  AcaoAuditoriaBiblioteca,
  BibliotecaOrigemModeloEtiqueta,
  Prisma,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import {
  bancoParaEntrada,
  booleanoOpcional,
  entradaParaDadosPrisma,
  normalizarEntradaModeloEtiqueta,
  serializarModeloBanco,
} from "@/lib/biblioteca/modelos-etiqueta-servidor";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";


export const dynamic =
  "force-dynamic";

export const revalidate =
  0;


type ContextoRota = {
  params: {
    modeloId:
      string;
  };
};


function obterModeloId(
  params:
    ContextoRota["params"],
) {
  const modeloId =
    Number(
      params.modeloId
    );

  if (
    !Number.isInteger(
      modeloId
    ) ||
    modeloId <= 0
  ) {
    throw new ErroBiblioteca(
      400,
      "Identificador do modelo de etiqueta inválido.",
      "MODELO_ETIQUETA_ID_INVALIDO",
    );
  }

  return modeloId;
}



function obterIp(
  request:
    NextRequest,
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  const candidato =
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null;

  return candidato
    ? candidato.slice(
        0,
        255
      )
    : null;
}


function obterUserAgent(
  request:
    NextRequest,
) {
  const userAgent =
    request.headers.get(
      "user-agent"
    );

  return userAgent
    ? userAgent.slice(
        0,
        4000
      )
    : null;
}


function responderErro(
  erro:
    unknown,
) {
  if (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code ===
      "P2002"
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        codigo:
          "MODELO_ETIQUETA_DUPLICADO",

        mensagem:
          "Já existe um modelo de etiqueta com este nome e tipo.",
      },
      {
        status:
          409,
      },
    );
  }

  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return NextResponse.json(
    resposta.corpo,
    {
      status:
        resposta.status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}


async function carregarModelo(
  instituicaoId:
    number,
  modeloId:
    number,
) {
  const modelo =
    await prisma
      .bibliotecaModeloEtiqueta
      .findFirst({
        where: {
          id:
            modeloId,

          instituicaoId,
        },
      });

  if (!modelo) {
    throw new ErroBiblioteca(
      404,
      "Modelo de etiqueta não encontrado.",
      "MODELO_ETIQUETA_NAO_ENCONTRADO",
    );
  }

  return modelo;
}


export async function PATCH(
  request:
    NextRequest,
  {
    params,
  }:
    ContextoRota,
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.configuracoes.gerenciar",
    );

    if (
      usuario.impersonacao
    ) {
      throw new ErroBiblioteca(
        403,
        "Operação bloqueada durante sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    const modeloId =
      obterModeloId(
        params
      );

    const atual =
      await carregarModelo(
        contexto.instituicaoId,
        modeloId,
      );

    const corpo =
      await request.json() as
        Record<
          string,
          unknown
        >;

    const acao =
      typeof corpo.acao ===
        "string"
        ? corpo.acao
        : null;


    /* =====================================================
       DEFINIR COMO PADRÃO
       ===================================================== */

    if (
      acao ===
      "DEFINIR_PADRAO"
    ) {
      if (
        !atual.ativo
      ) {
        throw new ErroBiblioteca(
          400,
          "Ative o modelo antes de defini-lo como padrão.",
          "MODELO_ETIQUETA_PADRAO_INATIVO",
        );
      }

      const atualizado =
        await prisma.$transaction(
          async (
            transacao
          ) => {
            await transacao
              .bibliotecaModeloEtiqueta
              .updateMany({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  tipo:
                    atual.tipo,

                  padrao:
                    true,
                },

                data: {
                  padrao:
                    false,
                },
              });

            const modelo =
              await transacao
                .bibliotecaModeloEtiqueta
                .update({
                  where: {
                    id:
                      atual.id,
                  },

                  data: {
                    padrao:
                      true,

                    atualizadoPorId:
                      usuario.id,
                  },
                });

            await transacao
              .bibliotecaAuditoria
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  usuarioId:
                    usuario.id,

                  entidade:
                    "BibliotecaModeloEtiqueta",

                  entidadeId:
                    String(
                      modelo.id
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca
                      .CONFIGURAR,

                  descricao:
                    "Modelo de etiquetas definido como padrão.",

                  ip:
                    obterIp(
                      request
                    ),

                  userAgent:
                    obterUserAgent(
                      request
                    ),

                  dadosAnteriores:
                    serializarModeloBanco(
                      atual
                    ),

                  dadosPosteriores:
                    serializarModeloBanco(
                      modelo
                    ),
                },
              });

            return modelo;
          }
        );

      return NextResponse.json({
        ok:
          true,

        modelo:
          serializarModeloBanco(
            atualizado
          ),
      });
    }


    /* =====================================================
       ATIVAR / DESATIVAR
       ===================================================== */

    if (
      acao ===
        "ATIVAR" ||
      acao ===
        "DESATIVAR"
    ) {
      const ativo =
        acao ===
        "ATIVAR";

      if (
        !ativo &&
        atual.padrao
      ) {
        throw new ErroBiblioteca(
          400,
          "Defina outro modelo como padrão antes de desativar este modelo.",
          "MODELO_ETIQUETA_PADRAO_NAO_PODE_DESATIVAR",
        );
      }

      const atualizado =
        await prisma.$transaction(
          async (
            transacao
          ) => {
            const modelo =
              await transacao
                .bibliotecaModeloEtiqueta
                .update({
                  where: {
                    id:
                      atual.id,
                  },

                  data: {
                    ativo,

                    atualizadoPorId:
                      usuario.id,
                  },
                });

            await transacao
              .bibliotecaAuditoria
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  usuarioId:
                    usuario.id,

                  entidade:
                    "BibliotecaModeloEtiqueta",

                  entidadeId:
                    String(
                      modelo.id
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca
                      .ATUALIZAR,

                  descricao:
                    ativo
                      ? "Modelo de etiquetas ativado."
                      : "Modelo de etiquetas desativado.",

                  ip:
                    obterIp(
                      request
                    ),

                  userAgent:
                    obterUserAgent(
                      request
                    ),

                  dadosAnteriores:
                    serializarModeloBanco(
                      atual
                    ),

                  dadosPosteriores:
                    serializarModeloBanco(
                      modelo
                    ),
                },
              });

            return modelo;
          }
        );

      return NextResponse.json({
        ok:
          true,

        modelo:
          serializarModeloBanco(
            atualizado
          ),
      });
    }


    /* =====================================================
       EDIÇÃO COMPLETA
       ===================================================== */

    if (
      atual.origem !==
      BibliotecaOrigemModeloEtiqueta
        .PERSONALIZADO
    ) {
      throw new ErroBiblioteca(
        403,
        "Este modelo não pode ser editado diretamente.",
        "MODELO_ETIQUETA_NAO_EDITAVEL",
      );
    }

    const entrada =
      normalizarEntradaModeloEtiqueta(
        corpo,
        bancoParaEntrada(
          atual
        ),
      );

    const padrao =
      booleanoOpcional(
        corpo.padrao,
        "padrao",
        atual.padrao,
      );

    const ativo =
      booleanoOpcional(
        corpo.ativo,
        "ativo",
        atual.ativo,
      );

    if (
      padrao &&
      !ativo
    ) {
      throw new ErroBiblioteca(
        400,
        "Um modelo padrão precisa estar ativo.",
        "MODELO_ETIQUETA_PADRAO_INATIVO",
      );
    }

    const atualizado =
      await prisma.$transaction(
        async (
          transacao
        ) => {
          if (
            padrao
          ) {
            await transacao
              .bibliotecaModeloEtiqueta
              .updateMany({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  tipo:
                    entrada.tipo,

                  padrao:
                    true,

                  NOT: {
                    id:
                      atual.id,
                  },
                },

                data: {
                  padrao:
                    false,
                },
              });
          }

          const modelo =
            await transacao
              .bibliotecaModeloEtiqueta
              .update({
                where: {
                  id:
                    atual.id,
                },

                data: {
                  ...entradaParaDadosPrisma(
                    entrada
                  ),

                  padrao,
                  ativo,

                  atualizadoPorId:
                    usuario.id,
                },
              });

          await transacao
            .bibliotecaAuditoria
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                usuarioId:
                  usuario.id,

                entidade:
                  "BibliotecaModeloEtiqueta",

                entidadeId:
                  String(
                    modelo.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .ATUALIZAR,

                descricao:
                  "Modelo de folha de etiquetas atualizado.",

                ip:
                  obterIp(
                    request
                  ),

                userAgent:
                  obterUserAgent(
                    request
                  ),

                dadosAnteriores:
                  serializarModeloBanco(
                    atual
                  ),

                dadosPosteriores:
                  serializarModeloBanco(
                    modelo
                  ),
              },
            });

          return modelo;
        }
      );

    return NextResponse.json({
      ok:
        true,

      modelo:
        serializarModeloBanco(
          atualizado
        ),
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}


export async function DELETE(
  request:
    NextRequest,
  {
    params,
  }:
    ContextoRota,
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.configuracoes.gerenciar",
    );

    if (
      usuario.impersonacao
    ) {
      throw new ErroBiblioteca(
        403,
        "Operação bloqueada durante sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    const modeloId =
      obterModeloId(
        params
      );

    const atual =
      await carregarModelo(
        contexto.instituicaoId,
        modeloId,
      );

    if (
      atual.origem !==
      BibliotecaOrigemModeloEtiqueta
        .PERSONALIZADO
    ) {
      throw new ErroBiblioteca(
        403,
        "Este modelo não pode ser excluído.",
        "MODELO_ETIQUETA_NAO_EXCLUIVEL",
      );
    }

    await prisma.$transaction(
      async (
        transacao
      ) => {
        await transacao
          .bibliotecaModeloEtiqueta
          .delete({
            where: {
              id:
                atual.id,
            },
          });

        await transacao
          .bibliotecaAuditoria
          .create({
            data: {
              instituicaoId:
                contexto.instituicaoId,

              usuarioId:
                usuario.id,

              entidade:
                "BibliotecaModeloEtiqueta",

              entidadeId:
                String(
                  atual.id
                ),

              acao:
                AcaoAuditoriaBiblioteca
                  .EXCLUIR,

              descricao:
                "Modelo de folha de etiquetas excluído.",

              ip:
                obterIp(
                  request
                ),

              userAgent:
                obterUserAgent(
                  request
                ),

              dadosAnteriores:
                serializarModeloBanco(
                  atual
                ),
            },
          });
      }
    );

    return NextResponse.json({
      ok:
        true,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}
