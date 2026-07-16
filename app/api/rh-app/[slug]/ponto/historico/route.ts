import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    slug: string;
  };
};

const LIMITE_PADRAO = 10;
const LIMITE_MAXIMO = 31;

function normalizarSlug(valor: unknown) {
  try {
    return decodeURIComponent(String(valor || ""))
      .trim()
      .toLowerCase();
  } catch {
    return String(valor || "")
      .trim()
      .toLowerCase();
  }
}

function inteiroPositivo(
  valor: string | null,
  padrao: number
) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return padrao;
  }

  return numero;
}

function dataCanonica(valor: string | null) {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function tiposDoFiltro(tipo: string) {
  if (tipo === "ENTRADA") {
    return ["ENTRADA", "RETORNO_ALMOCO"];
  }

  if (tipo === "SAIDA") {
    return ["SAIDA", "SAIDA_ALMOCO"];
  }

  return [];
}

export async function GET(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const slug = normalizarSlug(
      contexto.params.slug
    );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Sua sessão expirou. Entre novamente no RH Ponto.",
        },
        {
          status: 401,
        }
      );
    }

    const usuarioId = Number(user.id);
    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário ou instituição não identificado.",
        },
        {
          status: 401,
        }
      );
    }

    const url = new URL(req.url);

    const pagina = inteiroPositivo(
      url.searchParams.get("pagina"),
      1
    );

    const limite = Math.min(
      LIMITE_MAXIMO,
      inteiroPositivo(
        url.searchParams.get("limite"),
        LIMITE_PADRAO
      )
    );

    const tipo = String(
      url.searchParams.get("tipo") || "TODOS"
    )
      .trim()
      .toUpperCase();

    const situacao = String(
      url.searchParams.get("situacao") || "TODOS"
    )
      .trim()
      .toUpperCase();

    const dataInicio = dataCanonica(
      url.searchParams.get("dataInicio")
    );

    const dataFim = dataCanonica(
      url.searchParams.get("dataFim")
    );

    const [
      instituicao,
      funcionario,
      configuracao,
    ] = await Promise.all([
      prisma.instituicao.findFirst({
        where: {
          id: instituicaoId,
          slug,
        },
        select: {
          id: true,
        },
      }),

      prisma.funcionario.findFirst({
        where: {
          userId: usuarioId,
          instituicaoId,
        },
        select: {
          id: true,
          ativo: true,
          pontoMobileLiberado: true,
        },
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },
        select: {
          fusoHorario: true,
        },
      }),
    ]);

    if (!instituicao) {
      return NextResponse.json(
        {
          error:
            "Esta instituição não corresponde ao seu acesso.",
        },
        {
          status: 403,
        }
      );
    }

    if (!funcionario || funcionario.ativo !== true) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado ou inativo.",
        },
        {
          status: 403,
        }
      );
    }

    const where: Prisma.PontoFuncionarioRHWhereInput = {
      instituicaoId,
      funcionarioId: funcionario.id,
    };

    if (dataInicio || dataFim) {
      where.data = {
        ...(dataInicio
          ? {
              gte: dataInicio,
            }
          : {}),

        ...(dataFim
          ? {
              lte: dataFim,
            }
          : {}),
      };
    }

    const tipos = tiposDoFiltro(tipo);

    const filtroMarcacao: Prisma.MarcacaoPontoMobileRHWhereInput =
      {};

    if (tipos.length > 0) {
      filtroMarcacao.tipo = {
        in: tipos,
      };
    }

    if (
      situacao === "VALIDA" ||
      situacao === "INVALIDADA"
    ) {
      filtroMarcacao.status = situacao;
    }

    if (situacao === "CORRIGIDA") {
      where.solicitacoesCorrecaoPontoRH = {
        some: {
          status: "APLICADA",
        },
      };
    } else if (
      tipos.length > 0 ||
      situacao === "VALIDA" ||
      situacao === "INVALIDADA"
    ) {
      where.marcacoesMobile = {
        some: filtroMarcacao,
      };
    }

    const [total, jornadas] =
      await Promise.all([
        prisma.pontoFuncionarioRH.count({
          where,
        }),

        prisma.pontoFuncionarioRH.findMany({
          where,

          orderBy: {
            data: "desc",
          },

          skip: (pagina - 1) * limite,
          take: limite,

          select: {
            id: true,
            data: true,
            status: true,
            horasTrabalhadas: true,
            horasExtras: true,
            horasAtraso: true,
            observacoes: true,

            marcacoesMobile: {
              orderBy: [
                {
                  dataHora: "asc",
                },
                {
                  id: "asc",
                },
              ],

              select: {
                id: true,
                tipo: true,
                dataHora: true,
                dataLocal: true,
                status: true,
                statusLocalizacao: true,
                comprovanteCodigo: true,
                distanciaMetros: true,
                origem: true,

                local: {
                  select: {
                    nome: true,
                  },
                },
              },
            },

            autorizacoesCorrecaoPontoRH: {
              orderBy: {
                criadoEm: "desc",
              },

              take: 1,

              select: {
  id: true,
  status: true,
  motivoAutorizacao: true,
  autorizadoPorNome: true,
  autorizadoEm: true,
  validoAte: true,
  utilizadoEm: true,
  limiteEnvios: true,
  enviosRealizados: true,

  autorizadoPor: {
    select: {
      id: true,
      nome: true,

      funcionario: {
        select: {
          nome: true,
        },
      },
    },
  },
},
            },

            solicitacoesCorrecaoPontoRH: {
              orderBy: {
                criadoEm: "desc",
              },

              take: 1,

              select: {
                id: true,
                status: true,
                motivoFuncionario: true,
                enviadoEm: true,
                aplicadoEm: true,
              },
            },
          },
        }),
      ]);

    const agora = Date.now();

    const totalPaginas = Math.max(
      1,
      Math.ceil(total / limite)
    );

    return NextResponse.json({
      sucesso: true,
      pagina,
      limite,
      total,
      totalPaginas,

      fusoHorario:
        configuracao?.fusoHorario ||
        "America/Sao_Paulo",

      jornadas: jornadas.map((jornada) => {
        const autorizacao =
          jornada
            .autorizacoesCorrecaoPontoRH[0] ||
          null;

        const autorizacaoExpirada =
          autorizacao?.status === "ATIVA" &&
          autorizacao.validoAte.getTime() <=
            agora;

        return {
          id: jornada.id,

          dataLocal:
            jornada.data
              .toISOString()
              .slice(0, 10),

          status: jornada.status,

          horasTrabalhadas:
            jornada.horasTrabalhadas !== null
              ? String(
                  jornada.horasTrabalhadas
                )
              : null,

          horasExtras:
            jornada.horasExtras !== null
              ? String(
                  jornada.horasExtras
                )
              : null,

          horasAtraso:
            jornada.horasAtraso !== null
              ? String(
                  jornada.horasAtraso
                )
              : null,

          observacoes:
            jornada.observacoes,

          marcacoes:
            jornada.marcacoesMobile.map(
              (marcacao) => ({
                id: marcacao.id,
                tipo: marcacao.tipo,

                dataHora:
                  marcacao.dataHora
                    .toISOString(),

                dataLocal:
                  marcacao.dataLocal
                    .toISOString()
                    .slice(0, 10),

                status:
                  marcacao.status,

                statusLocalizacao:
                  marcacao
                    .statusLocalizacao,

                comprovanteCodigo:
                  marcacao
                    .comprovanteCodigo,

                distanciaMetros:
                  marcacao
                    .distanciaMetros,

                origem:
                  marcacao.origem,

                localNome:
                  marcacao.local?.nome ||
                  null,
              })
            ),

          autorizacao: autorizacao
            ? {
                id: autorizacao.id,

                status:
                  autorizacaoExpirada
                    ? "EXPIRADA"
                    : autorizacao.status,

                motivoAutorizacao:
                  autorizacao
                    .motivoAutorizacao,

                autorizadoEm:
                  autorizacao
                    .autorizadoEm
                    .toISOString(),

                validoAte:
                  autorizacao
                    .validoAte
                    .toISOString(),

                utilizadoEm:
                  autorizacao.utilizadoEm
                    ?.toISOString() ||
                  null,

                limiteEnvios:
                  autorizacao.limiteEnvios,

                enviosRealizados:
                  autorizacao
                    .enviosRealizados,

                autorizadoPor: {
  id:
    autorizacao.autorizadoPor.id,

  nome:
    autorizacao.autorizadoPor.nome?.trim() ||
    autorizacao.autorizadoPor.funcionario?.nome?.trim() ||
    autorizacao.autorizadoPorNome?.trim() ||
    "Responsável do RH",
},
              }
            : null,

          ultimaSolicitacao:
            jornada
              .solicitacoesCorrecaoPontoRH[0]
              ? {
                  id:
                    jornada
                      .solicitacoesCorrecaoPontoRH[0]
                      .id,

                  status:
                    jornada
                      .solicitacoesCorrecaoPontoRH[0]
                      .status,

                  motivoFuncionario:
                    jornada
                      .solicitacoesCorrecaoPontoRH[0]
                      .motivoFuncionario,

                  enviadoEm:
                    jornada
                      .solicitacoesCorrecaoPontoRH[0]
                      .enviadoEm
                      ?.toISOString() ||
                    null,

                  aplicadoEm:
                    jornada
                      .solicitacoesCorrecaoPontoRH[0]
                      .aplicadoEm
                      ?.toISOString() ||
                    null,
                }
              : null,
        };
      }),
    });
  } catch (error) {
    console.error(
      "Erro ao carregar histórico diário do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar seus pontos.",
      },
      {
        status: 500,
      }
    );
  }
}