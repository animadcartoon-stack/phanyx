import {
  Prisma,
  StatusLancamentoFinanceiro,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITUACOES = [
  "TODAS",
  "PENDENTES",
  "PARCIAIS",
  "ATRASADAS",
  "PAGAS",
  "CANCELADAS",
  "SEM_LANCAMENTO",
] as const;

type Situacao =
  (typeof SITUACOES)[number];

function responder(
  corpo: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

function responderErro(
  erro: unknown,
) {
  const resposta =
    respostaErroBiblioteca(
      erro,
    );

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

function inteiroLimitado(
  valor: string | null,
  padrao: number,
  minimo: number,
  maximo: number,
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < minimo
  ) {
    return padrao;
  }

  return Math.min(
    numero,
    maximo,
  );
}

function situacaoValida(
  valor: string | null,
): Situacao {
  const normalizada =
    valor
      ?.trim()
      .toUpperCase();

  if (
    normalizada &&
    SITUACOES.includes(
      normalizada as Situacao,
    )
  ) {
    return normalizada as Situacao;
  }

  return "TODAS";
}

function filtroSituacao(
  situacao: Situacao,
  agora: Date,
): Prisma.BibliotecaEmprestimoWhereInput {
  switch (situacao) {
    case "PENDENTES":
      return {
        multaLancamentoFinanceiro: {
          is: {
            status:
              StatusLancamentoFinanceiro.PENDENTE,

            OR: [
              {
                vencimento: null,
              },
              {
                vencimento: {
                  gte: agora,
                },
              },
            ],
          },
        },
      };

    case "PARCIAIS":
      return {
        multaLancamentoFinanceiro: {
          is: {
            status:
              StatusLancamentoFinanceiro.PARCIAL,

            OR: [
              {
                vencimento: null,
              },
              {
                vencimento: {
                  gte: agora,
                },
              },
            ],
          },
        },
      };

    case "ATRASADAS":
      return {
        multaLancamentoFinanceiro: {
          is: {
            OR: [
              {
                status:
                  StatusLancamentoFinanceiro.ATRASADO,
              },
              {
                status: {
                  in: [
                    StatusLancamentoFinanceiro.PENDENTE,
                    StatusLancamentoFinanceiro.PARCIAL,
                  ],
                },

                vencimento: {
                  lt: agora,
                },
              },
            ],
          },
        },
      };

    case "PAGAS":
      return {
        multaLancamentoFinanceiro: {
          is: {
            status:
              StatusLancamentoFinanceiro.PAGO,
          },
        },
      };

    case "CANCELADAS":
      return {
        multaLancamentoFinanceiro: {
          is: {
            status:
              StatusLancamentoFinanceiro.CANCELADO,
          },
        },
      };

    case "SEM_LANCAMENTO":
      return {
        multaLancamentoFinanceiroId:
          null,
      };

    case "TODAS":
    default:
      return {};
  }
}

function statusFinanceiroEfetivo(
  status:
    StatusLancamentoFinanceiro |
    null,
  vencimento: Date | null,
  agora: Date,
) {
  if (!status) {
    return "SEM_LANCAMENTO";
  }

  if (
    (
      status ===
        StatusLancamentoFinanceiro.PENDENTE ||
      status ===
        StatusLancamentoFinanceiro.PARCIAL
    ) &&
    vencimento &&
    vencimento.getTime() <
      agora.getTime()
  ) {
    return StatusLancamentoFinanceiro
      .ATRASADO;
  }

  return status;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuario nao autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.emprestimos.gerenciar",
    );

    const parametros =
      request.nextUrl.searchParams;

    const situacao =
      situacaoValida(
        parametros.get(
          "situacao",
        ),
      );

    const busca =
      parametros
        .get("q")
        ?.trim()
        .slice(0, 200) ||
      "";

    const pagina =
      inteiroLimitado(
        parametros.get(
          "pagina",
        ),
        1,
        1,
        1_000_000,
      );

    const porPagina =
      inteiroLimitado(
        parametros.get(
          "porPagina",
        ),
        25,
        1,
        100,
      );

    const agora =
      new Date();

    const filtrosBase:
      Prisma.BibliotecaEmprestimoWhereInput[] =
      [
        {
          instituicaoId:
            contexto.instituicaoId,
        },

        {
          valorMultaCalculado: {
            gt: 0,
          },
        },
      ];

    if (busca) {
      filtrosBase.push({
        OR: [
          {
            usuario: {
              is: {
                OR: [
                  {
                    nome: {
                      contains:
                        busca,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    email: {
                      contains:
                        busca,
                      mode:
                        "insensitive",
                    },
                  },
                ],
              },
            },
          },

          {
            exemplar: {
              is: {
                OR: [
                  {
                    codigoInterno: {
                      contains:
                        busca,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    codigoBarras: {
                      contains:
                        busca,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    numeroTombo: {
                      contains:
                        busca,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    item: {
                      is: {
                        OR: [
                          {
                            titulo: {
                              contains:
                                busca,
                              mode:
                                "insensitive",
                            },
                          },
                          {
                            subtitulo: {
                              contains:
                                busca,
                              mode:
                                "insensitive",
                            },
                          },
                          {
                            isbn10: {
                              contains:
                                busca,
                              mode:
                                "insensitive",
                            },
                          },
                          {
                            isbn13: {
                              contains:
                                busca,
                              mode:
                                "insensitive",
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    }

    const whereBase:
      Prisma.BibliotecaEmprestimoWhereInput =
      {
        AND:
          filtrosBase,
      };

    const where:
      Prisma.BibliotecaEmprestimoWhereInput =
      {
        AND: [
          ...filtrosBase,

          filtroSituacao(
            situacao,
            agora,
          ),
        ],
      };

    const contar =
      (
        filtro:
          Prisma.BibliotecaEmprestimoWhereInput,
      ) =>
        prisma
          .bibliotecaEmprestimo
          .count({
            where: {
              AND: [
                ...filtrosBase,
                filtro,
              ],
            },
          });

    const [
      multas,
      totalFiltrado,
      total,
      pendentes,
      parciais,
      atrasadas,
      pagas,
      canceladas,
      semLancamento,
    ] =
      await prisma.$transaction([
        prisma
          .bibliotecaEmprestimo
          .findMany({
            where,

            orderBy: [
              {
                devolvidoEm:
                  "desc",
              },
              {
                atualizadoEm:
                  "desc",
              },
            ],

            skip:
              (pagina - 1) *
              porPagina,

            take:
              porPagina,

            select: {
              id: true,

              status: true,

              emprestadoEm:
                true,

              vencimentoEm:
                true,

              devolvidoEm:
                true,

              diasAtrasoCalculado:
                true,

              multaGerada:
                true,

              valorMultaCalculado:
                true,

              multaLancamentoFinanceiroId:
                true,

              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  role: true,
                },
              },

              exemplar: {
                select: {
                  id: true,
                  itemId: true,

                  codigoInterno:
                    true,

                  codigoBarras:
                    true,

                  numeroTombo:
                    true,

                  item: {
                    select: {
                      id: true,
                      titulo: true,
                      subtitulo:
                        true,
                      isbn10: true,
                      isbn13: true,
                    },
                  },
                },
              },

              multaLancamentoFinanceiro: {
                select: {
                  id: true,

                  tipo: true,

                  descricao:
                    true,

                  valorOriginal:
                    true,

                  valorPago:
                    true,

                  descontoValor:
                    true,

                  jurosValor:
                    true,

                  multaValor:
                    true,

                  valorFinal:
                    true,

                  vencimento:
                    true,

                  pagoEm: true,

                  status: true,

                  observacao:
                    true,

                  createdAt:
                    true,

                  updatedAt:
                    true,

                  aluno: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          }),

        prisma
          .bibliotecaEmprestimo
          .count({
            where,
          }),

        prisma
          .bibliotecaEmprestimo
          .count({
            where:
              whereBase,
          }),

        contar(
          filtroSituacao(
            "PENDENTES",
            agora,
          ),
        ),

        contar(
          filtroSituacao(
            "PARCIAIS",
            agora,
          ),
        ),

        contar(
          filtroSituacao(
            "ATRASADAS",
            agora,
          ),
        ),

        contar(
          filtroSituacao(
            "PAGAS",
            agora,
          ),
        ),

        contar(
          filtroSituacao(
            "CANCELADAS",
            agora,
          ),
        ),

        contar(
          filtroSituacao(
            "SEM_LANCAMENTO",
            agora,
          ),
        ),
      ]);

    const registros =
      multas.map(
        (emprestimo) => {
          const lancamento =
            emprestimo
              .multaLancamentoFinanceiro;

          return {
            id:
              emprestimo.id,

            statusEmprestimo:
              emprestimo.status,

            emprestadoEm:
              emprestimo.emprestadoEm,

            vencimentoEm:
              emprestimo.vencimentoEm,

            devolvidoEm:
              emprestimo.devolvidoEm,

            diasAtraso:
              emprestimo
                .diasAtrasoCalculado,

            multaGerada:
              emprestimo
                .multaGerada,

            valorMultaCalculado:
              emprestimo
                .valorMultaCalculado
                ?.toString() ??
              null,

            usuario:
              emprestimo.usuario,

            exemplar:
              emprestimo.exemplar,

            financeiro:
              lancamento
                ? {
                    id:
                      lancamento.id,

                    descricao:
                      lancamento.descricao,

                    statusPersistido:
                      lancamento.status,

                    statusEfetivo:
                      statusFinanceiroEfetivo(
                        lancamento.status,
                        lancamento.vencimento,
                        agora,
                      ),

                    valorOriginal:
                      lancamento.valorOriginal,

                    valorPago:
                      lancamento.valorPago,

                    descontoValor:
                      lancamento.descontoValor,

                    jurosValor:
                      lancamento.jurosValor,

                    multaValor:
                      lancamento.multaValor,

                    valorFinal:
                      lancamento.valorFinal,

                    vencimento:
                      lancamento.vencimento,

                    pagoEm:
                      lancamento.pagoEm,

                    observacao:
                      lancamento.observacao,

                    aluno:
                      lancamento.aluno,

                    createdAt:
                      lancamento.createdAt,

                    updatedAt:
                      lancamento.updatedAt,
                  }
                : null,
          };
        },
      );

    const totalPaginas =
      Math.max(
        1,
        Math.ceil(
          totalFiltrado /
            porPagina,
        ),
      );

    return responder({
      filtros: {
        situacao,
        busca,
        pagina,
        porPagina,
      },

      resumo: {
        total,
        pendentes,
        parciais,
        atrasadas,
        pagas,
        canceladas,
        semLancamento,
      },

      paginacao: {
        pagina,
        porPagina,
        total:
          totalFiltrado,
        totalPaginas,
      },

      contexto: {
        impersonacao:
          Boolean(
            usuario.impersonacao,
          ),
      },

      multas:
        registros,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
