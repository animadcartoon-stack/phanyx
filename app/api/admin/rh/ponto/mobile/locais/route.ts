import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

const selecaoLocal = {
  id: true,
  nome: true,

  cep: true,
  logradouro: true,
  numero: true,
  complemento: true,
  bairro: true,
  cidade: true,
  estado: true,
  endereco: true,

  latitude: true,
  longitude: true,
  raioMetros: true,
  ativo: true,

  criadoEm: true,
  atualizadoEm: true,
} as const;

function obterInstituicaoId(user: any) {
  const instituicaoId = Number(user?.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return null;
  }

  return instituicaoId;
}

async function validarPermissao(user: any) {
  return usuarioPossuiPermissao(
    user,
    "rh.ponto.mobile.locais.gerenciar"
  );
}

function limparCep(valor: unknown) {
  return String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);
}

function formatarCep(cep: string) {
  return cep.replace(
    /^(\d{5})(\d{3})$/,
    "$1-$2"
  );
}

function limparTexto(
  valor: unknown,
  tamanhoMaximo: number
) {
  return String(valor || "")
    .trim()
    .slice(0, tamanhoMaximo);
}

function obterNumero(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const texto = String(valor)
    .trim()
    .replace(",", ".");

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function montarEnderecoCompleto(args: {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}) {
  const {
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
  } = args;

  const primeiraParte = [
    logradouro,
    numero,
    complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const segundaParte = [
    bairro,
    cidade && estado
      ? `${cidade} - ${estado}`
      : cidade || estado,
    cep ? `CEP ${formatarCep(cep)}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return [primeiraParte, segundaParte]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 500);
}

function prepararDadosLocal(body: any) {
  const nome = limparTexto(
    body?.nome,
    120
  );

  const cep = limparCep(body?.cep);

  const logradouro = limparTexto(
    body?.logradouro,
    200
  );

  const numero = limparTexto(
    body?.numero,
    30
  );

  const complemento = limparTexto(
    body?.complemento,
    120
  );

  const bairro = limparTexto(
    body?.bairro,
    120
  );

  const cidade = limparTexto(
    body?.cidade,
    120
  );

  const estado = limparTexto(
    body?.estado,
    2
  ).toUpperCase();

  const latitude = obterNumero(
    body?.latitude
  );

  const longitude = obterNumero(
    body?.longitude
  );

  const raioMetros = obterNumero(
    body?.raioMetros
  );

  if (nome.length < 2) {
    return {
      error:
        "Informe um nome com pelo menos 2 caracteres.",
    };
  }

  if (!/^\d{8}$/.test(cep)) {
    return {
      error:
        "Informe um CEP válido com 8 números.",
    };
  }

  if (logradouro.length < 2) {
    return {
      error:
        "Informe o logradouro do local.",
    };
  }

  if (!numero) {
    return {
      error:
        "Informe o número do endereço ou use S/N.",
    };
  }

  if (cidade.length < 2) {
    return {
      error:
        "Informe a cidade do local.",
    };
  }

  if (!/^[A-Z]{2}$/.test(estado)) {
    return {
      error:
        "Informe a sigla do estado com 2 letras.",
    };
  }

  /*
   * As coordenadas continuam obrigatórias no banco,
   * mas não serão digitadas pelo usuário.
   *
   * Elas virão da busca do CEP ou do botão
   * “Usar minha localização atual”.
   */
  if (
    latitude === null ||
    latitude < -90 ||
    latitude > 90
  ) {
    return {
      error:
        "Não foi possível confirmar a localização deste endereço. Busque novamente o CEP ou use sua localização atual.",
    };
  }

  if (
    longitude === null ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      error:
        "Não foi possível confirmar a localização deste endereço. Busque novamente o CEP ou use sua localização atual.",
    };
  }

  if (
    raioMetros === null ||
    !Number.isInteger(raioMetros) ||
    raioMetros < 10 ||
    raioMetros > 5000
  ) {
    return {
      error:
        "O raio permitido deve ser um número inteiro entre 10 e 5.000 metros.",
    };
  }

  const endereco = montarEnderecoCompleto({
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
  });

  return {
    dados: {
      nome,

      cep: formatarCep(cep),
      logradouro,
      numero,
      complemento:
        complemento || null,
      bairro:
        bairro || null,
      cidade,
      estado,
      endereco,

      latitude,
      longitude,
      raioMetros,

      ativo: body?.ativo !== false,
    },
  };
}

export async function GET(
  req: NextRequest
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const podeGerenciar =
      await validarPermissao(user);

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para gerenciar os locais do Ponto Mobile.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      obterInstituicaoId(user);

    if (!instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const pagina = Math.max(
      1,
      Number(
        req.nextUrl.searchParams.get(
          "pagina"
        ) || 1
      ) || 1
    );

    const limite = Math.min(
      LIMITE_MAXIMO,
      Math.max(
        1,
        Number(
          req.nextUrl.searchParams.get(
            "limite"
          ) || LIMITE_PADRAO
        ) || LIMITE_PADRAO
      )
    );

    const busca =
      req.nextUrl.searchParams
        .get("busca")
        ?.trim()
        .slice(0, 120) || "";

    const filtroAtivo =
      req.nextUrl.searchParams.get(
        "ativo"
      );

    const where: any = {
      instituicaoId,
    };

    if (busca) {
      where.OR = [
        {
          nome: {
            contains: busca,
            mode: "insensitive",
          },
        },

        {
          endereco: {
            contains: busca,
            mode: "insensitive",
          },
        },

        {
          cep: {
            contains: busca,
            mode: "insensitive",
          },
        },

        {
          cidade: {
            contains: busca,
            mode: "insensitive",
          },
        },
      ];
    }

    if (filtroAtivo === "true") {
      where.ativo = true;
    }

    if (filtroAtivo === "false") {
      where.ativo = false;
    }

    const skip =
      (pagina - 1) * limite;

    const [
      total,
      locais,
      configuracao,
    ] = await Promise.all([
      prisma.localPontoMobileRH.count({
        where,
      }),

      prisma.localPontoMobileRH.findMany({
        where,
        skip,
        take: limite,

        orderBy: [
          {
            ativo: "desc",
          },
          {
            nome: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: selecaoLocal,
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          raioPadraoMetros: true,
        },
      }),
    ]);

    const totalPaginas = Math.max(
      1,
      Math.ceil(total / limite)
    );

    return NextResponse.json({
      sucesso: true,

      configuracao: {
        raioPadraoMetros:
          configuracao?.raioPadraoMetros ||
          150,
      },

      locais,

      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas,
        possuiAnterior:
          pagina > 1,
        possuiProxima:
          pagina < totalPaginas,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao listar locais do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os locais autorizados.",
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
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const podeGerenciar =
      await validarPermissao(user);

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para cadastrar locais do Ponto Mobile.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      obterInstituicaoId(user);

    if (!instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const preparado =
      prepararDadosLocal(body);

    if ("error" in preparado) {
      return NextResponse.json(
        {
          error: preparado.error,
        },
        {
          status: 400,
        }
      );
    }

    const localComMesmoNome =
      await prisma.localPontoMobileRH.findFirst({
        where: {
          instituicaoId,

          nome: {
            equals:
              preparado.dados.nome,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (localComMesmoNome) {
      return NextResponse.json(
        {
          error:
            "Já existe um local cadastrado com este nome.",
        },
        {
          status: 409,
        }
      );
    }

    const local =
      await prisma.localPontoMobileRH.create({
        data: {
          instituicaoId,
          ...preparado.dados,
        },

        select: selecaoLocal,
      });

    return NextResponse.json(
      {
        sucesso: true,

        mensagem:
          "Local autorizado cadastrado com sucesso.",

        local,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar local do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível cadastrar o local autorizado.",
      },
      {
        status: 500,
      }
    );
  }
}