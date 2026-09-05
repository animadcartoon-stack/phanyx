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

import {
  EVENTOS_SAIDA_CAPTACAO,
  enfileirarEventoSaidaCaptacaoSeguro,
} from "@/lib/comercial/captacao/enfileirar-evento-saida";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_ABERTOS = [
  StatusTarefaComercial.PENDENTE,
  StatusTarefaComercial.EM_ANDAMENTO,
] as const;

type PermissoesAgenda = {
  podeVer: boolean;
  podeVerTodas: boolean;
  podeVerTodosLeads: boolean;
  podeEditar: boolean;
  podeAtribuir: boolean;
  podeConcluir: boolean;
  podeCancelar: boolean;
};

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(status: number, mensagem: string, codigo: string) {
    super(mensagem);
    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
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
    podeEditar,
    podeAtribuir,
    podeConcluir,
    podeCancelar,
  ] = await Promise.all([
    usuarioPossuiPermissao(user, "comercial.tarefas.ver"),
    usuarioPossuiPermissao(user, "comercial.tarefas.ver_todas"),
    usuarioPossuiPermissao(user, "comercial.leads.ver_todos"),
    usuarioPossuiPermissao(user, "comercial.tarefas.editar"),
    usuarioPossuiPermissao(user, "comercial.tarefas.atribuir"),
    usuarioPossuiPermissao(user, "comercial.tarefas.concluir"),
    usuarioPossuiPermissao(user, "comercial.tarefas.cancelar"),
  ]);

  return {
    podeVer: podeVer || podeVerTodas,
    podeVerTodas,
    podeVerTodosLeads,
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
  const funcionarioId = numeroPositivo(user.funcionarioId);
  if (funcionarioId) return funcionarioId;

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
      },
      { status: error.status }
    );
  }

  console.error(contexto, error);
  return NextResponse.json(
    {
      success: false,
      error: "Não foi possível atualizar a tarefa comercial.",
      codigo: "ERRO_INTERNO",
    },
    { status: 500 }
  );
}

async function recomputarProximoContato(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  leadId: number,
  usuarioId: number
) {
  const proxima = await tx.tarefaComercial.findFirst({
    where: {
      instituicaoId,
      leadId,
      proximaAcao: true,
      status: { in: [...STATUS_ABERTOS] },
    },
    select: { agendadaPara: true },
    orderBy: [{ agendadaPara: "asc" }, { id: "asc" }],
  });

  await tx.lead.updateMany({
    where: {
      id: leadId,
      instituicaoGestoraId: instituicaoId,
    },
    data: {
      proximoContatoEm: proxima?.agendadaPara ?? null,
      atualizadoPorId: usuarioId,
    },
  });
}

async function buscarTarefa(
  tarefaId: number,
  instituicaoId: number,
  funcionarioId: number | null,
  podeVerTodas: boolean
) {
  const tarefa = await prisma.tarefaComercial.findFirst({
    where: {
      id: tarefaId,
      instituicaoId,
      ...(!podeVerTodas
        ? { responsavelFuncionarioId: funcionarioId ?? -1 }
        : {}),
    },
  });

  if (!tarefa) {
    throw new ErroHttp(
      404,
      "Tarefa não encontrada ou indisponível para este usuário.",
      "TAREFA_NAO_ENCONTRADA"
    );
  }

  return tarefa;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, instituicaoId } = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);
    if (!permissoes.podeVer) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar tarefas comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const tarefaId = numeroPositivo(params.id);
    if (!tarefaId) {
      throw new ErroHttp(400, "ID da tarefa inválido.", "ID_INVALIDO");
    }

    const funcionarioId = await obterFuncionarioDoUsuario(user, instituicaoId);
    const tarefa = await buscarTarefa(
      tarefaId,
      instituicaoId,
      funcionarioId,
      permissoes.podeVerTodas
    );

    const [lead, responsavel] = await Promise.all([
      prisma.lead.findFirst({
        where: {
          id: tarefa.leadId,
          instituicaoGestoraId: instituicaoId,
        },
        select: { id: true, nome: true, email: true, telefone: true },
      }),
      tarefa.responsavelFuncionarioId
        ? prisma.funcionario.findFirst({
            where: {
              id: tarefa.responsavelFuncionarioId,
              instituicaoId,
            },
            select: { id: true, nome: true, cargo: true },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      tarefa: { ...tarefa, lead, responsavel },
      permissoes,
    });
  } catch (error) {
    return responderErro(error, "Erro ao consultar tarefa comercial:");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, instituicaoId } = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);

    if (
      !permissoes.podeEditar &&
      !permissoes.podeAtribuir &&
      !permissoes.podeConcluir &&
      !permissoes.podeCancelar
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para alterar tarefas comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const tarefaId = numeroPositivo(params.id);
    if (!tarefaId) {
      throw new ErroHttp(400, "ID da tarefa inválido.", "ID_INVALIDO");
    }

    const funcionarioId = await obterFuncionarioDoUsuario(user, instituicaoId);
    const tarefaAtual = await buscarTarefa(
      tarefaId,
      instituicaoId,
      funcionarioId,
      permissoes.podeVerTodas
    );

    const body = (await req.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!body) {
      throw new ErroHttp(400, "JSON inválido.", "JSON_INVALIDO");
    }

    const possui = (chave: string) =>
      Object.prototype.hasOwnProperty.call(body, chave);
    const statusNovo = possui("status")
      ? valorEnum(body.status, Object.values(StatusTarefaComercial))
      : tarefaAtual.status;
    if (!statusNovo) {
      throw new ErroHttp(400, "Status inválido.", "STATUS_INVALIDO");
    }

    const responsavelInformado = possui("responsavelFuncionarioId")
      ? numeroPositivo(body.responsavelFuncionarioId)
      : tarefaAtual.responsavelFuncionarioId;
    const alteraResponsavel =
      possui("responsavelFuncionarioId") &&
      responsavelInformado !== tarefaAtual.responsavelFuncionarioId;
    const alteraStatus = statusNovo !== tarefaAtual.status;
    const alteraCampos = [
      "leadId",
      "tipo",
      "prioridade",
      "titulo",
      "descricao",
      "proximaAcao",
      "agendadaPara",
      "prazoEm",
      "lembreteEm",
    ].some(possui);

    if (!alteraCampos && !alteraResponsavel && !alteraStatus) {
      throw new ErroHttp(
        400,
        "Nenhuma alteração foi informada para a tarefa.",
        "SEM_ALTERACOES"
      );
    }

    if (alteraCampos && !permissoes.podeEditar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para editar tarefas comerciais.",
        "SEM_PERMISSAO_EDITAR"
      );
    }
    if (alteraResponsavel && !permissoes.podeAtribuir) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para atribuir tarefas.",
        "SEM_PERMISSAO_ATRIBUIR"
      );
    }
    if (
      alteraStatus &&
      statusNovo === StatusTarefaComercial.CONCLUIDA &&
      !permissoes.podeConcluir
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para concluir tarefas.",
        "SEM_PERMISSAO_CONCLUIR"
      );
    }
    if (
      alteraStatus &&
      statusNovo === StatusTarefaComercial.CANCELADA &&
      !permissoes.podeCancelar
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para cancelar tarefas.",
        "SEM_PERMISSAO_CANCELAR"
      );
    }
    if (
      alteraStatus &&
      statusNovo !== StatusTarefaComercial.CONCLUIDA &&
      statusNovo !== StatusTarefaComercial.CANCELADA &&
      !permissoes.podeEditar
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para alterar o andamento da tarefa.",
        "SEM_PERMISSAO_EDITAR"
      );
    }

    const data: Prisma.TarefaComercialUncheckedUpdateInput = {
      atualizadoPorId: user.id,
    };

    let leadIdNovo = tarefaAtual.leadId;
    if (possui("leadId")) {
      const leadId = numeroPositivo(body.leadId);
      if (!leadId) {
        throw new ErroHttp(400, "Lead inválido.", "LEAD_INVALIDO");
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
        select: { id: true },
      });
      if (!lead) {
        throw new ErroHttp(
          404,
          "Lead não encontrado ou arquivado.",
          "LEAD_NAO_ENCONTRADO"
        );
      }
      leadIdNovo = lead.id;
      data.leadId = lead.id;
    }

    if (possui("tipo")) {
      const tipo = valorEnum(body.tipo, Object.values(TipoTarefaComercial));
      if (!tipo) {
        throw new ErroHttp(400, "Tipo inválido.", "TIPO_INVALIDO");
      }
      data.tipo = tipo;
    }
    if (possui("prioridade")) {
      const prioridade = valorEnum(
        body.prioridade,
        Object.values(PrioridadeTarefaComercial)
      );
      if (!prioridade) {
        throw new ErroHttp(
          400,
          "Prioridade inválida.",
          "PRIORIDADE_INVALIDA"
        );
      }
      data.prioridade = prioridade;
    }
    if (possui("titulo")) {
      const titulo = textoOuNull(body.titulo);
      if (!titulo || titulo.length > 180) {
        throw new ErroHttp(
          400,
          "Informe um título com até 180 caracteres.",
          "TITULO_INVALIDO"
        );
      }
      data.titulo = titulo;
    }
    if (possui("descricao")) data.descricao = textoOuNull(body.descricao);
    if (possui("proximaAcao")) {
      data.proximaAcao = booleano(body.proximaAcao);
    }

    const agendadaPara = possui("agendadaPara")
      ? dataOuNull(body.agendadaPara)
      : tarefaAtual.agendadaPara;
    const prazoEm = possui("prazoEm")
      ? dataOuNull(body.prazoEm)
      : tarefaAtual.prazoEm;
    const lembreteEm = possui("lembreteEm")
      ? dataOuNull(body.lembreteEm)
      : tarefaAtual.lembreteEm;

    if (!agendadaPara) {
      throw new ErroHttp(
        400,
        "Informe uma data de agendamento válida.",
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
    if (possui("agendadaPara")) data.agendadaPara = agendadaPara;
    if (possui("prazoEm")) data.prazoEm = prazoEm;
    if (possui("lembreteEm")) data.lembreteEm = lembreteEm;

    if (alteraResponsavel) {
      const responsavelId = responsavelInformado;
      if (!responsavelId) {
        throw new ErroHttp(
          400,
          "Selecione um responsável válido.",
          "RESPONSAVEL_INVALIDO"
        );
      }
      const responsavel = await prisma.funcionario.findFirst({
        where: {
          id: responsavelId,
          instituicaoId,
          ativo: true,
          statusFuncionario: "ATIVO",
        },
        select: { id: true, nome: true },
      });
      if (!responsavel) {
        throw new ErroHttp(
          400,
          "O responsável não está ativo na instituição.",
          "RESPONSAVEL_INVALIDO"
        );
      }
      data.responsavelFuncionarioId = responsavel.id;
      data.responsavelNomeSnapshot = responsavel.nome;
    }

    const agora = new Date();
    if (alteraStatus) {
      data.status = statusNovo;

      if (statusNovo === StatusTarefaComercial.EM_ANDAMENTO) {
        data.iniciadaEm = tarefaAtual.iniciadaEm ?? agora;
        data.concluidaEm = null;
        data.canceladaEm = null;
        data.concluidaPorId = null;
        data.canceladaPorId = null;
      } else if (statusNovo === StatusTarefaComercial.CONCLUIDA) {
        const resultado = textoOuNull(body.resultado);
        if (!resultado) {
          throw new ErroHttp(
            400,
            "Registre o resultado antes de concluir a tarefa.",
            "RESULTADO_OBRIGATORIO"
          );
        }
        data.resultado = resultado;
        data.concluidaEm = agora;
        data.concluidaPorId = user.id;
        data.canceladaEm = null;
        data.canceladaPorId = null;
        data.motivoCancelamento = null;
      } else if (statusNovo === StatusTarefaComercial.CANCELADA) {
        const motivo = textoOuNull(body.motivoCancelamento);
        if (!motivo) {
          throw new ErroHttp(
            400,
            "Informe o motivo do cancelamento.",
            "MOTIVO_CANCELAMENTO_OBRIGATORIO"
          );
        }
        data.motivoCancelamento = motivo;
        data.canceladaEm = agora;
        data.canceladaPorId = user.id;
        data.concluidaEm = null;
        data.concluidaPorId = null;
      } else {
        data.iniciadaEm =
          statusNovo === StatusTarefaComercial.PENDENTE
            ? null
            : tarefaAtual.iniciadaEm;
        data.concluidaEm = null;
        data.canceladaEm = null;
        data.resultado = null;
        data.motivoCancelamento = null;
        data.concluidaPorId = null;
        data.canceladaPorId = null;
      }
    }

    const tarefaAtualizada = await prisma.$transaction(async (tx) => {
      const atualizada = await tx.tarefaComercial.update({
        where: { id: tarefaAtual.id },
        data,
      });

      await recomputarProximoContato(
        tx,
        instituicaoId,
        tarefaAtual.leadId,
        user.id
      );
      if (leadIdNovo !== tarefaAtual.leadId) {
        await recomputarProximoContato(
          tx,
          instituicaoId,
          leadIdNovo,
          user.id
        );
      }

      return atualizada;
    });

    /*
 * Emitimos somente quando houve
 * transição real para CONCLUIDA.
 *
 * A atualização já foi persistida;
 * falha externa não desfaz a tarefa.
 */
if (
  alteraStatus &&
  statusNovo === StatusTarefaComercial.CONCLUIDA
) {
  await enfileirarEventoSaidaCaptacaoSeguro({
    instituicaoId,

    tipoEvento:
      EVENTOS_SAIDA_CAPTACAO.TAREFA_CONCLUIDA,

    chaveEvento:
      `tarefa:${tarefaAtualizada.id}:concluida`,

    payload: {
      tarefa: {
        id:
          tarefaAtualizada.id,

        leadId:
          tarefaAtualizada.leadId,

        tipo:
          tarefaAtualizada.tipo,

        status:
          tarefaAtualizada.status,

        prioridade:
          tarefaAtualizada.prioridade,

        titulo:
          tarefaAtualizada.titulo,

        resultado:
          tarefaAtualizada.resultado,

        concluidaEm:
          tarefaAtualizada.concluidaEm,

        concluidaPorId:
          tarefaAtualizada.concluidaPorId,
      },

      alteracao: {
        statusAnterior:
          tarefaAtual.status,

        statusNovo:
          tarefaAtualizada.status,
      },

      origem: {
        tipo:
          "AGENDA_COMERCIAL",
      },
    },
  });
}

    return NextResponse.json({
      success: true,
      message:
        statusNovo === StatusTarefaComercial.CONCLUIDA
          ? "Tarefa concluída com sucesso."
          : statusNovo === StatusTarefaComercial.CANCELADA
            ? "Tarefa cancelada com auditoria."
            : "Tarefa atualizada com sucesso.",
      tarefa: tarefaAtualizada,
    });
  } catch (error) {
    return responderErro(error, "Erro ao atualizar tarefa comercial:");
  }
}