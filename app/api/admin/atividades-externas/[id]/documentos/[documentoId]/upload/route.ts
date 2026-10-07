import {
  randomUUID,
} from "node:crypto";

import {
  StatusDocumentoAtividadeExterna,
} from "@prisma/client";

import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ATIVIDADE_EXTERNA_DOCUMENTOS_BLOB_ACCESS,
  LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES,
  extensaoDocumentoAtividadeExternaPermitida,
  limparNomeDocumentoAtividadeExterna,
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

const DEZ_MINUTOS_MS =
  10 * 60 * 1000;

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

type CorpoUpload = {
  nomeOriginal?: unknown;
  mimeType?: unknown;
  tamanhoBytes?: unknown;
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
      usuario.role || ""
    ).toUpperCase();

  const administrador =
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

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
      funcionario.statusFuncionario ===
        "ATIVO"
    ) {
      const permissoes =
        new Set([
          ...(
            funcionario.permissoes ||
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
    !usuario.acessoTodosPolos
  ) {
    const acessos =
      await prisma.userPolo.findMany({
        where: {
          userId:
            usuario.id,

          instituicaoId:
            usuario.instituicaoId,

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
      usuario.instituicaoId,

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
          usuario.instituicaoId,

        ...(
          usuario.polosPermitidos !==
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
        contexto.params.documentoId
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
      !usuario.podeGerenciar
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
              usuario.instituicaoId,
          },

          select: {
            id:
              true,

            status:
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

    const corpo =
      (
        await request.json()
      ) as CorpoUpload;

    const nomeOriginal =
      typeof corpo.nomeOriginal ===
      "string"
        ? corpo.nomeOriginal.trim()
        : "";

    const mimeType =
      typeof corpo.mimeType ===
      "string"
        ? corpo.mimeType
            .trim()
            .toLowerCase()
        : "";

    const tamanhoBytes =
      Number(
        corpo.tamanhoBytes
      );

    if (
      !nomeOriginal ||
      !mimeType ||
      !Number.isInteger(
        tamanhoBytes
      ) ||
      tamanhoBytes <= 0
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

    if (
      tamanhoBytes >
      LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ARQUIVO_MUITO_GRANDE",

          limiteBytes:
            LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES,
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
      ) ||
      !mimeDocumentoAtividadeExternaPermitido(
        mimeType,
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

    const nomeSeguro =
      limparNomeDocumentoAtividadeExterna(
        nomeOriginal
      );

    const prefixo =
      prefixoDocumentoAtividadeExterna({
        instituicaoId:
          usuario.instituicaoId,

        atividadeExternaId:
          atividadeId,

        documentoId,
      });

    const pathname =
      `${prefixo}/${randomUUID()}-${nomeSeguro}`;

    const validUntil =
      Date.now() +
      DEZ_MINUTOS_MS;

    const token =
      await issueSignedToken({
        token: obterTokenDocumentoAtividadeExternaBlob(),
        pathname,

        operations: [
          "put",
        ],

        validUntil,

        allowedContentTypes: [
          mimeType,
        ],

        maximumSizeInBytes:
          tamanhoBytes,
      });

    const {
      presignedUrl,
    } =
      await presignUrl(
        token,
        {
          pathname,

          operation:
            "put",

          access:
            ATIVIDADE_EXTERNA_DOCUMENTOS_BLOB_ACCESS,

          validUntil,

          allowedContentTypes: [
            mimeType,
          ],

          maximumSizeInBytes:
            tamanhoBytes,

          addRandomSuffix:
            false,

          allowOverwrite:
            false,
        }
      );

    return NextResponse.json({
      ok:
        true,

      presignedUrl,

      pathname,

      validUntil,

      mimeType,

      tamanhoBytes,

      limiteBytes:
        LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES,
    });
  } catch (erro) {
    console.error(
      "ERRO_UPLOAD_DOCUMENTO_ATIVIDADE_EXTERNA",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_AO_PREPARAR_UPLOAD",
      },
      {
        status:
          500,
      }
    );
  }
}
