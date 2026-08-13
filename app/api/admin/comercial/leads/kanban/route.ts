import {
  Prisma,
  StatusTarefaComercial,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    mensagem: string,
    codigo: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

const SELECT_LEAD = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  origem: true,
  tipo: true,
  interesse: true,
  status: true,
  prioridade: true,
  valorEstimado: true,
  proximoContatoEm: true,
  ultimoContatoEm: true,
  responsavelFuncionarioId: true,
  equipeResponsavelId: true,
  funilId: true,
  etapaFunilId: true,
  cursoInteresseId: true,
  poloInteresseId: true,
  primeiroContatoEm: true,
  qualificadoEm: true,
  entrouEtapaEm: true,
  perdidoEm: true,
  encerradoEm: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LeadSelect;

function inteiroPositivoOuNull(
  valor: string | null
) {
  if (!valor) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

function limitarTexto(
  valor: string | null,
  limite: number
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

export async function GET(
  request: NextRequest
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const [
      podeVer,
      podeVerTodos,
    ] = await Promise.all([
      usuarioPossuiPermissao(
        user,
        "comercial.leads.ver"
      ),
      usuarioPossuiPermissao(
        user,
        "comercial.leads.ver_todos"
      ),
    ]);

    if (!podeVer && !podeVerTodos) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para visualizar os leads comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      throw new ErroHttp(
        403,
        "O Kanban comercial está disponível somente no CRM institucional.",
        "INSTITUICAO_INVALIDA"
      );
    }

    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          instituicaoId,
          userId: user.id,
          ativo: true,
          statusFuncionario: "ATIVO",
        },
        select: {
          id: true,
          nome: true,
        },
      });

    const searchParams =
      request.nextUrl.searchParams;

    const somenteMeus =
      searchParams.get("meus") === "true";

    if (
      (!podeVerTodos || somenteMeus) &&
      !funcionario
    ) {
      throw new ErroHttp(
        403,
        "Seu usuário não possui um funcionário comercial ativo vinculado.",
        "FUNCIONARIO_NAO_VINCULADO"
      );
    }

    const funil =
      await prisma.funilComercial.findFirst({
        where: {
          instituicaoId,
          padrao: true,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
        },
        orderBy: {
          id: "asc",
        },
      });

    if (!funil) {
      throw new ErroHttp(
        409,
        "O funil comercial padrão ainda não foi configurado.",
        "FUNIL_NAO_CONFIGURADO"
      );
    }

    const etapas =
      await prisma.etapaFunilComercial.findMany({
        where: {
          instituicaoId,
          funilId: funil.id,
          ativo: true,
          visivelNoKanban: true,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          resultado: true,
          ordem: true,
          cor: true,
          probabilidadeConversao: true,
          prazoMaximoHoras: true,
          exigeProximaAcao: true,
          exigeMotivoPerda: true,
          permiteMovimentoManual: true,
        },
        orderBy: {
          ordem: "asc",
        },
      });

    if (etapas.length === 0) {
      throw new ErroHttp(
        409,
        "O funil comercial não possui etapas ativas para o Kanban.",
        "ETAPAS_NAO_CONFIGURADAS"
      );
    }

    const q = limitarTexto(
      searchParams.get("q"),
      120
    );

    const prioridade = limitarTexto(
      searchParams.get("prioridade"),
      20
    ).toUpperCase();

    const origem = limitarTexto(
      searchParams.get("origem"),
      80
    ).toUpperCase();

    const etapaId = inteiroPositivoOuNull(
      searchParams.get("etapaId")
    );

    const responsavelId =
      inteiroPositivoOuNull(
        searchParams.get("responsavelId")
      );

    const equipeId = inteiroPositivoOuNull(
      searchParams.get("equipeId")
    );

    const cursoId = inteiroPositivoOuNull(
      searchParams.get("cursoId")
    );

    const poloId = inteiroPositivoOuNull(
      searchParams.get("poloId")
    );

    const limiteSolicitado = Number(
      searchParams.get("limitePorEtapa") ??
      25
    );

    const limitePorEtapa = Math.min(
      50,
      Math.max(
        5,
        Number.isInteger(limiteSolicitado)
          ? limiteSolicitado
          : 25
      )
    );

    if (
      etapaId &&
      !etapas.some(
        (etapa) => etapa.id === etapaId
      )
    ) {
      throw new ErroHttp(
        400,
        "A etapa informada não pertence ao funil comercial ativo.",
        "ETAPA_INVALIDA"
      );
    }

    const idsEtapasConsultadas = etapaId
      ? [etapaId]
      : etapas.map((etapa) => etapa.id);

    const filtros: Prisma.LeadWhereInput = {
      instituicaoGestoraId: instituicaoId,
      tipo: "INSTITUICAO",
      funilId: funil.id,
      etapaFunilId: {
        in: idsEtapasConsultadas,
      },
      arquivadoEm: null,

      ...(!podeVerTodos || somenteMeus
        ? {
          responsavelFuncionarioId:
            funcionario!.id,
        }
        : responsavelId
          ? {
            responsavelFuncionarioId:
              responsavelId,
          }
          : {}),

      ...(equipeId
        ? {
          equipeResponsavelId: equipeId,
        }
        : {}),

      ...(cursoId
        ? {
          cursoInteresseId: cursoId,
        }
        : {}),

      ...(poloId
        ? {
          poloInteresseId: poloId,
        }
        : {}),

      ...(prioridade
        ? {
          prioridade,
        }
        : {}),

      ...(origem
        ? {
          origem,
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
              email: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              telefone: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              interesse: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              observacoes: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              responsavelNomeSnapshot: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        }
        : {}),
    };

    const [
      agrupamentos,
      lotesPorEtapa,
    ] = await Promise.all([
      prisma.lead.groupBy({
        by: ["etapaFunilId"],
        where: filtros,
        _count: {
          _all: true,
        },
        _sum: {
          valorEstimado: true,
        },
      }),

      Promise.all(
        idsEtapasConsultadas.map(
          (idEtapa) =>
            prisma.lead.findMany({
              where: {
                AND: [
                  filtros,
                  {
                    etapaFunilId:
                      idEtapa,
                  },
                ],
              },
              select: SELECT_LEAD,
              orderBy: [
                {
                  proximoContatoEm: "asc",
                },
                {
                  updatedAt: "desc",
                },
                {
                  id: "desc",
                },
              ],
              take: limitePorEtapa + 1,
            })
        )
      ),
    ]);

    const lotesVisiveis =
      lotesPorEtapa.map((lote) =>
        lote.slice(0, limitePorEtapa)
      );

    const leadsVisiveis =
      lotesVisiveis.flat();

    const leadIds =
      leadsVisiveis.map((lead) => lead.id);

    const responsavelIds = Array.from(
      new Set(
        leadsVisiveis
          .map(
            (lead) =>
              lead.responsavelFuncionarioId
          )
          .filter(
            (id): id is number =>
              typeof id === "number"
          )
      )
    );

    const equipeIds = Array.from(
      new Set(
        leadsVisiveis
          .map(
            (lead) =>
              lead.equipeResponsavelId
          )
          .filter(
            (id): id is number =>
              typeof id === "number"
          )
      )
    );

    const cursoIds = Array.from(
      new Set(
        leadsVisiveis
          .map(
            (lead) =>
              lead.cursoInteresseId
          )
          .filter(
            (id): id is number =>
              typeof id === "number"
          )
      )
    );

    const poloIds = Array.from(
      new Set(
        leadsVisiveis
          .map(
            (lead) =>
              lead.poloInteresseId
          )
          .filter(
            (id): id is number =>
              typeof id === "number"
          )
      )
    );

    const [
      responsaveis,
      equipes,
      cursos,
      polos,
      tarefas,
      matriculas,
    ] = await Promise.all([
      prisma.funcionario.findMany({
        where: {
          instituicaoId,
          id: {
            in: responsavelIds,
          },
        },
        select: {
          id: true,
          nome: true,
          cargo: true,
        },
      }),

      prisma.equipeComercial.findMany({
        where: {
          instituicaoId,
          id: {
            in: equipeIds,
          },
        },
        select: {
          id: true,
          nome: true,
        },
      }),

      prisma.curso.findMany({
        where: {
          instituicaoId,
          id: {
            in: cursoIds,
          },
        },
        select: {
          id: true,
          nome: true,
        },
      }),

      prisma.polo.findMany({
        where: {
          instituicaoId,
          id: {
            in: poloIds,
          },
        },
        select: {
          id: true,
          nome: true,
        },
      }),

      prisma.tarefaComercial.findMany({
        where: {
          instituicaoId,
          leadId: {
            in: leadIds,
          },
          status: {
            in: [
              StatusTarefaComercial.PENDENTE,
              StatusTarefaComercial.EM_ANDAMENTO,
            ],
          },
        },
        select: {
          id: true,
          leadId: true,
          tipo: true,
          status: true,
          prioridade: true,
          titulo: true,
          agendadaPara: true,
          prazoEm: true,
          lembreteEm: true,
          responsavelFuncionarioId: true,
          responsavelNomeSnapshot: true,
        },
        orderBy: [
          {
            agendadaPara: "asc",
          },
          {
            id: "asc",
          },
        ],
      }),

      prisma.matricula.findMany({
        where: {
          instituicaoId,
          leadOrigemId: {
            in: leadIds,
          },
        },
        select: {
          id: true,
          leadOrigemId: true,
          numeroMatricula: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const responsavelPorId = new Map(
      responsaveis.map((item) => [
        item.id,
        item,
      ])
    );

    const equipePorId = new Map(
      equipes.map((item) => [
        item.id,
        item,
      ])
    );

    const cursoPorId = new Map(
      cursos.map((item) => [
        item.id,
        item,
      ])
    );

    const poloPorId = new Map(
      polos.map((item) => [
        item.id,
        item,
      ])
    );

    const primeiraTarefaPorLead =
      new Map<
        number,
        (typeof tarefas)[number]
      >();

    for (const tarefa of tarefas) {
      if (
        !primeiraTarefaPorLead.has(
          tarefa.leadId
        )
      ) {
        primeiraTarefaPorLead.set(
          tarefa.leadId,
          tarefa
        );
      }
    }

    const matriculaPorLead =
      new Map<
        number,
        (typeof matriculas)[number]
      >();

    for (const matricula of matriculas) {
      if (
        matricula.leadOrigemId &&
        !matriculaPorLead.has(
          matricula.leadOrigemId
        )
      ) {
        matriculaPorLead.set(
          matricula.leadOrigemId,
          matricula
        );
      }
    }

    const etapaPorId = new Map<
      number,
      (typeof etapas)[number]
    >();

    for (const etapa of etapas) {
      etapaPorId.set(
        etapa.id,
        etapa
      );
    }

    const agora = Date.now();

    function serializarLead(
      lead: (typeof leadsVisiveis)[number]
    ) {
      const etapa =
        lead.etapaFunilId
          ? etapaPorId.get(
            lead.etapaFunilId
          )
          : null;

      const entrouEtapaEm =
        lead.entrouEtapaEm
          ? new Date(
            lead.entrouEtapaEm
          ).getTime()
          : null;

      const prazoEtapa =
        etapa?.prazoMaximoHoras &&
          entrouEtapaEm
          ? entrouEtapaEm +
          etapa.prazoMaximoHoras *
          60 *
          60 *
          1000
          : null;

      const proximaTarefa =
        primeiraTarefaPorLead.get(
          lead.id
        ) ?? null;

      const acompanhamentoAtrasado =
        Boolean(
          lead.proximoContatoEm &&
          new Date(
            lead.proximoContatoEm
          ).getTime() < agora
        );

      const etapaAtrasada =
        Boolean(
          prazoEtapa &&
          prazoEtapa < agora
        );

      return {
        ...lead,

        responsavel:
          lead.responsavelFuncionarioId
            ? responsavelPorId.get(
              lead.responsavelFuncionarioId
            ) ?? null
            : null,

        equipe:
          lead.equipeResponsavelId
            ? equipePorId.get(
              lead.equipeResponsavelId
            ) ?? null
            : null,

        curso:
          lead.cursoInteresseId
            ? cursoPorId.get(
              lead.cursoInteresseId
            ) ?? null
            : null,

        polo:
          lead.poloInteresseId
            ? poloPorId.get(
              lead.poloInteresseId
            ) ?? null
            : null,

        proximaTarefa,
        acompanhamentoAtrasado,
        etapaAtrasada,

        semProximaAcao:
          Boolean(
            etapa?.exigeProximaAcao &&
            !proximaTarefa
          ),

        matriculaConvertida:
          matriculaPorLead.get(
            lead.id
          ) ?? null,
      };
    }

    type ResumoEtapa = {
      total: number;
      valorEstimado: number;
    };

    const resumoPorEtapa =
      new Map<number, ResumoEtapa>();

    for (const item of agrupamentos) {
      if (item.etapaFunilId === null) {
        continue;
      }

      resumoPorEtapa.set(
        item.etapaFunilId,
        {
          total: item._count._all,
          valorEstimado:
            item._sum.valorEstimado ?? 0,
        }
      );
    }

    const etapasResposta =
      idsEtapasConsultadas.map(
        (idEtapa, indice) => {
          const etapa =
            etapaPorId.get(idEtapa)!;

          const loteOriginal =
            lotesPorEtapa[indice];

          const resumo =
            resumoPorEtapa.get(idEtapa) ?? {
              total: 0,
              valorEstimado: 0,
            };

          return {
            ...etapa,
            totalLeads: resumo.total,
            valorEstimado:
              resumo.valorEstimado,
            temMais:
              loteOriginal.length >
              limitePorEtapa,
            leads:
              lotesVisiveis[
                indice
              ].map(serializarLead),
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        permissoes: {
          podeVer,
          podeVerTodos,
          somenteMeus:
            !podeVerTodos ||
            somenteMeus,
        },

        funil,

        resumo: {
          totalLeads:
            agrupamentos.reduce(
              (total, item) =>
                total +
                item._count._all,
              0
            ),

          valorEstimado:
            agrupamentos.reduce(
              (total, item) =>
                total +
                (item._sum
                  .valorEstimado ?? 0),
              0
            ),

          limitePorEtapa,
        },

        etapas: etapasResposta,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          codigo: error.codigo,
        },
        {
          status: error.status,
        }
      );
    }

    console.error(
      "Erro ao carregar o Kanban comercial:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível carregar o Kanban comercial.",
        codigo: "ERRO_INTERNO",
      },
      {
        status: 500,
      }
    );
  }
}