import {
  ResultadoDeduplicacaoCaptacaoLead,
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
    Number(user.instituicaoId);

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
      podeReprocessar: true,
      podeVerAuditoria: true,
    };
  }

  const [
    podeVer,
    podeReprocessar,
    podeVerAuditoria,
  ] = await Promise.all([
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
      "comercial.captacao.auditoria.ver"
    ),
  ]);

  return {
    podeVer:
      podeVer ||
      podeReprocessar,

    podeReprocessar,

    podeVerAuditoria,
  };
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

  console.error(
    contexto,
    error
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Não foi possível consultar a submissão da Central de Captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function GET(
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

    const permissoes =
      await obterPermissoes(
        user
      );

    if (
      !permissoes.podeVer
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar submissões da Central de Captação.",
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

    const submissao =
      await prisma.submissaoCaptacaoLead.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,
          instituicaoId: true,

          canalId: true,
          campanhaId: true,
          formularioId: true,
          integracaoId: true,
          leadId: true,

          identificadorExterno:
            true,

          chaveDeduplicacao:
            true,

          status: true,

          resultadoDeduplicacao:
            true,

          nomeSnapshot: true,
          emailSnapshot: true,
          telefoneSnapshot:
            true,

          dadosOriginais: true,
          dadosNormalizados:
            true,

          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          utmTerm: true,

          gclid: true,
          fbclid: true,
          msclkid: true,

          paginaOrigem: true,
          referrer: true,

          ipHash: true,
          userAgent: true,
          idioma: true,

          consentimentoLgpd:
            true,

          consentimentoEm:
            true,

          versaoConsentimento:
            true,

          textoConsentimentoSnapshot:
            true,

          tentativasProcessamento:
            true,

          codigoErro: true,
          mensagemErro: true,

          recebidoEm: true,
          processadoEm: true,
          atualizadoEm: true,

          canal: {
            select: {
              id: true,
              nome: true,
              slug: true,
              tipo: true,
              cor: true,
              ativo: true,
            },
          },

          campanha: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              status: true,
              ativo: true,

              utmSource: true,
              utmMedium: true,
              utmCampaign: true,
              utmContent: true,
              utmTerm: true,
            },
          },

          formulario: {
            select: {
              id: true,
              nome: true,
              slug: true,
              tokenPublico: true,
              titulo: true,

              status: true,
              versao: true,
              publico: true,
              ativo: true,

              exigeConsentimento:
                true,

              bloquearDuplicados:
                true,

              atualizarLeadExistente:
                true,

              criarTarefaPrimeiroContato:
                true,

              tipoTarefaInicial:
                true,

              prazoPrimeiroContatoMinutos:
                true,
            },
          },

          integracao: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              status: true,
              ativo: true,

              ultimoSucessoEm:
                true,

              ultimoErroEm:
                true,

              ultimoErro: true,
            },
          },

          lead: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,

              status: true,
              prioridade: true,
              origem: true,

              cursoInteresseId: true,
              poloInteresseId: true,

              responsavelFuncionarioId:
                true,

              equipeResponsavelId:
                true,

              cursoInteresse: {
                select: {
                  id: true,
                  nome: true,
                },
              },

              poloInteresse: {
                select: {
                  id: true,
                  nome: true,
                },
              },

              responsavelFuncionario: {
                select: {
                  id: true,
                  nome: true,
                },
              },

              equipeResponsavel: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },

          eventosIntegracao: {
            select: {
              id: true,

              integracaoId:
                true,

              submissaoId:
                true,

              identificadorEvento:
                true,

              tipoEvento:
                true,

              direcao: true,
              status: true,

              headers: true,
              payload: true,
              resposta: true,

              codigoHttp: true,

              numeroTentativas:
                true,

              proximaTentativaEm:
                true,

              mensagemErro:
                true,

              recebidoEm: true,
              processadoEm: true,

              criadoEm: true,
              atualizadoEm: true,

              integracao: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                  status: true,
                },
              },
            },

            orderBy: {
              recebidoEm:
                "desc",
            },
          },
        },
      });

    if (!submissao) {
      throw new ErroHttp(
        404,
        "Submissão da Central de Captação não encontrada.",
        "SUBMISSAO_NAO_ENCONTRADA"
      );
    }

    /*
     * Eventos de integração contêm
     * payloads técnicos. Só são
     * entregues a quem possui acesso
     * à auditoria da captação.
     */
    const eventosIntegracao =
      permissoes.podeVerAuditoria
        ? submissao.eventosIntegracao
        : submissao.eventosIntegracao.map(
          (evento) => ({
            id:
              evento.id,

            integracaoId:
              evento.integracaoId,

            submissaoId:
              evento.submissaoId,

            identificadorEvento:
              evento.identificadorEvento,

            tipoEvento:
              evento.tipoEvento,

            direcao:
              evento.direcao,

            status:
              evento.status,

            codigoHttp:
              evento.codigoHttp,

            numeroTentativas:
              evento.numeroTentativas,

            proximaTentativaEm:
              evento.proximaTentativaEm,

            mensagemErro:
              evento.mensagemErro,

            recebidoEm:
              evento.recebidoEm,

            processadoEm:
              evento.processadoEm,

            criadoEm:
              evento.criadoEm,

            atualizadoEm:
              evento.atualizadoEm,

            integracao:
              evento.integracao,
          })
        );

    const {
      eventosIntegracao:
      _eventosOriginais,

      ...dadosSubmissao
    } = submissao;

    const podeReprocessarAgora =
      permissoes.podeReprocessar &&
      (
        submissao.status ===
        StatusSubmissaoCaptacaoLead.ERRO ||
        submissao.status ===
        StatusSubmissaoCaptacaoLead.REJEITADA ||
        submissao.status ===
        StatusSubmissaoCaptacaoLead.RECEBIDA
      );

    return NextResponse.json(
      {
        success: true,

        permissoes: {
          ...permissoes,

          podeReprocessarAgora,
        },

        statusDisponiveis:
          Object.values(
            StatusSubmissaoCaptacaoLead
          ),

        resultadosDeduplicacaoDisponiveis:
          Object.values(
            ResultadoDeduplicacaoCaptacaoLead
          ),

        submissao: {
          ...dadosSubmissao,

          eventosIntegracao,
        },
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
      "Erro ao consultar detalhe da submissão da Central de Captação:"
    );
  }
}