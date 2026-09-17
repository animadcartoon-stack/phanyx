import { get } from "@vercel/blob";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIPOS_PERMITIDOS =
  new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/heic",
    "image/heif",
  ]);

function idValido(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function nomeSeguro(
  nome: string
) {
  const limpo =
    nome
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return (
    limpo ||
    "documento"
  );
}

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      documentoId: string;
    };
  }
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.candidaturas.gerenciar"
      );

    const candidaturaId =
      idValido(
        params.id
      );

    const documentoId =
      idValido(
        params.documentoId
      );

    if (
      !candidaturaId ||
      !documentoId
    ) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "Identificação inválida."
      );
    }

    const documento =
      await prisma.mobilidadeCandidaturaDocumento.findFirst({
        where: {
          id:
            documentoId,

          candidaturaId,

          instituicaoId,
        },

        select: {
          id: true,
          arquivoUrl: true,
          arquivoNome: true,
          mimeType: true,
        },
      });

    if (
      !documento ||
      !documento.arquivoUrl
    ) {
      throw new ErroMobilidade(
        404,
        "ARQUIVO_NAO_ENCONTRADO",
        "Arquivo do documento não encontrado."
      );
    }

    const storeId =
      process.env
        .MOBILIDADE_STORE_ID
        ?.trim();

    if (!storeId) {
      throw new ErroMobilidade(
        500,
        "STORAGE_MOBILIDADE_NAO_CONFIGURADO",
        "O armazenamento privado da Mobilidade Internacional não está configurado."
      );
    }

    const resultado =
      await get(
        documento.arquivoUrl,
        {
          access:
            "private",

          storeId,
useCache:
            false,
        }
      );

    if (
      !resultado ||
      resultado.statusCode !==
        200 ||
      !resultado.stream
    ) {
      throw new ErroMobilidade(
        404,
        "ARQUIVO_NAO_ENCONTRADO",
        "Arquivo indisponível no armazenamento."
      );
    }

    const buffer =
      Buffer.from(
        await new Response(
          resultado.stream
        ).arrayBuffer()
      );

    const download =
      req.nextUrl.searchParams.get(
        "download"
      ) === "1";

    const mime =
      documento.mimeType &&
      TIPOS_PERMITIDOS.has(
        documento.mimeType
      )
        ? documento.mimeType
        : "application/octet-stream";

    const nomeOriginal =
      documento.arquivoNome ||
      `documento-${documento.id}`;

    const nome =
      nomeSeguro(
        nomeOriginal
      );

    return new NextResponse(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            mime,

          "Content-Length":
            String(
              buffer.length
            ),

          "Content-Disposition":
            `${
              download
                ? "attachment"
                : "inline"
            }; filename="${nome}"; filename*=UTF-8''${encodeURIComponent(
              nomeOriginal
            )}`,

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",

          "Referrer-Policy":
            "no-referrer",

          "X-Robots-Tag":
            "noindex, nofollow, noarchive",
        },
      }
    );
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,

        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      }
    );
  }
}
