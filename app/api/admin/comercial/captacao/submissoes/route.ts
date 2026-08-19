import {
  Prisma,
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
    };
  }

  const [
    podeVer,
    podeReprocessar,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.submissoes.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.submissoes.reprocessar"
    ),
  ]);

  return {
    podeVer:
      podeVer || podeReprocessar,

    podeReprocessar,
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

function textoOuNull(
  valor: unknown
) {
  const texto =
    String(valor ?? "").trim();

  return texto || null;
}

function statusOuNull(
  valor: unknown
): StatusSubmissaoCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
    StatusSubmissaoCaptacaoLead;

  return Object.values(
    StatusSubmissaoCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function resultadoOuNull(
  valor: unknown
): ResultadoDeduplicacaoCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
    ResultadoDeduplicacaoCaptacaoLead;

  return Object.values(
    ResultadoDeduplicacaoCaptacaoLead
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
        "Não foi possível consultar as submissões da Central de Captação.",
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

    if (
      !permissoes.podeVer
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar as submissões da Central de Captação.",
        "SEM_PERMISSAO"
      );
    }

    const busca =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "busca"
        )
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
        "Status de submissão inválido.",
        "STATUS_INVALIDO"
      );
    }

    const resultadoParam =
      req.nextUrl.searchParams.get(
        "resultado"
      );

    const resultado =
      resultadoParam
        ? resultadoOuNull(
          resultadoParam
        )
        : null;

    if (
      resultadoParam &&
      !resultado
    ) {
      throw new ErroHttp(
        400,
        "Resultado de deduplicação inválido.",
        "RESULTADO_INVALIDO"
      );
    }

    const canalId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "canalId"
        )
      );

    const campanhaId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "campanhaId"
        )
      );

    const formularioId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "formularioId"
        )
      );

    const integracaoId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "integracaoId"
        )
      );

    const pagina =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "pagina"
        )
      ) ?? 1;

    const limiteSolicitado =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "limite"
        )
      ) ?? 30;

    const limite =
      Math.min(
        limiteSolicitado,
        100
      );

    const skip =
      (pagina - 1) *
      limite;

    const where:
      Prisma.SubmissaoCaptacaoLeadWhereInput =
    {
      instituicaoId,

      ...(status
        ? {
          status,
        }
        : {}),

      ...(resultado
        ? {
          resultadoDeduplicacao:
            resultado,
        }
        : {}),

      ...(canalId
        ? {
          canalId,
        }
        : {}),

      ...(campanhaId
        ? {
          campanhaId,
        }
        : {}),

      ...(formularioId
        ? {
          formularioId,
        }
        : {}),

      ...(integracaoId
        ? {
          integracaoId,
        }
        : {}),

      ...(busca
        ? {
          OR: [
            {
              nomeSnapshot: {
                contains:
                  busca,
                mode:
                  "insensitive",
              },
            },

            {
              emailSnapshot: {
                contains:
                  busca,
                mode:
                  "insensitive",
              },
            },

            {
              telefoneSnapshot: {
                contains:
                  busca,
                mode:
                  "insensitive",
              },
            },

            {
              identificadorExterno: {
                contains:
                  busca,
                mode:
                  "insensitive",
              },
            },

            {
              utmCampaign: {
                contains:
                  busca,
                mode:
                  "insensitive",
              },
            },

            {
              codigoErro: {
                contains:
                  busca,
                mode:
                  "insensitive",
              },
            },
          ],
        }
        : {}),
    };

    const [
      totalFiltrado,
      submissoes,
      totalGeral,
      recebidas,
      emProcessamento,
      processadas,
      duplicadas,
      rejeitadas,
      spam,
      comErro,
      canais,
      campanhas,
      formularios,
      integracoes,
    ] =
      await prisma.$transaction([
        prisma.submissaoCaptacaoLead.count({
          where,
        }),

        prisma.submissaoCaptacaoLead.findMany({
          where,

          select: {
            id: true,

            canalId: true,
            campanhaId: true,
            formularioId: true,
            integracaoId: true,
            leadId: true,

            lead: {
              select: {
                id: true,
                nome: true,

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
              },
            },

            identificadorExterno:
              true,

            status: true,

            resultadoDeduplicacao:
              true,

            nomeSnapshot: true,
            emailSnapshot: true,
            telefoneSnapshot:
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

            consentimentoLgpd:
              true,

            consentimentoEm:
              true,

            versaoConsentimento:
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
                slug: true,
                status: true,
              },
            },

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

          skip,
          take: limite,
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusSubmissaoCaptacaoLead.RECEBIDA,
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status: {
              in: [
                StatusSubmissaoCaptacaoLead.VALIDANDO,
                StatusSubmissaoCaptacaoLead.PROCESSANDO,
              ],
            },
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusSubmissaoCaptacaoLead.PROCESSADA,
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusSubmissaoCaptacaoLead.DUPLICADA,
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusSubmissaoCaptacaoLead.REJEITADA,
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusSubmissaoCaptacaoLead.SPAM,
          },
        }),

        prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId,

            status:
              StatusSubmissaoCaptacaoLead.ERRO,
          },
        }),

        prisma.canalCaptacaoLead.findMany({
          where: {
            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            tipo: true,
            cor: true,
            ativo: true,
          },

          orderBy: {
            nome: "asc",
          },
        }),

        prisma.campanhaCaptacaoLead.findMany({
          where: {
            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            codigo: true,
            status: true,
            ativo: true,
          },

          orderBy: {
            nome: "asc",
          },
        }),

        prisma.formularioCaptacaoLead.findMany({
          where: {
            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            titulo: true,
            status: true,
            ativo: true,
          },

          orderBy: {
            nome: "asc",
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
            StatusSubmissaoCaptacaoLead
          ),

        resultadosDeduplicacaoDisponiveis:
          Object.values(
            ResultadoDeduplicacaoCaptacaoLead
          ),

        resumo: {
          total: totalGeral,

          recebidas,

          emProcessamento,

          processadas,

          duplicadas,

          rejeitadas,

          spam,

          comErro,
        },

        referencias: {
          canais,
          campanhas,
          formularios,
          integracoes,
        },

        filtros: {
          busca,
          status,
          resultado,
          canalId,
          campanhaId,
          formularioId,
          integracaoId,
        },

        paginacao: {
          pagina,
          limite,

          total:
            totalFiltrado,

          totalPaginas,

          temAnterior:
            pagina > 1,

          temProxima:
            pagina <
            totalPaginas,
        },

        submissoes,
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
      "Erro ao consultar submissões da Central de Captação:"
    );
  }
}