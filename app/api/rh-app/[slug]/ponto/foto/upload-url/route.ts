import crypto from "crypto";
import { put } from "@vercel/blob";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    slug: string;
  };
};

const TIPOS_PERMITIDOS = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
]);

const TAMANHO_MAXIMO_BYTES =
  2 * 1024 * 1024;

function normalizarSlug(
  valor: unknown
) {
  try {
    return decodeURIComponent(
      String(valor || "")
    )
      .trim()
      .toLowerCase();
  } catch {
    return String(valor || "")
      .trim()
      .toLowerCase();
  }
}

function obterExtensao(
  contentType: string
) {
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
    process.env
      .RH_PONTO_READ_WRITE_TOKEN || ""
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
          error:
            "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await getUserFromToken();

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

    const usuarioId = Number(
      user.id
    );

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

    const tokenBlob =
      obterTokenBlob();

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

          exigirFuncionarioLiberado:
            true,
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

          pontoMobileLiberado:
            true,

          pontoMobileValidoAte:
            true,

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
      configuracao
        .exigirFuncionarioLiberado &&
      funcionario
        .pontoMobileLiberado !== true
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
      funcionario
        .pontoMobileValidoAte !==
        null &&
      funcionario
        .pontoMobileValidoAte
        .getTime() <= agora.getTime();

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

    const formData =
      await req.formData();

    const foto =
      formData.get("foto");

    if (!(foto instanceof File)) {
      return NextResponse.json(
        {
          error:
            "A foto não foi recebida pelo servidor.",
        },
        {
          status: 400,
        }
      );
    }

    const contentType = String(
      foto.type || ""
    )
      .trim()
      .toLowerCase();

    if (
      !TIPOS_PERMITIDOS.has(
        contentType
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

    if (
      !Number.isFinite(foto.size) ||
      foto.size <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A foto recebida está vazia.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      foto.size >
      TAMANHO_MAXIMO_BYTES
    ) {
      return NextResponse.json(
        {
          error:
            "A foto ultrapassou o limite de 2 MB.",
        },
        {
          status: 413,
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

    const blob = await put(
      pathname,
      foto,
      {
        access: "private",

        token: tokenBlob,

        contentType,

        addRandomSuffix: false,
        allowOverwrite: false,

        cacheControlMaxAge:
          30 * 24 * 60 * 60,
      }
    );

    return NextResponse.json({
      sucesso: true,

      upload: {
        pathname: blob.pathname,
        contentType:
          blob.contentType ||
          contentType,

        tamanhoBytes: foto.size,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao enviar foto do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível enviar a foto com segurança.",
      },
      {
        status: 500,
      }
    );
  }
}