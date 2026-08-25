import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  NextRequest,
  NextResponse,
} from "next/server";
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

type AcaoRematriculaAluno =
  | "SALVAR_RASCUNHO"
  | "ENVIAR";

type ItemRematriculaRecebido = {
  disciplinaId: number;
  turmaDisciplinaId: number;
};

type ItemRematriculaValidado = {
  disciplinaId: number;
  turmaDisciplinaId: number;
  tipo: TipoDisciplinaRematricula;
  cargaHoraria: number;
  semestreOrigemNumero: number | null;
  obrigatoria: boolean;
  contaCargaMinima: boolean;
  contaCargaMaxima: boolean;
};

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

function inteiroPositivo(
  valor: unknown,
): number | null {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function horarioEmMinutos(
  valor?: string | null,
): number | null {
  if (!valor) {
    return null;
  }

  const partes = valor.split(":");

  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos)
  ) {
    return null;
  }

  return horas * 60 + minutos;
}

function horariosSeSobrepoem(
  horarioA: {
    diaSemana: number;
    horaInicio: string;
    horaFim: string | null;
  },
  horarioB: {
    diaSemana: number;
    horaInicio: string;
    horaFim: string | null;
  },
) {
  if (
    horarioA.diaSemana !==
    horarioB.diaSemana
  ) {
    return false;
  }

  const inicioA = horarioEmMinutos(
    horarioA.horaInicio,
  );

  const fimA = horarioEmMinutos(
    horarioA.horaFim,
  );

  const inicioB = horarioEmMinutos(
    horarioB.horaInicio,
  );

  const fimB = horarioEmMinutos(
    horarioB.horaFim,
  );

  if (
    inicioA === null ||
    fimA === null ||
    inicioB === null ||
    fimB === null
  ) {
    return false;
  }

  return (
    inicioA < fimB &&
    inicioB < fimA
  );
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
      await prisma.configuracaoPortalInstituicao.findFirst({
        where: {
          instituicaoId: aluno.instituicaoId,
          portal: "ALUNO",
          chavePagina: "aluno.rematricula",
        },
        select: {
          visivel: true,
          modoVisibilidade: true,
        },
      });

    const modoVisibilidade = String(
      configuracaoManual?.modoVisibilidade ||
      (configuracaoManual?.visivel
        ? "SEMPRE_VISIVEL"
        : "AUTOMATICO"),
    ).toUpperCase();

    const visibilidadeManual =
      modoVisibilidade === "SEMPRE_VISIVEL";

    const ocultoTemporariamente =
      modoVisibilidade === "OCULTO";

    if (ocultoTemporariamente) {
      return NextResponse.json({
        mostrarPagina: false,
        visibilidadeManual: false,
        modoVisibilidade,
        periodoAberto: false,
        motivoIndisponibilidade:
          "OCULTO_PELA_INSTITUICAO",
        mensagem:
          "A página de rematrícula foi temporariamente ocultada pela instituição.",
        aluno,
        matriculaAtual: null,
        periodo: null,
        disciplinas: [],
        rematricula: null,
      });
    }

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

    if (!matriculaAtual?.cursoId) {
      return NextResponse.json({
        mostrarPagina: visibilidadeManual,
        visibilidadeManual,
        modoVisibilidade,
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
          turmasParticipantes: {
            select: {
              turmaId: true,
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

    const turmaIdsParticipantes =
      periodo.turmasParticipantes.map(
        (item) => item.turmaId,
      );

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
              turmaId: {
                in: turmaIdsParticipantes,
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

    const disciplinasJaSalvas =
      new Set<number>(
        rematriculaExistente?.itens.map(
          (item) => item.disciplinaId,
        ) ?? [],
      );

    /*
     * O aluno deve visualizar apenas disciplinas
     * realmente ofertadas neste período.
     *
     * Mantemos uma disciplina já salva anteriormente
     * para preservar o histórico da rematrícula caso
     * a oferta seja retirada depois do envio.
     */
    const disciplinasVisiveis =
      disciplinas.filter(
        (disciplina) =>
          disciplina.opcoesTurma.length > 0 ||
          disciplinasJaSalvas.has(
            disciplina.disciplinaId,
          ),
      );

    const quantidadeSemOfertaOcultada =
      disciplinas.filter(
        (disciplina) =>
          disciplina.opcoesTurma.length === 0 &&
          !disciplinasJaSalvas.has(
            disciplina.disciplinaId,
          ),
      ).length;

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

      disciplinas:
        disciplinasVisiveis,

      resumoOfertas: {
        disciplinasSemOfertaOcultadas:
          quantidadeSemOfertaOcultada,
      },

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

export async function POST(
  req: NextRequest,
) {
  try {
    const aluno =
      await obterAlunoAutenticado();

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

    const configuracaoPortal =
      await prisma.configuracaoPortalInstituicao.findFirst(
        {
          where: {
            instituicaoId:
              aluno.instituicaoId,
            portal: "ALUNO",
            chavePagina:
              "aluno.rematricula",
          },
          select: {
            modoVisibilidade: true,
          },
        },
      );

    if (
      configuracaoPortal
        ?.modoVisibilidade === "OCULTO"
    ) {
      return NextResponse.json(
        {
          error:
            "A rematrícula está temporariamente indisponível.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await req.json();

    const acao = String(
      body?.acao || "",
    ).toUpperCase() as AcaoRematriculaAluno;

    if (
      acao !== "SALVAR_RASCUNHO" &&
      acao !== "ENVIAR"
    ) {
      return NextResponse.json(
        {
          error:
            "Ação de rematrícula inválida.",
        },
        {
          status: 400,
        },
      );
    }

    const periodoMatriculaId =
      inteiroPositivo(
        body?.periodoMatriculaId,
      );

    if (!periodoMatriculaId) {
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

    const itensRecebidos =
      Array.isArray(body?.itens)
        ? body.itens
        : [];

    const itens: ItemRematriculaRecebido[] =
      [];

    for (const item of itensRecebidos) {
      const disciplinaId =
        inteiroPositivo(
          item?.disciplinaId,
        );

      const turmaDisciplinaId =
        inteiroPositivo(
          item?.turmaDisciplinaId,
        );

      if (
        !disciplinaId ||
        !turmaDisciplinaId
      ) {
        return NextResponse.json(
          {
            error:
              "Existe uma disciplina ou turma inválida na seleção.",
          },
          {
            status: 400,
          },
        );
      }

      itens.push({
        disciplinaId,
        turmaDisciplinaId,
      });
    }

    const disciplinasUnicas = new Set(
      itens.map(
        (item) => item.disciplinaId,
      ),
    );

    if (
      disciplinasUnicas.size !==
      itens.length
    ) {
      return NextResponse.json(
        {
          error:
            "A mesma disciplina foi selecionada mais de uma vez.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      acao === "ENVIAR" &&
      itens.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos uma disciplina antes de enviar.",
        },
        {
          status: 400,
        },
      );
    }

    const agora = new Date();

    const periodo =
      await prisma.periodoMatricula.findFirst(
        {
          where: {
            id: periodoMatriculaId,
            instituicaoId:
              aluno.instituicaoId,
            tipo: "REMATRICULA",
            status: "PUBLICADO",
            ativo: true,
            permiteAluno: true,
            dataInicio: {
              lte: agora,
            },
            dataFim: {
              gte: agora,
            },
          },
          include: {
            curso: {
              select: {
                id: true,
                nome: true,
                cargaHorariaMaximaSemestre:
                  true,
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
                turmaId: true,
              },
            },
          },
        },
      );

    if (!periodo) {
      return NextResponse.json(
        {
          error:
            "O período de rematrícula não está aberto ou publicado.",
        },
        {
          status: 409,
        },
      );
    }

    const turmaIdsParticipantes =
      periodo.turmasParticipantes.map(
        (item) => item.turmaId,
      );

    const turmaIdsParticipantesSet =
      new Set(
        turmaIdsParticipantes,
      );

    if (
      turmaIdsParticipantes.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Este período de rematrícula não possui turmas participantes configuradas.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      acao === "SALVAR_RASCUNHO" &&
      !periodo.permiteRascunho
    ) {
      return NextResponse.json(
        {
          error:
            "A instituição não permite salvar rascunho neste período.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      periodo.bloqueiaInadimplente &&
      aluno.statusAluno ===
      "INADIMPLENTE"
    ) {
      return NextResponse.json(
        {
          error:
            "A rematrícula está bloqueada devido à situação financeira do aluno.",
        },
        {
          status: 403,
        },
      );
    }

    const matriculaAtual =
      await prisma.matricula.findFirst(
        {
          where: {
            instituicaoId:
              aluno.instituicaoId,
            alunoId: aluno.id,
            cursoId: {
              not: null,
            },
            status: {
              in: [
                "ATIVA",
                "A_INICIAR",
              ],
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
            cursoId: true,
            semestre: true,
            poloId: true,
            cursoSemestre: {
              select: {
                numero: true,
              },
            },
          },
        },
      );

    if (!matriculaAtual?.cursoId) {
      return NextResponse.json(
        {
          error:
            "Não foi localizada uma matrícula ativa para o aluno.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      periodo.cursoId !== null &&
      periodo.cursoId !==
      matriculaAtual.cursoId
    ) {
      return NextResponse.json(
        {
          error:
            "Este período não pertence ao curso atual do aluno.",
        },
        {
          status: 403,
        },
      );
    }

    const semestreAtual =
      matriculaAtual.cursoSemestre
        ?.numero ??
      matriculaAtual.semestre ??
      null;

    if (semestreAtual === null) {
      return NextResponse.json(
        {
          error:
            "O semestre atual da matrícula não está definido.",
        },
        {
          status: 409,
        },
      );
    }

    const proximoSemestreNumero =
      semestreAtual + 1;

    if (
      periodo.semestreNumero !== null &&
      periodo.semestreNumero !==
      proximoSemestreNumero
    ) {
      return NextResponse.json(
        {
          error:
            "Este período não corresponde ao próximo semestre do aluno.",
        },
        {
          status: 409,
        },
      );
    }

    const cursoSemestreDestino =
      periodo.cursoSemestre ??
      (await prisma.cursoSemestre.findFirst(
        {
          where: {
            instituicaoId:
              aluno.instituicaoId,
            cursoId:
              matriculaAtual.cursoId,
            numero:
              proximoSemestreNumero,
          },
          select: {
            id: true,
            numero: true,
            titulo: true,
            cargaMinima: true,
            cargaMaxima: true,
          },
        },
      ));

    if (!cursoSemestreDestino) {
      return NextResponse.json(
        {
          error:
            "O semestre de destino não foi encontrado.",
        },
        {
          status: 409,
        },
      );
    }

    const rematriculaExistente =
      await prisma.rematriculaSemestral.findUnique(
        {
          where: {
            alunoId_periodoMatriculaId:
            {
              alunoId: aluno.id,
              periodoMatriculaId:
                periodo.id,
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
      );

    if (
      rematriculaExistente &&
      ![
        "RASCUNHO",
        "DEVOLVIDA",
      ].includes(
        rematriculaExistente.status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Esta rematrícula já foi enviada e não pode mais ser alterada.",
        },
        {
          status: 409,
        },
      );
    }

    const disciplinaIds = itens.map(
      (item) => item.disciplinaId,
    );

    const turmaDisciplinaIds =
      itens.map(
        (item) =>
          item.turmaDisciplinaId,
      );

    const [
      vinculosDestino,
      vinculosAnteriores,
      extrasPermitidas,
      resultadosAprovados,
      itensAcademicos,
      preRequisitos,
      ofertas,
    ] = await Promise.all([
      disciplinaIds.length > 0
        ? prisma.cursoSemestreDisciplina.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,
              cursoSemestreId:
                cursoSemestreDestino.id,
              disciplinaId: {
                in: disciplinaIds,
              },
            },
            include: {
              disciplina: {
                select: {
                  id: true,
                  nome: true,
                  cargaHoraria: true,
                  ativo: true,
                },
              },
            },
          },
        )
        : [],

      disciplinaIds.length > 0
        ? prisma.cursoSemestreDisciplina.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,
              disciplinaId: {
                in: disciplinaIds,
              },
              cursoSemestre: {
                cursoId:
                  matriculaAtual.cursoId,
                numero: {
                  lt:
                    cursoSemestreDestino.numero,
                },
              },
            },
            include: {
              cursoSemestre: {
                select: {
                  numero: true,
                },
              },
              disciplina: {
                select: {
                  id: true,
                  nome: true,
                  cargaHoraria: true,
                  ativo: true,
                },
              },
            },
          },
        )
        : [],

      disciplinaIds.length > 0
        ? prisma.cursoDisciplinaExtraPermitida.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,
              cursoId:
                matriculaAtual.cursoId,
              disciplinaId: {
                in: disciplinaIds,
              },
              ativa: true,
              OR: [
                {
                  cursoSemestreId:
                    null,
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
                  cargaHoraria: true,
                  ativo: true,
                },
              },
            },
          },
        )
        : [],

      disciplinaIds.length > 0
        ? prisma.resultadoFinal.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,
              alunoId: aluno.id,
              disciplinaId: {
                in: disciplinaIds,
              },
              situacao:
                "APROVADO",
            },
            select: {
              disciplinaId: true,
            },
          },
        )
        : [],

      disciplinaIds.length > 0
        ? prisma.itemMatricula.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,
              disciplinaId: {
                in: disciplinaIds,
              },
              matricula: {
                alunoId: aluno.id,
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
          },
        )
        : [],

      disciplinaIds.length > 0
        ? prisma.disciplinaPreRequisito.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,
              disciplinaId: {
                in: disciplinaIds,
              },
            },
            include: {
              prerequisito: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        )
        : [],

      turmaDisciplinaIds.length > 0
        ? prisma.turmaDisciplina.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,

              id: {
                in:
                  turmaDisciplinaIds,
              },

              turmaId: {
                in:
                  turmaIdsParticipantes,
              },
            },
            include: {
              disciplina: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              turma: {
                select: {
                  id: true,
                  nome: true,
                  ativa: true,
                  periodoLetivo: true,
                  poloId: true,
                  capacidadeMaxima:
                    true,
                  statusTurma: true,
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
          },
        )
        : [],
    ]);

    const aprovadas = new Set<number>(
      resultadosAprovados.map(
        (item) => item.disciplinaId,
      ),
    );

    const emAndamento =
      new Set<number>();

    for (const item of itensAcademicos) {
      if (
        item.status === "CONCLUIDO"
      ) {
        aprovadas.add(
          item.disciplinaId,
        );
      }

      if (
        item.status === "A_CURSAR" ||
        item.status === "EM_CURSO"
      ) {
        emAndamento.add(
          item.disciplinaId,
        );
      }
    }

    const destinoPorDisciplina = new Map<
      number,
      (typeof vinculosDestino)[number]
    >(
      vinculosDestino.map(
        (vinculo) =>
          [
            vinculo.disciplinaId,
            vinculo,
          ] as const,
      ),
    );

    const anteriorPorDisciplina =
      new Map<number, (typeof vinculosAnteriores)[number]>();

    for (const vinculo of vinculosAnteriores) {
      const atual =
        anteriorPorDisciplina.get(
          vinculo.disciplinaId,
        );

      if (
        !atual ||
        vinculo.cursoSemestre.numero >
        atual.cursoSemestre.numero
      ) {
        anteriorPorDisciplina.set(
          vinculo.disciplinaId,
          vinculo,
        );
      }
    }

    const extrasPorDisciplina =
      new Map<
        number,
        (typeof extrasPermitidas)[number]
      >();

    for (const extra of extrasPermitidas) {
      const atual =
        extrasPorDisciplina.get(
          extra.disciplinaId,
        );

      if (
        !atual ||
        extra.cursoSemestreId ===
        cursoSemestreDestino.id
      ) {
        extrasPorDisciplina.set(
          extra.disciplinaId,
          extra,
        );
      }
    }

    const itensValidados:
      ItemRematriculaValidado[] = [];

    for (const item of itens) {
      if (
        aprovadas.has(
          item.disciplinaId,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Uma das disciplinas selecionadas já foi concluída pelo aluno.",
          },
          {
            status: 409,
          },
        );
      }

      const destino =
        destinoPorDisciplina.get(
          item.disciplinaId,
        );

      const anterior =
        anteriorPorDisciplina.get(
          item.disciplinaId,
        );

      const extra =
        extrasPorDisciplina.get(
          item.disciplinaId,
        );

      if (destino) {
        if (!destino.disciplina.ativo) {
          return NextResponse.json(
            {
              error: `A disciplina ${destino.disciplina.nome} está inativa.`,
            },
            {
              status: 409,
            },
          );
        }

        itensValidados.push({
          disciplinaId:
            item.disciplinaId,
          turmaDisciplinaId:
            item.turmaDisciplinaId,
          tipo:
            "PROXIMO_SEMESTRE",
          cargaHoraria:
            destino.disciplina
              .cargaHoraria ?? 0,
          semestreOrigemNumero:
            cursoSemestreDestino.numero,
          obrigatoria: true,
          contaCargaMinima: true,
          contaCargaMaxima: true,
        });

        continue;
      }

      if (
        anterior &&
        !emAndamento.has(
          item.disciplinaId,
        )
      ) {
        if (
          !anterior.disciplina.ativo
        ) {
          return NextResponse.json(
            {
              error: `A disciplina ${anterior.disciplina.nome} está inativa.`,
            },
            {
              status: 409,
            },
          );
        }

        itensValidados.push({
          disciplinaId:
            item.disciplinaId,
          turmaDisciplinaId:
            item.turmaDisciplinaId,
          tipo:
            "PENDENCIA_ANTERIOR",
          cargaHoraria:
            anterior.disciplina
              .cargaHoraria ?? 0,
          semestreOrigemNumero:
            anterior.cursoSemestre
              .numero,
          obrigatoria: false,
          contaCargaMinima: true,
          contaCargaMaxima: true,
        });

        continue;
      }

      if (
        extra &&
        !emAndamento.has(
          item.disciplinaId,
        )
      ) {
        if (!extra.disciplina.ativo) {
          return NextResponse.json(
            {
              error: `A disciplina ${extra.disciplina.nome} está inativa.`,
            },
            {
              status: 409,
            },
          );
        }

        itensValidados.push({
          disciplinaId:
            item.disciplinaId,
          turmaDisciplinaId:
            item.turmaDisciplinaId,
          tipo: "EXTRACURRICULAR",
          cargaHoraria:
            extra.disciplina
              .cargaHoraria ?? 0,
          semestreOrigemNumero:
            null,
          obrigatoria:
            extra.obrigatoria,
          contaCargaMinima:
            extra.contaCargaMinima,
          contaCargaMaxima:
            extra.contaCargaMaxima,
        });

        continue;
      }

      return NextResponse.json(
        {
          error:
            "Uma das disciplinas não está autorizada para esta rematrícula.",
        },
        {
          status: 409,
        },
      );
    }

    const preRequisitosPendentes: string[] =
      [];

    for (const requisito of preRequisitos) {
      if (
        !aprovadas.has(
          requisito.prerequisitoId,
        )
      ) {
        preRequisitosPendentes.push(
          requisito.prerequisito.nome,
        );
      }
    }

    if (
      preRequisitosPendentes.length > 0
    ) {
      return NextResponse.json(
        {
          error: `Pré-requisito pendente: ${Array.from(
            new Set(
              preRequisitosPendentes,
            ),
          ).join(", ")}.`,
        },
        {
          status: 409,
        },
      );
    }

    const ofertaPorId = new Map<
      number,
      (typeof ofertas)[number]
    >(
      ofertas.map(
        (oferta) =>
          [
            oferta.id,
            oferta,
          ] as const,
      ),
    );

    for (const item of itensValidados) {
      const oferta =
        ofertaPorId.get(
          item.turmaDisciplinaId,
        );

      if (!oferta) {
        return NextResponse.json(
          {
            error:
              "Uma das turmas selecionadas não foi encontrada.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        !turmaIdsParticipantesSet.has(
          oferta.turma.id,
        )
      ) {
        return NextResponse.json(
          {
            error: `A turma ${oferta.turma.nome} não foi disponibilizada para este período de rematrícula.`,
          },
          {
            status: 403,
          },
        );
      }

      if (
        oferta.disciplinaId !==
        item.disciplinaId
      ) {
        return NextResponse.json(
          {
            error:
              "A turma selecionada não pertence à disciplina informada.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        !oferta.turma.ativa ||
        ![
          "AGUARDANDO",
          "A_INICIAR",
          "ATIVA",
        ].includes(
          oferta.turma.statusTurma,
        )
      ) {
        return NextResponse.json(
          {
            error: `A turma ${oferta.turma.nome} não está disponível.`,
          },
          {
            status: 409,
          },
        );
      }

      if (
        oferta.turma.periodoLetivo !==
        periodo.periodoLetivo
      ) {
        return NextResponse.json(
          {
            error: `A turma ${oferta.turma.nome} não pertence ao período letivo da rematrícula.`,
          },
          {
            status: 409,
          },
        );
      }

      if (
        aluno.poloId !== null &&
        oferta.turma.poloId !== null &&
        oferta.turma.poloId !==
        aluno.poloId
      ) {
        return NextResponse.json(
          {
            error: `A turma ${oferta.turma.nome} pertence a outro polo.`,
          },
          {
            status: 403,
          },
        );
      }
    }

    const turmaIdsSelecionados =
      Array.from(
        new Set(
          ofertas.map(
            (oferta) =>
              oferta.turma.id,
          ),
        ),
      );

    const ocupacoesSelecionadas =
      turmaIdsSelecionados.length > 0
        ? await prisma.itemMatricula.findMany(
          {
            where: {
              instituicaoId:
                aluno.instituicaoId,

              turmaId: {
                in:
                  turmaIdsSelecionados,
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
          },
        )
        : [];

    const ocupacaoPorTurmaSelecionada =
      new Map<number, number>();

    for (
      const ocupacao of
      ocupacoesSelecionadas
    ) {
      ocupacaoPorTurmaSelecionada.set(
        ocupacao.turmaId,

        (
          ocupacaoPorTurmaSelecionada.get(
            ocupacao.turmaId,
          ) ?? 0
        ) + 1,
      );
    }

    for (const oferta of ofertas) {
      const capacidade =
        oferta.turma.capacidadeMaxima;

      if (capacidade === null) {
        continue;
      }

      const ocupacao =
        ocupacaoPorTurmaSelecionada.get(
          oferta.turma.id,
        ) ?? 0;

      if (ocupacao >= capacidade) {
        return NextResponse.json(
          {
            error: `A turma ${oferta.turma.nome} não possui mais vagas disponíveis.`,
          },
          {
            status: 409,
          },
        );
      }
    }

    for (
      let indiceA = 0;
      indiceA < ofertas.length;
      indiceA += 1
    ) {
      for (
        let indiceB = indiceA + 1;
        indiceB < ofertas.length;
        indiceB += 1
      ) {
        const ofertaA =
          ofertas[indiceA];

        const ofertaB =
          ofertas[indiceB];

        for (const horarioA of ofertaA.horarios) {
          for (const horarioB of ofertaB.horarios) {
            if (
              horariosSeSobrepoem(
                horarioA,
                horarioB,
              )
            ) {
              return NextResponse.json(
                {
                  error: `Existe conflito de horário entre ${ofertaA.disciplina.nome} e ${ofertaB.disciplina.nome}.`,
                },
                {
                  status: 409,
                },
              );
            }
          }
        }
      }
    }

    const cargaSelecionadaMinima =
      itensValidados.reduce(
        (total, item) =>
          total +
          (item.contaCargaMinima
            ? item.cargaHoraria
            : 0),
        0,
      );

    const cargaSelecionadaMaxima =
      itensValidados.reduce(
        (total, item) =>
          total +
          (item.contaCargaMaxima
            ? item.cargaHoraria
            : 0),
        0,
      );

    const cargaMinima =
      periodo.cargaMinimaOverride ??
      cursoSemestreDestino.cargaMinima ??
      0;

    const cargaMaxima =
      periodo.cargaMaximaOverride ??
      cursoSemestreDestino.cargaMaxima ??
      periodo.curso
        ?.cargaHorariaMaximaSemestre ??
      null;

    if (
      cargaMaxima !== null &&
      cargaSelecionadaMaxima >
      cargaMaxima
    ) {
      return NextResponse.json(
        {
          error: `A carga horária selecionada ultrapassa o máximo de ${cargaMaxima} horas.`,
        },
        {
          status: 409,
        },
      );
    }

    if (
      acao === "ENVIAR" &&
      cargaSelecionadaMinima <
      cargaMinima
    ) {
      return NextResponse.json(
        {
          error: `A carga horária mínima é de ${cargaMinima} horas.`,
        },
        {
          status: 409,
        },
      );
    }

    const declaracaoAceita =
      body?.declaracaoAceita === true;

    if (
      acao === "ENVIAR" &&
      !declaracaoAceita
    ) {
      return NextResponse.json(
        {
          error:
            "Aceite a declaração antes de enviar a rematrícula.",
        },
        {
          status: 409,
        },
      );
    }

    const statusNovo =
      acao === "ENVIAR"
        ? "ENVIADA"
        : "RASCUNHO";

    const rematriculaSalva =
      await prisma.$transaction(
        async (tx) => {
          let rematriculaId:
            number;

          if (rematriculaExistente) {
            await tx.rematriculaSemestralItem.deleteMany(
              {
                where: {
                  rematriculaId:
                    rematriculaExistente.id,
                },
              },
            );

            const atualizada =
              await tx.rematriculaSemestral.update(
                {
                  where: {
                    id:
                      rematriculaExistente.id,
                  },
                  data: {
                    cursoSemestreDestinoId:
                      cursoSemestreDestino.id,
                    matriculaOrigemId:
                      matriculaAtual.id,
                    status: statusNovo,
                    cargaHorariaSelecionada:
                      cargaSelecionadaMaxima,
                    declaracaoAceitaEm:
                      declaracaoAceita
                        ? agora
                        : null,
                    enviadaEm:
                      acao === "ENVIAR"
                        ? agora
                        : null,
                    analisadaEm: null,
                    aprovadaEm: null,
                    devolvidaEm: null,
                    recusadaEm: null,
                    canceladaEm: null,
                    motivoDevolucao: null,
                    motivoRecusa: null,
                    motivoCancelamento:
                      null,
                    observacoes:
                      String(
                        body?.observacoes ??
                        "",
                      ).trim() ||
                      null,
                  },
                  select: {
                    id: true,
                  },
                },
              );

            rematriculaId =
              atualizada.id;
          } else {
            const criada =
              await tx.rematriculaSemestral.create(
                {
                  data: {
                    instituicaoId:
                      aluno.instituicaoId,
                    alunoId: aluno.id,
                    periodoMatriculaId:
                      periodo.id,
                    cursoSemestreDestinoId:
                      cursoSemestreDestino.id,
                    matriculaOrigemId:
                      matriculaAtual.id,
                    status: statusNovo,
                    cargaHorariaSelecionada:
                      cargaSelecionadaMaxima,
                    declaracaoAceitaEm:
                      declaracaoAceita
                        ? agora
                        : null,
                    enviadaEm:
                      acao === "ENVIAR"
                        ? agora
                        : null,
                    observacoes:
                      String(
                        body?.observacoes ??
                        "",
                      ).trim() ||
                      null,
                  },
                  select: {
                    id: true,
                  },
                },
              );

            rematriculaId =
              criada.id;
          }

          if (
            itensValidados.length > 0
          ) {
            await tx.rematriculaSemestralItem.createMany(
              {
                data:
                  itensValidados.map(
                    (item) => ({
                      instituicaoId:
                        aluno.instituicaoId,
                      rematriculaId,
                      disciplinaId:
                        item.disciplinaId,
                      turmaDisciplinaId:
                        item.turmaDisciplinaId,
                      tipo: item.tipo,
                      cargaHorariaSnapshot:
                        item.cargaHoraria,
                      semestreOrigemNumero:
                        item.semestreOrigemNumero,
                      obrigatoria:
                        item.obrigatoria,
                    }),
                  ),
              },
            );
          }

          return tx.rematriculaSemestral.findUnique(
            {
              where: {
                id: rematriculaId,
              },
              select: {
                id: true,
                protocolo: true,
                status: true,
                cargaHorariaSelecionada:
                  true,
                declaracaoAceitaEm:
                  true,
                enviadaEm: true,
                criadaEm: true,
                atualizadaEm: true,
                itens: {
                  select: {
                    id: true,
                    disciplinaId: true,
                    turmaDisciplinaId:
                      true,
                    tipo: true,
                    cargaHorariaSnapshot:
                      true,
                    semestreOrigemNumero:
                      true,
                    obrigatoria: true,
                  },
                },
              },
            },
          );
        },
      );

    if (acao === "ENVIAR") {
      const responsaveis =
        await prisma.user.findMany({
          where: {
            instituicaoId:
              aluno.instituicaoId,
            ativo: true,
            role: {
              in: [
                "ADMIN",
                "SECRETARIA",
                "COORDENADOR",
              ],
            },
          },
          select: {
            id: true,
          },
        });

      if (responsaveis.length > 0) {
        await prisma.notificacao.createMany(
          {
            data: responsaveis.map(
              (responsavel) => ({
                usuarioId:
                  responsavel.id,
                instituicaoId:
                  aluno.instituicaoId,
                tipo:
                  "REMATRICULA_ENVIADA",
                categoria:
                  "ACADEMICO",
                titulo:
                  "Nova rematrícula enviada",
                descricao: `${aluno.nome} enviou uma rematrícula para ${periodo.periodoLetivo}.`,
                link:
                  "/admin/rematriculas-semestrais",
                chaveAgrupada: `rematricula:${rematriculaSalva?.id}:usuario:${responsavel.id}`,
              }),
            ),
            skipDuplicates: true,
          },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        acao === "ENVIAR"
          ? periodo.exigeAprovacao
            ? "Rematrícula enviada para análise da instituição."
            : "Rematrícula enviada com sucesso."
          : "Rascunho salvo com sucesso.",
      rematricula:
        rematriculaSalva,
    });
  } catch (error) {
    console.error(
      "Erro ao salvar rematrícula:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar a rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}