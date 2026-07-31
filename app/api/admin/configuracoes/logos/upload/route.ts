import {
  NextRequest,
  NextResponse,
} from "next/server";
import { put } from "@vercel/blob";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_ARQUIVO =
  5 * 1024 * 1024;

const TIPOS_PERMITIDOS =
  new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ]);

function limparNomeArquivo(
  nome: string
) {
  const nomeLimpo =
    String(nome || "logo")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        ""
      )
      .toLowerCase();

  return (
    nomeLimpo ||
    "logo.png"
  );
}

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão.",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await req.formData();

    const arquivo =
      formData.get("file");

    if (
      !(arquivo instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione uma imagem.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !TIPOS_PERMITIDOS.has(
        arquivo.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Formato inválido. Envie PNG, JPG, JPEG ou WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      arquivo.size <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "O arquivo enviado está vazio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      arquivo.size >
      LIMITE_ARQUIVO
    ) {
      return NextResponse.json(
        {
          error:
            "A imagem deve possuir no máximo 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const nomeSeguro =
      limparNomeArquivo(
        arquivo.name
      );

    const caminho =
      [
        "instituicoes",
        String(
          user.instituicaoId
        ),
        "logos",
        `${Date.now()}-${nomeSeguro}`,
      ].join("/");

    const buffer =
      Buffer.from(
        await arquivo.arrayBuffer()
      );

    const blob =
      await put(
        caminho,
        buffer,
        {
          access: "public",
          contentType:
            arquivo.type,
          addRandomSuffix:
            false,
        }
      );

    return NextResponse.json(
      {
        arquivoUrl:
          blob.url,

        arquivoPath:
          blob.pathname,

        mimeType:
          arquivo.type,

        tamanho:
          arquivo.size,

        nomeOriginal:
          arquivo.name,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "Erro ao enviar logo institucional:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao enviar a logo.",
      },
      {
        status: 500,
      }
    );
  }
}