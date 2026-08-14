import {
  StatusSubmissaoCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

import {
  ErroProcessamentoCaptacao,
  processarSubmissaoCaptacao,
} from "@/lib/comercial/captacao/processar-submissao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function ehMasterReal(
  user: UsuarioLogado
) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
      "academicophanyx@gmail.com"
  );
}

async function autenticarUsuario() {
  const user =
    await getUserFromToken();

  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId =
    Number(
      user.instituicaoId
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

  return {
    user,
    instituicaoId,
  };
}

async function podeReprocessar(
  user: UsuarioLogado
) {
  if (ehMasterReal(user)) {
    return true;
  }

  return usuarioPossuiPermissao(
    user,
    "comercial.captacao.submissoes.reprocessar"
  );
}

function numeroPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return (
    Number.isInteger(numero) &&
    numero > 0
  )
    ? numero
    : null;
}

function responderErro(
  error: unknown,
  contexto: string
) {
  if (
    error instanceof ErroHttp
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
    error instanceof
    ErroProcessamentoCaptacao
  ) {
    const statusHttp =
      error.statusFinal ===
      StatusSubmissaoCaptacaoLead.REJEITADA
        ? 422
        : 500;

    return NextResponse.json(
      {
        success: false,

        error:
          error.message,

        codigo:
          error.codigo,

        statusSubmissao:
          error.statusFinal,
      },
      {
        status:
          statusHttp,
      }
    );
  }

  console.error(
    contexto,
    error
  );

  return NextResponse.json(
    {
      success: false,

      error:
        "Não foi possível reprocessar a submissão.",

      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function POST(
  _req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permitido =
      await podeReprocessar(
        user
      );

    if (!permitido) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para reprocessar submissões da Central de Captação.",
        "SEM_PERMISSAO"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Submissão inválida.",
        "SUBMISSAO_INVALIDA"
      );
    }

    /*
     * Conferimos a submissão antes
     * de entregar ao processador.
     *
     * O motor fará uma segunda
     * proteção concorrente ao
     * capturar o registro.
     */
    const submissaoAtual =
      await prisma.submissaoCaptacaoLead.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,
          status: true,

          leadId: true,

          resultadoDeduplicacao:
            true,

          tentativasProcessamento:
            true,

          codigoErro:
            true,

          mensagemErro:
            true,

          recebidoEm:
            true,

          processadoEm:
            true,
        },
      });

    if (!submissaoAtual) {
      throw new ErroHttp(
        404,
        "Submissão da Central de Captação não encontrada.",
        "SUBMISSAO_NAO_ENCONTRADA"
      );
    }

    const statusPermitidos:
      StatusSubmissaoCaptacaoLead[] =
        [
          StatusSubmissaoCaptacaoLead.RECEBIDA,
          StatusSubmissaoCaptacaoLead.REJEITADA,
          StatusSubmissaoCaptacaoLead.ERRO,
        ];

    if (
      !statusPermitidos.includes(
        submissaoAtual.status
      )
    ) {
      throw new ErroHttp(
        409,
        "Esta submissão não pode ser reprocessada no estado atual.",
        "REPROCESSAMENTO_NAO_PERMITIDO",
        {
          statusAtual:
            submissaoAtual.status,
        }
      );
    }

    /*
     * A partir daqui o motor assume
     * todo o processamento:
     *
     * RECEBIDA/REJEITADA/ERRO
     *        ↓
     *    VALIDANDO
     *        ↓
     *   PROCESSANDO
     *        ↓
     * PROCESSADA / DUPLICADA
     * REJEITADA / ERRO
     */
    const resultado =
      await processarSubmissaoCaptacao({
        submissaoId:
          id,

        instituicaoId,
      });

    const submissao =
      await prisma.submissaoCaptacaoLead.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,

          status: true,

          resultadoDeduplicacao:
            true,

          leadId: true,

          tentativasProcessamento:
            true,

          codigoErro: true,
          mensagemErro: true,

          recebidoEm: true,
          processadoEm: true,
          atualizadoEm: true,

          nomeSnapshot:
            true,

          emailSnapshot:
            true,

          telefoneSnapshot:
            true,

          canal: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },

          campanha: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },

          formulario: {
            select: {
              id: true,
              nome: true,
              titulo: true,
            },
          },

          integracao: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },

          lead: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,

              status: true,

              responsavelFuncionarioId:
                true,

              equipeResponsavelId:
                true,

              funilId: true,
              etapaFunilId:
                true,

              cursoInteresseId:
                true,

              poloInteresseId:
                true,
            },
          },
        },
      });

    let message =
      "Submissão reprocessada com sucesso.";

    if (
      resultado.resultadoDeduplicacao ===
      "NOVO_LEAD"
    ) {
      message =
        "Submissão reprocessada e novo lead criado com sucesso.";
    }

    if (
      resultado.resultadoDeduplicacao ===
      "LEAD_EXISTENTE_ATUALIZADO"
    ) {
      message =
        "Submissão reprocessada e vinculada ao lead existente com sucesso.";
    }

    if (
      resultado.resultadoDeduplicacao ===
      "DUPLICADA_IGNORADA"
    ) {
      message =
        "Submissão reprocessada e identificada como duplicada.";
    }

    return NextResponse.json(
      {
        success: true,

        message,

        processamento: {
          submissaoId:
            resultado.submissaoId,

          status:
            resultado.status,

          resultadoDeduplicacao:
            resultado.resultadoDeduplicacao,

          leadId:
            resultado.leadId,

          tarefaId:
            resultado.tarefaId,

          regraDistribuicaoId:
            resultado.regraDistribuicaoId,
        },

        submissao,
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
    return responderErro(
      error,
      "Erro ao reprocessar submissão da Central de Captação:"
    );
  }
}