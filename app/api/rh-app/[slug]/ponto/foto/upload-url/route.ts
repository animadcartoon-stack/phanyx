import crypto from "crypto";
import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    slug: string;
  };
};

const TIPOS_PERMITIDOS = [
  "image/webp",
  "image/jpeg",
  "image/png",
] as const;

const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024;
const VALIDADE_UPLOAD_MS = 5 * 60 * 1000;

function normalizarSlug(valor: unknown) {
  try {
    return decodeURIComponent(String(valor || ""))
      .trim()
      .toLowerCase();
  } catch {
    return String(valor || "")
      .trim()
      .toLowerCase();
  }
}

function obterExtensao(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
    default:
      return "webp";
  }
}

function obterTokenBlob() {
  return String(
    process.env.RH_PONTO_READ_WRITE_TOKEN || ""
  ).trim();
}

export async function POST(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const slug = normalizarSlug(
      contexto.params.slug
    );

    if (!slug) {
      return NextResponse.json(
        {
          error: "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Sua sessão expirou. Entre novamente no RH Ponto.",
        },
        {
          status: 401,
        }
      );
    }

    const usuarioId = Number(user.id);
    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário ou instituição não identificado.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const contentType = String(
      body?.contentType || "image/webp"
    )
      .trim()
      .toLowerCase();

    if (
      !TIPOS_PERMITIDOS.includes(
        contentType as
          | "image/webp"
          | "image/jpeg"
          | "image/png"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Formato de imagem não permitido. Utilize WEBP, JPEG ou PNG.",
        },
        {
          status: 400,
        }
      );
    }

    const tokenBlob = obterTokenBlob();

    if (!tokenBlob) {
      console.error(
        "RH_PONTO_READ_WRITE_TOKEN não configurado."
      );

      return NextResponse.json(
        {
          error:
            "O armazenamento privado do Ponto Mobile não está configurado.",
        },
        {
          status: 503,
        }
      );
    }

    const agora = new Date();

    const [
      instituicao,
      configuracao,
      funcionario,
    ] = await Promise.all([
      prisma.instituicao.findFirst({
        where: {
          id: instituicaoId,
          slug,
        },

        select: {
          id: true,
          slug: true,
        },
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          ativo: true,
          exigirFoto: true,
          exigirFuncionarioLiberado: true,
        },
      }),

      prisma.funcionario.findFirst({
        where: {
          userId: usuarioId,
          instituicaoId,
        },

        select: {
          id: true,
          ativo: true,

          pontoMobileLiberado: true,
          pontoMobileValidoAte: true,

          user: {
            select: {
              ativo: true,
            },
          },
        },
      }),
    ]);

    if (!instituicao) {
      return NextResponse.json(
        {
          error:
            "Esta instituição não corresponde ao seu acesso.",
        },
        {
          status: 403,
        }
      );
    }

    if (!configuracao?.ativo) {
      return NextResponse.json(
        {
          error:
            "O Ponto Mobile está desativado nesta instituição.",
        },
        {
          status: 403,
        }
      );
    }

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado para este usuário.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      funcionario.ativo !== true ||
      funcionario.user.ativo !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Seu cadastro de funcionário está inativo.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      configuracao.exigirFuncionarioLiberado &&
      funcionario.pontoMobileLiberado !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Seu acesso ao Ponto Mobile não foi liberado pelo RH.",
        },
        {
          status: 403,
        }
      );
    }

    const acessoExpirado =
      funcionario.pontoMobileValidoAte !== null &&
      funcionario.pontoMobileValidoAte.getTime() <=
        agora.getTime();

    if (acessoExpirado) {
      return NextResponse.json(
        {
          error:
            "Sua autorização para utilizar o Ponto Mobile está expirada.",
        },
        {
          status: 403,
        }
      );
    }

    const ano = String(
      agora.getUTCFullYear()
    );

    const mes = String(
      agora.getUTCMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      agora.getUTCDate()
    ).padStart(2, "0");

    const extensao =
      obterExtensao(contentType);

    const identificador =
      crypto.randomUUID();

    const pathname = [
      "rh-ponto",
      `instituicao-${instituicaoId}`,
      `funcionario-${funcionario.id}`,
      ano,
      mes,
      dia,
      `${identificador}.${extensao}`,
    ].join("/");

    const expiraEm =
      Date.now() + VALIDADE_UPLOAD_MS;

    const tokenAssinado =
      await issueSignedToken({
        pathname,

        operations: ["put"],

        allowedContentTypes: [
          contentType,
        ],

        maximumSizeInBytes:
          TAMANHO_MAXIMO_BYTES,

        validUntil: expiraEm,

        token: tokenBlob,
      });

    const { presignedUrl } =
      await presignUrl(
        tokenAssinado,
        {
          operation: "put",
          pathname,
          access: "private",

          allowedContentTypes: [
            contentType,
          ],

          maximumSizeInBytes:
            TAMANHO_MAXIMO_BYTES,

          validUntil: expiraEm,

          addRandomSuffix: false,
          allowOverwrite: false,

          cacheControlMaxAge:
            30 * 24 * 60 * 60,
        }
      );

    return NextResponse.json({
      sucesso: true,

      upload: {
        url: presignedUrl,
        pathname,
        contentType,

        tamanhoMaximoBytes:
          TAMANHO_MAXIMO_BYTES,

        expiraEm:
          new Date(expiraEm).toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao gerar URL da foto do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível preparar o envio da foto.",
      },
      {
        status: 500,
      }
    );
  }
}