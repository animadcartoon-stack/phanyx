import {
  AcaoAuditoriaBiblioteca,
  StatusArquivoBiblioteca,
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

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    arquivoId: string;
  };
};

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
  detalhes?: Record<string, unknown>
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
    detalhes
  );
}

function obterArquivoId(
  params: ContextoRota["params"]
) {
  const arquivoId =
    Number(params.arquivoId);

  if (
    !Number.isInteger(arquivoId) ||
    arquivoId <= 0
  ) {
    falhar(
      400,
      "O identificador do arquivo é inválido.",
      "ARQUIVO_ID_INVALIDO"
    );
  }

  return arquivoId;
}

function obterIp(
  request: NextRequest
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  return (
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null
  );
}

function responderErro(
  erro: unknown
) {
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
          "no-store, max-age=0",
      },
    }
  );
}

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
        "Não é permitido alterar o arquivo principal durante uma sessão de suporte por impersonação.",
        "ALTERACAO_BLOQUEADA_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.arquivos.gerenciar"
    );

    const arquivoId =
      obterArquivoId(params);

    const arquivo =
      await prisma
        .bibliotecaArquivo
        .findFirst({
          where: {
            id:
              arquivoId,

            instituicaoId:
              contexto.instituicaoId,

            arquivadoEm:
              null,

            status:
              StatusArquivoBiblioteca.DISPONIVEL,
          },

          select: {
            id: true,
            itemId: true,
            nomeOriginal:
              true,
            tipo: true,
            versao: true,
            principal: true,
          },
        });

    if (!arquivo) {
      falhar(
        404,
        "Arquivo não encontrado ou indisponível nesta biblioteca.",
        "ARQUIVO_NAO_ENCONTRADO"
      );
    }

    if (arquivo.principal) {
      return NextResponse.json(
        {
          ok: true,

          mensagem:
            "Este arquivo já é o principal.",

          arquivo: {
            id:
              arquivo.id,

            itemId:
              arquivo.itemId,

            principal:
              true,

            versao:
              arquivo.versao,
          },
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        }
      );
    }

    const ip =
      obterIp(request);

    const userAgent =
      request.headers
        .get(
          "user-agent"
        )
        ?.slice(
          0,
          2_000
        ) || null;

    const resultado =
      await prisma
        .$transaction(
          async (
            transacao
          ) => {
            /*
             * A trava do item serializa
             * alterações concorrentes.
             * Assim duas requisições não
             * conseguem definir dois
             * principais simultaneamente.
             */
            await transacao
              .$queryRaw`
                SELECT "id"
                FROM "BibliotecaItem"
                WHERE "id" = ${arquivo.itemId}
                  AND "instituicaoId" = ${contexto.instituicaoId}
                FOR UPDATE
              `;

            /*
             * Confirma que o arquivo ainda
             * está disponível depois que
             * obtivemos a trava.
             */
            const atual =
              await transacao
                .bibliotecaArquivo
                .findFirst({
                  where: {
                    id:
                      arquivo.id,

                    instituicaoId:
                      contexto.instituicaoId,

                    itemId:
                      arquivo.itemId,

                    arquivadoEm:
                      null,

                    status:
                      StatusArquivoBiblioteca.DISPONIVEL,
                  },

                  select: {
                    id: true,
                    nomeOriginal:
                      true,
                    tipo: true,
                    versao: true,
                    principal:
                      true,
                  },
                });

            if (!atual) {
              throw new ErroBiblioteca(
                409,
                "O arquivo deixou de estar disponível antes da alteração.",
                "ARQUIVO_INDISPONIVEL"
              );
            }

            if (atual.principal) {
              return {
                arquivo:
                  atual,

                anterior:
                  null,

                alterado:
                  false,
              };
            }

            const anterior =
              await transacao
                .bibliotecaArquivo
                .findFirst({
                  where: {
                    instituicaoId:
                      contexto.instituicaoId,

                    itemId:
                      arquivo.itemId,

                    principal:
                      true,

                    arquivadoEm:
                      null,

                    status:
                      StatusArquivoBiblioteca.DISPONIVEL,
                  },

                  select: {
                    id: true,
                    nomeOriginal:
                      true,
                    versao: true,
                  },
                });

            /*
             * Remove principal de qualquer
             * arquivo ativo do item.
             */
            await transacao
              .bibliotecaArquivo
              .updateMany({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId:
                    arquivo.itemId,

                  principal:
                    true,

                  arquivadoEm:
                    null,
                },

                data: {
                  principal:
                    false,
                },
              });

            const atualizado =
              await transacao
                .bibliotecaArquivo
                .update({
                  where: {
                    id_instituicaoId:
                      {
                        id:
                          atual.id,

                        instituicaoId:
                          contexto.instituicaoId,
                      },
                  },

                  data: {
                    principal:
                      true,
                  },

                  select: {
                    id: true,
                    itemId: true,
                    nomeOriginal:
                      true,
                    tipo: true,
                    versao: true,
                    principal:
                      true,
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
                    "BibliotecaArquivo",

                  entidadeId:
                    String(
                      atualizado.id
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca.ATUALIZAR,

                  descricao:
                    "Arquivo definido como principal do item da Biblioteca Virtual.",

                  dadosAnteriores:
                    {
                      arquivoPrincipalAnteriorId:
                        anterior?.id ??
                        null,

                      arquivoPrincipalAnteriorNome:
                        anterior
                          ?.nomeOriginal ??
                        null,

                      arquivoPrincipalAnteriorVersao:
                        anterior
                          ?.versao ??
                        null,
                    },

                  dadosPosteriores:
                    {
                      arquivoPrincipalId:
                        atualizado.id,

                      arquivoPrincipalNome:
                        atualizado.nomeOriginal,

                      arquivoPrincipalVersao:
                        atualizado.versao,

                      principal:
                        true,
                    },

                  metadados:
                    {
                      origem:
                        "api_admin_biblioteca_arquivo_principal",

                      itemId:
                        atualizado.itemId,
                    },

                  ip,
                  userAgent,
                },
              });

            return {
              arquivo:
                atualizado,

              anterior,

              alterado:
                true,
            };
          },
          {
            maxWait:
              5_000,

            timeout:
              15_000,
          }
        );

    return NextResponse.json(
      {
        ok: true,

        mensagem:
          resultado.alterado
            ? "Arquivo definido como principal com sucesso."
            : "Este arquivo já é o principal.",

        arquivo:
          resultado.arquivo,

        arquivoPrincipalAnterior:
          resultado.anterior,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}