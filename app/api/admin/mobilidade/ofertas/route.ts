import {
  MobilidadeStatusOferta,
  MobilidadeStatusPrograma,
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

const STATUS = new Set(
  Object.values(
    MobilidadeStatusOferta
  )
);

type CriteriosElegibilidade = {
  mediaMinima: number | null;
  frequenciaMinima: number | null;
  semestreMinimo: number | null;
  semestreMaximo: number | null;
  idadeMinima: number | null;
  idadeMaxima: number | null;
  exigeRegularidadeAcademica: boolean;
  exigeRegularidadeFinanceira: boolean;
  observacoes: string | null;
};

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

function inteiroOuNulo(
  valor: unknown,
  minimo = 0
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero >= minimo
    ? numero
    : undefined;
}

function numeroOuNulo(
  valor: unknown,
  minimo = 0,
  maximo?: number
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
    !Number.isFinite(numero) ||
    numero < minimo ||
    (
      maximo !== undefined &&
      numero > maximo
    )
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

  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor
    )
  ) {
    return undefined;
  }

  const data = new Date(
    `${valor}T12:00:00.000Z`
  );

  return Number.isNaN(
    data.getTime()
  )
    ? undefined
    : data;
}

function statusValido(
  valor: unknown
): MobilidadeStatusOferta | null {
  return typeof valor === "string" &&
    STATUS.has(
      valor as MobilidadeStatusOferta
    )
    ? (
        valor as
          MobilidadeStatusOferta
      )
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

async function validarPrograma(
  instituicaoId: number,
  programaId: number
) {
  const programa =
    await prisma.mobilidadePrograma.findFirst({
      where: {
        id: programaId,
        instituicaoId,
        status: {
          not:
            MobilidadeStatusPrograma.ARQUIVADO,
        },
      },

      select: {
        id: true,
      },
    });

  if (!programa) {
    throw new ErroMobilidade(
      400,
      "PROGRAMA_INVALIDO",
      "Programa inválido."
    );
  }
}

async function validarCursos(
  instituicaoId: number,
  cursoIds: number[]
) {
  if (
    cursoIds.length === 0
  ) {
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
      "Um ou mais cursos são inválidos."
    );
  }
}

function montarCriterios(
  valor: unknown
): CriteriosElegibilidade {
  const fonte =
    valor &&
    typeof valor === "object" &&
    !Array.isArray(valor)
      ? (
          valor as Record<
            string,
            unknown
          >
        )
      : {};

  const mediaMinima =
    numeroOuNulo(
      fonte.mediaMinima,
      0,
      100
    );

  const frequenciaMinima =
    numeroOuNulo(
      fonte.frequenciaMinima,
      0,
      100
    );

  const semestreMinimo =
    inteiroOuNulo(
      fonte.semestreMinimo,
      1
    );

  const semestreMaximo =
    inteiroOuNulo(
      fonte.semestreMaximo,
      1
    );

  const idadeMinima =
    inteiroOuNulo(
      fonte.idadeMinima,
      0
    );

  const idadeMaxima =
    inteiroOuNulo(
      fonte.idadeMaxima,
      0
    );

  if (
    mediaMinima === undefined ||
    frequenciaMinima === undefined ||
    semestreMinimo === undefined ||
    semestreMaximo === undefined ||
    idadeMinima === undefined ||
    idadeMaxima === undefined
  ) {
    throw new ErroMobilidade(
      400,
      "CRITERIOS_INVALIDOS",
      "Critérios de elegibilidade inválidos."
    );
  }

  if (
    semestreMinimo !== null &&
    semestreMaximo !== null &&
    semestreMaximo <
      semestreMinimo
  ) {
    throw new ErroMobilidade(
      400,
      "CRITERIOS_INVALIDOS",
      "Intervalo de semestre inválido."
    );
  }

  if (
    idadeMinima !== null &&
    idadeMaxima !== null &&
    idadeMaxima <
      idadeMinima
  ) {
    throw new ErroMobilidade(
      400,
      "CRITERIOS_INVALIDOS",
      "Intervalo de idade inválido."
    );
  }

  return {
    mediaMinima,
    frequenciaMinima,
    semestreMinimo,
    semestreMaximo,
    idadeMinima,
    idadeMaxima,

    exigeRegularidadeAcademica:
      fonte.exigeRegularidadeAcademica !==
      false,

    exigeRegularidadeFinanceira:
      fonte.exigeRegularidadeFinanceira ===
      true,

    observacoes:
      textoOpcional(
        fonte.observacoes,
        3000
      ),
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
        "mobilidade.ofertas.ver",
        "mobilidade.ofertas.gerenciar"
      );

    const q =
      req.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    const statusParam =
      req.nextUrl.searchParams
        .get("status");

    const programaParam =
      Number(
        req.nextUrl.searchParams
          .get("programaId") ?? ""
      );

    const status =
      statusParam
        ? statusValido(
            statusParam
          )
        : null;

    const programaId =
      Number.isInteger(
        programaParam
      ) &&
      programaParam > 0
        ? programaParam
        : null;

    const where: Prisma.MobilidadeOfertaWhereInput =
      {
        instituicaoId,

        ...(status
          ? { status }
          : {}),

        ...(programaId
          ? { programaId }
          : {}),

        ...(q
          ? {
              OR: [
                {
                  titulo: {
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
                  periodo: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  programa: {
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
      agendadas,
      abertas,
      emSelecao,
      ofertas,
      programas,
      cursos,
    ] =
      await prisma.$transaction([
        prisma.mobilidadeOferta.count({
          where: {
            instituicaoId,
          },
        }),

        prisma.mobilidadeOferta.count({
          where: {
            instituicaoId,
            status:
              MobilidadeStatusOferta.INSCRICOES_AGENDADAS,
          },
        }),

        prisma.mobilidadeOferta.count({
          where: {
            instituicaoId,
            status:
              MobilidadeStatusOferta.INSCRICOES_ABERTAS,
          },
        }),

        prisma.mobilidadeOferta.count({
          where: {
            instituicaoId,
            status:
              MobilidadeStatusOferta.EM_SELECAO,
          },
        }),

        prisma.mobilidadeOferta.findMany({
          where,

          select: {
            id: true,
            programaId: true,
            titulo: true,
            codigo: true,
            descricao: true,
            status: true,
            ano: true,
            periodo: true,
            inscricoesInicio: true,
            inscricoesFim: true,
            mobilidadeInicio: true,
            mobilidadeFim: true,
            vagas: true,
            permiteListaEspera: true,
            criteriosElegibilidade: true,
            instrucoes: true,
            publicadoEm: true,
            createdAt: true,
            updatedAt: true,

            programa: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                tipo: true,
                direcao: true,
                status: true,
                ativo: true,

                instituicaoParceira: {
                  select: {
                    id: true,
                    nome: true,
                    paisCodigo: true,
                    cidade: true,
                  },
                },

                convenio: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                  },
                },
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
                candidaturas: true,
              },
            },
          },

          orderBy: [
            {
              inscricoesInicio:
                "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],
        }),

        prisma.mobilidadePrograma.findMany({
          where: {
            instituicaoId,
            status: {
              not:
                MobilidadeStatusPrograma.ARQUIVADO,
            },
          },

          select: {
            id: true,
            nome: true,
            codigo: true,
            tipo: true,
            direcao: true,
            status: true,
            ativo: true,

            instituicaoParceira: {
              select: {
                id: true,
                nome: true,
                paisCodigo: true,
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
      ]);

    return NextResponse.json(
      {
        ok: true,

        permissoes: {
          podeGerenciar:
            temPermissaoMobilidade(
              usuario,
              "mobilidade.gerenciar",
              "mobilidade.ofertas.gerenciar"
            ),
        },

        resumo: {
          total,
          agendadas,
          abertas,
          emSelecao,
        },

        ofertas,
        programas,
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
        "mobilidade.ofertas.gerenciar"
      );

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    const titulo =
      textoOpcional(
        corpo.titulo,
        220
      );

    if (!titulo) {
      throw new ErroMobilidade(
        400,
        "TITULO_OBRIGATORIO",
        "Título obrigatório."
      );
    }

    const programaId =
      Number(
        corpo.programaId
      );

    if (
      !Number.isInteger(
        programaId
      ) ||
      programaId <= 0
    ) {
      throw new ErroMobilidade(
        400,
        "PROGRAMA_INVALIDO",
        "Programa inválido."
      );
    }

    await validarPrograma(
      instituicaoId,
      programaId
    );

    const status =
      statusValido(
        corpo.status
      );

    if (!status) {
      throw new ErroMobilidade(
        400,
        "STATUS_INVALIDO",
        "Status inválido."
      );
    }

    const ano =
      inteiroOuNulo(
        corpo.ano,
        2000
      );

    if (
      ano === undefined ||
      (
        ano !== null &&
        ano > 2100
      )
    ) {
      throw new ErroMobilidade(
        400,
        "ANO_INVALIDO",
        "Ano inválido."
      );
    }

    const vagas =
      inteiroOuNulo(
        corpo.vagas,
        1
      );

    if (
      vagas === undefined
    ) {
      throw new ErroMobilidade(
        400,
        "VAGAS_INVALIDAS",
        "Quantidade de vagas inválida."
      );
    }

    const inscricoesInicio =
      dataOpcional(
        corpo.inscricoesInicio
      );

    const inscricoesFim =
      dataOpcional(
        corpo.inscricoesFim
      );

    const mobilidadeInicio =
      dataOpcional(
        corpo.mobilidadeInicio
      );

    const mobilidadeFim =
      dataOpcional(
        corpo.mobilidadeFim
      );

    if (
      inscricoesInicio ===
        undefined ||
      inscricoesFim ===
        undefined ||
      mobilidadeInicio ===
        undefined ||
      mobilidadeFim ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "DATA_INVALIDA",
        "Uma ou mais datas são inválidas."
      );
    }

    if (
      inscricoesInicio &&
      inscricoesFim &&
      inscricoesFim <
        inscricoesInicio
    ) {
      throw new ErroMobilidade(
        400,
        "PERIODO_INSCRICAO_INVALIDO",
        "Período de inscrições inválido."
      );
    }

    if (
      mobilidadeInicio &&
      mobilidadeFim &&
      mobilidadeFim <
        mobilidadeInicio
    ) {
      throw new ErroMobilidade(
        400,
        "PERIODO_MOBILIDADE_INVALIDO",
        "Período da mobilidade inválido."
      );
    }

    if (
      inscricoesFim &&
      mobilidadeInicio &&
      inscricoesFim >
        mobilidadeInicio
    ) {
      throw new ErroMobilidade(
        400,
        "CRONOLOGIA_INVALIDA",
        "As inscrições devem terminar antes do início da mobilidade."
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

    const criterios =
      montarCriterios(
        corpo.criteriosElegibilidade
      );

    try {
      const criado =
        await prisma.mobilidadeOferta.create({
          data: {
            instituicaoId,
            programaId,
            titulo,

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

            status,
            ano,

            periodo:
              textoOpcional(
                corpo.periodo,
                120
              ),

            inscricoesInicio,
            inscricoesFim,
            mobilidadeInicio,
            mobilidadeFim,
            vagas,

            permiteListaEspera:
              corpo.permiteListaEspera !==
              false,

            criteriosElegibilidade:
              criterios as unknown as
                Prisma.InputJsonValue,

            instrucoes:
              textoOpcional(
                corpo.instrucoes,
                8000
              ),

            publicadoEm:
              status ===
              MobilidadeStatusOferta.RASCUNHO
                ? null
                : new Date(),

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
          "Já existe uma oferta com este código."
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
