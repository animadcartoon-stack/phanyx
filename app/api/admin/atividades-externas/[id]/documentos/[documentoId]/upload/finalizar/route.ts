import {
  StatusDocumentoAtividadeExterna,
} from "@prisma/client";

import {
  del,
  head,
} from "@vercel/blob";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES,
  extensaoDocumentoAtividadeExternaPermitida,
  limparNomeDocumentoAtividadeExterna,
  mimeDocumentoAtividadeExternaPermitido,
  obterExtensaoDocumentoAtividadeExterna,
  prefixoDocumentoAtividadeExterna,
} from "@/lib/atividade-externa-documentos-storage";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type ContextoRota = {
  params: {
    id: string;
    documentoId: string;
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

type CorpoFinalizar = {
  pathname?: unknown;
  nomeOriginal?: unknown;
};

function obterId(
  valor: string
) {
  const id =
    Number(
      valor
    );

  return (
    Number.isInteger(id) &&
    id > 0
  )
    ? id
    : null;
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
      },
    });
}

async function removerBlobSilenciosamente(
  pathname: string
) {
  try {
    await del(
      pathname
    );
  } catch (
    erro
  ) {
    console.error(
      "ERRO_AO_REMOVER_BLOB_DOCUMENTO_ATIVIDADE_EXTERNA",
      erro
    );
  }
}

export async function POST(
  request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const atividadeId =
      obterId(
        contexto.params.id
      );

    const documentoId =
      obterId(
        contexto.params
          .documentoId
      );

    if (
      !atividadeId ||
      !documentoId
    ) {
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

    if (
      !usuario ||
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

    const documento =
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

            status:
              true,

            arquivoUrl:
              true,

            arquivoNome:
              true,
          },
        });

    if (!documento) {
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
      documento.status ===
        StatusDocumentoAtividadeExterna
          .ARQUIVADO ||
      documento.status ===
        StatusDocumentoAtividadeExterna
          .SUBSTITUIDO
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "DOCUMENTO_NAO_ACEITA_UPLOAD",
        },
        {
          status:
            409,
        }
      );
    }

    /*
     * Nao sobrescrevemos um arquivo existente.
     *
     * A futura acao "Substituir documento"
     * criara um novo registro e mantera o
     * anterior como SUBSTITUIDO.
     */
    if (
      documento
        .arquivoUrl
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "DOCUMENTO_JA_POSSUI_ARQUIVO",
        },
        {
          status:
            409,
        }
      );
    }

    const corpo =
      (
        await request.json()
      ) as CorpoFinalizar;

    const pathname =
      typeof corpo.pathname ===
      "string"
        ? corpo.pathname.trim()
        : "";

    const nomeOriginal =
      typeof corpo
        .nomeOriginal ===
      "string"
        ? corpo
            .nomeOriginal
            .trim()
        : "";

    if (
      !pathname ||
      !nomeOriginal
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "UPLOAD_DADOS_INVALIDOS",
        },
        {
          status:
            400,
        }
      );
    }

    const extensao =
      obterExtensaoDocumentoAtividadeExterna(
        nomeOriginal
      );

    if (
      !extensao ||
      !extensaoDocumentoAtividadeExternaPermitida(
        extensao
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_FORMATO_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const prefixo =
      prefixoDocumentoAtividadeExterna({
        instituicaoId:
          usuario
            .instituicaoId,

        atividadeExternaId:
          atividadeId,

        documentoId,
      });

    const nomeSeguro =
      limparNomeDocumentoAtividadeExterna(
        nomeOriginal
      );

    /*
     * O arquivo precisa estar exatamente
     * dentro da pasta deste tenant,
     * desta atividade e deste documento.
     */
    if (
      !pathname.startsWith(
        `${prefixo}/`
      ) ||
      !pathname.endsWith(
        `-${nomeSeguro}`
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "CAMINHO_UPLOAD_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    let detalhes:
      Awaited<
        ReturnType<
          typeof head
        >
      >;

    try {
      detalhes =
        await head(
          pathname
        );
    } catch {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_NAO_ENCONTRADO_NO_STORAGE",
        },
        {
          status:
            404,
        }
      );
    }

    const tamanho =
      Number(
        detalhes.size
      );

    if (
      !Number.isInteger(
        tamanho
      ) ||
      tamanho <= 0 ||
      tamanho >
        LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES
    ) {
      await removerBlobSilenciosamente(
        pathname
      );

      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_TAMANHO_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const mimeType =
      String(
        detalhes
          .contentType ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !mimeType ||
      !mimeDocumentoAtividadeExternaPermitido(
        mimeType,
        extensao
      )
    ) {
      await removerBlobSilenciosamente(
        pathname
      );

      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_MIME_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    /*
     * A URL privada nunca sera devolvida
     * diretamente ao navegador.
     *
     * Ela fica apenas no banco e a leitura
     * sera feita pela rota autenticada
     * /conteudo.
     */
    let atualizado;

    try {
      atualizado =
        await prisma
          .atividadeExternaDocumento
          .update({
            where: {
              id:
                documento.id,
            },

            data: {
              arquivoUrl:
                detalhes.url,

              arquivoNome:
                nomeOriginal,

              mimeType,

              tamanho,

              status:
                documento.status ===
                StatusDocumentoAtividadeExterna
                  .PENDENTE
                  ? StatusDocumentoAtividadeExterna
                      .ATIVO
                  : documento
                      .status,

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

              arquivoNome:
                true,

              mimeType:
                true,

              tamanho:
                true,

              status:
                true,

              confidencial:
                true,

              obrigatorio:
                true,

              atualizadoPorId:
                true,

              updatedAt:
                true,
            },
          });
    } catch (
      erroAtualizacao
    ) {
      /*
       * Se o banco falhar depois do upload,
       * removemos o Blob para nao deixar
       * arquivo orfao.
       */
      await removerBlobSilenciosamente(
        pathname
      );

      throw erroAtualizacao;
    }

    return NextResponse.json({
      ok:
        true,

      documento: {
        ...atualizado,

        temArquivo:
          true,

        conteudoUrl:
          `/api/admin/atividades-externas/${atividadeId}/documentos/${documentoId}/conteudo`,
      },
    });
  } catch (erro) {
    console.error(
      "ERRO_FINALIZAR_UPLOAD_DOCUMENTO_ATIVIDADE_EXTERNA",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_AO_FINALIZAR_UPLOAD",
      },
      {
        status:
          500,
      }
    );
  }
}
