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

const PAGINA_PADRAO = 1;
const LIMITE_PADRAO = 30;
const LIMITE_MAXIMO = 100;

type TipoEventoTimeline =
  | "CRIACAO"
  | "INTERACAO"
  | "MOVIMENTACAO_FUNIL"
  | "TRANSFERENCIA"
  | "TAREFA"
  | "PERDA"
  | "ARQUIVAMENTO"
  | "RESTAURACAO"
  | "CONVERSAO";

type UsuarioEvento = {
  id: number | null;
  nome: string | null;
};

type EventoTimeline = {
  id: string;
  tipo: TipoEventoTimeline;
  subtipo: string;
  titulo: string;
  descricao: string | null;
  ocorridoEm: Date;
  usuario: UsuarioEvento | null;
  metadados: Record<string, unknown>;
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
    user.email.trim().toLowerCase() === "academicophanyx@gmail.com"
  );
}

function parseId(valor: string) {
  const id = Number(valor);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function lerInteiroConsulta(
  valor: string | null,
  padrao: number,
  maximo?: number
) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return padrao;
  }

  return maximo ? Math.min(numero, maximo) : numero;
}

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();

  return texto || null;
}

function juntarTextos(...valores: Array<unknown>) {
  const textos = valores
    .map(textoOuNull)
    .filter((valor): valor is string => Boolean(valor));

  return textos.length > 0 ? textos.join(" · ") : null;
}

function tituloInteracao(tipo: string) {
  const titulos: Record<string, string> = {
    WHATSAPP: "Conversa pelo WhatsApp registrada",
    LIGACAO: "Ligação registrada",
    EMAIL: "E-mail registrado",
    REUNIAO: "Reunião registrada",
    OBSERVACAO: "Observação comercial registrada",
  };

  return titulos[tipo] ?? "Interação comercial registrada";
}

function usuarioEvento(
  id: number | null,
  snapshot: string | null,
  usuarios: Map<number, string>
): UsuarioEvento | null {
  const nome = textoOuNull(snapshot) ?? (id ? usuarios.get(id) ?? null : null);

  if (!id && !nome) {
    return null;
  }

  return {
    id,
    nome,
  };
}

function responderErro(error: unknown, contexto: string) {
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

  console.error(contexto, error);

  return NextResponse.json(
    {
      success: false,
      error: "Não foi possível consultar a linha do tempo do lead.",
      codigo: "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
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

  if (ehMasterReal(user)) {
    return user;
  }

  const instituicaoId = Number(user.instituicaoId);

  if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return user;
}

async function obterPermissoes(user: UsuarioLogado) {
  if (ehMasterReal(user)) {
    return {
      podeVer: true,
      podeVerHistorico: true,
      podeVerTodos: true,
    };
  }

  const [podeVer, podeVerHistorico, podeVerTodos] = await Promise.all([
    usuarioPossuiPermissao(user, "comercial.leads.ver"),
    usuarioPossuiPermissao(user, "comercial.leads.historico.ver"),
    usuarioPossuiPermissao(user, "comercial.leads.ver_todos"),
  ]);

  return {
    podeVer,
    podeVerHistorico,
    podeVerTodos,
  };
}

function obterEscopoLead(user: UsuarioLogado, podeVerTodos: boolean) {
  if (ehMasterReal(user)) {
    return {
      instituicaoGestoraId: null,
      tipo: "PHANYX",
    };
  }

  const escopoInstitucional = {
    instituicaoGestoraId: Number(user.instituicaoId),
    tipo: "INSTITUICAO",
  };

  if (podeVerTodos) {
    return escopoInstitucional;
  }

  const funcionarioId = Number(user.funcionarioId);

  if (!Number.isInteger(funcionarioId) || funcionarioId <= 0) {
    throw new ErroHttp(
      403,
      "O usuário precisa estar vinculado a um funcionário para consultar seus próprios leads.",
      "FUNCIONARIO_NAO_VINCULADO"
    );
  }

  return {
    ...escopoInstitucional,
    responsavelFuncionarioId: funcionarioId,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);

    if (!permissoes.podeVer || !permissoes.podeVerHistorico) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar o histórico dos leads.",
        "SEM_PERMISSAO"
      );
    }

    const leadId = parseId(params.id);

    if (!leadId) {
      throw new ErroHttp(400, "ID do lead inválido.", "LEAD_INVALIDO");
    }

    const paginaSolicitada = lerInteiroConsulta(
      req.nextUrl.searchParams.get("pagina"),
      PAGINA_PADRAO
    );

    const limite = lerInteiroConsulta(
      req.nextUrl.searchParams.get("limite"),
      LIMITE_PADRAO,
      LIMITE_MAXIMO
    );

    const escopo = obterEscopoLead(user, permissoes.podeVerTodos);

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...escopo,
      },
      select: {
        id: true,
        instituicaoGestoraId: true,
        instituicaoInteressadaId: true,
        responsavelFuncionarioId: true,
        equipeResponsavelId: true,
        funilId: true,
        etapaFunilId: true,
        motivoPerdaId: true,
        cursoInteresseId: true,
        poloInteresseId: true,
        criadoPorId: true,
        atualizadoPorId: true,
        perdidoPorId: true,
        arquivadoPorId: true,
        restauradoPorId: true,
        nome: true,
        email: true,
        telefone: true,
        instituicaoNome: true,
        cargo: true,
        origem: true,
        tipo: true,
        interesse: true,
        observacoes: true,
        status: true,
        prioridade: true,
        valorEstimado: true,
        responsavelNomeSnapshot: true,
        proximoContatoEm: true,
        primeiroContatoEm: true,
        ultimoContatoEm: true,
        qualificadoEm: true,
        entrouEtapaEm: true,
        perdidoEm: true,
        encerradoEm: true,
        motivoPerdaObservacao: true,
        arquivadoEm: true,
        restauradoEm: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      throw new ErroHttp(
        404,
        "Lead não encontrado ou indisponível para este usuário.",
        "LEAD_NAO_ENCONTRADO"
      );
    }

    // As tabelas comerciais novas pertencem obrigatoriamente a uma
    // instituição. O valor -1 mantém a consulta vazia para leads PHANYX.
    const instituicaoComercialId = lead.instituicaoGestoraId ?? -1;

    const [
      responsavel,
      equipe,
      funil,
      etapa,
      motivoPerda,
      curso,
      polo,
      matricula,
      interacoes,
      movimentacoes,
      transferencias,
      tarefas,
    ] = await Promise.all([
      lead.responsavelFuncionarioId
        ? prisma.funcionario.findFirst({
            where: {
              id: lead.responsavelFuncionarioId,
              ...(lead.instituicaoGestoraId
                ? { instituicaoId: lead.instituicaoGestoraId }
                : {}),
            },
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          })
        : Promise.resolve(null),

      lead.equipeResponsavelId
        ? prisma.equipeComercial.findFirst({
            where: {
              id: lead.equipeResponsavelId,
              instituicaoId: instituicaoComercialId,
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : Promise.resolve(null),

      lead.funilId
        ? prisma.funilComercial.findFirst({
            where: {
              id: lead.funilId,
              instituicaoId: instituicaoComercialId,
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : Promise.resolve(null),

      lead.etapaFunilId
        ? prisma.etapaFunilComercial.findFirst({
            where: {
              id: lead.etapaFunilId,
              instituicaoId: instituicaoComercialId,
            },
            select: {
              id: true,
              nome: true,
              categoria: true,
              resultado: true,
              ordem: true,
              cor: true,
            },
          })
        : Promise.resolve(null),

      lead.motivoPerdaId
        ? prisma.motivoPerdaComercial.findFirst({
            where: {
              id: lead.motivoPerdaId,
              instituicaoId: instituicaoComercialId,
            },
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          })
        : Promise.resolve(null),

      lead.cursoInteresseId
        ? prisma.curso.findFirst({
            where: {
              id: lead.cursoInteresseId,
              ...(lead.instituicaoGestoraId
                ? { instituicaoId: lead.instituicaoGestoraId }
                : {}),
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : Promise.resolve(null),

      lead.poloInteresseId
        ? prisma.polo.findFirst({
            where: {
              id: lead.poloInteresseId,
              ...(lead.instituicaoGestoraId
                ? { instituicaoId: lead.instituicaoGestoraId }
                : {}),
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : Promise.resolve(null),

      prisma.matricula.findFirst({
        where: {
          leadOrigemId: lead.id,
          ...(lead.instituicaoGestoraId
            ? { instituicaoId: lead.instituicaoGestoraId }
            : {}),
        },
        select: {
          id: true,
          numeroMatricula: true,
          status: true,
          alunoId: true,
          cursoId: true,
          poloId: true,
          vendedorResponsavelId: true,
          vendedorResponsavelNomeSnapshot: true,
          origemComercial: true,
          campanhaComercial: true,
          confirmadaEm: true,
          createdAt: true,
        },
      }),

      prisma.leadInteracao.findMany({
        where: {
          leadId: lead.id,
          instituicaoGestoraId: lead.instituicaoGestoraId,
        },
        select: {
          id: true,
          criadoPorId: true,
          tipo: true,
          descricao: true,
          usuarioNomeSnapshot: true,
          createdAt: true,
        },
      }),

      prisma.leadMovimentacaoFunil.findMany({
        where: {
          leadId: lead.id,
          instituicaoId: instituicaoComercialId,
        },
        select: {
          id: true,
          funilId: true,
          etapaAnteriorId: true,
          etapaNovaId: true,
          movimentadoPorId: true,
          origem: true,
          motivo: true,
          tempoEtapaAnteriorMinutos: true,
          dados: true,
          funilNomeSnapshot: true,
          etapaAnteriorNomeSnapshot: true,
          etapaNovaNomeSnapshot: true,
          movimentadoPorNomeSnapshot: true,
          criadoEm: true,
        },
      }),

      prisma.leadTransferencia.findMany({
        where: {
          leadId: lead.id,
          instituicaoId: instituicaoComercialId,
        },
        select: {
          id: true,
          responsavelAnteriorId: true,
          responsavelNovoId: true,
          equipeAnteriorId: true,
          equipeNovaId: true,
          realizadoPorId: true,
          origem: true,
          motivo: true,
          responsavelAnteriorNomeSnapshot: true,
          responsavelNovoNomeSnapshot: true,
          equipeAnteriorNomeSnapshot: true,
          equipeNovaNomeSnapshot: true,
          realizadoPorNomeSnapshot: true,
          criadoEm: true,
        },
      }),

      prisma.tarefaComercial.findMany({
        where: {
          leadId: lead.id,
          instituicaoId: instituicaoComercialId,
        },
        select: {
          id: true,
          responsavelFuncionarioId: true,
          criadoPorId: true,
          atualizadoPorId: true,
          concluidaPorId: true,
          canceladaPorId: true,
          tipo: true,
          status: true,
          prioridade: true,
          titulo: true,
          descricao: true,
          resultado: true,
          motivoCancelamento: true,
          proximaAcao: true,
          agendadaPara: true,
          prazoEm: true,
          lembreteEm: true,
          iniciadaEm: true,
          concluidaEm: true,
          canceladaEm: true,
          responsavelNomeSnapshot: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      }),
    ]);

    const idsUsuarios = new Set<number>();

    [
      lead.criadoPorId,
      lead.atualizadoPorId,
      lead.perdidoPorId,
      lead.arquivadoPorId,
      lead.restauradoPorId,
      ...interacoes.map((item) => item.criadoPorId),
      ...movimentacoes.map((item) => item.movimentadoPorId),
      ...transferencias.map((item) => item.realizadoPorId),
      ...tarefas.flatMap((item) => [
        item.criadoPorId,
        item.atualizadoPorId,
        item.concluidaPorId,
        item.canceladaPorId,
      ]),
    ].forEach((id) => {
      if (id) idsUsuarios.add(id);
    });

    const usuarios =
      idsUsuarios.size > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: Array.from(idsUsuarios),
              },
              ...(lead.instituicaoGestoraId
                ? { instituicaoId: lead.instituicaoGestoraId }
                : {}),
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : [];

    const nomesUsuarios = new Map<number, string>(
      usuarios.map((usuario) => [usuario.id, usuario.nome] as const)
    );

    const eventos: EventoTimeline[] = [];

    eventos.push({
      id: `criacao-${lead.id}`,
      tipo: "CRIACAO",
      subtipo: "LEAD_CRIADO",
      titulo: "Lead criado",
      descricao: juntarTextos(lead.origem, lead.interesse),
      ocorridoEm: lead.createdAt,
      usuario: usuarioEvento(lead.criadoPorId, null, nomesUsuarios),
      metadados: {
        origem: lead.origem,
        responsavelFuncionarioId: lead.responsavelFuncionarioId,
        responsavelNome:
          responsavel?.nome ?? lead.responsavelNomeSnapshot ?? null,
        equipeResponsavelId: lead.equipeResponsavelId,
        equipeNome: equipe?.nome ?? null,
      },
    });

    interacoes.forEach((interacao) => {
      eventos.push({
        id: `interacao-${interacao.id}`,
        tipo: "INTERACAO",
        subtipo: interacao.tipo,
        titulo: tituloInteracao(interacao.tipo),
        descricao: interacao.descricao,
        ocorridoEm: interacao.createdAt,
        usuario: usuarioEvento(
          interacao.criadoPorId,
          interacao.usuarioNomeSnapshot,
          nomesUsuarios
        ),
        metadados: {
          interacaoId: interacao.id,
          tipoInteracao: interacao.tipo,
        },
      });
    });

    movimentacoes.forEach((movimentacao) => {
      const etapaAnterior =
        movimentacao.etapaAnteriorNomeSnapshot ?? "Sem etapa";
      const etapaNova =
        movimentacao.etapaNovaNomeSnapshot ?? "Etapa não informada";

      eventos.push({
        id: `movimentacao-${movimentacao.id}`,
        tipo: "MOVIMENTACAO_FUNIL",
        subtipo: String(movimentacao.origem),
        titulo: `Movido para ${etapaNova}`,
        descricao:
          textoOuNull(movimentacao.motivo) ??
          `${etapaAnterior} → ${etapaNova}`,
        ocorridoEm: movimentacao.criadoEm,
        usuario: usuarioEvento(
          movimentacao.movimentadoPorId,
          movimentacao.movimentadoPorNomeSnapshot,
          nomesUsuarios
        ),
        metadados: {
          movimentacaoId: movimentacao.id,
          origem: movimentacao.origem,
          funilId: movimentacao.funilId,
          funilNome: movimentacao.funilNomeSnapshot,
          etapaAnteriorId: movimentacao.etapaAnteriorId,
          etapaAnteriorNome: movimentacao.etapaAnteriorNomeSnapshot,
          etapaNovaId: movimentacao.etapaNovaId,
          etapaNovaNome: movimentacao.etapaNovaNomeSnapshot,
          tempoEtapaAnteriorMinutos:
            movimentacao.tempoEtapaAnteriorMinutos,
          dados: movimentacao.dados,
        },
      });
    });

    transferencias.forEach((transferencia) => {
      const alterouResponsavel =
        transferencia.responsavelAnteriorId !==
        transferencia.responsavelNovoId;

      const alterouEquipe =
        transferencia.equipeAnteriorId !== transferencia.equipeNovaId;

      const titulo = alterouResponsavel
        ? "Responsável comercial alterado"
        : alterouEquipe
          ? "Equipe comercial alterada"
          : "Transferência comercial registrada";

      eventos.push({
        id: `transferencia-${transferencia.id}`,
        tipo: "TRANSFERENCIA",
        subtipo: String(transferencia.origem),
        titulo,
        descricao:
          textoOuNull(transferencia.motivo) ??
          juntarTextos(
            alterouResponsavel
              ? `${transferencia.responsavelAnteriorNomeSnapshot ?? "Sem responsável"} → ${transferencia.responsavelNovoNomeSnapshot ?? "Sem responsável"}`
              : null,
            alterouEquipe
              ? `${transferencia.equipeAnteriorNomeSnapshot ?? "Sem equipe"} → ${transferencia.equipeNovaNomeSnapshot ?? "Sem equipe"}`
              : null
          ),
        ocorridoEm: transferencia.criadoEm,
        usuario: usuarioEvento(
          transferencia.realizadoPorId,
          transferencia.realizadoPorNomeSnapshot,
          nomesUsuarios
        ),
        metadados: {
          transferenciaId: transferencia.id,
          origem: transferencia.origem,
          responsavelAnteriorId: transferencia.responsavelAnteriorId,
          responsavelAnteriorNome:
            transferencia.responsavelAnteriorNomeSnapshot,
          responsavelNovoId: transferencia.responsavelNovoId,
          responsavelNovoNome: transferencia.responsavelNovoNomeSnapshot,
          equipeAnteriorId: transferencia.equipeAnteriorId,
          equipeAnteriorNome: transferencia.equipeAnteriorNomeSnapshot,
          equipeNovaId: transferencia.equipeNovaId,
          equipeNovaNome: transferencia.equipeNovaNomeSnapshot,
        },
      });
    });

    tarefas.forEach((tarefa) => {
      const metadadosBase = {
        tarefaId: tarefa.id,
        tipoTarefa: tarefa.tipo,
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        proximaAcao: tarefa.proximaAcao,
        responsavelFuncionarioId: tarefa.responsavelFuncionarioId,
        responsavelNome: tarefa.responsavelNomeSnapshot,
        agendadaPara: tarefa.agendadaPara,
        prazoEm: tarefa.prazoEm,
        lembreteEm: tarefa.lembreteEm,
      };

      eventos.push({
        id: `tarefa-criada-${tarefa.id}`,
        tipo: "TAREFA",
        subtipo: "CRIADA",
        titulo: `Tarefa criada: ${tarefa.titulo}`,
        descricao: tarefa.descricao,
        ocorridoEm: tarefa.criadoEm,
        usuario: usuarioEvento(tarefa.criadoPorId, null, nomesUsuarios),
        metadados: metadadosBase,
      });

      if (tarefa.iniciadaEm) {
        eventos.push({
          id: `tarefa-iniciada-${tarefa.id}`,
          tipo: "TAREFA",
          subtipo: "INICIADA",
          titulo: `Tarefa iniciada: ${tarefa.titulo}`,
          descricao: tarefa.descricao,
          ocorridoEm: tarefa.iniciadaEm,
          usuario: usuarioEvento(
            tarefa.atualizadoPorId,
            null,
            nomesUsuarios
          ),
          metadados: metadadosBase,
        });
      }

      if (tarefa.concluidaEm) {
        eventos.push({
          id: `tarefa-concluida-${tarefa.id}`,
          tipo: "TAREFA",
          subtipo: "CONCLUIDA",
          titulo: `Tarefa concluída: ${tarefa.titulo}`,
          descricao: tarefa.resultado ?? tarefa.descricao,
          ocorridoEm: tarefa.concluidaEm,
          usuario: usuarioEvento(
            tarefa.concluidaPorId,
            null,
            nomesUsuarios
          ),
          metadados: metadadosBase,
        });
      }

      if (tarefa.canceladaEm) {
        eventos.push({
          id: `tarefa-cancelada-${tarefa.id}`,
          tipo: "TAREFA",
          subtipo: "CANCELADA",
          titulo: `Tarefa cancelada: ${tarefa.titulo}`,
          descricao: tarefa.motivoCancelamento ?? tarefa.descricao,
          ocorridoEm: tarefa.canceladaEm,
          usuario: usuarioEvento(
            tarefa.canceladaPorId,
            null,
            nomesUsuarios
          ),
          metadados: metadadosBase,
        });
      }
    });

    if (lead.perdidoEm) {
      const perdaJaRegistrada = movimentacoes.some(
        (movimentacao) =>
          Math.abs(
            movimentacao.criadoEm.getTime() - lead.perdidoEm!.getTime()
          ) <= 5000
      );

      if (!perdaJaRegistrada) {
        eventos.push({
          id: `perda-${lead.id}-${lead.perdidoEm.getTime()}`,
          tipo: "PERDA",
          subtipo: "PERDA_REGISTRADA",
          titulo: "Oportunidade encerrada como perdida",
          descricao: juntarTextos(
            motivoPerda?.nome,
            lead.motivoPerdaObservacao
          ),
          ocorridoEm: lead.perdidoEm,
          usuario: usuarioEvento(lead.perdidoPorId, null, nomesUsuarios),
          metadados: {
            motivoPerdaId: lead.motivoPerdaId,
            motivoPerdaNome: motivoPerda?.nome ?? null,
            observacao: lead.motivoPerdaObservacao,
          },
        });
      }
    }

    if (lead.arquivadoEm) {
      eventos.push({
        id: `arquivamento-${lead.id}-${lead.arquivadoEm.getTime()}`,
        tipo: "ARQUIVAMENTO",
        subtipo: "ARQUIVADO",
        titulo: "Lead arquivado",
        descricao: null,
        ocorridoEm: lead.arquivadoEm,
        usuario: usuarioEvento(lead.arquivadoPorId, null, nomesUsuarios),
        metadados: {},
      });
    }

    if (lead.restauradoEm) {
      eventos.push({
        id: `restauracao-${lead.id}-${lead.restauradoEm.getTime()}`,
        tipo: "RESTAURACAO",
        subtipo: "RESTAURADO",
        titulo: "Lead restaurado",
        descricao: null,
        ocorridoEm: lead.restauradoEm,
        usuario: usuarioEvento(lead.restauradoPorId, null, nomesUsuarios),
        metadados: {},
      });
    }

    if (matricula) {
      eventos.push({
        id: `conversao-${matricula.id}`,
        tipo: "CONVERSAO",
        subtipo: "MATRICULA_CRIADA",
        titulo: "Lead convertido em matrícula",
        descricao: matricula.numeroMatricula
          ? `Matrícula ${matricula.numeroMatricula}`
          : `Matrícula #${matricula.id}`,
        ocorridoEm: matricula.confirmadaEm ?? matricula.createdAt,
        usuario: null,
        metadados: {
          matriculaId: matricula.id,
          numeroMatricula: matricula.numeroMatricula,
          status: matricula.status,
          alunoId: matricula.alunoId,
          cursoId: matricula.cursoId,
          poloId: matricula.poloId,
          vendedorResponsavelId: matricula.vendedorResponsavelId,
          vendedorResponsavelNome:
            matricula.vendedorResponsavelNomeSnapshot,
          origemComercial: matricula.origemComercial,
          campanhaComercial: matricula.campanhaComercial,
        },
      });
    }

    eventos.sort((a, b) => {
      const diferencaData = b.ocorridoEm.getTime() - a.ocorridoEm.getTime();

      return diferencaData !== 0
        ? diferencaData
        : b.id.localeCompare(a.id);
    });

    const totalEventos = eventos.length;
    const totalPaginas = Math.max(1, Math.ceil(totalEventos / limite));
    const pagina = Math.min(paginaSolicitada, totalPaginas);
    const inicio = (pagina - 1) * limite;
    const eventosPagina = eventos.slice(inicio, inicio + limite);

    const tarefasPendentes = tarefas.filter((tarefa) =>
      ["PENDENTE", "EM_ANDAMENTO"].includes(String(tarefa.status))
    ).length;

    return NextResponse.json(
      {
        success: true,
        permissoes: {
          podeVerHistorico: permissoes.podeVerHistorico,
          podeVerTodos: permissoes.podeVerTodos,
          somenteMeus: !permissoes.podeVerTodos && !ehMasterReal(user),
        },
        lead: {
          id: lead.id,
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          instituicaoNome: lead.instituicaoNome,
          cargo: lead.cargo,
          origem: lead.origem,
          tipo: lead.tipo,
          interesse: lead.interesse,
          observacoes: lead.observacoes,
          status: lead.status,
          prioridade: lead.prioridade,
          valorEstimado: lead.valorEstimado,
          proximoContatoEm: lead.proximoContatoEm,
          primeiroContatoEm: lead.primeiroContatoEm,
          ultimoContatoEm: lead.ultimoContatoEm,
          qualificadoEm: lead.qualificadoEm,
          entrouEtapaEm: lead.entrouEtapaEm,
          perdidoEm: lead.perdidoEm,
          encerradoEm: lead.encerradoEm,
          arquivadoEm: lead.arquivadoEm,
          restauradoEm: lead.restauradoEm,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          responsavel:
            responsavel ??
            (lead.responsavelFuncionarioId || lead.responsavelNomeSnapshot
              ? {
                  id: lead.responsavelFuncionarioId,
                  nome: lead.responsavelNomeSnapshot,
                  cargo: null,
                }
              : null),
          equipe,
          funil,
          etapa,
          motivoPerda: motivoPerda
            ? {
                ...motivoPerda,
                observacao: lead.motivoPerdaObservacao,
              }
            : null,
          curso,
          polo,
          matricula,
        },
        marcos: {
          criadoEm: lead.createdAt,
          primeiroContatoEm: lead.primeiroContatoEm,
          qualificadoEm: lead.qualificadoEm,
          entrouEtapaEm: lead.entrouEtapaEm,
          perdidoEm: lead.perdidoEm,
          encerradoEm: lead.encerradoEm,
          arquivadoEm: lead.arquivadoEm,
          restauradoEm: lead.restauradoEm,
          convertidoEm: matricula
            ? matricula.confirmadaEm ?? matricula.createdAt
            : null,
        },
        resumo: {
          totalEventos,
          totalInteracoes: interacoes.length,
          totalMovimentacoes: movimentacoes.length,
          totalTransferencias: transferencias.length,
          totalTarefas: tarefas.length,
          tarefasPendentes,
          possuiMatricula: Boolean(matricula),
          ultimaAtividadeEm: eventos[0]?.ocorridoEm ?? lead.createdAt,
        },
        eventos: eventosPagina,
        paginacao: {
          pagina,
          limite,
          totalItens: totalEventos,
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
    return responderErro(
      error,
      "Erro ao consultar a linha do tempo do lead:"
    );
  }
}