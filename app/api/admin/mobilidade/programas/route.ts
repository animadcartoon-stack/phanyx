import {
  MobilidadeDirecao,
  MobilidadeStatusPrograma,
  MobilidadeTipoPrograma,
  Prisma,
} from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";

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

const TIPOS =
  new Set(
    Object.values(
      MobilidadeTipoPrograma
    )
  );

const DIRECOES =
  new Set(
    Object.values(
      MobilidadeDirecao
    )
  );

const STATUS =
  new Set(
    Object.values(
      MobilidadeStatusPrograma
    )
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

  const texto =
    valor.trim();

  return texto
    ? texto.slice(0, maximo)
    : null;
}

function inteiroPositivoOuNulo(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isInteger(
    numero
  ) &&
    numero >= 0
    ? numero
    : undefined;
}

function idOpcional(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isInteger(
    numero
  ) &&
    numero > 0
    ? numero
    : undefined;
}

function tipoValido(
  valor: unknown
): MobilidadeTipoPrograma | null {
  return typeof valor === "string" &&
    TIPOS.has(
      valor as MobilidadeTipoPrograma
    )
    ? (valor as MobilidadeTipoPrograma)
    : null;
}

function direcaoValida(
  valor: unknown
): MobilidadeDirecao | null {
  return typeof valor === "string" &&
    DIRECOES.has(
      valor as MobilidadeDirecao
    )
    ? (valor as MobilidadeDirecao)
    : null;
}

function statusValido(
  valor: unknown
): MobilidadeStatusPrograma | null {
  return typeof valor === "string" &&
    STATUS.has(
      valor as MobilidadeStatusPrograma
    )
    ? (valor as MobilidadeStatusPrograma)
    : null;
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

async function resolverVinculos({
  instituicaoId,
  convenioId,
  parceiroId,
}: {
  instituicaoId: number;
  convenioId: number | null;
  parceiroId: number | null;
}) {
  if (convenioId) {
    const convenio =
      await prisma.mobilidadeConvenio.findFirst({
        where: {
          id: convenioId,
          instituicaoId,
        },

        select: {
          id: true,
          instituicaoParceiraId: true,
        },
      });

    if (!convenio) {
      throw new ErroMobilidade(
        400,
        "CONVENIO_INVALIDO",
        "Convênio inválido."
      );
    }

    return {
      convenioId:
        convenio.id,

      instituicaoParceiraId:
        convenio.instituicaoParceiraId,
    };
  }

  if (parceiroId) {
    const parceiro =
      await prisma
        .mobilidadeInstituicaoParceira
        .findFirst({
          where: {
            id: parceiroId,
            instituicaoId,
            ativo: true,
          },

          select: {
            id: true,
          },
        });

    if (!parceiro) {
      throw new ErroMobilidade(
        400,
        "PARCEIRO_INVALIDO",
        "Instituição parceira inválida."
      );
    }
  }

  return {
    convenioId: null,
    instituicaoParceiraId:
      parceiroId,
  };
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
        "mobilidade.programas.ver",
        "mobilidade.programas.gerenciar"
      );

    const q =
      req.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    const tipoParam =
      req.nextUrl.searchParams
        .get("tipo");

    const statusParam =
      req.nextUrl.searchParams
        .get("status");

    const direcaoParam =
      req.nextUrl.searchParams
        .get("direcao");

    const tipo =
      tipoParam
        ? tipoValido(
            tipoParam
          )
        : null;

    const status =
      statusParam
        ? statusValido(
            statusParam
          )
        : null;

    const direcao =
      direcaoParam
        ? direcaoValida(
            direcaoParam
          )
        : null;

    const where: Prisma.MobilidadeProgramaWhereInput =
      {
        instituicaoId,

        ...(tipo
          ? { tipo }
          : {}),

        ...(status
          ? { status }
          : {}),

        ...(direcao
          ? { direcao }
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
                  codigo: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  idiomaPrincipal: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  instituicaoParceira: {
                    nome: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  convenio: {
                    nome: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      };

    const [
      total,
      ativos,
      rascunhos,
      inativos,
      programas,
      convenios,
      parceiros,
    ] =
      await prisma.$transaction([
        prisma.mobilidadePrograma.count({
          where: {
            instituicaoId,
          },
        }),

        prisma.mobilidadePrograma.count({
          where: {
            instituicaoId,
            status:
              MobilidadeStatusPrograma.ATIVO,
            ativo: true,
          },
        }),

        prisma.mobilidadePrograma.count({
          where: {
            instituicaoId,
            status:
              MobilidadeStatusPrograma.RASCUNHO,
          },
        }),

        prisma.mobilidadePrograma.count({
          where: {
            instituicaoId,
            OR: [
              {
                status:
                  MobilidadeStatusPrograma.INATIVO,
              },
              {
                ativo: false,
              },
            ],
          },
        }),

        prisma.mobilidadePrograma.findMany({
          where,

          select: {
            id: true,
            nome: true,
            codigo: true,
            descricao: true,
            tipo: true,
            direcao: true,
            status: true,
            idiomaPrincipal: true,
            nivelIdiomaMinimo: true,
            duracaoMinimaDias: true,
            duracaoMaximaDias: true,
            ativo: true,
            createdAt: true,
            updatedAt: true,

            convenio: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                status: true,
              },
            },

            instituicaoParceira: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                paisCodigo: true,
                cidade: true,
                ativo: true,
              },
            },

            _count: {
              select: {
                ofertas: true,
              },
            },
          },

          orderBy: [
            {
              ativo: "desc",
            },
            {
              status: "asc",
            },
            {
              nome: "asc",
            },
          ],
        }),

        prisma.mobilidadeConvenio.findMany({
          where: {
            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            codigo: true,
            status: true,

            instituicaoParceira: {
              select: {
                id: true,
                nome: true,
                paisCodigo: true,
                ativo: true,
              },
            },
          },

          orderBy: {
            nome: "asc",
          },
        }),

        prisma
          .mobilidadeInstituicaoParceira
          .findMany({
            where: {
              instituicaoId,
            },

            select: {
              id: true,
              nome: true,
              sigla: true,
              paisCodigo: true,
              cidade: true,
              ativo: true,
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
      ]);

    return NextResponse.json(
      {
        ok: true,

        permissoes: {
          podeGerenciar:
            temPermissaoMobilidade(
              usuario,
              "mobilidade.gerenciar",
              "mobilidade.programas.gerenciar"
            ),
        },

        resumo: {
          total,
          ativos,
          rascunhos,
          inativos,
        },

        programas,
        convenios,
        parceiros,
      },
      {
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
        "mobilidade.programas.gerenciar"
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

    if (!nome) {
      throw new ErroMobilidade(
        400,
        "NOME_OBRIGATORIO",
        "Nome obrigatório."
      );
    }

    const tipo =
      tipoValido(
        corpo.tipo
      );

    const direcao =
      direcaoValida(
        corpo.direcao
      );

    const status =
      statusValido(
        corpo.status
      );

    if (!tipo) {
      throw new ErroMobilidade(
        400,
        "TIPO_INVALIDO",
        "Tipo inválido."
      );
    }

    if (!direcao) {
      throw new ErroMobilidade(
        400,
        "DIRECAO_INVALIDA",
        "Direção inválida."
      );
    }

    if (!status) {
      throw new ErroMobilidade(
        400,
        "STATUS_INVALIDO",
        "Status inválido."
      );
    }

    const convenioId =
      idOpcional(
        corpo.convenioId
      );

    const parceiroId =
      idOpcional(
        corpo.instituicaoParceiraId
      );

    if (
      convenioId ===
        undefined ||
      parceiroId ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "VINCULO_INVALIDO",
        "Vínculo inválido."
      );
    }

    const vinculos =
      await resolverVinculos({
        instituicaoId,
        convenioId,
        parceiroId,
      });

    const duracaoMinimaDias =
      inteiroPositivoOuNulo(
        corpo.duracaoMinimaDias
      );

    const duracaoMaximaDias =
      inteiroPositivoOuNulo(
        corpo.duracaoMaximaDias
      );

    if (
      duracaoMinimaDias ===
        undefined ||
      duracaoMaximaDias ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "DURACAO_INVALIDA",
        "Duração inválida."
      );
    }

    if (
      duracaoMinimaDias !==
        null &&
      duracaoMaximaDias !==
        null &&
      duracaoMaximaDias <
        duracaoMinimaDias
    ) {
      throw new ErroMobilidade(
        400,
        "DURACAO_INTERVALO_INVALIDO",
        "Duração máxima inferior à mínima."
      );
    }

    try {
      const criado =
        await prisma.mobilidadePrograma.create({
          data: {
            instituicaoId,

            convenioId:
              vinculos.convenioId,

            instituicaoParceiraId:
              vinculos.instituicaoParceiraId,

            nome,

            codigo:
              textoOpcional(
                corpo.codigo,
                80
              ),

            descricao:
              textoOpcional(
                corpo.descricao,
                5000
              ),

            tipo,
            direcao,
            status,

            idiomaPrincipal:
              textoOpcional(
                corpo.idiomaPrincipal,
                100
              ),

            nivelIdiomaMinimo:
              textoOpcional(
                corpo.nivelIdiomaMinimo,
                100
              ),

            duracaoMinimaDias,
            duracaoMaximaDias,

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
          "CODIGO_DUPLICADO",
          "Código de programa já utilizado."
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
