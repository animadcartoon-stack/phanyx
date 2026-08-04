import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
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
            "Sem permissão",
        },
        {
          status: 403,
        }
      );
    }

    const tipo =
      req.nextUrl.searchParams
        .get("tipo")
        ?.trim();

    const documentos =
      await prisma.documentoGerado.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          ...(tipo
            ? {
                tipo:
                  tipo as any,
              }
            : {}),
        },

        include: {
          aluno: true,
          matricula: true,
          template: true,
        },

        orderBy: {
          criadoEm: "desc",
        },

        take: 100,
      });

    return NextResponse.json(
      documentos
    );
  } catch (error: any) {
    console.error(
      "Erro ao listar documentos gerados:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao listar documentos gerados",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
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
            "Sem permissão",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await req.json();

    const modo =
      String(
        body?.modo || ""
      ).trim();

    /*
     * Excluir individualmente.
     */
    if (
      modo === "INDIVIDUAL"
    ) {
      const documentoId =
        Number(body?.documentoId);

      if (
        !Number.isInteger(
          documentoId
        ) ||
        documentoId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Documento inválido.",
          },
          {
            status: 400,
          }
        );
      }

      const documento =
        await prisma
          .documentoGerado
          .findFirst({
            where: {
              id:
                documentoId,

              instituicaoId:
                user.instituicaoId,
            },

            select: {
              id: true,
              titulo: true,
              status: true,
              assinadoEm: true,
            },
          });

      if (!documento) {
        return NextResponse.json(
          {
            error:
              "Documento não encontrado.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        documento.status ===
          "ASSINADO" ||
        documento.assinadoEm
      ) {
        return NextResponse.json(
          {
            error:
              "Documentos assinados não podem ser excluídos.",
          },
          {
            status: 409,
          }
        );
      }

      await prisma
        .documentoGerado
        .delete({
          where: {
            id:
              documento.id,
          },
        });

      return NextResponse.json({
        ok: true,
        quantidadeExcluida: 1,
        mensagem:
          `O documento “${documento.titulo}” foi excluído.`,
      });
    }

    /*
     * Excluir em lote todos os
     * documentos ainda não assinados.
     */
    if (
      modo ===
      "TODOS_NAO_ASSINADOS"
    ) {
      const resultado =
        await prisma
          .documentoGerado
          .deleteMany({
            where: {
              instituicaoId:
                user.instituicaoId,

              status: {
                not:
                  "ASSINADO",
              },

              assinadoEm: null,
            },
          });

      return NextResponse.json({
        ok: true,

        quantidadeExcluida:
          resultado.count,

        mensagem:
          resultado.count === 1
            ? "1 documento não assinado foi excluído."
            : `${resultado.count} documentos não assinados foram excluídos.`,
      });
    }

    return NextResponse.json(
      {
        error:
          "Modo de exclusão inválido.",
      },
      {
        status: 400,
      }
    );
  } catch (error: any) {
    console.error(
      "Erro ao excluir documentos gerados:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao excluir documentos gerados",
      },
      {
        status: 500,
      }
    );
  }
}