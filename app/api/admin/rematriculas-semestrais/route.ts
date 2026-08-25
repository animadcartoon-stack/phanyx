import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  TipoPeriodoMatricula,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function podeGerenciarRematriculas(
  role?: string | null,
) {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

function numeroInteiroOuNull(
  valor: unknown,
): number | null {
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
    return null;
  }

  return numero;
}

function converterData(
  valor: unknown,
): Date | null {
  if (
    !valor ||
    typeof valor !== "string"
  ) {
    return null;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function normalizarTurmaIds(
  valor: unknown,
) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  );
}

type StatusPeriodoRematricula =
  | "RASCUNHO"
  | "PUBLICADO";

function normalizarStatus(
  valor: unknown,
): StatusPeriodoRematricula {
  const status = String(
    valor || "",
  )
    .trim()
    .toUpperCase();

  if (status === "PUBLICADO") {
    return "PUBLICADO";
  }

  return "RASCUNHO";
}

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      !podeGerenciarRematriculas(
        user.role,
      )
    ) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        {
          status: 400,
        },
      );
    }

    const [
      periodos,
      cursos,
      turmas,
    ] = await Promise.all([
      prisma.periodoMatricula.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          tipo:
            TipoPeriodoMatricula.REMATRICULA,
        },

        include: {
          curso: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              ativo: true,
            },
          },

          cursoSemestre: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              cargaMinima: true,
              cargaMaxima: true,
            },
          },

          turmasParticipantes: {
            select: {
              id: true,
              turmaId: true,

              turma: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,
                  cursoId: true,
                  semestre: true,
                  periodoLetivo: true,
                  turno: true,
                  modalidade: true,
                  ativa: true,

                  polo: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },

                  semestres: {
                    select: {
                      id: true,
                      numero: true,
                    },
                  },

                  _count: {
                    select: {
                      disciplinas: true,
                    },
                  },
                },
              },
            },
          },

          _count: {
            select: {
              matriculas: true,
              rematriculas: true,
            },
          },
        },

        orderBy: [
          {
            dataInicio: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),

      prisma.curso.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,
          ativo: true,
          excluidoEm: null,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,

          semestres: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              cargaMinima: true,
              cargaMaxima: true,
            },

            orderBy: {
              numero: "asc",
            },
          },
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.turma.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          ativa: true,

          cursoId: {
            not: null,
          },
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
          cursoId: true,
          semestre: true,
          periodoLetivo: true,
          turno: true,
          modalidade: true,
          capacidadeMaxima: true,
          statusTurma: true,

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },

          semestres: {
            select: {
              id: true,
              numero: true,
            },

            orderBy: {
              numero: "asc",
            },
          },

          _count: {
            select: {
              disciplinas: true,
            },
          },
        },

        orderBy: [
          {
            nome: "asc",
          },
        ],
      }),
    ]);

    return NextResponse.json({
      periodos,
      cursos,
      turmas,
    });
  } catch (error) {
    console.error(
      "Erro ao listar períodos de rematrícula:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erro ao listar os períodos de rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  req: NextRequest,
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      !podeGerenciarRematriculas(
        user.role,
      )
    ) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await req.json();

    const cursoId = Number(
      body.cursoId,
    );

    const cursoSemestreId = Number(
      body.cursoSemestreId,
    );

    const turmaIds =
      normalizarTurmaIds(
        body.turmaIds,
      );

    const periodoLetivo = String(
      body.periodoLetivo || "",
    ).trim();

    const titulo = String(
      body.titulo || "",
    ).trim();

    const instrucoes = String(
      body.instrucoes || "",
    ).trim();

    const dataInicio =
      converterData(
        body.dataInicio,
      );

    const dataFim =
      converterData(
        body.dataFim,
      );

    const dataInicioAulas =
      converterData(
        body.dataInicioAulas,
      );

    const cargaMinimaOverride =
      numeroInteiroOuNull(
        body.cargaMinimaOverride,
      );

    const cargaMaximaOverride =
      numeroInteiroOuNull(
        body.cargaMaximaOverride,
      );

    if (
      !Number.isInteger(cursoId) ||
      cursoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione um curso válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        cursoSemestreId,
      ) ||
      cursoSemestreId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione o semestre de destino.",
        },
        {
          status: 400,
        },
      );
    }

    if (!periodoLetivo) {
      return NextResponse.json(
        {
          error:
            "Informe o período letivo.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !dataInicio ||
      !dataFim
    ) {
      return NextResponse.json(
        {
          error:
            "Informe corretamente a data de abertura e a data de encerramento.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      dataFim.getTime() <=
      dataInicio.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "A data de encerramento deve ser posterior à data de abertura.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      cargaMinimaOverride !== null &&
      cargaMaximaOverride !== null &&
      cargaMinimaOverride >
        cargaMaximaOverride
    ) {
      return NextResponse.json(
        {
          error:
            "A carga horária mínima não pode ser maior que a carga máxima.",
        },
        {
          status: 400,
        },
      );
    }

    const curso =
      await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId:
            user.instituicaoId,
          ativo: true,
          excluidoEm: null,
        },

        select: {
          id: true,
          nome: true,
        },
      });

    if (!curso) {
      return NextResponse.json(
        {
          error:
            "O curso informado não existe ou não pertence à instituição.",
        },
        {
          status: 404,
        },
      );
    }

    const cursoSemestre =
      await prisma.cursoSemestre.findFirst(
        {
          where: {
            id: cursoSemestreId,
            cursoId,
            instituicaoId:
              user.instituicaoId,
          },

          select: {
            id: true,
            numero: true,
            titulo: true,
            cargaMinima: true,
            cargaMaxima: true,
          },
        },
      );

    if (!cursoSemestre) {
      return NextResponse.json(
        {
          error:
            "O semestre informado não pertence ao curso selecionado.",
        },
        {
          status: 404,
        },
      );
    }

    if (turmaIds.length > 0) {
      const turmasValidas =
        await prisma.turma.findMany(
          {
            where: {
              id: {
                in: turmaIds,
              },

              instituicaoId:
                user.instituicaoId,

              cursoId,

              ativa: true,
            },

            select: {
              id: true,
            },
          },
        );

      if (
        turmasValidas.length !==
        turmaIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais turmas selecionadas são inválidas, estão inativas ou não pertencem ao curso.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const status =
      normalizarStatus(
        body.status,
      );

    if (
      status === "PUBLICADO" &&
      turmaIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos uma turma participante antes de publicar a rematrícula.",
        },
        {
          status: 400,
        },
      );
    }

    const periodoExistente =
      await prisma.periodoMatricula.findFirst(
        {
          where: {
            instituicaoId:
              user.instituicaoId,

            cursoId,
            cursoSemestreId,
            periodoLetivo,

            tipo:
              TipoPeriodoMatricula.REMATRICULA,

            status: {
              not: "CANCELADO",
            },
          },

          select: {
            id: true,
          },
        },
      );

    if (periodoExistente) {
      return NextResponse.json(
        {
          error:
            "Já existe um período de rematrícula para este curso, semestre e período letivo.",
        },
        {
          status: 409,
        },
      );
    }

    const periodo =
      await prisma.$transaction(
        async (tx) => {
          const criado =
            await tx.periodoMatricula.create(
              {
                data: {
                  instituicaoId:
                    user.instituicaoId!,

                  cursoId,
                  cursoSemestreId,
                  periodoLetivo,

                  semestreNumero:
                    cursoSemestre.numero,

                  titulo:
                    titulo ||
                    `Rematrícula ${periodoLetivo} - ${curso.nome}`,

                  dataInicio,
                  dataFim,
                  dataInicioAulas,

                  instrucoes:
                    instrucoes || null,

                  cargaMinimaOverride,
                  cargaMaximaOverride,

                  exigeAprovacao:
                    Boolean(
                      body.exigeAprovacao,
                    ),

                  permiteRascunho:
                    typeof body.permiteRascunho ===
                    "boolean"
                      ? body.permiteRascunho
                      : true,

                  bloqueiaInadimplente:
                    Boolean(
                      body.bloqueiaInadimplente,
                    ),

                  permiteAluno:
                    status ===
                    "PUBLICADO",

                  bloqueiaAlunoForaDoPrazo:
                    true,

                  ativo: true,
                  status,

                  tipo:
                    TipoPeriodoMatricula.REMATRICULA,
                },

                select: {
                  id: true,
                },
              },
            );

          if (
            turmaIds.length > 0
          ) {
            await tx.periodoMatriculaTurma.createMany(
              {
                data: turmaIds.map(
                  (turmaId) => ({
                    instituicaoId:
                      user.instituicaoId!,
                    periodoMatriculaId:
                      criado.id,
                    turmaId,
                  }),
                ),
              },
            );
          }

          return tx.periodoMatricula.findUnique(
            {
              where: {
                id: criado.id,
              },

              include: {
                curso: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                  },
                },

                cursoSemestre: {
                  select: {
                    id: true,
                    numero: true,
                    titulo: true,
                    cargaMinima: true,
                    cargaMaxima: true,
                  },
                },

                turmasParticipantes: {
                  select: {
                    id: true,
                    turmaId: true,

                    turma: {
                      select: {
                        id: true,
                        nome: true,
                        codigo: true,
                        cursoId: true,
                        semestre: true,
                        periodoLetivo: true,
                        turno: true,
                        modalidade: true,

                        polo: {
                          select: {
                            id: true,
                            nome: true,
                          },
                        },

                        semestres: {
                          select: {
                            id: true,
                            numero: true,
                          },
                        },

                        _count: {
                          select: {
                            disciplinas:
                              true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          );
        },
      );

    return NextResponse.json(
      {
        message:
          status === "PUBLICADO"
            ? "Período de rematrícula criado e publicado."
            : "Período de rematrícula salvo como rascunho.",

        periodo,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Erro ao criar período de rematrícula:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erro ao criar o período de rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}