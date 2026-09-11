import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  FinalidadeContaBancariaRH,
  TipoChavePixRH,
  TipoContaBancariaRH,
} from "@prisma/client";
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";

const PAISES = new Set<CountryCode>(
  getCountries()
);

function limparTexto(
  valor: unknown
): string {
  return String(valor ?? "").trim();
}

function textoOpcional(
  valor: unknown,
  limite = 250
): string | null {
  const texto =
    limparTexto(valor).slice(0, limite);

  return texto || null;
}

function paisOpcional(
  valor: unknown
): CountryCode | null {
  const codigo =
    limparTexto(valor)
      .toUpperCase() as CountryCode;

  return PAISES.has(codigo)
    ? codigo
    : null;
}

function moedaOpcional(
  valor: unknown
): string | null {
  const codigo =
    limparTexto(valor)
      .toUpperCase();

  if (!codigo) {
    return null;
  }

  return /^[A-Z]{3}$/.test(codigo)
    ? codigo
    : null;
}

function tipoContaOpcional(
  valor: unknown
): TipoContaBancariaRH | null {
  const texto =
    limparTexto(valor).toUpperCase();

  if (!texto) {
    return null;
  }

  const valores = Object.values(
    TipoContaBancariaRH
  );

  return valores.includes(
    texto as TipoContaBancariaRH
  )
    ? (texto as TipoContaBancariaRH)
    : null;
}

function tipoPixOpcional(
  valor: unknown
): TipoChavePixRH | null {
  const texto =
    limparTexto(valor).toUpperCase();

  if (!texto) {
    return null;
  }

  const valores = Object.values(
    TipoChavePixRH
  );

  return valores.includes(
    texto as TipoChavePixRH
  )
    ? (texto as TipoChavePixRH)
    : null;
}

async function obterFuncionario(
  id: number,
  instituicaoId: number
) {
  return prisma.funcionario.findFirst({
    where: {
      id,
      instituicaoId,
    },
    select: {
      id: true,
      nome: true,
      paisResidencia: true,

      banco: true,
      agencia: true,
      conta: true,
      pix: true,
    },
  });
}

export async function GET(
  _request: Request,
  context: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        { status: 401 }
      );
    }

    if (
      !isAdminLike(user.role) ||
      !user.instituicaoId
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão",
        },
        { status: 403 }
      );
    }

    const id =
      Number(context.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Funcionário inválido.",
        },
        { status: 400 }
      );
    }

    const funcionario =
      await obterFuncionario(
        id,
        Number(user.instituicaoId)
      );

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado.",
        },
        { status: 404 }
      );
    }

    const conta =
      await prisma
        .contaBancariaFuncionarioRH
        .findUnique({
          where: {
            funcionarioId_finalidade: {
              funcionarioId: id,
              finalidade:
                FinalidadeContaBancariaRH.SALARIO,
            },
          },
        });

    if (conta) {
      return NextResponse.json({
        conta,
        origem: "CONTA_BANCARIA_RH",
      });
    }

    /*
     * Compatibilidade: funcionários antigos podem
     * ter somente os campos bancários legados.
     */
    const possuiLegado =
      Boolean(funcionario.banco) ||
      Boolean(funcionario.agencia) ||
      Boolean(funcionario.conta) ||
      Boolean(funcionario.pix);

    return NextResponse.json({
      conta: possuiLegado
        ? {
            id: null,
            instituicaoId:
              Number(user.instituicaoId),
            funcionarioId: id,
            finalidade:
              FinalidadeContaBancariaRH.SALARIO,

            paisCodigo:
              funcionario.paisResidencia ||
              "BR",

            moeda:
              funcionario.paisResidencia ===
              "BR"
                ? "BRL"
                : null,

            bancoCodigo: null,
            bancoNome:
              funcionario.banco ||
              null,
            agencia:
              funcionario.agencia ||
              null,
            conta:
              funcionario.conta ||
              null,
            tipoConta: null,

            iban: null,
            bicSwift: null,
            routingNumber: null,
            sortCode: null,

            tipoChavePix:
              funcionario.pix
                ? TipoChavePixRH.ALEATORIA
                : null,

            chavePix:
              funcionario.pix ||
              null,

            titularNome:
              funcionario.nome,
            titularDocumento: null,
            ativo: true,
          }
        : null,

      origem: possuiLegado
        ? "FUNCIONARIO_LEGADO"
        : null,
    });
  } catch (error) {
    console.error(
      "ERRO AO BUSCAR CONTA BANCARIA DO FUNCIONARIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao buscar dados bancários do funcionário.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        { status: 401 }
      );
    }

    if (
      !isAdminLike(user.role) ||
      !user.instituicaoId
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão",
        },
        { status: 403 }
      );
    }

    const instituicaoId =
      Number(user.instituicaoId);

    const id =
      Number(context.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Funcionário inválido.",
        },
        { status: 400 }
      );
    }

    const funcionario =
      await obterFuncionario(
        id,
        instituicaoId
      );

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado.",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const paisTexto =
      limparTexto(body.paisCodigo);

    const paisCodigo =
      paisTexto
        ? paisOpcional(paisTexto)
        : paisOpcional(
            funcionario.paisResidencia
          ) || "BR";

    if (
      paisTexto &&
      !paisCodigo
    ) {
      return NextResponse.json(
        {
          code:
            "INVALID_BANK_COUNTRY",
          error:
            "O país da conta bancária é inválido.",
        },
        { status: 400 }
      );
    }

    const moedaTexto =
      limparTexto(body.moeda);

    const moeda =
      moedaTexto
        ? moedaOpcional(
            moedaTexto
          )
        : paisCodigo === "BR"
          ? "BRL"
          : null;

    if (
      moedaTexto &&
      !moeda
    ) {
      return NextResponse.json(
        {
          code:
            "INVALID_CURRENCY",
          error:
            "Informe a moeda com o código ISO de 3 letras.",
        },
        { status: 400 }
      );
    }

    const tipoConta =
      tipoContaOpcional(
        body.tipoConta
      );

    if (
      limparTexto(body.tipoConta) &&
      !tipoConta
    ) {
      return NextResponse.json(
        {
          error:
            "O tipo de conta bancária é inválido.",
        },
        { status: 400 }
      );
    }

    const contaEhBrasil =
      paisCodigo === "BR";

    const tipoChavePix =
      contaEhBrasil
        ? tipoPixOpcional(
            body.tipoChavePix
          )
        : null;

    if (
      contaEhBrasil &&
      limparTexto(
        body.tipoChavePix
      ) &&
      !tipoChavePix
    ) {
      return NextResponse.json(
        {
          error:
            "O tipo de chave PIX é inválido.",
        },
        { status: 400 }
      );
    }

    const dados = {
      instituicaoId,
      funcionarioId: id,
      finalidade:
        FinalidadeContaBancariaRH.SALARIO,

      paisCodigo,
      moeda,

      bancoCodigo:
        textoOpcional(
          body.bancoCodigo,
          30
        ),

      bancoNome:
        textoOpcional(
          body.bancoNome,
          180
        ),

      agencia:
        textoOpcional(
          body.agencia,
          60
        ),

      conta:
        textoOpcional(
          body.conta,
          120
        ),

      tipoConta,

      iban:
        textoOpcional(
          body.iban,
          80
        )
          ?.replace(/\s+/g, "")
          .toUpperCase() ||
        null,

      bicSwift:
        textoOpcional(
          body.bicSwift,
          30
        )
          ?.replace(/\s+/g, "")
          .toUpperCase() ||
        null,

      routingNumber:
        textoOpcional(
          body.routingNumber,
          30
        ),

      sortCode:
        textoOpcional(
          body.sortCode,
          30
        ),

      tipoChavePix,

      chavePix:
        contaEhBrasil
          ? textoOpcional(
              body.chavePix,
              180
            )
          : null,

      titularNome:
        textoOpcional(
          body.titularNome,
          180
        ) ||
        funcionario.nome,

      titularDocumento:
        textoOpcional(
          body.titularDocumento,
          120
        ),

      ativo:
        body.ativo !== false,
    };

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const conta =
            await tx
              .contaBancariaFuncionarioRH
              .upsert({
                where: {
                  funcionarioId_finalidade: {
                    funcionarioId: id,
                    finalidade:
                      FinalidadeContaBancariaRH.SALARIO,
                  },
                },

                create: dados,
                update: {
                  paisCodigo:
                    dados.paisCodigo,
                  moeda:
                    dados.moeda,

                  bancoCodigo:
                    dados.bancoCodigo,
                  bancoNome:
                    dados.bancoNome,
                  agencia:
                    dados.agencia,
                  conta:
                    dados.conta,
                  tipoConta:
                    dados.tipoConta,

                  iban:
                    dados.iban,
                  bicSwift:
                    dados.bicSwift,
                  routingNumber:
                    dados.routingNumber,
                  sortCode:
                    dados.sortCode,

                  tipoChavePix:
                    dados.tipoChavePix,
                  chavePix:
                    dados.chavePix,

                  titularNome:
                    dados.titularNome,
                  titularDocumento:
                    dados.titularDocumento,
                  ativo:
                    dados.ativo,
                },
              });

          /*
           * Mantém os campos legados sincronizados
           * para os fluxos antigos brasileiros.
           */
          await tx.funcionario.update({
            where: {
              id,
            },
            data: {
              banco:
                contaEhBrasil
                  ? dados.bancoNome ||
                    dados.bancoCodigo
                  : null,

              agencia:
                contaEhBrasil
                  ? dados.agencia
                  : null,

              conta:
                contaEhBrasil
                  ? dados.conta
                  : null,

              pix:
                contaEhBrasil
                  ? dados.chavePix
                  : null,
            },
          });

          return conta;
        }
      );

    return NextResponse.json({
      message:
        "Dados bancários atualizados com sucesso.",
      conta: resultado,
    });
  } catch (error) {
    console.error(
      "ERRO AO SALVAR CONTA BANCARIA DO FUNCIONARIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao salvar os dados bancários do funcionário.",
      },
      { status: 500 }
    );
  }
}
