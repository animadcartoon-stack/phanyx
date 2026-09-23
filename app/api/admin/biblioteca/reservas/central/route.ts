import {
  Prisma,
  StatusReservaBiblioteca,
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

const POR_PAGINA_PADRAO = 25;
const POR_PAGINA_MAXIMO = 100;

type Situacao =
  | "TODAS"
  | "AGUARDANDO"
  | "DISPONIVEIS"
  | "ATENDIDAS"
  | "EXPIRADAS"
  | "CANCELADAS";

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

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
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

function inteiroPositivo(
  valor: string | null,
  padrao: number,
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return padrao;
  }

  return numero;
}

function normalizarSituacao(
  valor: string | null,
): Situacao {
  const situacoes:
    Situacao[] = [
      "TODAS",
      "AGUARDANDO",
      "DISPONIVEIS",
      "ATENDIDAS",
      "EXPIRADAS",
      "CANCELADAS",
    ];

  const candidata =
    String(
      valor || "TODAS",
    ).toUpperCase() as
      Situacao;

  return situacoes.includes(
    candidata,
  )
    ? candidata
    : "TODAS";
}

function whereSituacao(
  situacao: Situacao,
): Prisma.BibliotecaReservaWhereInput {
  switch (situacao) {
    case "AGUARDANDO":
      return {
        status:
          StatusReservaBiblioteca.AGUARDANDO,
      };

    case "DISPONIVEIS":
      return {
        status:
          StatusReservaBiblioteca.DISPONIVEL,
      };

    case "ATENDIDAS":
      return {
        status:
          StatusReservaBiblioteca.ATENDIDA,
      };

    case "EXPIRADAS":
      return {
        status:
          StatusReservaBiblioteca.EXPIRADA,
      };

    case "CANCELADAS":
      return {
        status:
          StatusReservaBiblioteca.CANCELADA,
      };

    default:
      return {};
  }
}

export async function GET(
  request: NextRequest,
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
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
      "biblioteca.reservas.gerenciar",
    );

    const { searchParams } =
      new URL(request.url);

    const situacao =
      normalizarSituacao(
        searchParams.get(
          "situacao",
        ),
      );

    const busca =
      (
        searchParams.get("q") ||
        ""
      ).trim();

    const pagina =
      inteiroPositivo(
        searchParams.get(
          "pagina",
        ),
        1,
      );

    const porPagina =
      Math.min(
        POR_PAGINA_MAXIMO,
        inteiroPositivo(
          searchParams.get(
            "porPagina",
          ),
          POR_PAGINA_PADRAO,
        ),
      );

    const base:
      Prisma.BibliotecaReservaWhereInput =
      {
        instituicaoId:
          contexto.instituicaoId,
      };

    const filtroSituacao =
      whereSituacao(
        situacao,
      );

    const filtroBusca:
      Prisma.BibliotecaReservaWhereInput =
      busca
        ? {
            OR: [
              {
                usuario: {
                  is: {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                usuario: {
                  is: {
                    email: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                item: {
                  is: {
                    titulo: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                item: {
                  is: {
                    subtitulo: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                item: {
                  is: {
                    isbn10: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                item: {
                  is: {
                    isbn13: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                exemplar: {
                  is: {
                    codigoInterno: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                exemplar: {
                  is: {
                    codigoBarras: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                exemplar: {
                  is: {
                    numeroTombo: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {};

    const where:
      Prisma.BibliotecaReservaWhereInput =
      {
        AND: [
          base,
          filtroSituacao,
          filtroBusca,
        ],
      };

    const agora =
      new Date();

    const [
      total,
      aguardando,
      disponiveis,
      atendidas,
      expiradas,
      canceladas,
      reservas,
    ] =
      await prisma.$transaction([
        prisma.bibliotecaReserva.count({
          where: base,
        }),

        prisma.bibliotecaReserva.count({
          where: {
            ...base,
            status:
              StatusReservaBiblioteca.AGUARDANDO,
          },
        }),

        prisma.bibliotecaReserva.count({
          where: {
            ...base,
            status:
              StatusReservaBiblioteca.DISPONIVEL,
          },
        }),

        prisma.bibliotecaReserva.count({
          where: {
            ...base,
            status:
              StatusReservaBiblioteca.ATENDIDA,
          },
        }),

        prisma.bibliotecaReserva.count({
          where: {
            ...base,
            status:
              StatusReservaBiblioteca.EXPIRADA,
          },
        }),

        prisma.bibliotecaReserva.count({
          where: {
            ...base,
            status:
              StatusReservaBiblioteca.CANCELADA,
          },
        }),

        prisma.bibliotecaReserva.findMany({
          where,

          orderBy: [
            {
              reservadaEm: "desc",
            },
            {
              id: "desc",
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
            posicaoFila: true,

            reservadaEm: true,
            disponivelEm: true,
            expiraEm: true,
            atendidaEm: true,
            canceladaEm: true,

            origem: true,
            observacao: true,
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
              },
            },

            item: {
              select: {
                id: true,
                titulo: true,
                subtitulo: true,
                isbn10: true,
                isbn13: true,
              },
            },

            exemplar: {
              select: {
                id: true,
                codigoInterno: true,
                codigoBarras: true,
                numeroTombo: true,
                status: true,
              },
            },
          },
        }),
      ]);

    const totalFiltrado =
      await prisma
        .bibliotecaReserva
        .count({
          where,
        });

    const totalPaginas =
      Math.max(
        1,
        Math.ceil(
          totalFiltrado /
            porPagina,
        ),
      );

    return responder({
      ok: true,

      contexto: {
        impersonacao:
          usuario.impersonacao ===
          true,
      },

      filtros: {
        situacao,
        q: busca,
        pagina,
        porPagina,
      },

      resumo: {
        total,
        aguardando,
        disponiveis,
        atendidas,
        expiradas,
        canceladas,
      },

      paginacao: {
        pagina,
        porPagina,
        total:
          totalFiltrado,
        totalPaginas,
      },

      reservas:
        reservas.map(
          (reserva) => ({
            ...reserva,

            prazoExpirado:
              reserva.status ===
                StatusReservaBiblioteca.DISPONIVEL &&
              reserva.expiraEm !==
                null &&
              reserva.expiraEm <=
                agora,

            podeCancelar:
              reserva.status ===
                StatusReservaBiblioteca.AGUARDANDO ||
              reserva.status ===
                StatusReservaBiblioteca.DISPONIVEL,
          }),
        ),
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
