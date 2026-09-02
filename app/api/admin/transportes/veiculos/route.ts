import {
  StatusVerificacaoTransporteEstudantil,
  TipoConducaoVeiculo,
  TipoVeiculoTransporte,
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

function inteiroOpcional(
  valor: unknown
): number | null | undefined {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    return undefined;
  }

  return numero;
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

    const veiculos =
      await prisma
        .veiculoTransporte
        .findMany({
          where: {
            instituicaoId:
              usuario.instituicaoId,
          },

          select: {
            id: true,

            prestadorTransporteId:
              true,

            nomeIdentificacao: true,

            tipo: true,

            marca: true,
            modelo: true,
            ano: true,

            placa: true,
            paisRegistro: true,

            identificadorExterno:
              true,

            capacidadePassageiros:
              true,

            acessivelPcd: true,

            tipoConducao: true,

            sistemaConducao: true,
            versaoSoftware: true,

            possuiRastreamento:
              true,

            possuiTelemetria:
              true,

            trackingProvider: true,

            externalVehicleId:
              true,

            autorizadoTransporteEstudantil:
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
              nomeIdentificacao:
                "asc",
            },
            {
              id: "asc",
            },
          ],
        });

    const prestadores =
      await prisma
        .prestadorTransporte
        .findMany({
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
        });

    return NextResponse.json({
      ok: true,

      podeGerenciar:
        usuario.podeGerenciar,

      veiculos,

      opcoes: {
        prestadores,
      },
    });
  } catch (error) {
    console.error(
      "[TRANSPORTES_VEICULOS_GET]",
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

    const tipoTexto =
      String(
        corpo?.tipo || ""
      ).trim();

    if (
      !Object.values(
        TipoVeiculoTransporte
      ).includes(
        tipoTexto as TipoVeiculoTransporte
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TIPO_VEICULO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const tipoConducaoTexto =
      String(
        corpo?.tipoConducao ||
          "HUMANA"
      ).trim();

    if (
      !Object.values(
        TipoConducaoVeiculo
      ).includes(
        tipoConducaoTexto as TipoConducaoVeiculo
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TIPO_CONDUCAO_INVALIDO",
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

    const ano =
      inteiroOpcional(
        corpo?.ano
      );

    if (ano === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ANO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ano !== null &&
      (
        ano < 1800 ||
        ano > 2200
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ANO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const capacidadePassageiros =
      inteiroOpcional(
        corpo
          ?.capacidadePassageiros
      );

    if (
      capacidadePassageiros ===
      undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "CAPACIDADE_INVALIDA",
        },
        {
          status: 400,
        }
      );
    }

    const veiculo =
      await prisma
        .veiculoTransporte
        .create({
          data: {
            instituicaoId:
              usuario.instituicaoId,

            prestadorTransporteId,

            nomeIdentificacao:
              limparTexto(
                corpo
                  ?.nomeIdentificacao,
                200
              ),

            tipo:
              tipoTexto as TipoVeiculoTransporte,

            marca:
              limparTexto(
                corpo?.marca,
                120
              ),

            modelo:
              limparTexto(
                corpo?.modelo,
                160
              ),

            ano,

            placa:
              limparTexto(
                corpo?.placa,
                80
              ),

            paisRegistro:
              limparTexto(
                corpo?.paisRegistro,
                120
              ),

            identificadorExterno:
              limparTexto(
                corpo
                  ?.identificadorExterno,
                200
              ),

            capacidadePassageiros,

            acessivelPcd:
              corpo?.acessivelPcd ===
              true,

            tipoConducao:
              tipoConducaoTexto as TipoConducaoVeiculo,

            sistemaConducao:
              limparTexto(
                corpo
                  ?.sistemaConducao,
                200
              ),

            versaoSoftware:
              limparTexto(
                corpo
                  ?.versaoSoftware,
                160
              ),

            possuiRastreamento:
              corpo
                ?.possuiRastreamento ===
              true,

            possuiTelemetria:
              corpo
                ?.possuiTelemetria ===
              true,

            trackingProvider:
              limparTexto(
                corpo
                  ?.trackingProvider,
                200
              ),

            externalVehicleId:
              limparTexto(
                corpo
                  ?.externalVehicleId,
                200
              ),

            autorizadoTransporteEstudantil:
              verificacaoTexto as StatusVerificacaoTransporteEstudantil,

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

            nomeIdentificacao: true,

            tipo: true,

            marca: true,
            modelo: true,
            ano: true,

            placa: true,
            paisRegistro: true,

            identificadorExterno:
              true,

            capacidadePassageiros:
              true,

            acessivelPcd: true,

            tipoConducao: true,

            sistemaConducao: true,
            versaoSoftware: true,

            possuiRastreamento:
              true,

            possuiTelemetria:
              true,

            trackingProvider: true,

            externalVehicleId:
              true,

            autorizadoTransporteEstudantil:
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
        veiculo,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[TRANSPORTES_VEICULOS_POST]",
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