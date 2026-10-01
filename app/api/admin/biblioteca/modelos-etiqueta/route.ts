import {
  AcaoAuditoriaBiblioteca,
  BibliotecaOrigemModeloEtiqueta,
  BibliotecaTipoEtiquetaFolha,
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
  MODELOS_ETIQUETA_PHANYX,
} from "@/lib/biblioteca/modelos-etiqueta";

import {
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


function modeloSistemaParaResposta(
  modelo:
    (typeof MODELOS_ETIQUETA_PHANYX)[number],
  padrao:
    boolean,
) {
  return {
    ...modelo,

    persistido:
      false,

    idBanco:
      null,

    capacidade:
      modelo.colunas *
      modelo.linhas,

    padrao,

    editavel:
      false,

    excluivel:
      false,

    criadoPorId:
      null,

    atualizadoPorId:
      null,

    criadoEm:
      null,

    atualizadoEm:
      null,
  };
}


export async function GET() {
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
      "biblioteca.catalogo.ver",
    );

    const modelosBanco =
      await prisma
        .bibliotecaModeloEtiqueta
        .findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,
          },

          orderBy: [
            {
              tipo:
                "asc",
            },
            {
              padrao:
                "desc",
            },
            {
              ativo:
                "desc",
            },
            {
              nome:
                "asc",
            },
          ],
        });

    const tiposComPadraoBanco =
      new Set(
        modelosBanco
          .filter(
            (modelo) =>
              modelo.padrao &&
              modelo.ativo
          )
          .map(
            (modelo) =>
              modelo.tipo
          )
      );

    const modelosSistema =
      MODELOS_ETIQUETA_PHANYX
        .map(
          (modelo) =>
            modeloSistemaParaResposta(
              modelo,
              !tiposComPadraoBanco.has(
                modelo.tipo as
                  BibliotecaTipoEtiquetaFolha
              ),
            )
        );

    const modelosPersistidos =
      modelosBanco.map(
        serializarModeloBanco
      );

    return NextResponse.json(
      {
        ok:
          true,

        modelos: [
          ...modelosSistema,
          ...modelosPersistidos,
        ],
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}


export async function PATCH(
  request:
    NextRequest,
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

    const corpo =
      await request.json() as
        Record<
          string,
          unknown
        >;

    if (
      corpo.acao !==
      "DEFINIR_PADRAO_SISTEMA"
    ) {
      throw new ErroBiblioteca(
        400,
        "Ação inválida.",
        "MODELO_ETIQUETA_ACAO_INVALIDA",
      );
    }

    if (
      typeof corpo.tipo !==
        "string" ||
      !Object.values(
        BibliotecaTipoEtiquetaFolha
      ).includes(
        corpo.tipo as
          BibliotecaTipoEtiquetaFolha
      )
    ) {
      throw new ErroBiblioteca(
        400,
        "Tipo de etiqueta inválido.",
        "MODELO_ETIQUETA_TIPO_INVALIDO",
      );
    }

    const tipo =
      corpo.tipo as
        BibliotecaTipoEtiquetaFolha;

    const modeloSistema =
      MODELOS_ETIQUETA_PHANYX.find(
        (modelo) =>
          modelo.tipo ===
          tipo
      );

    if (
      !modeloSistema
    ) {
      throw new ErroBiblioteca(
        404,
        "Modelo PHANYX do sistema não encontrado.",
        "MODELO_ETIQUETA_SISTEMA_NAO_ENCONTRADO",
      );
    }

    await prisma.$transaction(
      async (
        transacao
      ) => {
        const anteriores =
          await transacao
            .bibliotecaModeloEtiqueta
            .findMany({
              where: {
                instituicaoId:
                  contexto.instituicaoId,

                tipo,

                padrao:
                  true,
              },

              select: {
                id:
                  true,

                nome:
                  true,

                tipo:
                  true,

                padrao:
                  true,
              },
            });

        await transacao
          .bibliotecaModeloEtiqueta
          .updateMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,

              tipo,

              padrao:
                true,
            },

            data: {
              padrao:
                false,

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
                "sistema:" +
                tipo,

              acao:
                AcaoAuditoriaBiblioteca
                  .CONFIGURAR,

              descricao:
                "Modelo PHANYX definido como padrão para impressão de etiquetas.",

              ip:
                obterIp(
                  request
                ),

              userAgent:
                obterUserAgent(
                  request
                ),

              dadosAnteriores: {
                modelosPadrao:
                  anteriores,
              },

              dadosPosteriores: {
                id:
                  modeloSistema.id,

                nome:
                  modeloSistema.nome,

                tipo:
                  modeloSistema.tipo,

                origem:
                  modeloSistema.origem,

                padrao:
                  true,
              },
            },
          });
      }
    );

    return NextResponse.json(
      {
        ok:
          true,

        tipo,

        modelo:
          modeloSistemaParaResposta(
            modeloSistema,
            true
          ),
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}


export async function POST(
  request:
    NextRequest,
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

    const corpo =
      await request.json() as
        Record<
          string,
          unknown
        >;

    const entrada =
      normalizarEntradaModeloEtiqueta(
        corpo
      );

    const padrao =
      booleanoOpcional(
        corpo.padrao,
        "padrao",
        false,
      );

    const ativo =
      booleanoOpcional(
        corpo.ativo,
        "ativo",
        true,
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

    const criado =
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
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  ...entradaParaDadosPrisma(
                    entrada
                  ),

                  origem:
                    BibliotecaOrigemModeloEtiqueta
                      .PERSONALIZADO,

                  padrao,
                  ativo,

                  criadoPorId:
                    usuario.id,

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
                    .CRIAR,

                descricao:
                  "Modelo de folha de etiquetas criado.",

                ip:
                  obterIp(
                    request
                  ),

                userAgent:
                  obterUserAgent(
                    request
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

    return NextResponse.json(
      {
        ok:
          true,

        modelo:
          serializarModeloBanco(
            criado
          ),
      },
      {
        status:
          201,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}
