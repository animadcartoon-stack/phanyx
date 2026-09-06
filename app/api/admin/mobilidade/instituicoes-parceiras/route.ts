import {
  Prisma,
} from "@prisma/client";
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";
import { NextRequest, NextResponse } from "next/server";

import {
  ErroMobilidade,
  exigirAcessoMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
  temPermissaoMobilidade,
} from "@/lib/mobilidade-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAISES_VALIDOS =
  new Set<CountryCode>(
    getCountries()
  );

function textoOpcional(
  valor: unknown,
  maximo = 500
) {
  if (
    typeof valor !== "string"
  ) {
    return null;
  }

  const texto = valor.trim();

  return texto
    ? texto.slice(0, maximo)
    : null;
}

function paisValido(
  valor: unknown
): CountryCode | null {
  if (
    typeof valor !== "string"
  ) {
    return null;
  }

  const codigo =
    valor
      .trim()
      .toUpperCase() as CountryCode;

  return PAISES_VALIDOS.has(
    codigo
  )
    ? codigo
    : null;
}

function paisNomeCanonico(
  codigo: CountryCode
) {
  try {
    const nomes =
      new Intl.DisplayNames(
        ["en"],
        {
          type: "region",
        }
      );

    return (
      nomes.of(codigo) ??
      codigo
    );
  } catch {
    return codigo;
  }
}

function emailValido(
  valor: string | null
) {
  if (!valor) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    valor
  );
}

function siteValido(
  valor: string | null
) {
  if (!valor) {
    return true;
  }

  try {
    const url =
      valor.startsWith("http://") ||
      valor.startsWith("https://")
        ? valor
        : `https://${valor}`;

    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function normalizarSite(
  valor: string | null
) {
  if (!valor) {
    return null;
  }

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://")
  ) {
    return valor;
  }

  return `https://${valor}`;
}

function erroDuplicidade(
  erro: unknown
) {
  return (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  );
}

export async function GET(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.instituicoes.ver",
        "mobilidade.instituicoes.gerenciar"
      );

    const q =
      req.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    const paisParam =
      req.nextUrl.searchParams
        .get("pais");

    const status =
      req.nextUrl.searchParams
        .get("status") ?? "TODAS";

    const pais =
      paisParam
        ? paisValido(
            paisParam
          )
        : null;

    const where: Prisma.MobilidadeInstituicaoParceiraWhereInput =
      {
        instituicaoId,

        ...(pais
          ? {
              paisCodigo:
                pais,
            }
          : {}),

        ...(status ===
        "ATIVAS"
          ? {
              ativo: true,
            }
          : status ===
              "INATIVAS"
            ? {
                ativo: false,
              }
            : {}),

        ...(q
          ? {
              OR: [
                {
                  nome: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  sigla: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  codigo: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  cidade: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  emailGeral: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      };

    const [
      total,
      ativas,
      inativas,
      itens,
    ] =
      await prisma.$transaction(
        [
          prisma
            .mobilidadeInstituicaoParceira
            .count({
              where: {
                instituicaoId,
              },
            }),

          prisma
            .mobilidadeInstituicaoParceira
            .count({
              where: {
                instituicaoId,
                ativo: true,
              },
            }),

          prisma
            .mobilidadeInstituicaoParceira
            .count({
              where: {
                instituicaoId,
                ativo: false,
              },
            }),

          prisma
            .mobilidadeInstituicaoParceira
            .findMany({
              where,

              select: {
                id: true,
                nome: true,
                sigla: true,
                codigo: true,
                paisCodigo: true,
                paisNome: true,
                cidade: true,
                estadoProvincia: true,
                endereco: true,
                cep: true,
                site: true,
                emailGeral: true,
                telefone: true,
                nomeContato: true,
                cargoContato: true,
                emailContato: true,
                telefoneContato: true,
                observacoes: true,
                ativo: true,
                createdAt: true,
                updatedAt: true,

                criadoPor: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                  },
                },

                _count: {
                  select: {
                    convenios: true,
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
        ]
      );

    return NextResponse.json(
      {
        ok: true,

        permissoes: {
          podeGerenciar:
            temPermissaoMobilidade(
              usuario,
              "mobilidade.gerenciar",
              "mobilidade.instituicoes.gerenciar"
            ),
        },

        resumo: {
          total,
          ativas,
          inativas,
        },

        itens,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.instituicoes.gerenciar"
      );

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    const nome =
      textoOpcional(
        corpo.nome,
        180
      );

    const paisCodigo =
      paisValido(
        corpo.paisCodigo
      );

    if (!nome) {
      throw new ErroMobilidade(
        400,
        "NOME_OBRIGATORIO",
        "Nome obrigatório."
      );
    }

    if (!paisCodigo) {
      throw new ErroMobilidade(
        400,
        "PAIS_INVALIDO",
        "País inválido."
      );
    }

    const emailGeral =
      textoOpcional(
        corpo.emailGeral,
        200
      );

    const emailContato =
      textoOpcional(
        corpo.emailContato,
        200
      );

    const site =
      textoOpcional(
        corpo.site,
        500
      );

    if (
      !emailValido(
        emailGeral
      ) ||
      !emailValido(
        emailContato
      )
    ) {
      throw new ErroMobilidade(
        400,
        "EMAIL_INVALIDO",
        "E-mail inválido."
      );
    }

    if (
      !siteValido(site)
    ) {
      throw new ErroMobilidade(
        400,
        "SITE_INVALIDO",
        "Site inválido."
      );
    }

    try {
      const criado =
        await prisma
          .mobilidadeInstituicaoParceira
          .create({
            data: {
              instituicaoId,
              nome,

              sigla:
                textoOpcional(
                  corpo.sigla,
                  40
                ),

              codigo:
                textoOpcional(
                  corpo.codigo,
                  80
                ),

              paisCodigo,

              paisNome:
                paisNomeCanonico(
                  paisCodigo
                ),

              cidade:
                textoOpcional(
                  corpo.cidade,
                  120
                ),

              estadoProvincia:
                textoOpcional(
                  corpo.estadoProvincia,
                  120
                ),

              endereco:
                textoOpcional(
                  corpo.endereco,
                  300
                ),

              cep:
                textoOpcional(
                  corpo.cep,
                  40
                ),

              site:
                normalizarSite(
                  site
                ),

              emailGeral,

              telefone:
                textoOpcional(
                  corpo.telefone,
                  80
                ),

              nomeContato:
                textoOpcional(
                  corpo.nomeContato,
                  160
                ),

              cargoContato:
                textoOpcional(
                  corpo.cargoContato,
                  160
                ),

              emailContato,

              telefoneContato:
                textoOpcional(
                  corpo.telefoneContato,
                  80
                ),

              observacoes:
                textoOpcional(
                  corpo.observacoes,
                  5000
                ),

              ativo:
                corpo.ativo !==
                false,

              criadoPorId:
                usuario?.id ??
                null,
            },
          });

      return NextResponse.json(
        {
          ok: true,
          id: criado.id,
        },
        {
          status: 201,
        }
      );
    } catch (erro) {
      if (
        erroDuplicidade(
          erro
        )
      ) {
        throw new ErroMobilidade(
          409,
          "INSTITUICAO_DUPLICADA",
          "Instituição parceira já cadastrada."
        );
      }

      throw erro;
    }
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}
