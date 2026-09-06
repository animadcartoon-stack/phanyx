import {
  MobilidadeDirecao,
  MobilidadeStatusConvenio,
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

const DIRECOES = new Set(
  Object.values(MobilidadeDirecao)
);

const STATUS = new Set(
  Object.values(MobilidadeStatusConvenio)
);

function textoOpcional(
  valor: unknown,
  maximo = 500
) {
  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

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

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    return undefined;
  }

  return numero;
}

function idsNumericos(
  valor: unknown
) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

function dataOpcional(
  valor: unknown
): Date | null | undefined {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    return undefined;
  }

  const padrao =
    /^\d{4}-\d{2}-\d{2}$/;

  if (!padrao.test(valor)) {
    return undefined;
  }

  const data = new Date(
    `${valor}T12:00:00.000Z`
  );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return undefined;
  }

  return data;
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
): MobilidadeStatusConvenio | null {
  return typeof valor === "string" &&
    STATUS.has(
      valor as MobilidadeStatusConvenio
    )
    ? (valor as MobilidadeStatusConvenio)
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

async function validarCursos(
  instituicaoId: number,
  cursoIds: number[]
) {
  if (cursoIds.length === 0) {
    return;
  }

  const quantidade =
    await prisma.curso.count({
      where: {
        instituicaoId,
        id: {
          in: cursoIds,
        },
        excluidoEm: null,
      },
    });

  if (
    quantidade !==
    cursoIds.length
  ) {
    throw new ErroMobilidade(
      400,
      "CURSO_INVALIDO",
      "Há cursos inválidos para esta instituição."
    );
  }
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
        "mobilidade.convenios.ver",
        "mobilidade.convenios.gerenciar"
      );

    const q =
      req.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    const statusParam =
      req.nextUrl.searchParams
        .get("status");

    const direcaoParam =
      req.nextUrl.searchParams
        .get("direcao");

    const parceiroParam =
      Number(
        req.nextUrl.searchParams
          .get("parceiroId") ?? ""
      );

    const status =
      statusParam
        ? statusValido(statusParam)
        : null;

    const direcao =
      direcaoParam
        ? direcaoValida(
            direcaoParam
          )
        : null;

    const parceiroId =
      Number.isInteger(
        parceiroParam
      ) &&
      parceiroParam > 0
        ? parceiroParam
        : null;

    const where: Prisma.MobilidadeConvenioWhereInput =
      {
        instituicaoId,

        ...(status
          ? { status }
          : {}),

        ...(direcao
          ? { direcao }
          : {}),

        ...(parceiroId
          ? {
              instituicaoParceiraId:
                parceiroId,
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
                  codigo: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  descricao: {
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
              ],
            }
          : {}),
      };

    const [
      total,
      ativos,
      rascunhos,
      suspensos,
      convenios,
      parceiros,
      cursos,
    ] =
      await prisma.$transaction(
        [
          prisma.mobilidadeConvenio.count({
            where: {
              instituicaoId,
            },
          }),

          prisma.mobilidadeConvenio.count({
            where: {
              instituicaoId,
              status:
                MobilidadeStatusConvenio.ATIVO,
            },
          }),

          prisma.mobilidadeConvenio.count({
            where: {
              instituicaoId,
              status:
                MobilidadeStatusConvenio.RASCUNHO,
            },
          }),

          prisma.mobilidadeConvenio.count({
            where: {
              instituicaoId,
              status:
                MobilidadeStatusConvenio.SUSPENSO,
            },
          }),

          prisma.mobilidadeConvenio.findMany({
            where,

            select: {
              id: true,
              nome: true,
              codigo: true,
              descricao: true,
              direcao: true,
              status: true,
              vigenciaInicio: true,
              vigenciaFim: true,
              reciprocidade: true,
              vagasSaidaAno: true,
              vagasEntradaAno: true,
              isencaoTaxaAcademica: true,
              observacoes: true,
              createdAt: true,
              updatedAt: true,

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

              criadoPor: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },

              cursos: {
                orderBy: {
                  curso: {
                    nome: "asc",
                  },
                },

                select: {
                  id: true,
                  cursoId: true,

                  curso: {
                    select: {
                      id: true,
                      nome: true,
                      codigo: true,
                      ativo: true,
                    },
                  },
                },
              },

              _count: {
                select: {
                  programas: true,
                },
              },
            },

            orderBy: [
              {
                status: "asc",
              },
              {
                nome: "asc",
              },
            ],
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

          prisma.curso.findMany({
            where: {
              instituicaoId,
              excluidoEm: null,
            },

            select: {
              id: true,
              nome: true,
              codigo: true,
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
              "mobilidade.convenios.gerenciar"
            ),
        },

        resumo: {
          total,
          ativos,
          rascunhos,
          suspensos,
        },

        convenios,
        parceiros,
        cursos,
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
        "mobilidade.convenios.gerenciar"
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

    const parceiroId =
      Number(
        corpo.instituicaoParceiraId
      );

    if (
      !Number.isInteger(
        parceiroId
      ) ||
      parceiroId <= 0
    ) {
      throw new ErroMobilidade(
        400,
        "PARCEIRO_INVALIDO",
        "Instituição parceira inválida."
      );
    }

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
        "Instituição parceira inválida ou inativa."
      );
    }

    const direcao =
      direcaoValida(
        corpo.direcao
      );

    const status =
      statusValido(
        corpo.status
      );

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

    const vigenciaInicio =
      dataOpcional(
        corpo.vigenciaInicio
      );

    const vigenciaFim =
      dataOpcional(
        corpo.vigenciaFim
      );

    if (
      vigenciaInicio ===
        undefined ||
      vigenciaFim ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "DATA_INVALIDA",
        "Data inválida."
      );
    }

    if (
      vigenciaInicio &&
      vigenciaFim &&
      vigenciaFim <
        vigenciaInicio
    ) {
      throw new ErroMobilidade(
        400,
        "VIGENCIA_INVALIDA",
        "A data final não pode ser anterior à data inicial."
      );
    }

    const vagasSaidaAno =
      inteiroPositivoOuNulo(
        corpo.vagasSaidaAno
      );

    const vagasEntradaAno =
      inteiroPositivoOuNulo(
        corpo.vagasEntradaAno
      );

    if (
      vagasSaidaAno ===
        undefined ||
      vagasEntradaAno ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "VAGAS_INVALIDAS",
        "Quantidade de vagas inválida."
      );
    }

    const cursoIds =
      idsNumericos(
        corpo.cursoIds
      );

    await validarCursos(
      instituicaoId,
      cursoIds
    );

    try {
      const criado =
        await prisma
          .mobilidadeConvenio
          .create({
            data: {
              instituicaoId,
              instituicaoParceiraId:
                parceiroId,

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

              direcao,
              status,

              vigenciaInicio,
              vigenciaFim,

              reciprocidade:
                corpo.reciprocidade !==
                false,

              vagasSaidaAno,
              vagasEntradaAno,

              isencaoTaxaAcademica:
                corpo.isencaoTaxaAcademica ===
                true,

              observacoes:
                textoOpcional(
                  corpo.observacoes,
                  5000
                ),

              criadoPorId:
                usuario?.id ??
                null,

              cursos:
                cursoIds.length
                  ? {
                      create:
                        cursoIds.map(
                          (
                            cursoId
                          ) => ({
                            instituicaoId,
                            cursoId,
                          })
                        ),
                    }
                  : undefined,
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
          "Já existe um convênio com este código."
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
