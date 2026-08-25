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

type AcaoPeriodo =
  | "SALVAR"
  | "PUBLICAR"
  | "ENCERRAR"
  | "CANCELAR";

function podeGerenciarRematriculas(
  role?: string | null,
) {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
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

function normalizarAcao(
  valor: unknown,
): AcaoPeriodo | null {
  const acao = String(
    valor || "",
  )
    .trim()
    .toUpperCase();

  if (
    acao === "SALVAR" ||
    acao === "PUBLICAR" ||
    acao === "ENCERRAR" ||
    acao === "CANCELAR"
  ) {
    return acao;
  }

  return null;
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

function numeroSemestreTexto(
  valor?: string | null,
) {
  if (!valor) {
    return null;
  }

  const correspondencia =
    String(valor).match(/\d+/);

  if (!correspondencia) {
    return null;
  }

  const numero = Number(
    correspondencia[0],
  );

  return Number.isInteger(numero)
    ? numero
    : null;
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
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
          error:
            "Não autorizado.",
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

    const { id } =
      await context.params;

    const periodoId = Number(id);

    if (
      !Number.isInteger(periodoId) ||
      periodoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Período de rematrícula inválido.",
        },
        {
          status: 400,
        },
      );
    }

    const periodoAtual =
      await prisma.periodoMatricula.findFirst(
        {
          where: {
            id: periodoId,

            instituicaoId:
              user.instituicaoId,

            tipo:
              TipoPeriodoMatricula.REMATRICULA,
          },

          include: {
            turmasParticipantes: {
              select: {
                turmaId: true,
              },
            },

            _count: {
              select: {
                rematriculas: true,
              },
            },
          },
        },
      );

    if (!periodoAtual) {
      return NextResponse.json(
        {
          error:
            "O período de rematrícula não foi encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const body = await req.json();

    const acao =
      normalizarAcao(
        body.acao,
      );

    if (!acao) {
      return NextResponse.json(
        {
          error:
            "Ação inválida.",
        },
        {
          status: 400,
        },
      );
    }

    if (acao === "ENCERRAR") {
      if (
        periodoAtual.status !==
        "PUBLICADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Somente um período publicado pode ser encerrado.",
          },
          {
            status: 400,
          },
        );
      }

      const periodo =
        await prisma.periodoMatricula.update(
          {
            where: {
              id:
                periodoAtual.id,
            },

            data: {
              status:
                "ENCERRADO",

              ativo: false,

              permiteAluno:
                false,
            },
          },
        );

      return NextResponse.json({
        message:
          "O período de rematrícula foi encerrado.",

        periodo,
      });
    }

    if (acao === "CANCELAR") {
      if (
        periodoAtual.status ===
        "CANCELADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Este período de rematrícula já está cancelado.",
          },
          {
            status: 400,
          },
        );
      }

      const periodo =
        await prisma.periodoMatricula.update(
          {
            where: {
              id:
                periodoAtual.id,
            },

            data: {
              status:
                "CANCELADO",

              ativo: false,

              permiteAluno:
                false,
            },
          },
        );

      return NextResponse.json({
        message:
          periodoAtual._count
            .rematriculas > 0
            ? "O período foi cancelado. As rematrículas já registradas foram preservadas para auditoria."
            : "O período de rematrícula foi cancelado.",

        periodo,
      });
    }

    if (
      periodoAtual.status ===
        "ENCERRADO" ||
      periodoAtual.status ===
        "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este período não pode mais ser editado ou publicado.",
        },
        {
          status: 400,
        },
      );
    }

    const cursoId = Number(
      body.cursoId,
    );

    const cursoSemestreId =
      Number(
        body.cursoSemestreId,
      );

    const periodoLetivo =
      String(
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

    const turmaIdsForamInformados =
      Array.isArray(
        body.turmaIds,
      );

    const turmaIdsAtuais =
      periodoAtual
        .turmasParticipantes
        .map(
          (item) =>
            item.turmaId,
        );

    const turmaIds =
      turmaIdsForamInformados
        ? normalizarTurmaIds(
            body.turmaIds,
          )
        : turmaIdsAtuais;

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
            "Informe corretamente a abertura e o encerramento.",
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
            "O encerramento deve ser posterior à abertura.",
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
            "A carga horária mínima não pode ser maior que a máxima.",
        },
        {
          status: 400,
        },
      );
    }

    const curso =
      await prisma.curso.findFirst(
        {
          where: {
            id: cursoId,

            instituicaoId:
              user.instituicaoId,

            ativo: true,

            excluidoEm:
              null,
          },

          select: {
            id: true,
            nome: true,
          },
        },
      );

    if (!curso) {
      return NextResponse.json(
        {
          error:
            "O curso não existe ou não pertence à instituição.",
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
            id:
              cursoSemestreId,

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
            "O semestre não pertence ao curso selecionado.",
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
              semestre: true,

              semestres: {
                select: {
                  numero: true,
                },
              },
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

      const turmaForaDoSemestre =
        turmasValidas.find(
          (turma) => {
            if (
              turma.semestres.length >
              0
            ) {
              return !turma.semestres.some(
                (semestre) =>
                  semestre.numero ===
                  cursoSemestre.numero,
              );
            }

            const numeroTexto =
              numeroSemestreTexto(
                turma.semestre,
              );

            if (
              numeroTexto === null
            ) {
              return false;
            }

            return (
              numeroTexto !==
              cursoSemestre.numero
            );
          },
        );

      if (turmaForaDoSemestre) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais turmas selecionadas não pertencem ao semestre de destino.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const periodoDuplicado =
      await prisma.periodoMatricula.findFirst(
        {
          where: {
            id: {
              not:
                periodoAtual.id,
            },

            instituicaoId:
              user.instituicaoId,

            cursoId,
            cursoSemestreId,
            periodoLetivo,

            tipo:
              TipoPeriodoMatricula.REMATRICULA,

            status: {
              not:
                "CANCELADO",
            },
          },

          select: {
            id: true,
          },
        },
      );

    if (periodoDuplicado) {
      return NextResponse.json(
        {
          error:
            "Já existe outro período para este curso, semestre e período letivo.",
        },
        {
          status: 409,
        },
      );
    }

    const statusFinal =
      acao === "PUBLICAR"
        ? "PUBLICADO"
        : periodoAtual.status;

    if (
      statusFinal ===
        "PUBLICADO" &&
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

    if (
      turmaIdsForamInformados &&
      periodoAtual._count
        .rematriculas > 0
    ) {
      const itensEmUso =
        await prisma.rematriculaSemestralItem.findMany(
          {
            where: {
              instituicaoId:
                user.instituicaoId,

              rematricula: {
                periodoMatriculaId:
                  periodoAtual.id,
              },
            },

            select: {
              turmaDisciplina: {
                select: {
                  turmaId: true,
                },
              },
            },
          },
        );

      const turmaIdsEmUso =
        Array.from(
          new Set(
            itensEmUso.map(
              (item) =>
                item
                  .turmaDisciplina
                  .turmaId,
            ),
          ),
        );

      const turmaRemovidaEmUso =
        turmaIdsEmUso.find(
          (turmaId) =>
            !turmaIds.includes(
              turmaId,
            ),
        );

      if (
        turmaRemovidaEmUso
      ) {
        return NextResponse.json(
          {
            error:
              "Não é possível remover uma turma que já possui disciplinas selecionadas em rematrículas deste período.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const periodo =
      await prisma.$transaction(
        async (tx) => {
          await tx.periodoMatricula.update(
            {
              where: {
                id:
                  periodoAtual.id,
              },

              data: {
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
                  instrucoes ||
                  null,

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

                status:
                  statusFinal,

                ativo:
                  statusFinal ===
                    "PUBLICADO" ||
                  statusFinal ===
                    "RASCUNHO",

                permiteAluno:
                  statusFinal ===
                  "PUBLICADO",

                bloqueiaAlunoForaDoPrazo:
                  true,
              },
            },
          );

          if (
            turmaIdsForamInformados
          ) {
            await tx.periodoMatriculaTurma.deleteMany(
              {
                where: {
                  periodoMatriculaId:
                    periodoAtual.id,

                  instituicaoId:
                    user.instituicaoId!,
                },
              },
            );

            if (
              turmaIds.length >
              0
            ) {
              await tx.periodoMatriculaTurma.createMany(
                {
                  data:
                    turmaIds.map(
                      (
                        turmaId,
                      ) => ({
                        instituicaoId:
                          user.instituicaoId!,

                        periodoMatriculaId:
                          periodoAtual.id,

                        turmaId,
                      }),
                    ),
                },
              );
            }
          }

          return tx.periodoMatricula.findUnique(
            {
              where: {
                id:
                  periodoAtual.id,
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

    return NextResponse.json({
      message:
        acao === "PUBLICAR"
          ? "O período de rematrícula foi publicado."
          : "As alterações foram salvas.",

      periodo,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar período de rematrícula:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar o período de rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}