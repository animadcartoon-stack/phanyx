import {
  StatusVerificacaoTransporteEstudantil,
  TipoPrestadorTransporte,
} from "@prisma/client";

import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  normalizarTelefoneE164,
  telefoneValidoInternacional,
} from "@/lib/internacionalizacao/telefone";

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

const PAISES_VALIDOS =
  new Set<CountryCode>(
    getCountries()
  );

function converterPais(
  valor: unknown
): CountryCode | null | undefined {
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

  const codigo =
    valor
      .trim()
      .toUpperCase() as CountryCode;

  if (
    !PAISES_VALIDOS.has(
      codigo
    )
  ) {
    return undefined;
  }

  return codigo;
}

function codigoPostalValido(
  valor: string,
  pais: CountryCode | null
) {
  if (!valor.trim()) {
    return true;
  }

  if (!pais) {
    return false;
  }

  const limpo =
    valor
      .toUpperCase()
      .replace(
        /[^A-Z0-9 -]/g,
        ""
      );

  const digitos =
    limpo.replace(
      /\D/g,
      ""
    );

  if (pais === "BR") {
    return (
      digitos.length === 8
    );
  }

  if (pais === "PT") {
    return (
      digitos.length === 7
    );
  }

  if (pais === "US") {
    return (
      digitos.length === 5 ||
      digitos.length === 9
    );
  }

  if (
    pais === "ES" ||
    pais === "FR"
  ) {
    return (
      digitos.length === 5
    );
  }

  const tamanho =
    limpo.replace(
      /\s/g,
      ""
    ).length;

  return (
    tamanho >= 3 &&
    tamanho <= 16
  );
}

function normalizarTelefoneOpcional(
  valor: unknown,
  pais: CountryCode | null
): {
  valor: string | null;
  erro?: string;
} {
  const texto =
    limparTexto(
      valor,
      80
    );

  if (!texto) {
    return {
      valor: null,
    };
  }

  /*
   * Se vier número local,
   * precisamos saber o país.
   *
   * Se vier +55..., +351...,
   * a própria biblioteca
   * identifica o país.
   */
  if (
    !pais &&
    !texto.startsWith("+")
  ) {
    return {
      valor: null,
      erro:
        "PAIS_TELEFONE_OBRIGATORIO",
    };
  }

  /*
   * Quando começa com +,
   * o país base é ignorado
   * pelo parser internacional.
   */
  const paisBase =
    pais ?? "BR";

  if (
    !telefoneValidoInternacional(
      texto,
      paisBase
    )
  ) {
    return {
      valor: null,
      erro:
        "TELEFONE_INVALIDO",
    };
  }

  const e164 =
    normalizarTelefoneE164(
      texto,
      paisBase
    );

  if (!e164) {
    return {
      valor: null,
      erro:
        "TELEFONE_INVALIDO",
    };
  }

  return {
    valor: e164,
  };
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

            paisCodigo: true,
            pais: true,
            codigoPostal: true,

            endereco: true,
            numero: true,
            complemento: true,
            bairro: true,

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

    const paisCodigo =
      converterPais(
        corpo?.paisCodigo
      );

    if (
      paisCodigo === undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PAIS_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const codigoPostal =
      limparTexto(
        corpo?.codigoPostal,
        32
      );

    if (
      codigoPostal &&
      !codigoPostalValido(
        codigoPostal,
        paisCodigo
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "CODIGO_POSTAL_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const paisTelefone =
      converterPais(
        corpo?.paisTelefone
      );

    if (
      paisTelefone === undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PAIS_TELEFONE_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const paisTelefoneResponsavel =
      converterPais(
        corpo?.paisTelefoneResponsavel
      );

    if (
      paisTelefoneResponsavel ===
      undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PAIS_TELEFONE_RESPONSAVEL_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const telefone =
      normalizarTelefoneOpcional(
        corpo?.telefone,
        paisTelefone ??
        paisCodigo
      );

    if (telefone.erro) {
      return NextResponse.json(
        {
          ok: false,
          error:
            telefone.erro,
        },
        {
          status: 400,
        }
      );
    }

    const telefoneResponsavel =
      normalizarTelefoneOpcional(
        corpo
          ?.telefoneResponsavelContato,
        paisTelefoneResponsavel ??
        paisCodigo
      );

    if (
      telefoneResponsavel.erro
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            telefoneResponsavel.erro ===
              "TELEFONE_INVALIDO"
              ? "TELEFONE_RESPONSAVEL_INVALIDO"
              : "PAIS_TELEFONE_RESPONSAVEL_OBRIGATORIO",
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

            paisCodigo,

            pais:
              limparTexto(
                corpo?.pais,
                120
              ),

            codigoPostal,

            endereco:
              limparTexto(
                corpo?.endereco,
                300
              ),

            numero:
              limparTexto(
                corpo?.numero,
                80
              ),

            complemento:
              limparTexto(
                corpo?.complemento,
                200
              ),

            bairro:
              limparTexto(
                corpo?.bairro,
                160
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
              telefone.valor,

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
  telefoneResponsavel.valor,

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