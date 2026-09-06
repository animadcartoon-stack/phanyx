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
} from "@/lib/mobilidade-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DIRECOES =
  new Set(
    Object.values(
      MobilidadeDirecao
    )
  );

const STATUS =
  new Set(
    Object.values(
      MobilidadeStatusConvenio
    )
  );

function idValido(
  valor: string
) {
  const id =
    Number(valor);

  return Number.isInteger(
    id
  ) &&
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
    ? texto.slice(
        0,
        maximo
      )
    : null;
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
            Number.isInteger(
              id
            ) &&
            id > 0
        )
    )
  );
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
    typeof valor !==
    "string"
  ) {
    return undefined;
  }

  if (
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

function direcaoValida(
  valor: unknown
): MobilidadeDirecao | null {
  return typeof valor ===
      "string" &&
    DIRECOES.has(
      valor as MobilidadeDirecao
    )
    ? (valor as MobilidadeDirecao)
    : null;
}

function statusValido(
  valor: unknown
): MobilidadeStatusConvenio | null {
  return typeof valor ===
      "string" &&
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
        "mobilidade.convenios.ver",
        "mobilidade.convenios.gerenciar"
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

    const convenio =
      await prisma
        .mobilidadeConvenio
        .findFirst({
          where: {
            id,
            instituicaoId,
          },

          include: {
            instituicaoParceira:
              true,

            cursos: {
              include: {
                curso: true,
              },
            },

            _count: {
              select: {
                programas: true,
              },
            },
          },
        });

    if (!convenio) {
      throw new ErroMobilidade(
        404,
        "CONVENIO_NAO_ENCONTRADO",
        "Convênio não encontrado."
      );
    }

    return NextResponse.json({
      ok: true,
      convenio,
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
        "mobilidade.convenios.gerenciar"
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
        .mobilidadeConvenio
        .findFirst({
          where: {
            id,
            instituicaoId,
          },

          select: {
            id: true,
            instituicaoParceiraId:
              true,
          },
        });

    if (!atual) {
      throw new ErroMobilidade(
        404,
        "CONVENIO_NAO_ENCONTRADO",
        "Convênio não encontrado."
      );
    }

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
          },

          select: {
            id: true,
            ativo: true,
          },
        });

    if (
      !parceiro ||
      (!parceiro.ativo &&
        parceiro.id !==
          atual.instituicaoParceiraId)
    ) {
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
        "Vigência inválida."
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
      await prisma.$transaction(
        async (tx) => {
          await tx
            .mobilidadeConvenio
            .update({
              where: {
                id,
              },

              data: {
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
              },
            });

          await tx
            .mobilidadeConvenioCurso
            .deleteMany({
              where: {
                convenioId: id,
                instituicaoId,
              },
            });

          if (
            cursoIds.length >
            0
          ) {
            await tx
              .mobilidadeConvenioCurso
              .createMany({
                data:
                  cursoIds.map(
                    (
                      cursoId
                    ) => ({
                      instituicaoId,
                      convenioId:
                        id,
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
