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

function validarId(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

async function sincronizarLogoPrincipal(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  logo: {
    arquivoUrl: string;
    arquivoPath:
      | string
      | null;
  } | null
) {
  await tx.configuracaoInstituicao.upsert({
    where: {
      instituicaoId,
    },
    update: {
      logoUrl:
        logo?.arquivoUrl ||
        null,

      logoPath:
        logo?.arquivoPath ||
        null,
    },
    create: {
      instituicaoId,

      logoUrl:
        logo?.arquivoUrl ||
        null,

      logoPath:
        logo?.arquivoPath ||
        null,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
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

    const id =
      validarId(
        params.id
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Logo inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const logoAtual =
      await prisma.instituicaoLogo.findFirst({
        where: {
          id,

          instituicaoId:
            user.instituicaoId,
        },
      });

    if (!logoAtual) {
      return NextResponse.json(
        {
          error:
            "Logo não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await req.json();

    const nome =
      body?.nome ===
      undefined
        ? logoAtual.nome
        : String(
            body.nome || ""
          ).trim();

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
            "O nome deve ter no máximo 80 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    const tipo =
      body?.tipo ===
      undefined
        ? logoAtual.tipo
        : String(
            body.tipo
          ).trim() as
            TipoLogoInstituicao;

    if (
      !TIPOS_PERMITIDOS.has(
        tipo
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

    const ativa =
      body?.ativa ===
      undefined
        ? logoAtual.ativa
        : body.ativa === true;

    let principal =
      body?.principal ===
      undefined
        ? logoAtual.principal
        : body.principal ===
          true;

    if (
      tipo ===
      "PRINCIPAL"
    ) {
      principal = true;
    }

    if (!ativa) {
      principal = false;
    }

    const logoAtualizada =
      await prisma.$transaction(
        async (tx) => {
          if (principal) {
            await tx.instituicaoLogo.updateMany({
              where: {
                instituicaoId:
                  user.instituicaoId,

                principal: true,

                id: {
                  not: id,
                },
              },
              data: {
                principal: false,

                atualizadoPorId:
                  user.id,
              },
            });
          }

          await tx.instituicaoLogo.update({
            where: {
              id,
            },
            data: {
              nome,
              tipo,
              ativa,
              principal,

              atualizadoPorId:
                user.id,
            },
          });

          if (principal) {
            await sincronizarLogoPrincipal(
              tx,
              user.instituicaoId,
              {
                arquivoUrl:
                  logoAtual.arquivoUrl,

                arquivoPath:
                  logoAtual.arquivoPath,
              }
            );
          }

          if (
            logoAtual.principal &&
            !principal
          ) {
            const outraPrincipal =
              await tx.instituicaoLogo.findFirst({
                where: {
                  instituicaoId:
                    user.instituicaoId,

                  principal: true,

                  ativa: true,
                },
              });

            if (
              !outraPrincipal
            ) {
              const substituta =
                await tx.instituicaoLogo.findFirst({
                  where: {
                    instituicaoId:
                      user.instituicaoId,

                    ativa: true,

                    id: {
                      not: id,
                    },
                  },
                  orderBy: [
                    {
                      tipo: "asc",
                    },
                    {
                      criadoEm:
                        "asc",
                    },
                  ],
                });

              if (substituta) {
                await tx.instituicaoLogo.update({
                  where: {
                    id:
                      substituta.id,
                  },
                  data: {
                    principal:
                      true,

                    atualizadoPorId:
                      user.id,
                  },
                });

                await sincronizarLogoPrincipal(
                  tx,
                  user.instituicaoId,
                  {
                    arquivoUrl:
                      substituta.arquivoUrl,

                    arquivoPath:
                      substituta.arquivoPath,
                  }
                );
              } else {
                await sincronizarLogoPrincipal(
                  tx,
                  user.instituicaoId,
                  null
                );
              }
            }
          }

          return tx.instituicaoLogo.findUnique({
            where: {
              id,
            },
            include: {
              _count: {
                select: {
                  templates:
                    true,
                },
              },
            },
          });
        }
      );

    return NextResponse.json({
      logo:
        logoAtualizada,

      mensagem:
        "Logo atualizada com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar logo institucional:",
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
          "Erro ao atualizar a logo.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
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

    const id =
      validarId(
        params.id
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Logo inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const logoAtual =
      await prisma.instituicaoLogo.findFirst({
        where: {
          id,

          instituicaoId:
            user.instituicaoId,
        },
        include: {
          _count: {
            select: {
              templates:
                true,
            },
          },
        },
      });

    if (!logoAtual) {
      return NextResponse.json(
        {
          error:
            "Logo não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      logoAtual._count.templates >
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Esta logo está vinculada a um ou mais templates. Altere os templates antes de excluí-la.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.instituicaoLogo.delete({
          where: {
            id,
          },
        });

        if (
          logoAtual.principal
        ) {
          const substituta =
            await tx.instituicaoLogo.findFirst({
              where: {
                instituicaoId:
                  user.instituicaoId,

                ativa: true,
              },
              orderBy: [
                {
                  tipo: "asc",
                },
                {
                  criadoEm:
                    "asc",
                },
              ],
            });

          if (substituta) {
            await tx.instituicaoLogo.update({
              where: {
                id:
                  substituta.id,
              },
              data: {
                principal:
                  true,

                atualizadoPorId:
                  user.id,
              },
            });

            await sincronizarLogoPrincipal(
              tx,
              user.instituicaoId,
              {
                arquivoUrl:
                  substituta.arquivoUrl,

                arquivoPath:
                  substituta.arquivoPath,
              }
            );
          } else {
            await sincronizarLogoPrincipal(
              tx,
              user.instituicaoId,
              null
            );
          }
        }
      }
    );

    return NextResponse.json({
      mensagem:
        "Logo excluída com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao excluir logo institucional:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao excluir a logo.",
      },
      {
        status: 500,
      }
    );
  }
}