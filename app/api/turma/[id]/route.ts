import { mesmosHorariosTurma, protegerEstruturaTurma, validarHorarioGeralTurma } from "@/lib/academico/horarios-proprios-turma";
import { ErroCadastroTurmaAvulsa } from "@/lib/academico/validar-turma-avulsa";
import { etapaDaOferta } from "@/lib/academico/organizacao";
import { mesmaEtapaOferta } from "@/lib/academico/grade-oferta";
import { validarEtapaDoCurso, ErroIntegridadeAcademica, idOpcionalOferta, idsOferta, protegerHistoricoDasOfertas, respostaErroAcademico, validarDisciplinasDaOferta, validarResponsaveisDaOferta } from "@/lib/academico/integridade-ofertas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const turmaId = Number(context.params.id);
    if (!Number.isInteger(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "ID de turma inválido" }, { status: 400 });
    }

    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, instituicaoId: user.instituicaoId },
      include: {
        curso: true,
        polo: true,
        horariosAvulsos: { where: { instituicaoId: user.instituicaoId, ativo: true }, orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
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
      curso: turma.curso ?? (
        turma.disciplinas.length > 0
          ? turma.disciplinas[0].disciplina.curso ?? null
          : null),
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
    if (!Number.isSafeInteger(turmaId) || turmaId <= 0) return NextResponse.json({ error: "ID de turma inválido" }, { status: 400 });
    const body = await request.json();
    const horariosGerais = body.horariosTurma === undefined ? undefined : validarHorarioGeralTurma(body.horariosTurma);

    // Omissão preserva associações; [] é uma retirada explícita, sujeita ao histórico.
    const idsRecebidos = body.disciplinaIds === undefined ? undefined : idsOferta(body.disciplinaIds);

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


const turmaAtualizada =
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Turma" WHERE "id"=${turmaId} AND "instituicaoId"=${user.instituicaoId} FOR UPDATE`;
      const atual = await tx.turma.findFirst({ where: { id: turmaId, instituicaoId: user.instituicaoId },
        include: { curso: { select: { matriculaDiretaTurma: true } }, horariosAvulsos: { where: { instituicaoId: user.instituicaoId, ativo: true } } } });
      if (!atual) throw new ErroIntegridadeAcademica("TURMA_INVALIDA");
      // A rota de avulsos mantém suas próprias proteções de ativação e matrícula.
      if (atual.curso?.matriculaDiretaTurma) throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
      const turmaExistente = atual;
      const poloId = body.poloId === undefined ? atual.poloId : idOpcionalOferta(body.poloId);
      const professorId = body.professorId === undefined ? atual.professorId : idOpcionalOferta(body.professorId);
      const modalidade = String(body.modalidade ?? atual.modalidade ?? "PRESENCIAL").trim().toUpperCase();
      const campo = (nome: "codigo" | "predio" | "ala" | "andar" | "sala") => body[nome] === undefined ? atual[nome] : body[nome];
      const vinculosExistentes = await tx.turmaDisciplina.findMany({
        where: { turmaId, instituicaoId: user.instituicaoId },
      });
      const disciplinaIds = idsRecebidos ?? vinculosExistentes.map(v => v.disciplinaId);
      const mudouHorarioGeral = horariosGerais !== undefined && !mesmosHorariosTurma(atual.horariosAvulsos, horariosGerais);
      if (mudouHorarioGeral || (disciplinaIds.length === 0 && vinculosExistentes.length > 0)) {
        await protegerEstruturaTurma(tx, user.instituicaoId, turmaId);
      }
      const etapa = await validarEtapaDoCurso(tx, user.instituicaoId, turmaExistente.cursoId,
        body.etapaNumero ?? (body.semestre !== undefined && turmaExistente.organizacaoCurricular !== "ANUAL" ? body.semestre : etapaDaOferta(turmaExistente)),
        turmaExistente.organizacaoCurricular);
      const semestreNumero = etapa.etapaNumero;
      const mesmoSemestre = mesmaEtapaOferta(etapa.etapaNumero, etapaDaOferta(turmaExistente));
      if (!mesmoSemestre) await protegerHistoricoDasOfertas(tx, user.instituicaoId, vinculosExistentes, "ETAPA_COM_HISTORICO");
      await validarDisciplinasDaOferta(tx, user.instituicaoId, turmaExistente.cursoId,
        etapa.etapaNumero, disciplinaIds,
        mesmoSemestre ? vinculosExistentes.map(v => v.disciplinaId) : []);
      await validarResponsaveisDaOferta(tx, user.instituicaoId, poloId, professorId, disciplinaIds, professoresPorDisciplina);

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
                campo("codigo") ?? "",
              ).trim() || null,

            ...etapa,
            semestre: mesmoSemestre && etapa.organizacaoCurricular === "SEMESTRAL" ? turmaExistente.semestre : etapa.semestre,

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
                    campo("predio") ?? "",
                  ).trim() || null,

            ala:
              modalidade === "EAD"
                ? null
                : String(
                    campo("ala") ?? "",
                  ).trim() || null,

            andar:
              modalidade === "EAD"
                ? null
                : String(
                    campo("andar") ?? "",
                  ).trim() || null,

            sala:
              modalidade === "EAD"
                ? null
                : String(
                    campo("sala") ?? "",
                  ).trim() || null,

            ativa:
              body.ativa !== undefined
                ? Boolean(body.ativa)
                : turmaExistente.ativa,

            statusTurma:
              body.statusTurma ||
              turmaExistente.statusTurma,

            poloId,

            professorId,

            capacidadeMinima: body.capacidadeMinima === undefined ? turmaExistente.capacidadeMinima :
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

            capacidadeMaxima: body.capacidadeMaxima === undefined ? turmaExistente.capacidadeMaxima :
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
        semestreNumero === null ? null : await tx.turmaSemestre.findFirst(
          {
            where: {
              turmaId,
              instituicaoId:
                user.instituicaoId,
              organizacaoCurricular: etapa.organizacaoCurricular,
              numero:
                semestreNumero,
            },

            orderBy: {
              id: "desc",
            },
          },
        );

      if (!turmaSemestre && semestreNumero !== null) {
        turmaSemestre =
          await tx.turmaSemestre.create(
            {
              data: {
                turmaId,
                instituicaoId:
                  user.instituicaoId,
                organizacaoCurricular: etapa.organizacaoCurricular,
                numero:
                  semestreNumero,
                status:
                  "A_INICIAR",
              },
            },
          );
      }

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
        await protegerHistoricoDasOfertas(tx, user.instituicaoId, vinculosRemover);
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
                  turmaSemestre?.id ?? null,

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
                turmaSemestreId: mesmoSemestre ? undefined : turmaSemestre?.id ?? null,
                professorId: Object.prototype.hasOwnProperty.call(professoresPorDisciplina, disciplinaId)
                  ? idOpcionalOferta(professorValor) : undefined,
                dataInicio: Object.prototype.hasOwnProperty.call(datasInicioPorDisciplina, disciplinaId)
                  ? dataInicioValor ? new Date(dataInicioValor) : null : undefined,
                dataFim: Object.prototype.hasOwnProperty.call(datasFimPorDisciplina, disciplinaId)
                  ? dataFimValor ? new Date(dataFimValor) : null : undefined,
                status: Object.prototype.hasOwnProperty.call(statusPorDisciplina, disciplinaId)
                  ? statusValor || "A_INICIAR" : undefined,
              },
            },
          );

        if (!Object.prototype.hasOwnProperty.call(horariosPorDisciplina, disciplinaId)) continue;
        if (!Array.isArray(horariosPorDisciplina[disciplinaId])) {
          throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
        }

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

      if (mudouHorarioGeral) {
        await tx.turmaHorarioAvulso.deleteMany({ where: { turmaId, instituicaoId: user.instituicaoId } });
        if (horariosGerais!.length) await tx.turmaHorarioAvulso.createMany({ data: horariosGerais!.map(h => ({
          ...h, turmaId, instituicaoId: user.instituicaoId, ativo: true,
        })) });
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
          horariosAvulsos: { where: { instituicaoId: user.instituicaoId, ativo: true }, orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },

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
    { isolationLevel: "Serializable", timeout: 20000 },
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
    if (error instanceof ErroCadastroTurmaAvulsa) return NextResponse.json({ codigo: error.codigo, error: error.message }, { status: 400 });
    const erroAcademico = respostaErroAcademico(error);
    if (erroAcademico) return erroAcademico;
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
    if (!Number.isSafeInteger(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "Identificador de turma inválido" }, { status: 400 });
    }

    return await prisma.$transaction(async (tx) => {
      // Serializa a exclusão com matrículas e alterações que referenciam a turma.
      await tx.$queryRaw`SELECT "id" FROM "Turma" WHERE "id"=${turmaId} AND "instituicaoId"=${user.instituicaoId} FOR UPDATE`;
      const turma = await tx.turma.findFirst({
        where: { id: turmaId, instituicaoId: user.instituicaoId },
        select: {
          id: true,
          _count: { select: {
            atividades: true, aulas: true, itensMatricula: true, matriculasComoPrincipal: true,
            modulos: true, notas: true, provas: true, sessoesVideoAluno: true,
            eventosAprendizagemAluno: true, resultadosFinais: true,
            periodosMatriculaParticipantes: true, reunioes: true, substituicoesDocentes: true,
            destinosRecomendacoesBiblioteca: true, atividadesExternas: true, matriculasAvulsas: true,
          } },
          disciplinas: { select: { _count: { select: { itensRematriculaSemestral: true } } } },
        },
      });
      if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
      // Cascades e SetNull não são uma autorização para remover histórico.
      if (Object.values(turma._count).some(total => Number(total) > 0) ||
          turma.disciplinas.some(d => d._count.itensRematriculaSemestral > 0)) {
        return NextResponse.json({ codigo: "TURMA_COM_HISTORICO",
          error: "Não é possível excluir esta turma porque ela possui matrículas, registros ou vínculos acadêmicos. Os dados foram preservados." }, { status: 409 });
      }
      const snapshots = await tx.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
        WHERE "instituicaoId"=${user.instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ turmaId }] })}::jsonb`;
      if (snapshots[0]?.total) {
        return NextResponse.json({ codigo: "TURMA_COM_HISTORICO",
          error: "Esta turma está preservada em uma contratação anterior e não pode ser excluída." }, { status: 409 });
      }
      const derivadas = await tx.turma.findMany({
        where: { instituicaoId: user.instituicaoId, codigo: { startsWith: `OFERTA-${turmaId}-` } },
        select: { codigo: true, cursoId: true },
      });
      if (derivadas.some(d => d.cursoId && d.codigo === `OFERTA-${turmaId}-${d.cursoId}`)) {
        return NextResponse.json({ codigo: "OFERTAS_VINCULADAS",
          error: "Esta turma disponibiliza ofertas em outros cursos. Revise esses vínculos antes de excluir a turma de origem." }, { status: 409 });
      }
      // Apenas configurações da turma sem uso (ofertas, etapas e horários) podem sair.
      await tx.turmaDisciplina.deleteMany({ where: { turmaId, instituicaoId: user.instituicaoId } });
      await tx.turma.delete({ where: { id: turmaId, instituicaoId: user.instituicaoId } });
      return NextResponse.json({ ok: true, id: turmaId, message: "Turma excluída com sucesso" },
        { headers: { "Cache-Control": "no-store" } });
    }, { isolationLevel: "Serializable", timeout: 20000 });
  } catch (error: any) {
    console.error(error);

    if (["P2003", "P2014"].includes(error?.code)) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir esta turma porque ela já possui vínculos acadêmicos.",
        },
        { status: 409 }
      );
    }

    if (["P2034", "P2025"].includes(error?.code)) {
      return NextResponse.json({ codigo: "DADOS_ALTERADOS",
        error: "Os vínculos da turma mudaram durante a operação. Atualize a lista e confira antes de tentar novamente." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Erro ao excluir turma" },
      { status: 500 }
    );
  }
}