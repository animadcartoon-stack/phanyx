import {
  StatusVerificacaoTransporteEstudantil,
  TipoPrestadorTransporte,
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

    const prestadores =
      await prisma
        .prestadorTransporte
        .findMany({
          where: {
            instituicaoId:
              usuario.instituicaoId,
          },

          select: {
            id: true,

            nome: true,
            nomeFantasia: true,

            tipo: true,

            pais: true,
            regiao: true,
            cidade: true,

            telefone: true,
            email: true,
            site: true,

            responsavelContato:
              true,

            telefoneResponsavelContato:
              true,

            emailResponsavelContato:
              true,

            tipoDocumento: true,
            numeroDocumento: true,

            numeroLicenca: true,
            licencaValidaAte:
              true,

            numeroApolice: true,
            seguroValidoAte:
              true,

            verificacaoTransporteEstudantil:
              true,

            permiteSubcontratacao:
              true,

            observacao: true,

            ativo: true,

            createdAt: true,
            updatedAt: true,

            _count: {
              select: {
                veiculos: true,
                condutores: true,
                trechosAtividadesExternas:
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
        });

    return NextResponse.json({
      ok: true,

      podeGerenciar:
        usuario.podeGerenciar,

      prestadores,
    });
  } catch (error) {
    console.error(
      "[TRANSPORTES_PRESTADORES_GET]",
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
        corpo?.tipo || ""
      ).trim();

    if (
      !Object.values(
        TipoPrestadorTransporte
      ).includes(
        tipoTexto as TipoPrestadorTransporte
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TIPO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const verificacaoTexto =
      String(
        corpo
          ?.verificacaoTransporteEstudantil ||
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

    const seguroValidoAte =
      converterData(
        corpo?.seguroValidoAte
      );

    if (
      seguroValidoAte ===
      undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "VALIDADE_SEGURO_INVALIDA",
        },
        {
          status: 400,
        }
      );
    }

    const prestador =
      await prisma
        .prestadorTransporte
        .create({
          data: {
            instituicaoId:
              usuario.instituicaoId,

            nome,

            nomeFantasia:
              limparTexto(
                corpo?.nomeFantasia,
                200
              ),

            tipo:
              tipoTexto as TipoPrestadorTransporte,

            pais:
              limparTexto(
                corpo?.pais,
                120
              ),

            regiao:
              limparTexto(
                corpo?.regiao,
                160
              ),

            cidade:
              limparTexto(
                corpo?.cidade,
                160
              ),

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

            site:
              limparTexto(
                corpo?.site,
                500
              ),

            responsavelContato:
              limparTexto(
                corpo
                  ?.responsavelContato,
                200
              ),

            telefoneResponsavelContato:
              limparTexto(
                corpo
                  ?.telefoneResponsavelContato,
                80
              ),

            emailResponsavelContato:
              limparTexto(
                corpo
                  ?.emailResponsavelContato,
                320
              ),

            tipoDocumento:
              limparTexto(
                corpo
                  ?.tipoDocumento,
                80
              ),

            numeroDocumento:
              limparTexto(
                corpo
                  ?.numeroDocumento,
                160
              ),

            numeroLicenca:
              limparTexto(
                corpo
                  ?.numeroLicenca,
                160
              ),

            licencaValidaAte,

            numeroApolice:
              limparTexto(
                corpo
                  ?.numeroApolice,
                160
              ),

            seguroValidoAte,

            verificacaoTransporteEstudantil:
              verificacaoTexto as StatusVerificacaoTransporteEstudantil,

            permiteSubcontratacao:
              corpo
                ?.permiteSubcontratacao ===
              true,

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
        });

    return NextResponse.json(
      {
        ok: true,
        prestador,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[TRANSPORTES_PRESTADORES_POST]",
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