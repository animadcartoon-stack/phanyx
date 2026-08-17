import {
  DirecaoEventoIntegracaoCaptacaoLead,
  Prisma,
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
      podeVer: true,
      podeVerAuditoria: true,
      podeGerenciarIntegracoes: true,
    };
  }

  const [
    podeVerIntegracoes,
    podeVerAuditoria,
    podeGerenciarIntegracoes,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.auditoria.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.gerenciar"
    ),
  ]);

  return {
    podeVer:
      podeVerIntegracoes ||
      podeVerAuditoria ||
      podeGerenciarIntegracoes,

    podeVerAuditoria,

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

function inteiroPositivo(
  valor: unknown,
  padrao: number,
  maximo: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return Math.min(
    numero,
    maximo
  );
}

function textoOuNull(
  valor: unknown,
  limite = 500
) {
  const texto =
    String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

function statusOuNull(
  valor: unknown
):
  | StatusEventoIntegracaoCaptacaoLead
  | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      StatusEventoIntegracaoCaptacaoLead;

  return Object.values(
    StatusEventoIntegracaoCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function direcaoOuNull(
  valor: unknown
):
  | DirecaoEventoIntegracaoCaptacaoLead
  | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      DirecaoEventoIntegracaoCaptacaoLead;

  return Object.values(
    DirecaoEventoIntegracaoCaptacaoLead
  ).includes(normalizado)
    ? normalizado
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
        "Não foi possível consultar os eventos das integrações.",

      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function GET(
  req: NextRequest
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

    if (!permissoes.podeVer) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar eventos de integração.",
        "SEM_PERMISSAO"
      );
    }

    const busca =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "busca"
        ),
        300
      );

    const statusParam =
      req.nextUrl.searchParams.get(
        "status"
      );

    const status =
      statusParam
        ? statusOuNull(
            statusParam
          )
        : null;

    if (
      statusParam &&
      !status
    ) {
      throw new ErroHttp(
        400,
        "Status de evento inválido.",
        "STATUS_INVALIDO"
      );
    }

    const direcaoParam =
      req.nextUrl.searchParams.get(
        "direcao"
      );

    const direcao =
      direcaoParam
        ? direcaoOuNull(
            direcaoParam
          )
        : null;

    if (
      direcaoParam &&
      !direcao
    ) {
      throw new ErroHttp(
        400,
        "Direção do evento inválida.",
        "DIRECAO_INVALIDA"
      );
    }

    const tipoEvento =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "tipoEvento"
        ),
        200
      );

    const integracaoParam =
      req.nextUrl.searchParams.get(
        "integracaoId"
      );

    const integracaoId =
      integracaoParam
        ? numeroPositivo(
            integracaoParam
          )
        : null;

    if (
      integracaoParam &&
      !integracaoId
    ) {
      throw new ErroHttp(
        400,
        "Integração inválida.",
        "INTEGRACAO_INVALIDA"
      );
    }

    const submissaoParam =
      req.nextUrl.searchParams.get(
        "submissaoId"
      );

    const submissaoId =
      submissaoParam
        ? numeroPositivo(
            submissaoParam
          )
        : null;

    if (
      submissaoParam &&
      !submissaoId
    ) {
      throw new ErroHttp(
        400,
        "Submissão inválida.",
        "SUBMISSAO_INVALIDA"
      );
    }

    const pagina =
      inteiroPositivo(
        req.nextUrl.searchParams.get(
          "pagina"
        ),
        1,
        1_000_000
      );

    const limite =
      inteiroPositivo(
        req.nextUrl.searchParams.get(
          "limite"
        ),
        30,
        100
      );

    if (
      !pagina ||
      !limite
    ) {
      throw new ErroHttp(
        400,
        "Paginação inválida.",
        "PAGINACAO_INVALIDA"
      );
    }

    const where:
      Prisma.EventoIntegracaoCaptacaoLeadWhereInput =
        {
          instituicaoId,

          ...(status
            ? {
                status,
              }
            : {}),

          ...(direcao
            ? {
                direcao,
              }
            : {}),

          ...(tipoEvento
            ? {
                tipoEvento: {
                  contains:
                    tipoEvento,

                  mode:
                    "insensitive",
                },
              }
            : {}),

          ...(integracaoId
            ? {
                integracaoId,
              }
            : {}),

          ...(submissaoId
            ? {
                submissaoId,
              }
            : {}),

          ...(busca
            ? {
                OR: [
                  {
                    identificadorEvento: {
                      contains:
                        busca,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    tipoEvento: {
                      contains:
                        busca,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    mensagemErro: {
                      contains:
                        busca,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    integracao: {
                      nome: {
                        contains:
                          busca,

                        mode:
                          "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        };

    const [
      totalFiltrado,
      eventos,
      total,
      recebidos,
      pendentes,
      processando,
      processados,
      entregues,
      erros,
      descartados,
      entradas,
      saidas,
      integracoes,
    ] =
      await prisma.$transaction([
        prisma.eventoIntegracaoCaptacaoLead.count({
          where,
        }),

        prisma.eventoIntegracaoCaptacaoLead.findMany({
          where,

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

            direcao:
              true,

            status:
              true,

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
                nome: true,
                tipo: true,
                status: true,
                chavePublica:
                  true,
                ativo: true,
              },
            },

            submissao: {
              select: {
                id: true,
                status: true,
                leadId: true,

                nomeSnapshot:
                  true,

                emailSnapshot:
                  true,

                telefoneSnapshot:
                  true,

                resultadoDeduplicacao:
                  true,

                recebidoEm:
                  true,

                processadoEm:
                  true,
              },
            },
          },

          orderBy: [
            {
              recebidoEm:
                "desc",
            },

            {
              id: "desc",
            },
          ],

          skip:
            (pagina - 1) *
            limite,

          take:
            limite,
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.RECEBIDO,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.PENDENTE,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.PROCESSANDO,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.PROCESSADO,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.ENTREGUE,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.ERRO,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusEventoIntegracaoCaptacaoLead.DESCARTADO,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            direcao:
              DirecaoEventoIntegracaoCaptacaoLead.ENTRADA,
          },
        }),

        prisma.eventoIntegracaoCaptacaoLead.count({
          where: {
            instituicaoId,

            direcao:
              DirecaoEventoIntegracaoCaptacaoLead.SAIDA,
          },
        }),

        prisma.integracaoCaptacaoLead.findMany({
          where: {
            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            tipo: true,
            status: true,
            ativo: true,
          },

          orderBy: {
            nome: "asc",
          },
        }),
      ]);

    const totalPaginas =
      totalFiltrado > 0
        ? Math.ceil(
            totalFiltrado /
              limite
          )
        : 0;

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

        resumo: {
          total,

          recebidos,
          pendentes,
          processando,
          processados,
          entregues,
          erros,
          descartados,

          entradas,
          saidas,
        },

        referencias: {
          integracoes,
        },

        filtros: {
          busca,
          status,
          direcao,
          tipoEvento,
          integracaoId,
          submissaoId,
        },

        paginacao: {
          pagina,
          limite,

          total:
            totalFiltrado,

          totalPaginas,

          possuiAnterior:
            pagina > 1,

          possuiProxima:
            pagina <
            totalPaginas,
        },

        eventos,
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
      "Erro ao consultar eventos das integrações da Central de Captação:"
    );
  }
}