import {
  PrioridadeTarefaComercial,
  Prisma,
  StatusTarefaComercial,
  TipoTarefaComercial,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_ABERTOS = [
  StatusTarefaComercial.PENDENTE,
  StatusTarefaComercial.EM_ANDAMENTO,
] as const;

const LIMITE_PADRAO = 30;
const LIMITE_MAXIMO = 100;
const MAXIMO_REFERENCIAS = 500;
const FUSO_BRASILIA = "America/Sao_Paulo";

type PermissoesAgenda = {
  podeVer: boolean;
  podeVerTodas: boolean;
  podeVerTodosLeads: boolean;
  podeCriar: boolean;
  podeEditar: boolean;
  podeAtribuir: boolean;
  podeConcluir: boolean;
  podeCancelar: boolean;
};

class ErroHttp extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);
    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function ehMasterReal(user: UsuarioLogado) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
      "academicophanyx@gmail.com"
  );
}

function numeroPositivo(valor: unknown) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function booleano(valor: unknown, padrao = false) {
  if (typeof valor === "boolean") return valor;
  if (valor === "true" || valor === "1" || valor === 1) return true;
  if (valor === "false" || valor === "0" || valor === 0) return false;
  return padrao;
}

function dataOuNull(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return null;
  const data = new Date(String(valor));
  return Number.isNaN(data.getTime()) ? null : data;
}

function valorEnum<T extends string>(
  valor: unknown,
  permitidos: readonly T[]
): T | null {
  const normalizado = String(valor ?? "")
    .trim()
    .toUpperCase() as T;
  return permitidos.includes(normalizado) ? normalizado : null;
}

function hojeEmBrasilia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_BRASILIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function intervaloDoDia(dataIso: string) {
  const inicio = new Date(`${dataIso}T00:00:00-03:00`);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);
  return { inicio, fim };
}

function somarDias(data: Date, quantidade: number) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + quantidade);
  return resultado;
}

function filtroAtrasadas(agora: Date): Prisma.TarefaComercialWhereInput {
  return {
    status: { in: [...STATUS_ABERTOS] },
    OR: [
      { prazoEm: { lt: agora } },
      {
        prazoEm: null,
        agendadaPara: { lt: agora },
      },
    ],
  };
}

async function autenticarUsuario() {
  const user = await getUserFromToken();
  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId = Number(user.instituicaoId);
  if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return { user, instituicaoId };
}

async function obterPermissoes(
  user: UsuarioLogado
): Promise<PermissoesAgenda> {
  if (ehMasterReal(user)) {
    return {
      podeVer: true,
      podeVerTodas: true,
      podeVerTodosLeads: true,
      podeCriar: true,
      podeEditar: true,
      podeAtribuir: true,
      podeConcluir: true,
      podeCancelar: true,
    };
  }

  const [
    podeVer,
    podeVerTodas,
    podeVerTodosLeads,
    podeCriar,
    podeEditar,
    podeAtribuir,
    podeConcluir,
    podeCancelar,
  ] = await Promise.all([
    usuarioPossuiPermissao(user, "comercial.tarefas.ver"),
    usuarioPossuiPermissao(user, "comercial.tarefas.ver_todas"),
    usuarioPossuiPermissao(user, "comercial.leads.ver_todos"),
    usuarioPossuiPermissao(user, "comercial.tarefas.criar"),
    usuarioPossuiPermissao(user, "comercial.tarefas.editar"),
    usuarioPossuiPermissao(user, "comercial.tarefas.atribuir"),
    usuarioPossuiPermissao(user, "comercial.tarefas.concluir"),
    usuarioPossuiPermissao(user, "comercial.tarefas.cancelar"),
  ]);

  return {
    podeVer: podeVer || podeVerTodas,
    podeVerTodas,
    podeVerTodosLeads,
    podeCriar,
    podeEditar,
    podeAtribuir,
    podeConcluir,
    podeCancelar,
  };
}

async function obterFuncionarioDoUsuario(
  user: UsuarioLogado,
  instituicaoId: number
) {
  const informadoNoToken = numeroPositivo(user.funcionarioId);
  if (informadoNoToken) return informadoNoToken;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      userId: user.id,
      instituicaoId,
      ativo: true,
      statusFuncionario: "ATIVO",
    },
    select: { id: true },
  });

  return funcionario?.id ?? null;
}

function responderErro(error: unknown, contexto: string) {
  if (error instanceof ErroHttp) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        codigo: error.codigo,
        detalhes: error.detalhes,
      },
      { status: error.status }
    );
  }

  console.error(contexto, error);
  return NextResponse.json(
    {
      success: false,
      error: "Não foi possível processar a Agenda Comercial.",
      codigo: "ERRO_INTERNO",
    },
    { status: 500 }
  );
}

function serializarTarefa(
  tarefa: {
    id: number;
    instituicaoId: number;
    leadId: number;
    responsavelFuncionarioId: number | null;
    criadoPorId: number | null;
    atualizadoPorId: number | null;
    concluidaPorId: number | null;
    canceladaPorId: number | null;
    tipo: TipoTarefaComercial;
    status: StatusTarefaComercial;
    prioridade: PrioridadeTarefaComercial;
    titulo: string;
    descricao: string | null;
    resultado: string | null;
    motivoCancelamento: string | null;
    proximaAcao: boolean;
    agendadaPara: Date;
    prazoEm: Date | null;
    lembreteEm: Date | null;
    iniciadaEm: Date | null;
    concluidaEm: Date | null;
    canceladaEm: Date | null;
    responsavelNomeSnapshot: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
  },
  lead: { id: number; nome: string; email: string; telefone: string | null } | null,
  responsavel: { id: number; nome: string; cargo: string | null } | null,
  agora: Date
) {
  const vencimento = tarefa.prazoEm ?? tarefa.agendadaPara;
  const atrasada =
    STATUS_ABERTOS.includes(
      tarefa.status as (typeof STATUS_ABERTOS)[number]
    ) && vencimento.getTime() < agora.getTime();

  return {
    ...tarefa,
    atrasada,
    lead,
    responsavel:
      responsavel ??
      (tarefa.responsavelFuncionarioId
        ? {
            id: tarefa.responsavelFuncionarioId,
            nome: tarefa.responsavelNomeSnapshot ?? "Responsável indisponível",
            cargo: null,
          }
        : null),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { user, instituicaoId } = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);

    if (!permissoes.podeVer) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar a Agenda Comercial.",
        "SEM_PERMISSAO"
      );
    }

    const funcionarioId = await obterFuncionarioDoUsuario(user, instituicaoId);
    if (!permissoes.podeVerTodas && !funcionarioId) {
      throw new ErroHttp(
        403,
        "Seu usuário precisa estar vinculado a um funcionário para consultar as próprias tarefas.",
        "FUNCIONARIO_NAO_VINCULADO"
      );
    }

    const busca = textoOuNull(req.nextUrl.searchParams.get("busca"));
    const periodo = String(
      req.nextUrl.searchParams.get("periodo") ?? "TODAS"
    ).toUpperCase();
    const statusTexto = String(
      req.nextUrl.searchParams.get("status") ?? "TODOS"
    ).toUpperCase();
    const prioridadeTexto = String(
      req.nextUrl.searchParams.get("prioridade") ?? "TODAS"
    ).toUpperCase();
    const tipoTexto = String(
      req.nextUrl.searchParams.get("tipo") ?? "TODOS"
    ).toUpperCase();
    const responsavelFiltro = numeroPositivo(
      req.nextUrl.searchParams.get("responsavelId")
    );
    const leadFiltro = numeroPositivo(req.nextUrl.searchParams.get("leadId"));
    const somenteMinhasSolicitado = booleano(
      req.nextUrl.searchParams.get("somenteMinhas")
    );
    const pagina = Math.max(
      1,
      Math.trunc(Number(req.nextUrl.searchParams.get("pagina")) || 1)
    );
    const limite = Math.min(
      LIMITE_MAXIMO,
      Math.max(
        1,
        Math.trunc(
          Number(req.nextUrl.searchParams.get("limite")) || LIMITE_PADRAO
        )
      )
    );

    const somenteMinhas =
      !permissoes.podeVerTodas || somenteMinhasSolicitado;

    if (somenteMinhas && !funcionarioId) {
      throw new ErroHttp(
        403,
        "Não foi possível identificar o funcionário responsável por suas tarefas.",
        "FUNCIONARIO_NAO_VINCULADO"
      );
    }

    const agora = new Date();
    const { inicio: inicioHoje, fim: fimHoje } = intervaloDoDia(
      hojeEmBrasilia()
    );
    const inicioAmanha = fimHoje;
    const fimAmanha = somarDias(inicioAmanha, 1);
    const fimSemana = somarDias(inicioHoje, 7);

    const escopoVisibilidade: Prisma.TarefaComercialWhereInput = {
      instituicaoId,
      ...(somenteMinhas
        ? { responsavelFuncionarioId: funcionarioId! }
        : {}),
    };

    const filtros: Prisma.TarefaComercialWhereInput[] = [
      escopoVisibilidade,
    ];

    const status = valorEnum(statusTexto, Object.values(StatusTarefaComercial));
    if (status) filtros.push({ status });

    const prioridade = valorEnum(
      prioridadeTexto,
      Object.values(PrioridadeTarefaComercial)
    );
    if (prioridade) filtros.push({ prioridade });

    const tipo = valorEnum(tipoTexto, Object.values(TipoTarefaComercial));
    if (tipo) filtros.push({ tipo });

    if (responsavelFiltro && permissoes.podeVerTodas && !somenteMinhas) {
      filtros.push({ responsavelFuncionarioId: responsavelFiltro });
    }
    if (leadFiltro) filtros.push({ leadId: leadFiltro });

    if (periodo === "ATRASADAS") {
      filtros.push(filtroAtrasadas(agora));
    } else if (periodo === "HOJE") {
      filtros.push({
        agendadaPara: { gte: inicioHoje, lt: fimHoje },
      });
    } else if (periodo === "AMANHA") {
      filtros.push({
        agendadaPara: { gte: inicioAmanha, lt: fimAmanha },
      });
    } else if (periodo === "SEMANA") {
      filtros.push({
        agendadaPara: { gte: inicioHoje, lt: fimSemana },
      });
    } else if (periodo === "PROXIMAS") {
      filtros.push({
        status: { in: [...STATUS_ABERTOS] },
        agendadaPara: { gte: fimHoje },
      });
    }

    if (busca) {
      const leadsEncontrados = await prisma.lead.findMany({
        where: {
          instituicaoGestoraId: instituicaoId,
          ...(!permissoes.podeVerTodosLeads
            ? { responsavelFuncionarioId: funcionarioId ?? -1 }
            : {}),
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { email: { contains: busca, mode: "insensitive" } },
            { telefone: { contains: busca, mode: "insensitive" } },
          ],
        },
        select: { id: true },
        take: MAXIMO_REFERENCIAS,
      });

      filtros.push({
        OR: [
          { titulo: { contains: busca, mode: "insensitive" } },
          { descricao: { contains: busca, mode: "insensitive" } },
          {
            responsavelNomeSnapshot: {
              contains: busca,
              mode: "insensitive",
            },
          },
          ...(leadsEncontrados.length
            ? [{ leadId: { in: leadsEncontrados.map((item) => item.id) } }]
            : []),
        ],
      });
    }

    const where: Prisma.TarefaComercialWhereInput = { AND: filtros };
    const whereResumo: Prisma.TarefaComercialWhereInput = escopoVisibilidade;

    const [
      total,
      tarefas,
      totalAtrasadas,
      totalHoje,
      totalProximas,
      totalEmAndamento,
      totalConcluidasHoje,
      responsaveis,
      leadsReferencia,
    ] = await prisma.$transaction([
      prisma.tarefaComercial.count({ where }),
      prisma.tarefaComercial.findMany({
        where,
        orderBy: [{ agendadaPara: "asc" }, { id: "asc" }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.tarefaComercial.count({
        where: { AND: [whereResumo, filtroAtrasadas(agora)] },
      }),
      prisma.tarefaComercial.count({
        where: {
          AND: [
            whereResumo,
            { status: { in: [...STATUS_ABERTOS] } },
            { agendadaPara: { gte: inicioHoje, lt: fimHoje } },
          ],
        },
      }),
      prisma.tarefaComercial.count({
        where: {
          AND: [
            whereResumo,
            { status: { in: [...STATUS_ABERTOS] } },
            { agendadaPara: { gte: fimHoje } },
          ],
        },
      }),
      prisma.tarefaComercial.count({
        where: {
          AND: [whereResumo, { status: StatusTarefaComercial.EM_ANDAMENTO }],
        },
      }),
      prisma.tarefaComercial.count({
        where: {
          AND: [
            whereResumo,
            { status: StatusTarefaComercial.CONCLUIDA },
            { concluidaEm: { gte: inicioHoje, lt: fimHoje } },
          ],
        },
      }),
      prisma.funcionario.findMany({
        where: {
          instituicaoId,
          ativo: true,
          statusFuncionario: "ATIVO",
        },
        select: { id: true, nome: true, cargo: true },
        orderBy: { nome: "asc" },
      }),
      prisma.lead.findMany({
        where: {
          instituicaoGestoraId: instituicaoId,
          arquivadoEm: null,
          ...(!permissoes.podeVerTodosLeads
            ? { responsavelFuncionarioId: funcionarioId ?? -1 }
            : {}),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          responsavelFuncionarioId: true,
        },
        orderBy: [{ updatedAt: "desc" }, { nome: "asc" }],
        take: MAXIMO_REFERENCIAS,
      }),
    ]);

    const leadIds = [...new Set(tarefas.map((item) => item.leadId))];
    const responsavelIds = [
      ...new Set(
        tarefas
          .map((item) => item.responsavelFuncionarioId)
          .filter((id): id is number => Boolean(id))
      ),
    ];

    const [leadsDasTarefas, responsaveisDasTarefas] = await Promise.all([
      leadIds.length
        ? prisma.lead.findMany({
            where: {
              id: { in: leadIds },
              instituicaoGestoraId: instituicaoId,
            },
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              responsavelFuncionarioId: true,
            },
          })
        : Promise.resolve([]),
      responsavelIds.length
        ? prisma.funcionario.findMany({
            where: {
              id: { in: responsavelIds },
              instituicaoId,
            },
            select: { id: true, nome: true, cargo: true },
          })
        : Promise.resolve([]),
    ]);

    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const referenciasLeads = new Map(
      leadsReferencia.map((item) => [item.id, item] as const)
    );

    for (const lead of leadsDasTarefas) {
      if (!referenciasLeads.has(lead.id)) {
        referenciasLeads.set(lead.id, lead);
      }
    }

    return NextResponse.json(
      {
        success: true,
        permissoes: {
          ...permissoes,
          somenteMinhas,
          funcionarioId,
        },
        resumo: {
          total,
          atrasadas: totalAtrasadas,
          hoje: totalHoje,
          proximas: totalProximas,
          emAndamento: totalEmAndamento,
          concluidasHoje: totalConcluidasHoje,
        },
        tarefas: tarefas.map((tarefa) =>
          serializarTarefa(
            tarefa,
            leadsDasTarefas.find(
  (lead) => lead.id === tarefa.leadId
) ?? null,
            tarefa.responsavelFuncionarioId
  ? responsaveisDasTarefas.find(
      (responsavel) =>
        responsavel.id ===
        tarefa.responsavelFuncionarioId
    ) ?? null
  : null,
            agora
          )
        ),
        referencias: {
          responsaveis,
          leads: [...referenciasLeads.values()],
        },
        paginacao: {
          pagina: Math.min(pagina, totalPaginas),
          limite,
          totalItens: total,
          totalPaginas,
          temAnterior: pagina > 1,
          temProxima: pagina < totalPaginas,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(error, "Erro ao consultar a Agenda Comercial:");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, instituicaoId } = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);
    if (!permissoes.podeCriar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para criar tarefas comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const funcionarioId = await obterFuncionarioDoUsuario(user, instituicaoId);
    const body = (await req.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!body) {
      throw new ErroHttp(400, "JSON inválido.", "JSON_INVALIDO");
    }

    const leadId = numeroPositivo(body.leadId);
    const tipo = valorEnum(body.tipo, Object.values(TipoTarefaComercial));
    const prioridade =
      valorEnum(body.prioridade, Object.values(PrioridadeTarefaComercial)) ??
      PrioridadeTarefaComercial.MEDIA;
    const titulo = textoOuNull(body.titulo);
    const descricao = textoOuNull(body.descricao);
    const agendadaPara = dataOuNull(body.agendadaPara);
    const prazoEm = dataOuNull(body.prazoEm);
    const lembreteEm = dataOuNull(body.lembreteEm);
    const proximaAcao = booleano(body.proximaAcao, true);

    if (!leadId) {
      throw new ErroHttp(400, "Selecione o lead.", "LEAD_OBRIGATORIO");
    }
    if (!tipo) {
      throw new ErroHttp(400, "Selecione o tipo da tarefa.", "TIPO_INVALIDO");
    }
    if (!titulo || titulo.length > 180) {
      throw new ErroHttp(
        400,
        "Informe um título com até 180 caracteres.",
        "TITULO_INVALIDO"
      );
    }
    if (!agendadaPara) {
      throw new ErroHttp(
        400,
        "Informe uma data e um horário válidos.",
        "AGENDAMENTO_INVALIDO"
      );
    }
    if (prazoEm && prazoEm.getTime() < agendadaPara.getTime()) {
      throw new ErroHttp(
        400,
        "O prazo final não pode ser anterior ao agendamento.",
        "PRAZO_INVALIDO"
      );
    }
    if (lembreteEm && lembreteEm.getTime() > agendadaPara.getTime()) {
      throw new ErroHttp(
        400,
        "O lembrete deve ocorrer antes ou no horário agendado.",
        "LEMBRETE_INVALIDO"
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        instituicaoGestoraId: instituicaoId,
        arquivadoEm: null,
        ...(!permissoes.podeVerTodosLeads
          ? { responsavelFuncionarioId: funcionarioId ?? -1 }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        responsavelFuncionarioId: true,
        proximoContatoEm: true,
      },
    });
    if (!lead) {
      throw new ErroHttp(
        404,
        "Lead não encontrado ou arquivado.",
        "LEAD_NAO_ENCONTRADO"
      );
    }

    const responsavelSolicitado = numeroPositivo(body.responsavelFuncionarioId);
    const responsavelId =
      responsavelSolicitado ?? lead.responsavelFuncionarioId ?? funcionarioId;
    if (!responsavelId) {
      throw new ErroHttp(
        400,
        "Defina um responsável pela tarefa.",
        "RESPONSAVEL_OBRIGATORIO"
      );
    }
    if (!permissoes.podeAtribuir && responsavelId !== funcionarioId) {
      throw new ErroHttp(
        403,
        "Você só pode criar tarefas para si mesmo.",
        "SEM_PERMISSAO_ATRIBUIR"
      );
    }

    const responsavel = await prisma.funcionario.findFirst({
      where: {
        id: responsavelId,
        instituicaoId,
        ativo: true,
        statusFuncionario: "ATIVO",
      },
      select: { id: true, nome: true, cargo: true },
    });
    if (!responsavel) {
      throw new ErroHttp(
        400,
        "O responsável não está ativo na instituição.",
        "RESPONSAVEL_INVALIDO"
      );
    }

    const tarefa = await prisma.$transaction(async (tx) => {
      const criada = await tx.tarefaComercial.create({
        data: {
          instituicaoId,
          leadId: lead.id,
          responsavelFuncionarioId: responsavel.id,
          criadoPorId: user.id,
          atualizadoPorId: user.id,
          tipo,
          status: StatusTarefaComercial.PENDENTE,
          prioridade,
          titulo,
          descricao,
          proximaAcao,
          agendadaPara,
          prazoEm,
          lembreteEm,
          responsavelNomeSnapshot: responsavel.nome,
        },
      });

      if (
        proximaAcao &&
        (!lead.proximoContatoEm ||
          agendadaPara.getTime() < lead.proximoContatoEm.getTime())
      ) {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            proximoContatoEm: agendadaPara,
            atualizadoPorId: user.id,
          },
        });
      }

      return criada;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tarefa criada na Agenda Comercial.",
        tarefa: serializarTarefa(
          tarefa,
          {
            id: lead.id,
            nome: lead.nome,
            email: lead.email,
            telefone: lead.telefone,
          },
          responsavel,
          new Date()
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    return responderErro(error, "Erro ao criar tarefa comercial:");
  }
}