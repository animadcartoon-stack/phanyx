import {
  OrigemMovimentacaoFunilComercial,
  PrioridadeTarefaComercial,
  ResultadoEtapaFunilComercial,
  TipoTarefaComercial,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

import {
  ErroMovimentacaoLead,
  movimentarLeadNoFunil,
  type ProximaAcaoMovimentacao,
} from "@/lib/services/lead-funil.service";

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

const TIPOS_TAREFA =
  new Set<string>(
    Object.values(
      TipoTarefaComercial
    )
  );

const PRIORIDADES_TAREFA =
  new Set<string>(
    Object.values(
      PrioridadeTarefaComercial
    )
  );

function inteiroPositivoOuNull(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

function textoOuNull(
  valor: unknown
) {
  const texto = String(
    valor ?? ""
  ).trim();

  return texto || null;
}

function lerDataOpcional(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return {
      valido: true,
      valor: null as Date | null,
    };
  }

  const data = new Date(
    String(valor)
  );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return {
      valido: false,
      valor: null as Date | null,
    };
  }

  return {
    valido: true,
    valor: data,
  };
}

function montarProximaAcao(
  valor: unknown
): ProximaAcaoMovimentacao | null {
  if (
    !valor ||
    typeof valor !== "object" ||
    Array.isArray(valor)
  ) {
    return null;
  }

  const objeto =
    valor as Record<
      string,
      unknown
    >;

  const tipoTexto = String(
    objeto.tipo ??
      TipoTarefaComercial.RETORNO
  )
    .trim()
    .toUpperCase();

  if (
    !TIPOS_TAREFA.has(
      tipoTexto
    )
  ) {
    throw new ErroHttp(
      400,
      "O tipo da próxima ação é inválido.",
      "TIPO_TAREFA_INVALIDO"
    );
  }

  const prioridadeTexto = String(
    objeto.prioridade ??
      PrioridadeTarefaComercial.MEDIA
  )
    .trim()
    .toUpperCase();

  if (
    !PRIORIDADES_TAREFA.has(
      prioridadeTexto
    )
  ) {
    throw new ErroHttp(
      400,
      "A prioridade da próxima ação é inválida.",
      "PRIORIDADE_TAREFA_INVALIDA"
    );
  }

  const agendadaPara =
    lerDataOpcional(
      objeto.agendadaPara
    );

  if (
    !agendadaPara.valido ||
    !agendadaPara.valor
  ) {
    throw new ErroHttp(
      400,
      "Informe quando a próxima ação deverá ser realizada.",
      "DATA_PROXIMA_ACAO_OBRIGATORIA"
    );
  }

  const prazoEm =
    lerDataOpcional(
      objeto.prazoEm
    );

  if (!prazoEm.valido) {
    throw new ErroHttp(
      400,
      "A data limite da próxima ação é inválida.",
      "PRAZO_TAREFA_INVALIDO"
    );
  }

  const lembreteEm =
    lerDataOpcional(
      objeto.lembreteEm
    );

  if (!lembreteEm.valido) {
    throw new ErroHttp(
      400,
      "A data do lembrete é inválida.",
      "LEMBRETE_TAREFA_INVALIDO"
    );
  }

  if (
    prazoEm.valor &&
    prazoEm.valor.getTime() <
      agendadaPara.valor.getTime()
  ) {
    throw new ErroHttp(
      400,
      "A data limite não pode ser anterior ao agendamento.",
      "PRAZO_ANTERIOR_AO_AGENDAMENTO"
    );
  }

  if (
    lembreteEm.valor &&
    lembreteEm.valor.getTime() >
      agendadaPara.valor.getTime()
  ) {
    throw new ErroHttp(
      400,
      "O lembrete não pode ocorrer depois do agendamento.",
      "LEMBRETE_POSTERIOR_AO_AGENDAMENTO"
    );
  }

  const responsavelInformado =
    objeto.responsavelFuncionarioId;

  const responsavelFuncionarioId =
    inteiroPositivoOuNull(
      responsavelInformado
    );

  if (
    responsavelInformado !==
      undefined &&
    responsavelInformado !==
      null &&
    responsavelInformado !==
      "" &&
    !responsavelFuncionarioId
  ) {
    throw new ErroHttp(
      400,
      "O responsável pela próxima ação é inválido.",
      "RESPONSAVEL_TAREFA_INVALIDO"
    );
  }

  return {
    tipo:
      tipoTexto as TipoTarefaComercial,

    prioridade:
      prioridadeTexto as PrioridadeTarefaComercial,

    titulo:
      textoOuNull(
        objeto.titulo
      ),

    descricao:
      textoOuNull(
        objeto.descricao
      ),

    agendadaPara:
      agendadaPara.valor,

    prazoEm:
      prazoEm.valor,

    lembreteEm:
      lembreteEm.valor,

    responsavelFuncionarioId,
  };
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const [
      podeMovimentar,
      podeVerTodos,
    ] = await Promise.all([
      usuarioPossuiPermissao(
        user,
        "comercial.leads.movimentar"
      ),
      usuarioPossuiPermissao(
        user,
        "comercial.leads.ver_todos"
      ),
    ]);

    if (!podeMovimentar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para movimentar leads no funil.",
        "SEM_PERMISSAO"
      );
    }

    const instituicaoId =
      Number(
        user.instituicaoId
      );

    const usuarioId =
      Number(user.id);

    const leadId =
      inteiroPositivoOuNull(
        params.id
      );

    if (
      !Number.isInteger(
        instituicaoId
      ) ||
      instituicaoId <= 0
    ) {
      throw new ErroHttp(
        403,
        "O usuário não está vinculado a uma instituição válida.",
        "INSTITUICAO_INVALIDA"
      );
    }

    if (
      !Number.isInteger(
        usuarioId
      ) ||
      usuarioId <= 0
    ) {
      throw new ErroHttp(
        403,
        "Não foi possível identificar o usuário responsável.",
        "USUARIO_INVALIDO"
      );
    }

    if (!leadId) {
      throw new ErroHttp(
        400,
        "Lead inválido.",
        "LEAD_INVALIDO"
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const etapaNovaId =
      inteiroPositivoOuNull(
        body.etapaNovaId
      );

    if (!etapaNovaId) {
      throw new ErroHttp(
        400,
        "Selecione a etapa de destino.",
        "ETAPA_DESTINO_OBRIGATORIA"
      );
    }

    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          instituicaoId,
          userId: usuarioId,
          ativo: true,
          statusFuncionario: "ATIVO",
        },
        select: {
          id: true,
        },
      });

    if (
      !podeVerTodos &&
      !funcionario
    ) {
      throw new ErroHttp(
        403,
        "Seu usuário não possui um funcionário comercial ativo vinculado.",
        "FUNCIONARIO_NAO_VINCULADO"
      );
    }

    const [
      lead,
      etapaNova,
    ] = await Promise.all([
      prisma.lead.findFirst({
        where: {
          id: leadId,
          instituicaoGestoraId:
            instituicaoId,
          tipo: "INSTITUICAO",
          arquivadoEm: null,

          ...(!podeVerTodos
            ? {
                responsavelFuncionarioId:
                  funcionario!.id,
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),

      prisma.etapaFunilComercial.findFirst({
        where: {
          id: etapaNovaId,
          instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
          resultado: true,
          exigeMotivoPerda: true,
        },
      }),
    ]);

    if (!lead) {
      throw new ErroHttp(
        404,
        "O lead não foi encontrado ou não está disponível para este usuário.",
        "LEAD_NAO_ENCONTRADO"
      );
    }

    if (!etapaNova) {
      throw new ErroHttp(
        404,
        "A etapa de destino não foi encontrada.",
        "ETAPA_NAO_ENCONTRADA"
      );
    }

    const etapaDePerda =
      etapaNova.exigeMotivoPerda ||
      etapaNova.resultado ===
        ResultadoEtapaFunilComercial.PERDIDA ||
      etapaNova.resultado ===
        ResultadoEtapaFunilComercial.DESCARTADA;

    if (etapaDePerda) {
      const podeRegistrarPerda =
        await usuarioPossuiPermissao(
          user,
          "comercial.leads.registrar_perda"
        );

      if (!podeRegistrarPerda) {
        throw new ErroHttp(
          403,
          "Você não possui permissão para registrar perdas comerciais.",
          "SEM_PERMISSAO_REGISTRAR_PERDA"
        );
      }
    }

    const motivoPerdaInformado =
      body.motivoPerdaId;

    const motivoPerdaId =
      inteiroPositivoOuNull(
        motivoPerdaInformado
      );

    if (
      motivoPerdaInformado !==
        undefined &&
      motivoPerdaInformado !==
        null &&
      motivoPerdaInformado !==
        "" &&
      !motivoPerdaId
    ) {
      throw new ErroHttp(
        400,
        "O motivo de perda informado é inválido.",
        "MOTIVO_PERDA_INVALIDO"
      );
    }

    const proximaAcao =
      montarProximaAcao(
        body.proximaAcao
      );

    const resultado =
      await movimentarLeadNoFunil({
        instituicaoId,
        leadId,
        etapaNovaId,
        usuarioId,

        origem:
          OrigemMovimentacaoFunilComercial.MANUAL,

        motivo:
          textoOuNull(
            body.motivo
          ),

        motivoPerdaId,

        motivoPerdaObservacao:
          textoOuNull(
            body.motivoPerdaObservacao
          ),

        proximaAcao,
      });

    return NextResponse.json(
      {
        success: true,
        mensagem:
          "Lead movimentado com sucesso.",
        resultado,
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
    if (
      error instanceof
      ErroMovimentacaoLead
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          codigo: error.codigo,
          detalhes:
            error.detalhes,
        },
        {
          status: error.status,
        }
      );
    }

    if (
      error instanceof ErroHttp
    ) {
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
      "Erro ao movimentar lead no funil:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível movimentar o lead.",
        codigo: "ERRO_INTERNO",
      },
      {
        status: 500,
      }
    );
  }
}