import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
  TipoLogoInstituicao,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

const TIPOS_PERMITIDOS =
  new Set<TipoLogoInstituicao>([
    "PRINCIPAL",
    "FUNDO_CLARO",
    "FUNDO_ESCURO",
    "MONOCROMATICA",
    "OUTRA",
  ]);

function numeroOpcional(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isFinite(numero) &&
    numero > 0
    ? Math.round(numero)
    : null;
}

export async function GET() {
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

    const logos =
      await prisma.instituicaoLogo.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,
        },
        include: {
          _count: {
            select: {
              templates: true,
            },
          },
        },
        orderBy: [
          {
            principal: "desc",
          },
          {
            ativa: "desc",
          },
          {
            tipo: "asc",
          },
          {
            nome: "asc",
          },
        ],
      });

    return NextResponse.json({
      logos,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar logos institucionais:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao buscar logos da instituição.",
      },
      {
        status: 500,
      }
    );
  }
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

    const body =
      await req.json();

    const nome =
      String(
        body?.nome || ""
      ).trim();

    const arquivoUrl =
      String(
        body?.arquivoUrl || ""
      ).trim();

    const arquivoPath =
      body?.arquivoPath
        ? String(
            body.arquivoPath
          ).trim()
        : null;

    const mimeType =
      body?.mimeType
        ? String(
            body.mimeType
          ).trim()
        : null;

    const tipoInformado =
      String(
        body?.tipo || "OUTRA"
      ).trim() as TipoLogoInstituicao;

    if (
      nome.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um nome para a logo.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      nome.length > 80
    ) {
      return NextResponse.json(
        {
          error:
            "O nome da logo deve ter no máximo 80 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    if (!arquivoUrl) {
      return NextResponse.json(
        {
          error:
            "Envie o arquivo da logo antes de cadastrá-la.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !TIPOS_PERMITIDOS.has(
        tipoInformado
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Tipo de logo inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const deveSerPrincipal =
      body?.principal === true ||
      tipoInformado ===
        "PRINCIPAL";

    const logo =
      await prisma.$transaction(
        async (tx) => {
          if (
            deveSerPrincipal
          ) {
            await tx.instituicaoLogo.updateMany({
              where: {
                instituicaoId:
                  user.instituicaoId,
                principal: true,
              },
              data: {
                principal: false,
              },
            });
          }

          return tx.instituicaoLogo.create({
            data: {
              instituicaoId:
                user.instituicaoId,

              nome,

              tipo:
                tipoInformado,

              arquivoUrl,

              arquivoPath,

              mimeType,

              largura:
                numeroOpcional(
                  body?.largura
                ),

              altura:
                numeroOpcional(
                  body?.altura
                ),

              ativa:
                body?.ativa !==
                false,

              principal:
                deveSerPrincipal,

              criadoPorId:
                user.id,

              atualizadoPorId:
                user.id,
            },
            include: {
              _count: {
                select: {
                  templates: true,
                },
              },
            },
          });
        }
      );

    return NextResponse.json(
      {
        logo,
        mensagem:
          "Logo cadastrada com sucesso.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar logo institucional:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Já existe uma logo com esse nome nesta instituição.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Erro ao cadastrar a logo da instituição.",
      },
      {
        status: 500,
      }
    );
  }
}