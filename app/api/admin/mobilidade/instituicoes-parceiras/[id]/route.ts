import {
  Prisma,
} from "@prisma/client";
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirAcessoMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
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

function idValido(
  valor: string
) {
  const id =
    Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function textoOpcional(
  valor: unknown,
  maximo = 500
) {
  if (
    typeof valor !==
    "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  return texto
    ? texto.slice(0, maximo)
    : null;
}

function paisValido(
  valor: unknown
): CountryCode | null {
  if (
    typeof valor !==
    "string"
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
    new URL(
      valor.startsWith(
        "http://"
      ) ||
        valor.startsWith(
          "https://"
        )
        ? valor
        : `https://${valor}`
    );

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

  return valor.startsWith(
    "http://"
  ) ||
    valor.startsWith(
      "https://"
    )
    ? valor
    : `https://${valor}`;
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
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.instituicoes.ver",
        "mobilidade.instituicoes.gerenciar"
      );

    const id =
      idValido(
        params.id
      );

    if (!id) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "ID inválido."
      );
    }

    const item =
      await prisma
        .mobilidadeInstituicaoParceira
        .findFirst({
          where: {
            id,
            instituicaoId,
          },

          include: {
            _count: {
              select: {
                convenios: true,
              },
            },
          },
        });

    if (!item) {
      throw new ErroMobilidade(
        404,
        "INSTITUICAO_NAO_ENCONTRADA",
        "Instituição não encontrada."
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item,
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
      }
    );
  }
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
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.instituicoes.gerenciar"
      );

    const id =
      idValido(
        params.id
      );

    if (!id) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "ID inválido."
      );
    }

    const atual =
      await prisma
        .mobilidadeInstituicaoParceira
        .findFirst({
          where: {
            id,
            instituicaoId,
          },
        });

    if (!atual) {
      throw new ErroMobilidade(
        404,
        "INSTITUICAO_NAO_ENCONTRADA",
        "Instituição não encontrada."
      );
    }

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    if (
      corpo.acao ===
      "ALTERAR_STATUS"
    ) {
      if (
        typeof corpo.ativo !==
        "boolean"
      ) {
        throw new ErroMobilidade(
          400,
          "STATUS_INVALIDO",
          "Status inválido."
        );
      }

      await prisma
        .mobilidadeInstituicaoParceira
        .update({
          where: {
            id,
          },
          data: {
            ativo:
              corpo.ativo,
          },
        });

      return NextResponse.json(
        {
          ok: true,
        }
      );
    }

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
      !siteValido(
        site
      )
    ) {
      throw new ErroMobilidade(
        400,
        "SITE_INVALIDO",
        "Site inválido."
      );
    }

    try {
      await prisma
        .mobilidadeInstituicaoParceira
        .update({
          where: {
            id,
          },

          data: {
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
          },
        });

      return NextResponse.json(
        {
          ok: true,
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
