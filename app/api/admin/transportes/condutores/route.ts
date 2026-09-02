import {
  StatusVerificacaoTransporteEstudantil,
  TipoCondutorTransporte,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoUsuario = {
  id: number;
  instituicaoId: number;
  podeGerenciar: boolean;
};

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
        id: token.id,
        instituicaoId:
          token.instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
        instituicaoId: true,
        role: true,

        funcionario: {
          select: {
            ativo: true,
            statusFuncionario: true,

            permissoes: {
              where: {
                ativo: true,
              },

              select: {
                chave: true,
              },
            },

            departamento: {
              select: {
                permissoes: {
                  where: {
                    ativo: true,
                  },

                  select: {
                    chave: true,
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
          ...(funcionario.permissoes ||
            []
          ).map(
            (item) =>
              item.chave
          ),

          ...(funcionario.departamento
            ?.permissoes || []
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

  return {
    id: usuario.id,

    instituicaoId:
      usuario.instituicaoId,

    podeGerenciar,
  };
}

function limparTexto(
  valor: unknown,
  limite: number
) {
  if (
    typeof valor !== "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

function converterData(
  valor: unknown
): Date | null | undefined {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string"
  ) {
    return undefined;
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return undefined;
  }

  return data;
}

export async function GET() {
  try {
    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status: 403,
        }
      );
    }

    const [
      condutores,
      prestadores,
    ] = await Promise.all([
      prisma.condutorTransporte.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,
        },

        select: {
          id: true,

          prestadorTransporteId:
            true,

          nome: true,

          tipo: true,

          telefone: true,
          email: true,

          paisDocumento: true,
          tipoDocumento: true,
          numeroDocumento: true,

          numeroLicenca: true,
          categoriaLicenca:
            true,

          licencaValidaAte: true,

          autorizadoTransporteEstudantil:
            true,

          contatoEmergencia:
            true,

          telefoneEmergencia:
            true,

          observacao: true,

          ativo: true,

          createdAt: true,
          updatedAt: true,

          prestadorTransporte: {
            select: {
              id: true,
              nome: true,
              nomeFantasia: true,
              tipo: true,
            },
          },

          _count: {
            select: {
              atribuicoesTrechos:
                true,
            },
          },
        },

        orderBy: [
          {
            ativo: "desc",
          },
          {
            nome: "asc",
          },
        ],
      }),

      prisma.prestadorTransporte.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          nomeFantasia: true,
          tipo: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,

      podeGerenciar:
        usuario.podeGerenciar,

      condutores,

      opcoes: {
        prestadores,
      },
    });
  } catch (error) {
    console.error(
      "[TRANSPORTES_CONDUTORES_GET]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "ERRO_INTERNO",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              detalhe:
                error instanceof Error
                  ? error.message
                  : String(error),
            }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !usuario.podeGerenciar
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SEM_PERMISSAO_GERENCIAR",
        },
        {
          status: 403,
        }
      );
    }

    const corpo =
      await request
        .json()
        .catch(
          () => null
        );

    if (!corpo) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "CORPO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const nome =
      limparTexto(
        corpo?.nome,
        200
      );

    if (!nome) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "NOME_OBRIGATORIO",
        },
        {
          status: 400,
        }
      );
    }

    const tipoTexto =
      String(
        corpo?.tipo ||
          "MOTORISTA"
      ).trim();

    if (
      !Object.values(
        TipoCondutorTransporte
      ).includes(
        tipoTexto as TipoCondutorTransporte
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TIPO_CONDUTOR_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const verificacaoTexto =
      String(
        corpo
          ?.autorizadoTransporteEstudantil ||
          "NAO_VERIFICADO"
      ).trim();

    if (
      !Object.values(
        StatusVerificacaoTransporteEstudantil
      ).includes(
        verificacaoTexto as StatusVerificacaoTransporteEstudantil
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "VERIFICACAO_INVALIDA",
        },
        {
          status: 400,
        }
      );
    }

    const licencaValidaAte =
      converterData(
        corpo?.licencaValidaAte
      );

    if (
      licencaValidaAte ===
      undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "VALIDADE_LICENCA_INVALIDA",
        },
        {
          status: 400,
        }
      );
    }

    let prestadorTransporteId:
      | number
      | null = null;

    if (
      corpo?.prestadorTransporteId !==
        undefined &&
      corpo?.prestadorTransporteId !==
        null &&
      corpo?.prestadorTransporteId !==
        ""
    ) {
      const idPrestador =
        Number(
          corpo
            .prestadorTransporteId
        );

      if (
        !Number.isInteger(
          idPrestador
        ) ||
        idPrestador <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PRESTADOR_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const prestador =
        await prisma
          .prestadorTransporte
          .findFirst({
            where: {
              id: idPrestador,

              instituicaoId:
                usuario
                  .instituicaoId,

              ativo: true,
            },

            select: {
              id: true,
            },
          });

      if (!prestador) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PRESTADOR_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      prestadorTransporteId =
        prestador.id;
    }

    const condutor =
      await prisma
        .condutorTransporte
        .create({
          data: {
            instituicaoId:
              usuario.instituicaoId,

            prestadorTransporteId,

            nome,

            tipo:
              tipoTexto as TipoCondutorTransporte,

            telefone:
              limparTexto(
                corpo?.telefone,
                80
              ),

            email:
              limparTexto(
                corpo?.email,
                320
              ),

            paisDocumento:
              limparTexto(
                corpo?.paisDocumento,
                120
              ),

            tipoDocumento:
              limparTexto(
                corpo?.tipoDocumento,
                80
              ),

            numeroDocumento:
              limparTexto(
                corpo?.numeroDocumento,
                160
              ),

            numeroLicenca:
              limparTexto(
                corpo?.numeroLicenca,
                160
              ),

            categoriaLicenca:
              limparTexto(
                corpo?.categoriaLicenca,
                80
              ),

            licencaValidaAte,

            autorizadoTransporteEstudantil:
              verificacaoTexto as StatusVerificacaoTransporteEstudantil,

            contatoEmergencia:
              limparTexto(
                corpo?.contatoEmergencia,
                200
              ),

            telefoneEmergencia:
              limparTexto(
                corpo?.telefoneEmergencia,
                80
              ),

            observacao:
              limparTexto(
                corpo?.observacao,
                5000
              ),

            ativo: true,

            criadoPorId:
              usuario.id,

            atualizadoPorId:
              usuario.id,
          },

          select: {
            id: true,

            prestadorTransporteId:
              true,

            nome: true,

            tipo: true,

            telefone: true,
            email: true,

            paisDocumento: true,
            tipoDocumento: true,
            numeroDocumento: true,

            numeroLicenca: true,
            categoriaLicenca:
              true,

            licencaValidaAte: true,

            autorizadoTransporteEstudantil:
              true,

            contatoEmergencia:
              true,

            telefoneEmergencia:
              true,

            observacao: true,

            ativo: true,

            createdAt: true,
            updatedAt: true,

            prestadorTransporte: {
              select: {
                id: true,
                nome: true,
                nomeFantasia: true,
                tipo: true,
              },
            },
          },
        });

    return NextResponse.json(
      {
        ok: true,
        condutor,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[TRANSPORTES_CONDUTORES_POST]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "ERRO_INTERNO",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              detalhe:
                error instanceof Error
                  ? error.message
                  : String(error),
            }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}