import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  mimeDocumentoAtividadeExternaPermitido,
  obterExtensaoDocumentoAtividadeExterna,
  prefixoDocumentoAtividadeExterna,
  obterTokenDocumentoAtividadeExternaBlob,
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

function nomeArquivoCabecalho(
  nome: string
) {
  const original =
    String(
      nome ||
        "documento"
    )
      .trim()
      .slice(
        0,
        220
      ) ||
    "documento";

  const fallback =
    original
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "_"
      )
      .slice(
        0,
        180
      ) ||
    "documento";

  return {
    fallback,

    codificado:
      encodeURIComponent(
        original
      )
        .replace(
          /'/g,
          "%27"
        )
        .replace(
          /\(/g,
          "%28"
        )
        .replace(
          /\)/g,
          "%29"
        ),
  };
}

export async function GET(
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

          headers: {
            "Cache-Control":
              "no-store",
          },
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

          headers: {
            "Cache-Control":
              "no-store",
          },
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

          headers: {
            "Cache-Control":
              "no-store",
          },
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

            arquivoUrl:
              true,

            arquivoNome:
              true,

            mimeType:
              true,

            confidencial:
              true,
          },
        });

    if (
      !documento ||
      !documento
        .arquivoUrl
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_NAO_ENCONTRADO",
        },
        {
          status:
            404,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * Documentos confidenciais exigem
     * permissao de gerenciamento.
     */
    if (
      documento
        .confidencial &&
      !usuario
        .podeGerenciar
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "DOCUMENTO_CONFIDENCIAL",
        },
        {
          status:
            403,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    let pathname:
      string;

    try {
      const url =
        new URL(
          documento
            .arquivoUrl
        );

      pathname =
        decodeURIComponent(
          url.pathname.replace(
            /^\/+/,
            ""
          )
        );
    } catch {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "REFERENCIA_ARQUIVO_INVALIDA",
        },
        {
          status:
            500,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (!pathname) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "REFERENCIA_ARQUIVO_INVALIDA",
        },
        {
          status:
            500,

          headers: {
            "Cache-Control":
              "no-store",
          },
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

    /*
     * Mesmo que a referencia do banco
     * esteja corrompida, nao permitimos
     * leitura de outro tenant,
     * atividade ou documento.
     */
    if (
      !pathname.startsWith(
        `${prefixo}/`
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "CAMINHO_ARQUIVO_INVALIDO",
        },
        {
          status:
            403,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * A leitura usa uma URL GET assinada
     * de curta duracao.
     *
     * A URL nunca e enviada ao navegador:
     * o proprio PHANYX busca o Blob e
     * repassa somente o stream autorizado.
     */
    const validoAte =
      Date.now() +
      5 * 60 * 1000;

    const tokenLeitura =
      await issueSignedToken({
        token: obterTokenDocumentoAtividadeExternaBlob(),
        pathname,

        operations: [
          "get",
        ],

        validUntil:
          validoAte,
      });

    const {
      presignedUrl,
    } =
      await presignUrl(
        tokenLeitura,
        {
          pathname,

          operation:
            "get",

          access:
            "private",

          validUntil:
            validoAte,

          useCache:
            false,
        }
      );

    const respostaBlob =
      await fetch(
        presignedUrl,
        {
          method:
            "GET",

          cache:
            "no-store",
        }
      );

    if (
      !respostaBlob.ok ||
      !respostaBlob.body
    ) {
      let detalheBlob =
        "";

      try {
        detalheBlob =
          (
            await respostaBlob
              .clone()
              .text()
          )
            .slice(
              0,
              2000
            );
      } catch {
        detalheBlob =
          "CORPO_NAO_LEGIVEL";
      }

      console.error(
        "ERRO_LEITURA_BLOB_DOCUMENTO_ATIVIDADE_EXTERNA",
        {
          status:
            respostaBlob.status,

          statusText:
            respostaBlob.statusText,

          contentType:
            respostaBlob.headers.get(
              "content-type"
            ),

          detalheBlob,

          documentoId,

          atividadeId,
        }
      );

      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_INDISPONIVEL",
        },
        {
          status:
            404,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const nome =
      documento
        .arquivoNome ||
      "documento";

    const extensao =
      obterExtensaoDocumentoAtividadeExterna(
        nome
      );

    const mimeBanco =
      String(
        documento
          .mimeType ||
        ""
      )
        .trim()
        .toLowerCase();

    const mimeBlob =
      String(
        respostaBlob.headers.get(
          "content-type"
        ) ||
        ""
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

    let mime =
      "application/octet-stream";

    if (
      extensao &&
      mimeBlob &&
      mimeDocumentoAtividadeExternaPermitido(
        mimeBlob,
        extensao
      )
    ) {
      mime =
        mimeBlob;
    } else if (
      extensao &&
      mimeBanco &&
      mimeDocumentoAtividadeExternaPermitido(
        mimeBanco,
        extensao
      )
    ) {
      mime =
        mimeBanco;
    }

    const download =
      request
        .nextUrl
        .searchParams
        .get(
          "download"
        ) ===
      "1";

    const podeAbrirInline =
      mime ===
        "application/pdf" ||
      mime.startsWith(
        "image/"
      );

    const disposition =
      download ||
      !podeAbrirInline
        ? "attachment"
        : "inline";

    const nomeCabecalho =
      nomeArquivoCabecalho(
        nome
      );

    return new NextResponse(
      respostaBlob.body,
      {
        status:
          200,

        headers: {
          "Content-Type":
            mime,

          "Content-Disposition":
            `${disposition}; filename="${nomeCabecalho.fallback}"; filename*=UTF-8''${nomeCabecalho.codificado}`,

          "X-Content-Type-Options":
            "nosniff",

          "Cache-Control":
            "private, no-store, max-age=0",

          "Content-Security-Policy":
            "default-src 'none'; sandbox",

          ...(respostaBlob.headers.get(
            "etag"
          )
            ? {
                ETag:
                  respostaBlob.headers.get(
                    "etag"
                  )!,
              }
            : {}),
        },
      }
    );
  } catch (erro) {
    console.error(
      "ERRO_CONTEUDO_DOCUMENTO_ATIVIDADE_EXTERNA",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_AO_CARREGAR_ARQUIVO",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
