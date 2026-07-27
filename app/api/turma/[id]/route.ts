import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { isAdminLike } from "@/lib/server-auth";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const turmaId = Number(context.params.id);

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        polo: true,
        disciplinas: {
          include: {
            disciplina: {
              include: {
                curso: true,
              },
            },
          },
        },
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...turma,
      disciplinas: turma.disciplinas.map((item) => item.disciplina),
      curso:
        turma.disciplinas.length > 0
          ? turma.disciplinas[0].disciplina.curso ?? null
          : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar turma" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const turmaId = Number(context.params.id);
    const body = await request.json();

    const disciplinaIds: number[] =
  Array.isArray(
    body?.disciplinaIds,
  )
    ? Array.from(
        new Set<number>(
          body.disciplinaIds
            .map(Number)
            .filter(
              (id: number) =>
                Number.isInteger(id) &&
                id > 0,
            ),
        ),
      )
    : [];

const professoresPorDisciplina =
  body?.professoresPorDisciplina &&
  typeof body.professoresPorDisciplina ===
    "object"
    ? body.professoresPorDisciplina
    : {};

const datasInicioPorDisciplina =
  body?.datasInicioPorDisciplina &&
  typeof body.datasInicioPorDisciplina ===
    "object"
    ? body.datasInicioPorDisciplina
    : {};

const datasFimPorDisciplina =
  body?.datasFimPorDisciplina &&
  typeof body.datasFimPorDisciplina ===
    "object"
    ? body.datasFimPorDisciplina
    : {};

const statusPorDisciplina =
  body?.statusPorDisciplina &&
  typeof body.statusPorDisciplina ===
    "object"
    ? body.statusPorDisciplina
    : {};

const horariosPorDisciplina =
  body?.horariosPorDisciplina &&
  typeof body.horariosPorDisciplina ===
    "object"
    ? body.horariosPorDisciplina
    : {};

    const turmaExistente = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!turmaExistente) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    if (disciplinaIds.length === 0) {
  return NextResponse.json(
    {
      error:
        "Selecione pelo menos uma disciplina.",
    },
    {
      status: 400,
    },
  );
}

    const poloFoiEnviado =
  Object.prototype.hasOwnProperty.call(
    body,
    "poloId",
  );

const poloId = poloFoiEnviado
  ? body?.poloId !== null &&
    String(
      body.poloId,
    ).trim() !== ""
    ? Number(body.poloId)
    : null
  : turmaExistente.poloId;

    if (poloId !== null) {
      const polo = await prisma.polo.findFirst({
        where: {
          id: poloId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!polo) {
        return NextResponse.json(
          { error: "Polo inválido para esta instituição." },
          { status: 400 }
        );
      }
    }

    const semestreNumero = Number(
  String(
    body.semestre ??
      turmaExistente.semestre,
  ).match(/\d+/)?.[0] || 0,
);

const modalidade = String(
  body?.modalidade ??
    turmaExistente.modalidade ??
    "PRESENCIAL",
)
  .trim()
  .toUpperCase();

const turmaAtualizada =
  await prisma.$transaction(
    async (tx) => {
      const turmaSalva =
        await tx.turma.update({
          where: {
            id: turmaId,
          },

          data: {
            nome:
              String(
                body.nome ??
                  turmaExistente.nome,
              ).trim(),

            codigo:
              String(
                body.codigo ?? "",
              ).trim() || null,

            semestre:
              String(
                body.semestre ??
                  turmaExistente.semestre,
              ).trim(),

            periodoLetivo:
              String(
                body.periodoLetivo ??
                  turmaExistente.periodoLetivo ??
                  "",
              ).trim() || null,

            turno:
              String(
                body.turno ??
                  turmaExistente.turno ??
                  "",
              ).trim() || null,

            modalidade,

            predio:
              modalidade === "EAD"
                ? null
                : String(
                    body.predio ?? "",
                  ).trim() || null,

            ala:
              modalidade === "EAD"
                ? null
                : String(
                    body.ala ?? "",
                  ).trim() || null,

            andar:
              modalidade === "EAD"
                ? null
                : String(
                    body.andar ?? "",
                  ).trim() || null,

            sala:
              modalidade === "EAD"
                ? null
                : String(
                    body.sala ?? "",
                  ).trim() || null,

            ativa:
              body.ativa !== undefined
                ? Boolean(body.ativa)
                : turmaExistente.ativa,

            statusTurma:
              body.statusTurma ||
              turmaExistente.statusTurma,

            poloId,

            professorId:
              body?.professorId !==
                undefined &&
              body?.professorId !==
                null &&
              String(
                body.professorId,
              ).trim() !== ""
                ? Number(
                    body.professorId,
                  )
                : turmaExistente.professorId,

            capacidadeMinima:
              body.capacidadeMinima !==
                undefined &&
              body.capacidadeMinima !==
                null &&
              String(
                body.capacidadeMinima,
              ).trim() !== ""
                ? Number(
                    body.capacidadeMinima,
                  )
                : null,

            capacidadeMaxima:
              body.capacidadeMaxima !==
                undefined &&
              body.capacidadeMaxima !==
                null &&
              String(
                body.capacidadeMaxima,
              ).trim() !== ""
                ? Number(
                    body.capacidadeMaxima,
                  )
                : null,
          },
        });

      let turmaSemestre =
        await tx.turmaSemestre.findFirst(
          {
            where: {
              turmaId,
              instituicaoId:
                user.instituicaoId,
              numero:
                semestreNumero || 1,
            },

            orderBy: {
              id: "desc",
            },
          },
        );

      if (!turmaSemestre) {
        turmaSemestre =
          await tx.turmaSemestre.create(
            {
              data: {
                turmaId,
                instituicaoId:
                  user.instituicaoId,
                numero:
                  semestreNumero || 1,
                status:
                  "A_INICIAR",
              },
            },
          );
      }

      const vinculosExistentes =
        await tx.turmaDisciplina.findMany(
          {
            where: {
              turmaId,
              instituicaoId:
                user.instituicaoId,
            },
          },
        );

      const idsSelecionados =
        new Set(disciplinaIds);

      const vinculosRemover =
        vinculosExistentes.filter(
          (vinculo) =>
            !idsSelecionados.has(
              vinculo.disciplinaId,
            ),
        );

      if (
        vinculosRemover.length > 0
      ) {
        await tx.turmaDisciplina.deleteMany(
          {
            where: {
              id: {
                in: vinculosRemover.map(
                  (vinculo) =>
                    vinculo.id,
                ),
              },
              instituicaoId:
                user.instituicaoId,
            },
          },
        );
      }

      for (const disciplinaId of disciplinaIds) {
        const professorValor =
          professoresPorDisciplina[
            disciplinaId
          ];

        const dataInicioValor =
          datasInicioPorDisciplina[
            disciplinaId
          ];

        const dataFimValor =
          datasFimPorDisciplina[
            disciplinaId
          ];

        const statusValor =
          statusPorDisciplina[
            disciplinaId
          ];

        const vinculo =
          await tx.turmaDisciplina.upsert(
            {
              where: {
                turmaId_disciplinaId:
                  {
                    turmaId,
                    disciplinaId,
                  },
              },

              create: {
                turmaId,
                disciplinaId,

                instituicaoId:
                  user.instituicaoId,

                turmaSemestreId:
                  turmaSemestre.id,

                professorId:
                  professorValor &&
                  Number(
                    professorValor,
                  ) > 0
                    ? Number(
                        professorValor,
                      )
                    : null,

                dataInicio:
                  dataInicioValor
                    ? new Date(
                        dataInicioValor,
                      )
                    : null,

                dataFim:
                  dataFimValor
                    ? new Date(
                        dataFimValor,
                      )
                    : null,

                status:
                  statusValor ||
                  "A_INICIAR",
              },

              update: {
                turmaSemestreId:
                  turmaSemestre.id,

                professorId:
                  professorValor &&
                  Number(
                    professorValor,
                  ) > 0
                    ? Number(
                        professorValor,
                      )
                    : null,

                dataInicio:
                  dataInicioValor
                    ? new Date(
                        dataInicioValor,
                      )
                    : null,

                dataFim:
                  dataFimValor
                    ? new Date(
                        dataFimValor,
                      )
                    : null,

                status:
                  statusValor ||
                  "A_INICIAR",
              },
            },
          );

        const horariosRecebidos =
          Array.isArray(
            horariosPorDisciplina[
              disciplinaId
            ],
          )
            ? horariosPorDisciplina[
                disciplinaId
              ]
            : [];

        await tx.turmaDisciplinaHorario.deleteMany(
          {
            where: {
              turmaDisciplinaId:
                vinculo.id,
              instituicaoId:
                user.instituicaoId,
            },
          },
        );

        const horariosValidos =
          horariosRecebidos
            .map((horario: any) => ({
              diaSemana: Number(
                horario.diaSemana,
              ),

              horaInicio: String(
                horario.horaInicio ||
                  "",
              ).trim(),

              horaFim:
                String(
                  horario.horaFim ||
                    "",
                ).trim() ||
                null,
            }))
            .filter(
              (horario: {
                diaSemana: number;
                horaInicio: string;
              }) =>
                Number.isInteger(
                  horario.diaSemana,
                ) &&
                horario.diaSemana >= 0 &&
                horario.diaSemana <= 6 &&
                Boolean(
                  horario.horaInicio,
                ),
            );

        if (
          horariosValidos.length > 0
        ) {
          await tx.turmaDisciplinaHorario.createMany(
            {
              data:
                horariosValidos.map(
                  (horario) => ({
                    turmaDisciplinaId:
                      vinculo.id,

                    instituicaoId:
                      user.instituicaoId,

                    diaSemana:
                      horario.diaSemana,

                    horaInicio:
                      horario.horaInicio,

                    horaFim:
                      horario.horaFim,

                    ativo: true,
                  }),
                ),
            },
          );
        }
      }

      return tx.turma.findFirst({
        where: {
          id: turmaSalva.id,
          instituicaoId:
            user.instituicaoId,
        },

        include: {
          polo: true,
          curso: true,

          professor: {
            select: {
              id: true,
              nome: true,
            },
          },

          disciplinas: {
            include: {
              professor: {
                select: {
                  id: true,
                  nome: true,
                },
              },

              horarios: {
                where: {
                  ativo: true,
                },
              },

              disciplina: {
                include: {
                  curso: true,
                },
              },
            },
          },

          _count: {
            select: {
              itensMatricula: true,
            },
          },
        },
      });
    },
  );

if (!turmaAtualizada) {
  return NextResponse.json(
    {
      error:
        "Não foi possível recarregar a turma.",
    },
    {
      status: 500,
    },
  );
}

return NextResponse.json({
  ...turmaAtualizada,

  disciplinas:
    turmaAtualizada.disciplinas.map(
      (item) => ({
        ...item.disciplina,

        turmaDisciplinaId:
          item.id,

        professorId:
          item.professorId,

        professor:
          item.professor,

        dataInicio:
          item.dataInicio
            ? item.dataInicio.toISOString()
            : null,

        dataFim:
          item.dataFim
            ? item.dataFim.toISOString()
            : null,

        status:
          item.status,

        turmaSemestreId:
          item.turmaSemestreId,

        horarios:
          item.horarios.map(
            (horario) => ({
              id: horario.id,
              diaSemana:
                horario.diaSemana,
              horaInicio:
                horario.horaInicio,
              horaFim:
                horario.horaFim,
              ativo:
                horario.ativo,
            }),
          ),
      }),
    ),

  curso:
    turmaAtualizada.curso ??
    turmaAtualizada
      .disciplinas[0]
      ?.disciplina.curso ??
    null,
});
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar turma" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const turmaId = Number(context.params.id);

    const turmaExistente = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!turmaExistente) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    await prisma.turmaDisciplina.deleteMany({
      where: {
        turmaId,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.turma.delete({
      where: { id: turmaId },
    });

    return NextResponse.json({ message: "Turma excluída com sucesso" });
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir esta turma porque ela já possui vínculos acadêmicos.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao excluir turma" },
      { status: 500 }
    );
  }
}