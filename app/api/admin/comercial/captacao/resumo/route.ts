import {
  ResultadoDeduplicacaoCaptacaoLead,
  StatusCampanhaCaptacaoLead,
  StatusFormularioCaptacaoLead,
  StatusIntegracaoCaptacaoLead,
  StatusSubmissaoCaptacaoLead,
} from "@prisma/client";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FUSO_BRASILIA = "America/Sao_Paulo";

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

function ehMasterReal(user: UsuarioLogado) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
      "academicophanyx@gmail.com"
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

  const instituicaoId = Number(user.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return {
    user,
    instituicaoId,
  };
}

async function obterPermissoes(
  user: UsuarioLogado
) {
  if (ehMasterReal(user)) {
    return {
      podeVer: true,
      podeVerCanais: true,
      podeGerenciarCanais: true,
      podeVerCampanhas: true,
      podeGerenciarCampanhas: true,
      podeVerFormularios: true,
      podeGerenciarFormularios: true,
      podeVerSubmissoes: true,
      podeReprocessarSubmissoes: true,
      podeVerDistribuicao: true,
      podeGerenciarDistribuicao: true,
      podeVerIntegracoes: true,
      podeGerenciarIntegracoes: true,
      podeVerAuditoria: true,
    };
  }

  const [
    podeVer,
    podeVerCanais,
    podeGerenciarCanais,
    podeVerCampanhas,
    podeGerenciarCampanhas,
    podeVerFormularios,
    podeGerenciarFormularios,
    podeVerSubmissoes,
    podeReprocessarSubmissoes,
    podeVerDistribuicao,
    podeGerenciarDistribuicao,
    podeVerIntegracoes,
    podeGerenciarIntegracoes,
    podeVerAuditoria,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.canais.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.canais.gerenciar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.campanhas.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.campanhas.gerenciar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.formularios.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.formularios.gerenciar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.submissoes.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.submissoes.reprocessar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.distribuicao.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.distribuicao.gerenciar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.gerenciar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.auditoria.ver"
    ),
  ]);

  return {
    podeVer,
    podeVerCanais,
    podeGerenciarCanais,
    podeVerCampanhas,
    podeGerenciarCampanhas,
    podeVerFormularios,
    podeGerenciarFormularios,
    podeVerSubmissoes,
    podeReprocessarSubmissoes,
    podeVerDistribuicao,
    podeGerenciarDistribuicao,
    podeVerIntegracoes,
    podeGerenciarIntegracoes,
    podeVerAuditoria,
  };
}

function partesDataBrasilia(
  data = new Date()
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: FUSO_BRASILIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(data);

  const obter = (tipo: string) =>
    partes.find(
      (parte) => parte.type === tipo
    )?.value ?? "";

  return {
    ano: Number(obter("year")),
    mes: Number(obter("month")),
    dia: Number(obter("day")),
  };
}

function intervalosBrasilia() {
  const {
    ano,
    mes,
    dia,
  } = partesDataBrasilia();

  const hojeInicio = new Date(
    `${ano}-${String(mes).padStart(
      2,
      "0"
    )}-${String(dia).padStart(
      2,
      "0"
    )}T00:00:00-03:00`
  );

  const amanhaInicio = new Date(
    hojeInicio.getTime() +
      24 * 60 * 60 * 1000
  );

  const mesInicio = new Date(
    `${ano}-${String(mes).padStart(
      2,
      "0"
    )}-01T00:00:00-03:00`
  );

  const proximoMes =
    mes === 12
      ? {
          ano: ano + 1,
          mes: 1,
        }
      : {
          ano,
          mes: mes + 1,
        };

  const proximoMesInicio = new Date(
    `${proximoMes.ano}-${String(
      proximoMes.mes
    ).padStart(
      2,
      "0"
    )}-01T00:00:00-03:00`
  );

  return {
    ano,
    mes,
    hojeInicio,
    amanhaInicio,
    mesInicio,
    proximoMesInicio,
  };
}

function responderErro(
  error: unknown
) {
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
    "Erro ao consultar resumo da Central de Captação:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Não foi possível consultar a Central de Captação.",
      codigo: "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function GET() {
  try {
    const {
      user,
      instituicaoId,
    } = await autenticarUsuario();

    const permissoes =
      await obterPermissoes(user);

    if (!permissoes.podeVer) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para acessar a Central de Captação.",
        "SEM_PERMISSAO"
      );
    }

    const {
      ano,
      mes,
      hojeInicio,
      amanhaInicio,
      mesInicio,
      proximoMesInicio,
    } = intervalosBrasilia();

    const statusPendentes = [
      StatusSubmissaoCaptacaoLead.RECEBIDA,
      StatusSubmissaoCaptacaoLead.VALIDANDO,
      StatusSubmissaoCaptacaoLead.PROCESSANDO,
    ];

    const [
      totalCanais,
      canaisAtivos,

      totalCampanhas,
      campanhasAtivas,

      totalFormularios,
      formulariosPublicados,

      totalIntegracoes,
      integracoesAtivas,
      integracoesComErro,

      submissoesHoje,
      submissoesMes,
      submissoesPendentes,
      submissoesProcessadasMes,
      submissoesDuplicadasMes,
      submissoesComErroMes,
      submissoesRejeitadasMes,
      submissoesSpamMes,

      novosLeadsMes,
      leadsAtualizadosMes,

      regrasDistribuicaoAtivas,

      ultimasSubmissoes,
    ] = await prisma.$transaction([
      prisma.canalCaptacaoLead.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.canalCaptacaoLead.count({
        where: {
          instituicaoId,
          ativo: true,
        },
      }),

      prisma.campanhaCaptacaoLead.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.campanhaCaptacaoLead.count({
        where: {
          instituicaoId,
          ativo: true,
          status:
            StatusCampanhaCaptacaoLead.ATIVA,
        },
      }),

      prisma.formularioCaptacaoLead.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.formularioCaptacaoLead.count({
        where: {
          instituicaoId,
          ativo: true,
          status:
            StatusFormularioCaptacaoLead.PUBLICADO,
        },
      }),

      prisma.integracaoCaptacaoLead.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.integracaoCaptacaoLead.count({
        where: {
          instituicaoId,
          ativo: true,
          status:
            StatusIntegracaoCaptacaoLead.ATIVA,
        },
      }),

      prisma.integracaoCaptacaoLead.count({
        where: {
          instituicaoId,
          ativo: true,
          status:
            StatusIntegracaoCaptacaoLead.ERRO,
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          recebidoEm: {
            gte: hojeInicio,
            lt: amanhaInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          status: {
            in: statusPendentes,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          status:
            StatusSubmissaoCaptacaoLead.PROCESSADA,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          status:
            StatusSubmissaoCaptacaoLead.DUPLICADA,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          status:
            StatusSubmissaoCaptacaoLead.ERRO,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          status:
            StatusSubmissaoCaptacaoLead.REJEITADA,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          status:
            StatusSubmissaoCaptacaoLead.SPAM,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          resultadoDeduplicacao:
            ResultadoDeduplicacaoCaptacaoLead.NOVO_LEAD,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.submissaoCaptacaoLead.count({
        where: {
          instituicaoId,
          resultadoDeduplicacao:
            ResultadoDeduplicacaoCaptacaoLead.LEAD_EXISTENTE_ATUALIZADO,
          recebidoEm: {
            gte: mesInicio,
            lt: proximoMesInicio,
          },
        },
      }),

      prisma.regraDistribuicaoLead.count({
        where: {
          instituicaoId,
          ativo: true,
        },
      }),

      prisma.submissaoCaptacaoLead.findMany({
        where: {
          instituicaoId,
        },

        select: {
          id: true,
          status: true,
          resultadoDeduplicacao: true,

          nomeSnapshot: true,
          emailSnapshot: true,
          telefoneSnapshot: true,

          utmSource: true,
          utmMedium: true,
          utmCampaign: true,

          consentimentoLgpd: true,

          codigoErro: true,
          mensagemErro: true,

          recebidoEm: true,
          processadoEm: true,

          leadId: true,

          canal: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              cor: true,
            },
          },

          campanha: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              status: true,
            },
          },

          formulario: {
            select: {
              id: true,
              nome: true,
              titulo: true,
              status: true,
            },
          },
        },

        orderBy: {
          recebidoEm: "desc",
        },

        take: 10,
      }),
    ]);

    const taxaProcessamento =
      submissoesMes > 0
        ? Math.round(
            (submissoesProcessadasMes /
              submissoesMes) *
              10000
          ) / 100
        : 0;

    const taxaErro =
      submissoesMes > 0
        ? Math.round(
            (submissoesComErroMes /
              submissoesMes) *
              10000
          ) / 100
        : 0;

    const leadsGeradosMes =
      novosLeadsMes +
      leadsAtualizadosMes;

    return NextResponse.json(
      {
        success: true,

        permissoes,

        periodo: {
          mes,
          ano,
        },

        resumo: {
          canais: {
            total: totalCanais,
            ativos: canaisAtivos,
          },

          campanhas: {
            total: totalCampanhas,
            ativas: campanhasAtivas,
          },

          formularios: {
            total: totalFormularios,
            publicados:
              formulariosPublicados,
          },

          integracoes: {
            total: totalIntegracoes,
            ativas: integracoesAtivas,
            comErro:
              integracoesComErro,
          },

          distribuicao: {
            regrasAtivas:
              regrasDistribuicaoAtivas,
          },

          submissoes: {
            hoje: submissoesHoje,
            mes: submissoesMes,
            pendentes:
              submissoesPendentes,
            processadas:
              submissoesProcessadasMes,
            duplicadas:
              submissoesDuplicadasMes,
            rejeitadas:
              submissoesRejeitadasMes,
            spam:
              submissoesSpamMes,
            comErro:
              submissoesComErroMes,
          },

          leads: {
            novos:
              novosLeadsMes,
            existentesAtualizados:
              leadsAtualizadosMes,
            totalGerados:
              leadsGeradosMes,
          },

          taxas: {
            processamento:
              taxaProcessamento,
            erro:
              taxaErro,
          },
        },

        ultimasSubmissoes,
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
    return responderErro(error);
  }
}