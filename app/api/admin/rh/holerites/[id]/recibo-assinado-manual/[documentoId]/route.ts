import { createHash } from "crypto";
import { get } from "@vercel/blob";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CHAVE_PERMISSAO =
  "rh.holerites_assinar";

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

function respostaSemCache(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,

    headers: {
      "Cache-Control":
        "private, no-store, max-age=0",

      "X-Content-Type-Options":
        "nosniff",
    },
  });
}

function usuarioEhAdministrador(user: {
  role: unknown;
  isMasterAdmin: boolean;
}) {
  const role = String(
    user.role || "",
  ).toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user.isMasterAdmin === true
  );
}

function calcularSha256(
  valor: Buffer,
) {
  return createHash("sha256")
    .update(valor)
    .digest("hex");
}

function limparNomeArquivo(
  nome: string,
) {
  const nomeLimpo = nome
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    nomeLimpo ||
    "recibo-assinado-manualmente"
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
  },
) {
  try {
    const sessao =
      await getUserFromToken();

    if (
      !sessao?.id ||
      !sessao.instituicaoId
    ) {
      return respostaSemCache(
        {
          error: "Não autorizado.",
        },
        401,
      );
    }

    const instituicaoId = Number(
      sessao.instituicaoId,
    );

    const usuarioId = Number(
      sessao.id,
    );

    const holeriteId = Number(
      params.id,
    );

    const documentoId = Number(
      params.documentoId,
    );

    if (
      !Number.isInteger(holeriteId) ||
      holeriteId <= 0
    ) {
      return respostaSemCache(
        {
          error:
            "Informe um holerite válido.",
        },
        400,
      );
    }

    if (
      !Number.isInteger(documentoId) ||
      documentoId <= 0
    ) {
      return respostaSemCache(
        {
          error:
            "Informe um documento válido.",
        },
        400,
      );
    }

    const usuario =
      await prisma.user.findFirst({
        where: {
          id: usuarioId,
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          role: true,
          isMasterAdmin: true,

          funcionario: {
            select: {
              id: true,

              permissoes: {
                where: {
                  chave:
                    CHAVE_PERMISSAO,
                },

                take: 1,

                select: {
                  ativo: true,
                },
              },

              departamento: {
                select: {
                  permissoes: {
                    where: {
                      chave:
                        CHAVE_PERMISSAO,
                    },

                    take: 1,

                    select: {
                      ativo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!usuario) {
      return respostaSemCache(
        {
          error:
            "Usuário não encontrado, inativo ou pertencente a outra instituição.",
        },
        401,
      );
    }

    const permissaoIndividual =
      usuario.funcionario
        ?.permissoes[0];

    const permissaoDepartamento =
      usuario.funcionario
        ?.departamento
        ?.permissoes[0];

    const autorizado =
      usuarioEhAdministrador(usuario) ||
      (permissaoIndividual
        ? permissaoIndividual.ativo
        : permissaoDepartamento
            ?.ativo === true);

    if (!autorizado) {
      return respostaSemCache(
        {
          error:
            "Você não possui autorização para visualizar este documento.",

          codigo:
            "SEM_PERMISSAO_RECIBO_MANUAL",
        },
        403,
      );
    }

    const documento =
      await prisma.documentoAssinadoManualHoleriteRH.findFirst({
        where: {
          id: documentoId,
          instituicaoId,
          holeriteId,
          ativo: true,
        },

        select: {
          id: true,
          instituicaoId: true,
          holeriteId: true,
          funcionarioId: true,
          pagamentoHoleriteId: true,

          arquivoUrl: true,
          arquivoNome: true,
          arquivoMime: true,
          arquivoTamanho: true,
          arquivoHash: true,

          criadoEm: true,
          dataAssinaturaDeclarada:
            true,

          enviadoPorNomeSnapshot:
            true,
        },
      });

    if (!documento) {
      return respostaSemCache(
        {
          error:
            "Documento assinado não encontrado nesta instituição.",
        },
        404,
      );
    }

    const tokenBlob =
      process.env
        .RH_PONTO_READ_WRITE_TOKEN
        ?.trim();

    if (!tokenBlob) {
      return respostaSemCache(
        {
          error:
            "O armazenamento privado de documentos do RH não está configurado.",
        },
        500,
      );
    }

    const resultado = await get(
      documento.arquivoUrl,
      {
        access: "private",
        token: tokenBlob,
        useCache: false,
      },
    );

    if (
      !resultado ||
      resultado.statusCode !== 200 ||
      !resultado.stream
    ) {
      return respostaSemCache(
        {
          error:
            "O arquivo assinado não está disponível no armazenamento privado.",
        },
        404,
      );
    }

    const arquivoBuffer =
      Buffer.from(
        await new Response(
          resultado.stream,
        ).arrayBuffer(),
      );

    const hashAtual =
      calcularSha256(
        arquivoBuffer,
      );

    if (
      hashAtual !==
      documento.arquivoHash
    ) {
      console.error(
        "Falha de integridade no recibo assinado manualmente:",
        {
          instituicaoId,
          holeriteId,
          documentoId:
            documento.id,
          pagamentoHoleriteId:
            documento.pagamentoHoleriteId,
        },
      );

      return respostaSemCache(
        {
          error:
            "O documento não passou pela verificação de integridade. O arquivo não será exibido.",

          codigo:
            "FALHA_INTEGRIDADE_DOCUMENTO",
        },
        409,
      );
    }

    const forcarDownload =
      req.nextUrl.searchParams.get(
        "download",
      ) === "1";

    const disposicao =
      forcarDownload
        ? "attachment"
        : "inline";

    const mime =
      TIPOS_PERMITIDOS.has(
        documento.arquivoMime,
      )
        ? documento.arquivoMime
        : "application/octet-stream";

    const nomeOriginal =
      documento.arquivoNome ||
      `recibo-assinado-${documento.id}`;

    const nomeSeguro =
      limparNomeArquivo(
        nomeOriginal,
      );

    return new NextResponse(
      arquivoBuffer,
      {
        status: 200,

        headers: {
          "Content-Type": mime,

          "Content-Length":
            String(
              arquivoBuffer.length,
            ),

          "Content-Disposition":
            `${disposicao}; ` +
            `filename="${nomeSeguro}"; ` +
            `filename*=UTF-8''${encodeURIComponent(
              nomeOriginal,
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
      },
    );
  } catch (error: any) {
    console.error(
      "Erro ao abrir recibo assinado manualmente:",
      error,
    );

    return respostaSemCache(
      {
        error:
          error?.message ||
          "Erro ao abrir o documento assinado manualmente.",
      },
      500,
    );
  }
}