import {
  AcaoAuditoriaBiblioteca,
  BibliotecariaFuncaoAutor,
  Prisma,
  StatusItemBiblioteca,
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
import { gerarCodigoCutterObra } from "@/lib/biblioteca-cutter";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    itemId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function responderErro(
  erro: unknown
) {
  if (erro instanceof ErroBiblioteca) {
    const resposta =
      respostaErroBiblioteca(
        erro
      );

    return responder(
      resposta.corpo,
      resposta.status
    );
  }

  console.error(
    "[biblioteca/item/relacionamentos]",
    erro
  );

  return responder(
    {
      error:
        "Não foi possível atualizar os vínculos bibliográficos.",
      codigo:
        "ERRO_INTERNO",
    },
    500
  );
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo
  );
}

function numeroId(
  valor: unknown,
  campo: string
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    falhar(
      400,
      `O campo ${campo} contém um identificador inválido.`,
      "ID_INVALIDO"
    );
  }

  return numero;
}

const FUNCOES_AUTOR =
  new Set<BibliotecariaFuncaoAutor>(
    Object.values(
      BibliotecariaFuncaoAutor
    )
  );

export async function PATCH(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido alterar vínculos bibliográficos durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.editar"
    );

    const itemId =
      numeroId(
        params.itemId,
        "itemId"
      );

    const corpo =
      await request.json();

    const editoraId =
      corpo?.editoraId === null ||
      corpo?.editoraId === undefined ||
      corpo?.editoraId === ""
        ? null
        : numeroId(
            corpo.editoraId,
            "editoraId"
          );

    if (!Array.isArray(corpo?.autores)) {
      falhar(
        400,
        "A lista de autores é inválida.",
        "AUTORES_INVALIDOS"
      );
    }

    if (!Array.isArray(corpo?.categorias)) {
      falhar(
        400,
        "A lista de assuntos é inválida.",
        "CATEGORIAS_INVALIDAS"
      );
    }

    const autores =
      corpo.autores.map(
        (
          valor: unknown,
          indice: number
        ) => {
          if (
            !valor ||
            typeof valor !== "object"
          ) {
            falhar(
              400,
              "Autor inválido.",
              "AUTOR_INVALIDO"
            );
          }

          const registro =
            valor as Record<
              string,
              unknown
            >;

          const funcao =
            String(
              registro.funcao ||
              "AUTOR"
            )
              .trim()
              .toUpperCase() as
              BibliotecariaFuncaoAutor;

          if (
            !FUNCOES_AUTOR.has(
              funcao
            )
          ) {
            falhar(
              400,
              "Função de autoria inválida.",
              "FUNCAO_AUTOR_INVALIDA"
            );
          }

          return {
            autorId:
              numeroId(
                registro.autorId,
                "autorId"
              ),
            funcao,
            ordem:
              Number.isInteger(
                Number(
                  registro.ordem
                )
              )
                ? Number(
                    registro.ordem
                  )
                : indice,
          };
        }
      );

    const categorias =
      corpo.categorias.map(
        (
          valor: unknown
        ) => {
          if (
            !valor ||
            typeof valor !== "object"
          ) {
            falhar(
              400,
              "Assunto inválido.",
              "CATEGORIA_INVALIDA"
            );
          }

          const registro =
            valor as Record<
              string,
              unknown
            >;

          return {
            categoriaId:
              numeroId(
                registro.categoriaId,
                "categoriaId"
              ),
            principal:
              registro.principal ===
              true,
          };
        }
      );

    const autoresUnicos =
      new Set(
        autores.map(
          (item) =>
            `${item.autorId}:${item.funcao}`
        )
      );

    if (
      autoresUnicos.size !==
      autores.length
    ) {
      falhar(
        400,
        "Há vínculos de autoria duplicados.",
        "AUTOR_DUPLICADO"
      );
    }

    const categoriasUnicas =
      new Set(
        categorias.map(
          (item) =>
            item.categoriaId
        )
      );

    if (
      categoriasUnicas.size !==
      categorias.length
    ) {
      falhar(
        400,
        "Há assuntos duplicados.",
        "CATEGORIA_DUPLICADA"
      );
    }

    if (
      categorias.filter(
        (item) =>
          item.principal
      ).length > 1
    ) {
      falhar(
        400,
        "Somente um assunto pode ser marcado como principal.",
        "MULTIPLAS_CATEGORIAS_PRINCIPAIS"
      );
    }

    const itemAnterior =
      await prisma.bibliotecaItem.findFirst({
        where: {
          id:
            itemId,
          instituicaoId:
            contexto.instituicaoId,
        },

        select: {
          id: true,
          titulo: true,
          status: true,

          codigoCutter: true,
          codigoCutterAutomatico: true,

          codigoChamada: true,
          classificacaoBibliografica: true,
          sistemaClassificacao: true,
          cdd: true,
          cdu: true,

          editora: {
            select: {
              id: true,
              nome: true,
            },
          },

          autores: {
            orderBy: [
              {
                ordem:
                  "asc",
              },
              {
                id:
                  "asc",
              },
            ],

            select: {
              funcao: true,
              ordem: true,

              autor: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },

          categorias: {
            orderBy: [
              {
                principal:
                  "desc",
              },
              {
                id:
                  "asc",
              },
            ],

            select: {
              principal: true,

              categoria: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });

    if (!itemAnterior) {
      falhar(
        404,
        "Item não encontrado nesta biblioteca.",
        "ITEM_NAO_ENCONTRADO"
      );
    }

    if (
      itemAnterior.status ===
      StatusItemBiblioteca.ARQUIVADO
    ) {
      falhar(
        409,
        "Restaure o item antes de alterar seus vínculos bibliográficos.",
        "ITEM_ARQUIVADO"
      );
    }

    const idsAutores =
      Array.from(
        new Set(
          autores.map(
            (item) =>
              item.autorId
          )
        )
      );

    const idsCategorias =
      Array.from(
        new Set(
          categorias.map(
            (item) =>
              item.categoriaId
          )
        )
      );

    const [
      editora,
      autoresExistentes,
      categoriasExistentes,
    ] =
      await Promise.all([
        editoraId
          ? prisma.bibliotecaEditora.findFirst({
              where: {
                id:
                  editoraId,
                instituicaoId:
                  contexto.instituicaoId,
                ativo:
                  true,
              },

              select: {
                id:
                  true,
              },
            })
          : Promise.resolve(
              null
            ),

        idsAutores.length
          ? prisma.bibliotecaAutor.findMany({
              where: {
                instituicaoId:
                  contexto.instituicaoId,
                id: {
                  in:
                    idsAutores,
                },
                ativo:
                  true,
              },

              select: {
                id:
                  true,

                codigoCutterBase:
                  true,
              },
            })
          : Promise.resolve(
              []
            ),

        idsCategorias.length
          ? prisma.bibliotecaCategoria.findMany({
              where: {
                instituicaoId:
                  contexto.instituicaoId,
                id: {
                  in:
                    idsCategorias,
                },
                ativo:
                  true,
              },

              select: {
                id:
                  true,
              },
            })
          : Promise.resolve(
              []
            ),
      ]);

    if (
      editoraId &&
      !editora
    ) {
      falhar(
        400,
        "A editora informada não pertence a esta instituição ou está inativa.",
        "EDITORA_INVALIDA"
      );
    }

    if (
      autoresExistentes.length !==
      idsAutores.length
    ) {
      falhar(
        400,
        "Um ou mais autores não pertencem a esta instituição ou estão inativos.",
        "AUTOR_INVALIDO"
      );
    }

    if (
      categoriasExistentes.length !==
      idsCategorias.length
    ) {
      falhar(
        400,
        "Um ou mais assuntos não pertencem a esta instituição ou estão inativos.",
        "CATEGORIA_INVALIDA"
      );
    }

    const autorPrincipalVinculo =
      [...autores]
        .filter(
          (autor) =>
            autor.funcao ===
            BibliotecariaFuncaoAutor.AUTOR
        )
        .sort(
          (a, b) =>
            a.ordem -
            b.ordem
        )[0] ||
      null;

    const autorPrincipal =
      autorPrincipalVinculo
        ? autoresExistentes.find(
            (autor) =>
              autor.id ===
              autorPrincipalVinculo.autorId
          ) ||
          null
        : null;

    const podeGerarCutter =
      !itemAnterior.codigoCutter ||
      itemAnterior
        .codigoCutterAutomatico;

    const codigoCutterGerado =
      podeGerarCutter
        ? gerarCodigoCutterObra(
            autorPrincipal
              ?.codigoCutterBase,
            itemAnterior.titulo
          )
        : null;

    const codigoCutterFinal =
      podeGerarCutter
        ? codigoCutterGerado
        : itemAnterior
            .codigoCutter;

    const codigoCutterAutomatico =
      Boolean(
        podeGerarCutter &&
        codigoCutterGerado
      );

    const sistema =
      itemAnterior
        .sistemaClassificacao ??
      contexto.configuracao
        ?.sistemaClassificacaoPadrao;

    const classificacao =
      sistema === "CDD"
        ? itemAnterior.cdd
        : sistema === "CDU"
          ? itemAnterior.cdu
          : itemAnterior
              .classificacaoBibliografica;

    const partesChamadaAnterior = [
      classificacao,
      contexto.configuracao
        ?.usarCutter !== false
        ? itemAnterior
            .codigoCutter
        : null,
    ].filter(
      (valor): valor is string =>
        Boolean(valor)
    );

    const chamadaAutomaticaAnterior =
      partesChamadaAnterior.length
        ? partesChamadaAnterior.join(" ")
        : null;

    const codigoChamadaEraAutomatico =
      itemAnterior.codigoChamada ===
      chamadaAutomaticaAnterior;

    const partesChamadaNova = [
      classificacao,
      contexto.configuracao
        ?.usarCutter !== false
        ? codigoCutterFinal
        : null,
    ].filter(
      (valor): valor is string =>
        Boolean(valor)
    );

    const codigoChamadaNovo =
      contexto.configuracao
        ?.gerarCodigoChamadaAutomaticamente !==
        false &&
      codigoChamadaEraAutomatico
        ? (
            partesChamadaNova.length
              ? partesChamadaNova.join(" ")
              : null
          )
        : itemAnterior
            .codigoChamada;

    const ip =
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      request.headers
        .get("x-real-ip") ||
      null;

    const userAgent =
      request.headers
        .get("user-agent")
        ?.slice(0, 2_000) ||
      null;

    const atualizado =
      await prisma.$transaction(
        async (
          transacao
        ) => {
          await transacao.bibliotecaItem.update({
            where: {
              id_instituicaoId: {
                id:
                  itemId,
                instituicaoId:
                  contexto.instituicaoId,
              },
            },

            data: {
              editoraId,

              ...(podeGerarCutter
                ? {
                    codigoCutter:
                      codigoCutterFinal,

                    codigoCutterAutomatico,

                    codigoChamada:
                      codigoChamadaNovo,
                  }
                : {}),

              atualizadoPorId:
                usuario.id,
            },
          });

          await transacao.bibliotecaItemAutor.deleteMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
              itemId,
            },
          });

          if (
            autores.length
          ) {
            await transacao.bibliotecaItemAutor.createMany({
              data:
                autores.map(
                  (
                    autor
                  ) => ({
                    instituicaoId:
                      contexto.instituicaoId,
                    itemId,
                    autorId:
                      autor.autorId,
                    funcao:
                      autor.funcao,
                    ordem:
                      autor.ordem,
                  })
                ),
            });
          }

          await transacao.bibliotecaItemCategoria.deleteMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
              itemId,
            },
          });

          if (
            categorias.length
          ) {
            await transacao.bibliotecaItemCategoria.createMany({
              data:
                categorias.map(
                  (
                    categoria
                  ) => ({
                    instituicaoId:
                      contexto.instituicaoId,
                    itemId,
                    categoriaId:
                      categoria.categoriaId,
                    principal:
                      categoria.principal,
                  })
                ),
            });
          }

          const depois =
            await transacao.bibliotecaItem.findUniqueOrThrow({
              where: {
                id:
                  itemId,
              },

              select: {
                id: true,
                titulo: true,

                codigoCutter: true,
                codigoCutterAutomatico: true,
                codigoChamada: true,

                editora: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },

                autores: {
                  orderBy: [
                    {
                      ordem:
                        "asc",
                    },
                    {
                      id:
                        "asc",
                    },
                  ],

                  select: {
                    funcao:
                      true,
                    ordem:
                      true,

                    autor: {
                      select: {
                        id:
                          true,
                        nome:
                          true,
                        nomeOrdenacao:
                          true,
                      },
                    },
                  },
                },

                categorias: {
                  orderBy: [
                    {
                      principal:
                        "desc",
                    },
                    {
                      id:
                        "asc",
                    },
                  ],

                  select: {
                    principal:
                      true,

                    categoria: {
                      select: {
                        id:
                          true,
                        nome:
                          true,
                        slug:
                          true,
                        cor:
                          true,
                        icone:
                          true,
                      },
                    },
                  },
                },
              },
            });

          await transacao.bibliotecaAuditoria.create({
            data: {
              instituicaoId:
                contexto.instituicaoId,
              usuarioId:
                usuario.id,
              entidade:
                "BibliotecaItem",
              entidadeId:
                String(
                  itemId
                ),
              acao:
                AcaoAuditoriaBiblioteca.ATUALIZAR,
              descricao:
                "Vínculos bibliográficos do item foram atualizados.",
              dadosAnteriores:
                itemAnterior as unknown as Prisma.InputJsonValue,
              dadosPosteriores:
                depois as unknown as Prisma.InputJsonValue,
              metadados: {
                origem:
                  "catalogacao_relacionamentos",
              },
              ip,
              userAgent,
            },
          });

          return depois;
        },
        {
          maxWait:
            5_000,
          timeout:
            10_000,
        }
      );

    return responder({
      ok: true,
      mensagem:
        "Vínculos bibliográficos atualizados com sucesso.",
      item:
        atualizado,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}
