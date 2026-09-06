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

function idValido(
  valor: string
) {
  const id = Number(valor);

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

  const data =
    new Date(
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
      "Curso inválido."
    );
  }
}

function montarCriterios(
  valor: unknown
) {
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
      "Critérios inválidos."
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
        "mobilidade.ofertas.ver",
        "mobilidade.ofertas.gerenciar"
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

    const oferta =
      await prisma.mobilidadeOferta.findFirst({
        where: {
          id,
          instituicaoId,
        },

        include: {
          programa: {
            include: {
              instituicaoParceira:
                true,
              convenio: true,
            },
          },

          cursos: {
            include: {
              curso: true,
            },
          },

          _count: {
            select: {
              candidaturas: true,
            },
          },
        },
      });

    if (!oferta) {
      throw new ErroMobilidade(
        404,
        "OFERTA_NAO_ENCONTRADA",
        "Oferta não encontrada."
      );
    }

    return NextResponse.json({
      ok: true,
      oferta,
    });
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
        "mobilidade.ofertas.gerenciar"
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
      await prisma.mobilidadeOferta.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,
          status: true,
          publicadoEm: true,
        },
      });

    if (!atual) {
      throw new ErroMobilidade(
        404,
        "OFERTA_NAO_ENCONTRADA",
        "Oferta não encontrada."
      );
    }

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
        "Data inválida."
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
        "Período de mobilidade inválido."
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
        "Cronologia inválida."
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
      await prisma.$transaction(
        async (tx) => {
          await tx.mobilidadeOferta.update({
            where: {
              id,
            },

            data: {
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
                  : (
                      atual.publicadoEm ??
                      new Date()
                    ),
            },
          });

          await tx.mobilidadeOfertaCurso.deleteMany({
            where: {
              instituicaoId,
              ofertaId: id,
            },
          });

          if (
            cursoIds.length >
            0
          ) {
            await tx.mobilidadeOfertaCurso.createMany({
              data:
                cursoIds.map(
                  (
                    cursoId
                  ) => ({
                    instituicaoId,
                    ofertaId: id,
                    cursoId,
                  })
                ),
            });
          }
        }
      );

      return NextResponse.json({
        ok: true,
      });
    } catch (erro) {
      if (
        erroDuplicidade(
          erro
        )
      ) {
        throw new ErroMobilidade(
          409,
          "CODIGO_DUPLICADO",
          "Código já utilizado."
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
