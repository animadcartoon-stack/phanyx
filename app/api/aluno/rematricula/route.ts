import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TokenAluno = {
  id: number;
  role: string;
  email?: string;
  instituicaoId: number;
};

type TipoDisciplinaRematricula =
  | "PROXIMO_SEMESTRE"
  | "PENDENCIA_ANTERIOR"
  | "EXTRACURRICULAR";

type CandidatoDisciplina = {
  disciplinaId: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  cargaHoraria: number;
  tipo: TipoDisciplinaRematricula;
  semestreOrigemNumero: number | null;
  obrigatoria: boolean;
  contaCargaMinima: boolean;
  contaCargaMaxima: boolean;
};

async function obterAlunoAutenticado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  let decoded: TokenAluno;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as TokenAluno;
  } catch {
    return null;
  }

  if (
    String(decoded.role || "").toUpperCase() !==
    "ALUNO"
  ) {
    return null;
  }

  return prisma.aluno.findFirst({
    where: {
      userId: decoded.id,
      instituicaoId: decoded.instituicaoId,
      ativo: true,
    },
    select: {
      id: true,
      userId: true,
      nome: true,
      statusAluno: true,
      instituicaoId: true,
      poloId: true,
      polo: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });
}

function ordenarHorarios<
  T extends {
    diaSemana: number;
    horaInicio: string;
  },
>(horarios: T[]) {
  return [...horarios].sort((a, b) => {
    if (a.diaSemana !== b.diaSemana) {
      return a.diaSemana - b.diaSemana;
    }

    return a.horaInicio.localeCompare(
      b.horaInicio,
    );
  });
}

export async function GET() {
  try {
    const aluno = await obterAlunoAutenticado();

    if (!aluno) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const agora = new Date();

    const configuracaoManual =
      await prisma.configuracaoPortalInstituicao.findFirst(
        {
          where: {
            instituicaoId: aluno.instituicaoId,
            portal: "ALUNO",
            chavePagina: "aluno.rematricula",
          },
          select: {
            visivel: true,
          },
        },
      );

    const matriculaAtual =
      await prisma.matricula.findFirst({
        where: {
          alunoId: aluno.id,
          instituicaoId: aluno.instituicaoId,
          cursoId: {
            not: null,
          },
          status: {
            in: ["ATIVA", "A_INICIAR"],
          },
        },
        orderBy: [
          {
            updatedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          id: true,
          numeroMatricula: true,
          status: true,
          semestre: true,
          periodoLetivo: true,
          cursoId: true,
          cursoSemestreId: true,
          poloId: true,
          curso: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              quantidadeSemestres: true,
              cargaHorariaMaximaSemestre: true,
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
        },
      });

    const visibilidadeManual =
      configuracaoManual?.visivel === true;

    if (!matriculaAtual?.cursoId) {
      return NextResponse.json({
        mostrarPagina: visibilidadeManual,
        visibilidadeManual,
        periodoAberto: false,
        motivoIndisponibilidade:
          "SEM_MATRICULA_ATIVA",
        mensagem:
          "Não foi localizada uma matrícula ativa com curso vinculado.",
        aluno,
        matriculaAtual: null,
        periodo: null,
        disciplinas: [],
        rematricula: null,
      });
    }

    const semestreAtual =
      matriculaAtual.cursoSemestre?.numero ??
      matriculaAtual.semestre ??
      null;

    if (semestreAtual === null) {
      return NextResponse.json({
        mostrarPagina: visibilidadeManual,
        visibilidadeManual,
        periodoAberto: false,
        motivoIndisponibilidade:
          "SEM_SEMESTRE_ATUAL",
        mensagem:
          "A matrícula atual não possui semestre acadêmico definido.",
        aluno,
        matriculaAtual,
        periodo: null,
        disciplinas: [],
        rematricula: null,
      });
    }

    const proximoSemestreNumero =
      semestreAtual + 1;

    const periodo =
      await prisma.periodoMatricula.findFirst({
        where: {
          instituicaoId: aluno.instituicaoId,
          cursoId: matriculaAtual.cursoId,
          tipo: "REMATRICULA",
          status: "PUBLICADO",
          ativo: true,
          permiteAluno: true,
          semestreNumero: proximoSemestreNumero,
          dataInicio: {
            lte: agora,
          },
          dataFim: {
            gte: agora,
          },
        },
        orderBy: {
          dataInicio: "desc",
        },
        include: {
          curso: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              quantidadeSemestres: true,
              cargaHorariaMaximaSemestre: true,
            },
          },
          cursoSemestre: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              descricao: true,
              cargaMinima: true,
              cargaMaxima: true,
              disciplinas: {
                include: {
                  disciplina: {
                    select: {
                      id: true,
                      nome: true,
                      codigo: true,
                      descricao: true,
                      cargaHoraria: true,
                      ativo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!periodo) {
      return NextResponse.json({
        mostrarPagina: visibilidadeManual,
        visibilidadeManual,
        periodoAberto: false,
        motivoIndisponibilidade:
          "SEM_PERIODO_ABERTO",
        mensagem:
          "Não existe período de rematrícula aberto para o próximo semestre.",
        aluno,
        matriculaAtual,
        proximoSemestreNumero,
        periodo: null,
        disciplinas: [],
        rematricula: null,
      });
    }

    let cursoSemestreDestino =
      periodo.cursoSemestre;

    if (!cursoSemestreDestino) {
      cursoSemestreDestino =
        await prisma.cursoSemestre.findFirst({
          where: {
            instituicaoId: aluno.instituicaoId,
            cursoId: matriculaAtual.cursoId,
            numero: proximoSemestreNumero,
          },
          select: {
            id: true,
            numero: true,
            titulo: true,
            descricao: true,
            cargaMinima: true,
            cargaMaxima: true,
            disciplinas: {
              include: {
                disciplina: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    descricao: true,
                    cargaHoraria: true,
                    ativo: true,
                  },
                },
              },
            },
          },
        });
    }

    if (!cursoSemestreDestino) {
      return NextResponse.json(
        {
          error:
            "O semestre de destino não foi encontrado para este curso.",
        },
        {
          status: 409,
        },
      );
    }

    const [
      semestresAnteriores,
      resultadosAprovados,
      itensAcademicosAluno,
      extrasConfiguradas,
    ] = await Promise.all([
      prisma.cursoSemestre.findMany({
        where: {
          instituicaoId: aluno.instituicaoId,
          cursoId: matriculaAtual.cursoId,
          numero: {
            lt: cursoSemestreDestino.numero,
          },
        },
        select: {
          id: true,
          numero: true,
          titulo: true,
          disciplinas: {
            include: {
              disciplina: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,
                  descricao: true,
                  cargaHoraria: true,
                  ativo: true,
                },
              },
            },
          },
        },
        orderBy: {
          numero: "asc",
        },
      }),

      prisma.resultadoFinal.findMany({
        where: {
          alunoId: aluno.id,
          instituicaoId: aluno.instituicaoId,
          situacao: "APROVADO",
        },
        select: {
          disciplinaId: true,
        },
      }),

      prisma.itemMatricula.findMany({
        where: {
          instituicaoId: aluno.instituicaoId,
          matricula: {
            alunoId: aluno.id,
            instituicaoId: aluno.instituicaoId,
          },
          status: {
            in: [
              "A_CURSAR",
              "EM_CURSO",
              "CONCLUIDO",
            ],
          },
        },
        select: {
          disciplinaId: true,
          status: true,
        },
      }),

      prisma.cursoDisciplinaExtraPermitida.findMany(
        {
          where: {
            instituicaoId: aluno.instituicaoId,
            cursoId: matriculaAtual.cursoId,
            ativa: true,
            OR: [
              {
                cursoSemestreId: null,
              },
              {
                cursoSemestreId:
                  cursoSemestreDestino.id,
              },
            ],
          },
          include: {
            disciplina: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                descricao: true,
                cargaHoraria: true,
                ativo: true,
              },
            },
          },
        },
      ),
    ]);

    const disciplinasAprovadas = new Set<number>(
      resultadosAprovados.map(
        (item) => item.disciplinaId,
      ),
    );

    const disciplinasEmAndamento = new Set<number>();
    const disciplinasConcluidasPorItem =
      new Set<number>();

    for (const item of itensAcademicosAluno) {
      if (item.status === "CONCLUIDO") {
        disciplinasConcluidasPorItem.add(
          item.disciplinaId,
        );
        disciplinasAprovadas.add(
          item.disciplinaId,
        );
      }

      if (
        item.status === "A_CURSAR" ||
        item.status === "EM_CURSO"
      ) {
        disciplinasEmAndamento.add(
          item.disciplinaId,
        );
      }
    }

    const candidatos =
      new Map<number, CandidatoDisciplina>();

    for (const item of cursoSemestreDestino.disciplinas) {
      const disciplina = item.disciplina;

      if (
        !disciplina.ativo ||
        disciplinasAprovadas.has(disciplina.id)
      ) {
        continue;
      }

      candidatos.set(disciplina.id, {
        disciplinaId: disciplina.id,
        nome: disciplina.nome,
        codigo: disciplina.codigo,
        descricao: disciplina.descricao,
        cargaHoraria:
          disciplina.cargaHoraria ?? 0,
        tipo: "PROXIMO_SEMESTRE",
        semestreOrigemNumero:
          cursoSemestreDestino.numero,
        obrigatoria: true,
        contaCargaMinima: true,
        contaCargaMaxima: true,
      });
    }

    for (const semestre of semestresAnteriores) {
      for (const item of semestre.disciplinas) {
        const disciplina = item.disciplina;

        if (
          !disciplina.ativo ||
          disciplinasAprovadas.has(
            disciplina.id,
          ) ||
          disciplinasEmAndamento.has(
            disciplina.id,
          ) ||
          candidatos.has(disciplina.id)
        ) {
          continue;
        }

        candidatos.set(disciplina.id, {
          disciplinaId: disciplina.id,
          nome: disciplina.nome,
          codigo: disciplina.codigo,
          descricao: disciplina.descricao,
          cargaHoraria:
            disciplina.cargaHoraria ?? 0,
          tipo: "PENDENCIA_ANTERIOR",
          semestreOrigemNumero:
            semestre.numero,
          obrigatoria: false,
          contaCargaMinima: true,
          contaCargaMaxima: true,
        });
      }
    }

    const extrasPorDisciplina = new Map<
      number,
      (typeof extrasConfiguradas)[number]
    >();

    for (const extra of extrasConfiguradas) {
      const existente =
        extrasPorDisciplina.get(
          extra.disciplinaId,
        );

      if (
        !existente ||
        extra.cursoSemestreId ===
          cursoSemestreDestino.id
      ) {
        extrasPorDisciplina.set(
          extra.disciplinaId,
          extra,
        );
      }
    }

    for (const extra of extrasPorDisciplina.values()) {
      const disciplina = extra.disciplina;

      if (
        !disciplina.ativo ||
        disciplinasAprovadas.has(
          disciplina.id,
        ) ||
        disciplinasEmAndamento.has(
          disciplina.id,
        ) ||
        candidatos.has(disciplina.id)
      ) {
        continue;
      }

      candidatos.set(disciplina.id, {
        disciplinaId: disciplina.id,
        nome: disciplina.nome,
        codigo: disciplina.codigo,
        descricao: disciplina.descricao,
        cargaHoraria:
          disciplina.cargaHoraria ?? 0,
        tipo: "EXTRACURRICULAR",
        semestreOrigemNumero: null,
        obrigatoria: extra.obrigatoria,
        contaCargaMinima:
          extra.contaCargaMinima,
        contaCargaMaxima:
          extra.contaCargaMaxima,
      });
    }

    const disciplinaIds = Array.from(
      candidatos.keys(),
    );

    const [preRequisitos, ofertas] =
      disciplinaIds.length > 0
        ? await Promise.all([
            prisma.disciplinaPreRequisito.findMany(
              {
                where: {
                  instituicaoId:
                    aluno.instituicaoId,
                  disciplinaId: {
                    in: disciplinaIds,
                  },
                },
                select: {
                  disciplinaId: true,
                  prerequisitoId: true,
                  prerequisito: {
                    select: {
                      id: true,
                      nome: true,
                      codigo: true,
                    },
                  },
                },
              },
            ),

            prisma.turmaDisciplina.findMany({
              where: {
                instituicaoId:
                  aluno.instituicaoId,
                disciplinaId: {
                  in: disciplinaIds,
                },
                AND: [
                  {
                    turma: {
                      ativa: true,
                      periodoLetivo:
                        periodo.periodoLetivo,
                      statusTurma: {
                        in: [
                          "AGUARDANDO",
                          "A_INICIAR",
                          "ATIVA",
                        ],
                      },
                    },
                  },
                  ...(aluno.poloId
                    ? [
                        {
                          OR: [
                            {
                              turma: {
                                poloId:
                                  aluno.poloId,
                              },
                            },
                            {
                              turma: {
                                poloId: null,
                              },
                            },
                          ],
                        },
                      ]
                    : []),
                ],
              },
              select: {
                id: true,
                disciplinaId: true,
                dataInicio: true,
                dataFim: true,
                status: true,
                professor: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
                turmaSemestre: {
                  select: {
                    id: true,
                    numero: true,
                    dataInicio: true,
                    dataFim: true,
                    status: true,
                  },
                },
                turma: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    periodoLetivo: true,
                    predio: true,
                    ala: true,
                    andar: true,
                    sala: true,
                    capacidadeMaxima: true,
                    capacidadeMinima: true,
                    dataInicio: true,
                    dataFim: true,
                    statusTurma: true,
                    poloId: true,
                    polo: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                  },
                },
                horarios: {
                  where: {
                    ativo: true,
                  },
                  select: {
                    id: true,
                    diaSemana: true,
                    horaInicio: true,
                    horaFim: true,
                  },
                },
              },
            }),
          ])
        : [[], []];

    const turmaIds = Array.from(
      new Set(
        ofertas.map(
          (oferta) => oferta.turma.id,
        ),
      ),
    );

    const ocupacoes =
      turmaIds.length > 0
        ? await prisma.itemMatricula.findMany({
            where: {
              instituicaoId:
                aluno.instituicaoId,
              turmaId: {
                in: turmaIds,
              },
              status: {
                in: [
                  "A_CURSAR",
                  "EM_CURSO",
                ],
              },
            },
            select: {
              turmaId: true,
              matriculaId: true,
            },
            distinct: [
              "turmaId",
              "matriculaId",
            ],
          })
        : [];

    const ocupacaoPorTurma =
      new Map<number, number>();

    for (const ocupacao of ocupacoes) {
      ocupacaoPorTurma.set(
        ocupacao.turmaId,
        (ocupacaoPorTurma.get(
          ocupacao.turmaId,
        ) ?? 0) + 1,
      );
    }

    const preRequisitosPorDisciplina =
      new Map<
        number,
        typeof preRequisitos
      >();

    for (const preRequisito of preRequisitos) {
      const lista =
        preRequisitosPorDisciplina.get(
          preRequisito.disciplinaId,
        ) ?? [];

      lista.push(preRequisito);

      preRequisitosPorDisciplina.set(
        preRequisito.disciplinaId,
        lista,
      );
    }

    const ofertasPorDisciplina = new Map<
      number,
      typeof ofertas
    >();

    for (const oferta of ofertas) {
      const lista =
        ofertasPorDisciplina.get(
          oferta.disciplinaId,
        ) ?? [];

      lista.push(oferta);

      ofertasPorDisciplina.set(
        oferta.disciplinaId,
        lista,
      );
    }

    const disciplinas = Array.from(
      candidatos.values(),
    )
      .map((candidato) => {
        const requisitos =
          preRequisitosPorDisciplina.get(
            candidato.disciplinaId,
          ) ?? [];

        const requisitosFormatados =
          requisitos.map((requisito) => ({
            disciplinaId:
              requisito.prerequisito.id,
            nome: requisito.prerequisito.nome,
            codigo:
              requisito.prerequisito.codigo,
            cumprido:
              disciplinasAprovadas.has(
                requisito.prerequisitoId,
              ),
          }));

        const requisitosPendentes =
          requisitosFormatados.filter(
            (item) => !item.cumprido,
          );

        const opcoesTurma = (
          ofertasPorDisciplina.get(
            candidato.disciplinaId,
          ) ?? []
        ).map((oferta) => {
          const ocupacao =
            ocupacaoPorTurma.get(
              oferta.turma.id,
            ) ?? 0;

          const capacidade =
            oferta.turma.capacidadeMaxima;

          const vagasDisponiveis =
            capacidade === null
              ? null
              : Math.max(
                  capacidade - ocupacao,
                  0,
                );

          return {
            turmaDisciplinaId: oferta.id,
            turmaId: oferta.turma.id,
            turmaNome: oferta.turma.nome,
            turmaCodigo:
              oferta.turma.codigo,
            periodoLetivo:
              oferta.turma.periodoLetivo,
            professor: oferta.professor,
            polo: oferta.turma.polo,
            predio: oferta.turma.predio,
            ala: oferta.turma.ala,
            andar: oferta.turma.andar,
            sala: oferta.turma.sala,
            dataInicio:
              oferta.dataInicio ??
              oferta.turma.dataInicio,
            dataFim:
              oferta.dataFim ??
              oferta.turma.dataFim,
            statusTurma:
              oferta.turma.statusTurma,
            capacidadeMaxima: capacidade,
            ocupacao,
            vagasDisponiveis,
            semVagas:
              vagasDisponiveis !== null &&
              vagasDisponiveis <= 0,
            horarios: ordenarHorarios(
              oferta.horarios,
            ),
          };
        });

        const possuiTurmaDisponivel =
          opcoesTurma.some(
            (opcao) => !opcao.semVagas,
          );

        const motivosBloqueio: string[] = [];

        if (requisitosPendentes.length > 0) {
          motivosBloqueio.push(
            `Pré-requisito pendente: ${requisitosPendentes
              .map((item) => item.nome)
              .join(", ")}.`,
          );
        }

        if (opcoesTurma.length === 0) {
          motivosBloqueio.push(
            "Nenhuma turma foi disponibilizada para esta disciplina.",
          );
        } else if (!possuiTurmaDisponivel) {
          motivosBloqueio.push(
            "Não existem vagas disponíveis nas turmas desta disciplina.",
          );
        }

        return {
          ...candidato,
          preRequisitos:
            requisitosFormatados,
          preRequisitosPendentes: requisitosPendentes,
          opcoesTurma,
          bloqueada:
            motivosBloqueio.length > 0,
          motivosBloqueio,
        };
      })
      .sort((a, b) => {
        const ordemTipo: Record<
          TipoDisciplinaRematricula,
          number
        > = {
          PROXIMO_SEMESTRE: 1,
          PENDENCIA_ANTERIOR: 2,
          EXTRACURRICULAR: 3,
        };

        if (
          ordemTipo[a.tipo] !==
          ordemTipo[b.tipo]
        ) {
          return (
            ordemTipo[a.tipo] -
            ordemTipo[b.tipo]
          );
        }

        return a.nome.localeCompare(
          b.nome,
          "pt-BR",
        );
      });

    const rematriculaExistente =
      await prisma.rematriculaSemestral.findFirst(
        {
          where: {
            alunoId: aluno.id,
            periodoMatriculaId: periodo.id,
            instituicaoId:
              aluno.instituicaoId,
          },
          select: {
            id: true,
            protocolo: true,
            status: true,
            cargaHorariaSelecionada: true,
            declaracaoAceitaEm: true,
            enviadaEm: true,
            analisadaEm: true,
            aprovadaEm: true,
            devolvidaEm: true,
            recusadaEm: true,
            canceladaEm: true,
            motivoDevolucao: true,
            motivoRecusa: true,
            motivoCancelamento: true,
            observacoes: true,
            criadaEm: true,
            atualizadaEm: true,
            itens: {
              select: {
                id: true,
                disciplinaId: true,
                turmaDisciplinaId: true,
                tipo: true,
                cargaHorariaSnapshot: true,
                semestreOrigemNumero: true,
                obrigatoria: true,
              },
            },
          },
        },
      );

    const cargaMinima =
      periodo.cargaMinimaOverride ??
      cursoSemestreDestino.cargaMinima ??
      0;

    const cargaMaxima =
      periodo.cargaMaximaOverride ??
      cursoSemestreDestino.cargaMaxima ??
      matriculaAtual.curso
        ?.cargaHorariaMaximaSemestre ??
      null;

    const bloqueadaPorInadimplencia =
      periodo.bloqueiaInadimplente &&
      aluno.statusAluno === "INADIMPLENTE";

    const statusRematricula =
      rematriculaExistente?.status ?? null;

    const statusEditavel =
      statusRematricula === null ||
      statusRematricula === "RASCUNHO" ||
      statusRematricula === "DEVOLVIDA";

    return NextResponse.json({
      mostrarPagina: true,
      visibilidadeManual,
      periodoAberto: true,
      motivoIndisponibilidade: null,

      aluno,

      matriculaAtual: {
        ...matriculaAtual,
        semestreAtual,
      },

      proximoSemestreNumero,

      periodo: {
        id: periodo.id,
        titulo: periodo.titulo,
        periodoLetivo:
          periodo.periodoLetivo,
        semestreNumero:
          periodo.semestreNumero,
        dataInicio: periodo.dataInicio,
        dataFim: periodo.dataFim,
        dataInicioAulas:
          periodo.dataInicioAulas,
        instrucoes: periodo.instrucoes,
        exigeAprovacao:
          periodo.exigeAprovacao,
        permiteRascunho:
          periodo.permiteRascunho,
        bloqueiaInadimplente:
          periodo.bloqueiaInadimplente,
        cargaMinima,
        cargaMaxima,
        curso: periodo.curso,
        cursoSemestre: {
          id: cursoSemestreDestino.id,
          numero:
            cursoSemestreDestino.numero,
          titulo:
            cursoSemestreDestino.titulo,
          descricao:
            cursoSemestreDestino.descricao,
        },
      },

      regras: {
        cargaMinima,
        cargaMaxima,
        exigeAprovacao:
          periodo.exigeAprovacao,
        permiteRascunho:
          periodo.permiteRascunho,
        bloqueiaInadimplente:
          periodo.bloqueiaInadimplente,
      },

      bloqueios: {
        inadimplencia:
          bloqueadaPorInadimplencia,
        mensagemInadimplencia:
          bloqueadaPorInadimplencia
            ? "A instituição bloqueou a rematrícula para alunos inadimplentes."
            : null,
      },

      disciplinas,

      rematricula: rematriculaExistente,

      selecaoAtual: {
        turmaDisciplinaIds:
          rematriculaExistente?.itens.map(
            (item) =>
              item.turmaDisciplinaId,
          ) ?? [],
        disciplinaIds:
          rematriculaExistente?.itens.map(
            (item) => item.disciplinaId,
          ) ?? [],
        cargaHorariaSelecionada:
          rematriculaExistente
            ?.cargaHorariaSelecionada ?? 0,
      },

      edicaoPermitida:
        statusEditavel &&
        !bloqueadaPorInadimplencia,

      envioPermitido:
        statusEditavel &&
        !bloqueadaPorInadimplencia,

      gradeCurricular: {
        pdfDisponivel: false,
        pdfUrl: null,
        mensagem:
          "O PDF da grade será gerado a partir das turmas, professores e horários apresentados nesta página.",
      },
    });
  } catch (error) {
    console.error(
      "Erro ao carregar rematrícula do aluno:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar as informações da rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}