import {
  StatusArquivoBiblioteca,
  TipoAcessoBiblioteca,
} from "@prisma/client";

import { get } from "@vercel/blob";

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
  obterTokenBibliotecaBlob,
} from "@/lib/biblioteca-storage";

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

function nomeArquivoCabecalho(
  nome: string
) {
  return String(
    nome || "arquivo"
  )
    .replace(
      /[\r\n"]/g,
      ""
    )
    .trim() || "arquivo";
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

export async function GET(
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

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.arquivos.download"
    );

    const arquivoId =
      obterArquivoId(params);

    const arquivo =
      await prisma
        .bibliotecaArquivo
        .findFirst({
          where: {
            id: arquivoId,

            instituicaoId:
              contexto.instituicaoId,

            status:
              StatusArquivoBiblioteca.DISPONIVEL,

            arquivadoEm:
              null,
          },

          select: {
            id: true,
            itemId: true,

            nomeOriginal:
              true,

            mimeType:
              true,

            tamanhoBytes:
              true,

            storageKey:
              true,

            protegido:
              true,

            permitirDownload:
              true,

            item: {
              select: {
                id: true,
                titulo: true,
                status: true,
              },
            },
          },
        });

    if (!arquivo) {
      falhar(
        404,
        "Arquivo não encontrado ou indisponível nesta biblioteca.",
        "ARQUIVO_NAO_ENCONTRADO"
      );
    }

    if (!arquivo.storageKey) {
      falhar(
        409,
        "O arquivo ainda não possui armazenamento disponível.",
        "ARQUIVO_SEM_STORAGE_KEY"
      );
    }

    const forcarDownload =
      request.nextUrl
        .searchParams
        .get("download") ===
      "1";

    const token =
      obterTokenBibliotecaBlob();

    const ifNoneMatch =
      request.headers.get(
        "if-none-match"
      ) || undefined;

    const resultado =
      await get(
        arquivo.storageKey,
        {
          access:
            "private",

          token,

          ifNoneMatch,
        }
      );

    if (!resultado) {
      falhar(
        404,
        "O arquivo não foi encontrado no armazenamento.",
        "BLOB_NAO_ENCONTRADO"
      );
    }

    /*
     * Se o navegador já possui a mesma
     * versão em cache, não transmitimos
     * os bytes novamente.
     */
    if (
      resultado.statusCode ===
      304
    ) {
      return new NextResponse(
        null,
        {
          status: 304,

          headers: {
            ETag:
              resultado
                .blob
                .etag,

            "Cache-Control":
              "private, no-cache",
          },
        }
      );
    }

    if (
      resultado.statusCode !==
        200 ||
      !resultado.stream
    ) {
      falhar(
        404,
        "Não foi possível recuperar o arquivo armazenado.",
        "BLOB_INDISPONIVEL"
      );
    }

    const nomeOriginal =
      nomeArquivoCabecalho(
        arquivo.nomeOriginal
      );

    const contentDisposition =
      forcarDownload
        ? "attachment"
        : "inline";

    const nomeCodificado =
      encodeURIComponent(
        nomeOriginal
      );

    /*
     * Registra somente acessos que
     * realmente entregaram o arquivo.
     */
    await prisma
      .bibliotecaHistoricoAcesso
      .create({
        data: {
          instituicaoId:
            contexto.instituicaoId,

          usuarioId:
            usuario.id,

          itemId:
            arquivo.itemId,

          arquivoId:
            arquivo.id,

          tipo:
            forcarDownload
              ? TipoAcessoBiblioteca.DOWNLOAD
              : TipoAcessoBiblioteca.VISUALIZACAO,

          ip:
            obterIp(request),

          userAgent:
            request.headers
              .get(
                "user-agent"
              )
              ?.slice(
                0,
                2_000
              ) || null,
        },
      });

    return new NextResponse(
      resultado.stream,
      {
        status: 200,

        headers: {
          "Content-Type":
            resultado.blob
              .contentType ||
            arquivo.mimeType ||
            "application/octet-stream",

          "Content-Disposition":
            `${contentDisposition}; filename*=UTF-8''${nomeCodificado}`,

          "X-Content-Type-Options":
            "nosniff",

          "Cache-Control":
            "private, no-cache",

          ETag:
            resultado.blob
              .etag,
        },
      }
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}