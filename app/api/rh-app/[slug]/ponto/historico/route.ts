import { NextRequest, NextResponse } from "next/server";
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
const LIMITE_MAXIMO = 50;

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

  return Number.isNaN(data.getTime()) ? null : data;
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
    const slug = normalizarSlug(contexto.params.slug);

    if (!slug) {
      return NextResponse.json(
        {
          error: "Instituição não identificada.",
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
    const instituicaoId = Number(user.instituicaoId);

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

    const [instituicao, funcionario, configuracao] =
      await Promise.all([
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

    const where: Prisma.MarcacaoPontoMobileRHWhereInput = {
      instituicaoId,
      funcionarioId: funcionario.id,
    };

    const tipos = tiposDoFiltro(tipo);

    if (tipos.length > 0) {
      where.tipo = {
        in: tipos,
      };
    }

    if (dataInicio || dataFim) {
      where.dataLocal = {
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

    if (
      situacao === "VALIDA" ||
      situacao === "INVALIDADA"
    ) {
      where.status = situacao;
    }

    if (situacao === "CORRIGIDA") {
      where.ajustes = {
        some: {},
      };
    }

    const [total, marcacoes] = await Promise.all([
      prisma.marcacaoPontoMobileRH.count({
        where,
      }),

      prisma.marcacaoPontoMobileRH.findMany({
        where,

        orderBy: [
          {
            dataHora: "desc",
          },
          {
            id: "desc",
          },
        ],

        skip: (pagina - 1) * limite,
        take: limite,

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

          ajustes: {
            orderBy: {
              criadoEm: "desc",
            },
            take: 1,
            select: {
              id: true,
              acao: true,
              motivo: true,
              criadoEm: true,

              criadoPor: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      }),
    ]);

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

      marcacoes: marcacoes.map((marcacao) => ({
        id: marcacao.id,
        tipo: marcacao.tipo,
        dataHora: marcacao.dataHora.toISOString(),

        dataLocal:
          marcacao.dataLocal
            .toISOString()
            .slice(0, 10),

        status: marcacao.status,
        statusLocalizacao:
          marcacao.statusLocalizacao,

        comprovanteCodigo:
          marcacao.comprovanteCodigo,

        distanciaMetros:
          marcacao.distanciaMetros,

        origem: marcacao.origem,
        localNome: marcacao.local?.nome || null,

        corrigida:
          marcacao.ajustes.length > 0,

        ultimoAjuste:
          marcacao.ajustes[0]
            ? {
                acao:
                  marcacao.ajustes[0].acao,

                motivo:
                  marcacao.ajustes[0].motivo,

                criadoEm:
                  marcacao.ajustes[0]
                    .criadoEm
                    .toISOString(),

                criadoPorNome:
                  marcacao.ajustes[0]
                    .criadoPor?.nome || null,
              }
            : null,
      })),
    });
  } catch (error) {
    console.error(
      "Erro ao carregar histórico do Ponto Mobile:",
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