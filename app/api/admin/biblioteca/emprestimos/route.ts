import {
  Prisma,
  StatusEmprestimoBiblioteca,
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

const DIA_EM_MS =
  24 * 60 * 60 * 1000;

const DIAS_VENCENDO_EM_BREVE = 3;

const SITUACOES = [
  "TODOS",
  "ATIVOS",
  "ATRASADOS",
  "VENCENDO",
  "DEVOLVIDOS",
  "OCORRENCIAS",
] as const;

type SituacaoFiltro =
  (typeof SITUACOES)[number];

function responder(
  corpo: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(corpo, {
    status,

    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

function responderErro(
  erro: unknown,
) {
  const resposta =
    respostaErroBiblioteca(erro);

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
  const numero = Number(valor);

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
): SituacaoFiltro {
  const normalizado =
    valor
      ?.trim()
      .toUpperCase();

  if (
    normalizado &&
    SITUACOES.includes(
      normalizado as SituacaoFiltro,
    )
  ) {
    return normalizado as SituacaoFiltro;
  }

  return "TODOS";
}

function filtroSituacao(
  situacao: SituacaoFiltro,
  agora: Date,
  limiteVencimento: Date,
): Prisma.BibliotecaEmprestimoWhereInput {
  switch (situacao) {
    case "ATIVOS":
      return {
        status:
          StatusEmprestimoBiblioteca.ATIVO,

        vencimentoEm: {
          gte: agora,
        },
      };

    case "ATRASADOS":
      return {
        OR: [
          {
            status:
              StatusEmprestimoBiblioteca
                .ATRASADO,
          },
          {
            status:
              StatusEmprestimoBiblioteca
                .ATIVO,

            vencimentoEm: {
              lt: agora,
            },
          },
        ],
      };

    case "VENCENDO":
      return {
        status:
          StatusEmprestimoBiblioteca.ATIVO,

        vencimentoEm: {
          gte: agora,
          lte: limiteVencimento,
        },
      };

    case "DEVOLVIDOS":
      return {
        status:
          StatusEmprestimoBiblioteca
            .DEVOLVIDO,
      };

    case "OCORRENCIAS":
      return {
        status: {
          in: [
            StatusEmprestimoBiblioteca
              .PERDIDO,

            StatusEmprestimoBiblioteca
              .DANIFICADO,

            StatusEmprestimoBiblioteca
              .CANCELADO,
          ],
        },
      };

    case "TODOS":
    default:
      return {};
  }
}

function statusEfetivo(
  status: StatusEmprestimoBiblioteca,
  vencimentoEm: Date,
  agora: Date,
) {
  if (
    status ===
      StatusEmprestimoBiblioteca.ATIVO &&
    vencimentoEm.getTime() <
      agora.getTime()
  ) {
    return StatusEmprestimoBiblioteca
      .ATRASADO;
  }

  return status;
}

function diasAtrasoAtual(
  status:
    StatusEmprestimoBiblioteca,
  vencimentoEm: Date,
  agora: Date,
) {
  const efetivo =
    statusEfetivo(
      status,
      vencimentoEm,
      agora,
    );

  if (
    efetivo !==
    StatusEmprestimoBiblioteca
      .ATRASADO
  ) {
    return 0;
  }

  const diferenca =
    agora.getTime() -
    vencimentoEm.getTime();

  return Math.max(
    1,
    Math.ceil(
      diferenca / DIA_EM_MS,
    ),
  );
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
        parametros.get("situacao"),
      );

    const busca =
      parametros
        .get("q")
        ?.trim()
        .slice(0, 200) || "";

    const pagina =
      inteiroLimitado(
        parametros.get("pagina"),
        1,
        1,
        1_000_000,
      );

    const porPagina =
      inteiroLimitado(
        parametros.get("porPagina"),
        25,
        1,
        100,
      );

    const agora =
      new Date();

    const limiteVencimento =
      new Date(
        agora.getTime() +
          DIAS_VENCENDO_EM_BREVE *
            DIA_EM_MS,
      );

    const filtrosBase:
      Prisma.BibliotecaEmprestimoWhereInput[] =
        [
          {
            instituicaoId:
              contexto.instituicaoId,
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
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                  {
                    email: {
                      contains: busca,
                      mode: "insensitive",
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
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                  {
                    codigoBarras: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                  {
                    numeroTombo: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                  {
                    item: {
                      is: {
                        OR: [
                          {
                            titulo: {
                              contains: busca,
                              mode:
                                "insensitive",
                            },
                          },
                          {
                            subtitulo: {
                              contains: busca,
                              mode:
                                "insensitive",
                            },
                          },
                          {
                            isbn10: {
                              contains: busca,
                              mode:
                                "insensitive",
                            },
                          },
                          {
                            isbn13: {
                              contains: busca,
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
          AND: filtrosBase,
        };

    const where:
      Prisma.BibliotecaEmprestimoWhereInput =
        {
          AND: [
            ...filtrosBase,

            filtroSituacao(
              situacao,
              agora,
              limiteVencimento,
            ),
          ],
        };

    let orderBy:
      Prisma.BibliotecaEmprestimoOrderByWithRelationInput[];

    if (
      situacao === "ATIVOS" ||
      situacao === "ATRASADOS" ||
      situacao === "VENCENDO"
    ) {
      orderBy = [
        {
          vencimentoEm: "asc",
        },
        {
          emprestadoEm: "desc",
        },
      ];
    } else if (
      situacao === "DEVOLVIDOS"
    ) {
      orderBy = [
        {
          devolvidoEm: "desc",
        },
      ];
    } else {
      orderBy = [
        {
          emprestadoEm: "desc",
        },
      ];
    }

    const [
      emprestimos,
      totalFiltrado,
      total,
      ativos,
      atrasados,
      vencendo,
      devolvidos,
      ocorrencias,
    ] = await prisma.$transaction([
      prisma.bibliotecaEmprestimo
        .findMany({
          where,

          orderBy,

          skip:
            (pagina - 1) *
            porPagina,

          take: porPagina,

          select: {
            id: true,
            status: true,

            emprestadoEm: true,
            vencimentoEm: true,
            devolvidoEm: true,

            quantidadeRenovacoes:
              true,

            devolucaoCondicao: true,

            diasAtrasoCalculado:
              true,

            bloqueioGerado: true,
            multaGerada: true,
            valorMultaCalculado:
              true,

            multaLancamentoFinanceiroId:
              true,

            canceladoEm: true,
            motivoCancelamento:
              true,

            criadoEm: true,
            atualizadoEm: true,

            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
              },
            },

            exemplar: {
              select: {
                id: true,
                itemId: true,

                tipo: true,
                status: true,

                codigoInterno:
                  true,

                codigoBarras:
                  true,

                numeroTombo:
                  true,

                patrimonio: true,

                unidadeSnapshot:
                  true,

                setor: true,
                sala: true,
                estante: true,
                prateleira: true,

                localizacaoCompleta:
                  true,

                item: {
                  select: {
                    id: true,
                    titulo: true,
                    subtitulo: true,
                    tipo: true,
                    capaUrl: true,
                    isbn10: true,
                    isbn13: true,
                  },
                },
              },
            },

            renovacoes: {
              orderBy: {
                solicitadaEm:
                  "desc",
              },

              select: {
                id: true,
                status: true,

                vencimentoAnterior:
                  true,

                novoVencimento:
                  true,

                solicitadaEm:
                  true,

                analisadaEm:
                  true,
              },
            },
          },
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where,
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where: whereBase,
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where: {
            AND: [
              ...filtrosBase,

              filtroSituacao(
                "ATIVOS",
                agora,
                limiteVencimento,
              ),
            ],
          },
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where: {
            AND: [
              ...filtrosBase,

              filtroSituacao(
                "ATRASADOS",
                agora,
                limiteVencimento,
              ),
            ],
          },
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where: {
            AND: [
              ...filtrosBase,

              filtroSituacao(
                "VENCENDO",
                agora,
                limiteVencimento,
              ),
            ],
          },
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where: {
            AND: [
              ...filtrosBase,

              filtroSituacao(
                "DEVOLVIDOS",
                agora,
                limiteVencimento,
              ),
            ],
          },
        }),

      prisma.bibliotecaEmprestimo
        .count({
          where: {
            AND: [
              ...filtrosBase,

              filtroSituacao(
                "OCORRENCIAS",
                agora,
                limiteVencimento,
              ),
            ],
          },
        }),
    ]);

    const dados =
      emprestimos.map(
        (emprestimo) => {
          const statusAtual =
            statusEfetivo(
              emprestimo.status,
              emprestimo.vencimentoEm,
              agora,
            );

          const diasAtraso =
            diasAtrasoAtual(
              emprestimo.status,
              emprestimo.vencimentoEm,
              agora,
            );

          const vencendoEmBreve =
            statusAtual ===
              StatusEmprestimoBiblioteca
                .ATIVO &&
            emprestimo.vencimentoEm
              .getTime() <=
              limiteVencimento.getTime();

          return {
            ...emprestimo,

            valorMultaCalculado:
              emprestimo
                .valorMultaCalculado
                ?.toString() ??
              null,

            statusPersistido:
              emprestimo.status,

            statusEfetivo:
              statusAtual,

            atrasado:
              statusAtual ===
              StatusEmprestimoBiblioteca
                .ATRASADO,

            diasAtrasoAtual:
              diasAtraso,

            vencendoEmBreve,
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

        diasVencendoEmBreve:
          DIAS_VENCENDO_EM_BREVE,
      },

      resumo: {
        total,
        ativos,
        atrasados,
        vencendo,
        devolvidos,
        ocorrencias,
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

      emprestimos: dados,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}
