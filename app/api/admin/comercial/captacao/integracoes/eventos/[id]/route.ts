import {
  DirecaoEventoIntegracaoCaptacaoLead,
  StatusEventoIntegracaoCaptacaoLead,
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

async function obterPermissoes(
  user: UsuarioLogado
) {
  if (ehMasterReal(user)) {
    return {
      podeVerAuditoria: true,
      podeReprocessarSubmissao: true,
      podeGerenciarIntegracoes: true,
    };
  }

  const [
    podeVerAuditoria,
    podeReprocessarSubmissao,
    podeGerenciarIntegracoes,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.auditoria.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.submissoes.reprocessar"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.gerenciar"
    ),
  ]);

  return {
    podeVerAuditoria,
    podeReprocessarSubmissao,
    podeGerenciarIntegracoes,
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

function sanitizarHeadersAuditoria(
  valor: unknown
) {
  if (
    !valor ||
    typeof valor !==
    "object" ||
    Array.isArray(valor)
  ) {
    return valor;
  }

  const headers =
    valor as Record<
      string,
      unknown
    >;

  const termosSensiveis = [
    "authorization",
    "cookie",
    "secret",
    "token",
    "signature",
    "api-key",
    "apikey",
  ];

  const headersComIp = [
    "x-forwarded-for",
    "x-real-ip",
    "x-vercel-forwarded-for",
    "x-vercel-proxied-for",
  ];

  return Object.fromEntries(
    Object.entries(
      headers
    ).map(
      ([
        chave,
        conteudo,
      ]) => {
        const normalizada =
          chave
            .trim()
            .toLowerCase();

        const sensivel =
          termosSensiveis.some(
            (termo) =>
              normalizada.includes(
                termo
              )
          ) ||
          headersComIp.includes(
            normalizada
          );

        return [
          chave,
          sensivel
            ? "[PROTEGIDO]"
            : conteudo,
        ];
      }
    )
  );
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
        status:
          error.status,
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
        "Não foi possível consultar o evento da integração.",

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

    /*
     * Aqui não basta possuir
     * integracoes.ver.
     *
     * O endpoint expõe payload,
     * headers e resposta completos.
     */
    if (
      !permissoes.podeVerAuditoria
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar a auditoria técnica das integrações.",
        "SEM_PERMISSAO_AUDITORIA"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Evento de integração inválido.",
        "EVENTO_INVALIDO"
      );
    }

    const evento =
      await prisma.eventoIntegracaoCaptacaoLead.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,
          instituicaoId: true,

          integracaoId:
            true,

          submissaoId:
            true,

          identificadorEvento:
            true,

          tipoEvento:
            true,

          direcao:
            true,

          status:
            true,

          /*
           * Dados técnicos completos.
           *
           * Somente auditoria pode
           * acessar este endpoint.
           */
          headers: true,
          payload: true,
          resposta: true,

          codigoHttp:
            true,

          numeroTentativas:
            true,

          proximaTentativaEm:
            true,

          mensagemErro:
            true,

          recebidoEm:
            true,

          processadoEm:
            true,

          criadoEm:
            true,

          atualizadoEm:
            true,

          integracao: {
            select: {
              id: true,

              canalId:
                true,

              campanhaId:
                true,

              formularioId:
                true,

              nome: true,
              tipo: true,
              status: true,

              /*
               * Chave pública pode
               * aparecer.
               *
               * segredoCriptografado
               * propositalmente NÃO.
               */
              chavePublica:
                true,

              urlEndpoint:
                true,

              configuracao:
                true,

              eventosAssinados:
                true,

              ativo: true,

              ultimoSucessoEm:
                true,

              ultimoErroEm:
                true,

              ultimoErro:
                true,

              criadoEm:
                true,

              atualizadoEm:
                true,

              canal: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
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
                },
              },

              formulario: {
                select: {
                  id: true,
                  nome: true,
                  titulo: true,
                  status: true,
                  ativo: true,
                },
              },
            },
          },

          submissao: {
            select: {
              id: true,

              canalId: true,
              campanhaId:
                true,

              formularioId:
                true,

              integracaoId:
                true,

              leadId: true,

              identificadorExterno:
                true,

              chaveDeduplicacao:
                true,

              status: true,

              resultadoDeduplicacao:
                true,

              nomeSnapshot:
                true,

              emailSnapshot:
                true,

              telefoneSnapshot:
                true,

              /*
               * Auditoria completa
               * da transformação.
               */
              dadosOriginais:
                true,

              dadosNormalizados:
                true,

              utmSource: true,
              utmMedium: true,
              utmCampaign:
                true,
              utmContent:
                true,
              utmTerm: true,

              gclid: true,
              fbclid: true,
              msclkid: true,

              paginaOrigem:
                true,

              referrer: true,

              ipHash: true,

              userAgent:
                true,

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

              codigoErro:
                true,

              mensagemErro:
                true,

              recebidoEm:
                true,

              processadoEm:
                true,

              atualizadoEm:
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
                  status: true,
                },
              },
            },
          },
        },
      });

    if (!evento) {
      throw new ErroHttp(
        404,
        "Evento de integração não encontrado.",
        "EVENTO_NAO_ENCONTRADO"
      );
    }

    /*
     * Informações úteis para a
     * futura tela decidir quais
     * ações poderá mostrar.
     */
    const submissaoPodeSerReprocessada =
      Boolean(
        permissoes
          .podeReprocessarSubmissao &&
        evento.submissao &&
        (
          evento.submissao.status ===
          "RECEBIDA" ||
          evento.submissao.status ===
          "REJEITADA" ||
          evento.submissao.status ===
          "ERRO"
        )
      );

    const eventoPossuiFalha =
      evento.status ===
      StatusEventoIntegracaoCaptacaoLead.ERRO ||
      Boolean(
        evento.mensagemErro
      );

    const eventoPendente =
      evento.status ===
      StatusEventoIntegracaoCaptacaoLead.RECEBIDO ||
      evento.status ===
      StatusEventoIntegracaoCaptacaoLead.PENDENTE ||
      evento.status ===
      StatusEventoIntegracaoCaptacaoLead.PROCESSANDO;

    return NextResponse.json(
      {
        success: true,

        permissoes,

        statusDisponiveis:
          Object.values(
            StatusEventoIntegracaoCaptacaoLead
          ),

        direcoesDisponiveis:
          Object.values(
            DirecaoEventoIntegracaoCaptacaoLead
          ),

        acoes: {
          submissaoPodeSerReprocessada,

          eventoPossuiFalha,

          eventoPendente,
        },

        evento: {
          ...evento,

          headers:
            sanitizarHeadersAuditoria(
              evento.headers
            ),
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
      "Erro ao consultar detalhe do evento de integração da Central de Captação:"
    );
  }
}