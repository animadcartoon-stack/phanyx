import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

function inteiroPositivo(
  valor: string | null,
  padrao: number
) {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return padrao;
  }

  return numero;
}

function dataCanonica(
  valor: string | null
) {
  if (
    !valor ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return null;
  }

  const data = new Date(
    `${valor}T00:00:00.000Z`
  );

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function paraDataHora(
  data: string,
  hora?: string | null
) {
  if (!hora) return null;

  /*
   * O lançamento manual antigo permanece disponível
   * temporariamente. O horário é tratado como horário
   * local de Brasília até a tela de correção auditada
   * substituir este POST.
   */
  return new Date(
    `${data}T${hora}:00-03:00`
  );
}

function calcularHoras(
  inicio: Date | null,
  fim: Date | null
) {
  if (!inicio || !fim) return 0;

  return Math.max(
    0,
    (fim.getTime() - inicio.getTime()) /
      1000 /
      60 /
      60
  );
}

function tiposDoFiltro(
  tipo: string
) {
  if (tipo === "ENTRADA") {
    return [
      "ENTRADA",
      "RETORNO_ALMOCO",
    ];
  }

  if (tipo === "SAIDA") {
    return [
      "SAIDA",
      "SAIDA_ALMOCO",
    ];
  }

  return [];
}

export async function GET(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
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

    const busca = String(
      url.searchParams.get("busca") || ""
    )
      .trim()
      .slice(0, 120);

    const tipo = String(
      url.searchParams.get("tipo") ||
        "TODOS"
    )
      .trim()
      .toUpperCase();

    const statusMarcacao = String(
      url.searchParams.get(
        "statusMarcacao"
      ) || "TODOS"
    )
      .trim()
      .toUpperCase();

    const statusPonto = String(
      url.searchParams.get(
        "statusPonto"
      ) || "TODOS"
    )
      .trim()
      .toUpperCase();

    const dataInicio = dataCanonica(
      url.searchParams.get(
        "dataInicio"
      )
    );

    const dataFim = dataCanonica(
      url.searchParams.get("dataFim")
    );

    const where: Prisma.PontoFuncionarioRHWhereInput =
      {
        instituicaoId,
      };

    if (busca) {
      where.funcionario = {
        is: {
          OR: [
            {
              nome: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              cargo: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              codigoFuncionario: {
                contains: busca,
                mode: "insensitive",
              },
            },
          ],
        },
      };
    }

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

    if (
      statusPonto !== "TODOS" &&
      statusPonto
    ) {
      where.status = statusPonto;
    }

    const filtroMarcacao: Prisma.MarcacaoPontoMobileRHWhereInput =
      {};

    const tipos = tiposDoFiltro(tipo);

    if (tipos.length > 0) {
      filtroMarcacao.tipo = {
        in: tipos,
      };
    }

    if (
      statusMarcacao !== "TODOS" &&
      [
        "VALIDA",
        "INVALIDADA",
      ].includes(statusMarcacao)
    ) {
      filtroMarcacao.status =
        statusMarcacao;
    }

    const possuiFiltroMarcacao =
      tipos.length > 0 ||
      statusMarcacao !== "TODOS";

    if (possuiFiltroMarcacao) {
      where.marcacoesMobile = {
        some: filtroMarcacao,
      };
    }

    const [
  total,
  pontos,
  configuracao,
  usuarioAtual,
] = await Promise.all([
      prisma.pontoFuncionarioRH.count({
        where,
      }),

      prisma.pontoFuncionarioRH.findMany({
        where,

        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              codigoFuncionario: true,

              departamento: {
                select: {
                  nome: true,
                },
              },
            },
          },

          marcacoesMobile: {
            where: possuiFiltroMarcacao
              ? filtroMarcacao
              : undefined,

            orderBy: {
              dataHora: "asc",
            },

            select: {
              id: true,
              tipo: true,
              dataHora: true,
              dataLocal: true,
              status: true,
              statusLocalizacao: true,
              comprovanteCodigo: true,
              origem: true,
              distanciaMetros: true,

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
        },

        orderBy: [
          {
            data: "desc",
          },
          {
            funcionario: {
              nome: "asc",
            },
          },
        ],

        skip: (pagina - 1) * limite,
        take: limite,
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          fusoHorario: true,
        },
      }),
      prisma.user.findFirst({
  where: {
    id: Number(user.id),
    instituicaoId,
  },

  select: {
    id: true,
    nome: true,
    email: true,

    funcionario: {
      select: {
        nome: true,
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
      responsavelAtual: {
  id:
    usuarioAtual?.id ||
    Number(user.id),

  nome:
    usuarioAtual?.nome?.trim() ||
    usuarioAtual?.funcionario?.nome?.trim() ||
    usuarioAtual?.email?.trim() ||
    "Responsável do RH",
},

      fusoHorario:
        configuracao?.fusoHorario ||
        "America/Sao_Paulo",

      pontos: pontos.map((ponto) => ({
        id: ponto.id,

        /*
         * dataLocal é enviada como texto puro.
         * Assim, 16/07 nunca vira 15/07 por causa
         * da conversão de fuso no navegador.
         */
        dataLocal:
          ponto.data
            .toISOString()
            .slice(0, 10),

        entrada:
          ponto.entrada?.toISOString() ||
          null,

        saidaAlmoco:
          ponto.saidaAlmoco?.toISOString() ||
          null,

        retornoAlmoco:
          ponto.retornoAlmoco?.toISOString() ||
          null,

        saida:
          ponto.saida?.toISOString() ||
          null,

        horasTrabalhadas:
          ponto.horasTrabalhadas !== null
            ? String(
                ponto.horasTrabalhadas
              )
            : null,

        horasExtras:
          ponto.horasExtras !== null
            ? String(ponto.horasExtras)
            : null,

        horasAtraso:
          ponto.horasAtraso !== null
            ? String(ponto.horasAtraso)
            : null,

        status: ponto.status,
        observacoes:
          ponto.observacoes,

        funcionario:
          ponto.funcionario,

        marcacoes:
          ponto.marcacoesMobile.map(
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

              origem:
                marcacao.origem,

              distanciaMetros:
                marcacao
                  .distanciaMetros,

              localNome:
                marcacao.local?.nome ||
                null,
            })
          ),

        autorizacaoCorrecao: (() => {
          const autorizacao =
            ponto
              .autorizacoesCorrecaoPontoRH[0];

          if (!autorizacao) {
            return null;
          }

          const expirada =
            autorizacao.status === "ATIVA" &&
            autorizacao.validoAte.getTime() <=
              Date.now();

          return {
            id: autorizacao.id,

            status: expirada
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
                ?.toISOString() || null,

            limiteEnvios:
              autorizacao.limiteEnvios,

            enviosRealizados:
              autorizacao.enviosRealizados,

            autorizadoPor: {
  id:
    autorizacao.autorizadoPor.id,

  nome:
    autorizacao.autorizadoPor.nome?.trim() ||
    autorizacao.autorizadoPor.funcionario?.nome?.trim() ||
    autorizacao.autorizadoPorNome?.trim() ||
    "Responsável do RH",
},
          };
        })(),
      })),
    });
  } catch (error) {
    console.error(
      "Erro ao carregar pontos do RH:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar pontos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const body = await req.json();

    const data = String(
      body.data || ""
    );

    const funcionarioId = Number(
      body.funcionarioId
    );

    if (
      !funcionarioId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        data
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Informe funcionário e data.",
        },
        {
          status: 400,
        }
      );
    }

    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          id: funcionarioId,
          instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    const entrada = paraDataHora(
      data,
      body.entrada
    );

    const saidaAlmoco =
      paraDataHora(
        data,
        body.saidaAlmoco
      );

    const retornoAlmoco =
      paraDataHora(
        data,
        body.retornoAlmoco
      );

    const saida = paraDataHora(
      data,
      body.saida
    );

    const horasManha =
      calcularHoras(
        entrada,
        saidaAlmoco
      );

    const horasTarde =
      calcularHoras(
        retornoAlmoco,
        saida
      );

    const horasTrabalhadas =
      horasManha + horasTarde;

    const jornada = Number(
      body.jornada || 8
    );

    const horasExtras = Math.max(
      0,
      horasTrabalhadas - jornada
    );

    const horasAtraso = Math.max(
      0,
      jornada - horasTrabalhadas
    );

    const ponto =
      await prisma.pontoFuncionarioRH.create({
        data: {
          funcionarioId,
          instituicaoId,

          data: new Date(
            `${data}T00:00:00.000Z`
          ),

          entrada,
          saidaAlmoco,
          retornoAlmoco,
          saida,
          horasTrabalhadas,
          horasExtras,
          horasAtraso,

          observacoes:
            body.observacoes || null,

          status:
            body.status ||
            "REGISTRADO",
        },
      });

    return NextResponse.json(ponto);
  } catch (error) {
    console.error(
      "Erro ao salvar ponto manual:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao salvar ponto.",
      },
      {
        status: 500,
      }
    );
  }
}