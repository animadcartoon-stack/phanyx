import {
  StatusEmprestimoBiblioteca,
  StatusLancamentoFinanceiro,
  StatusRenovacaoBiblioteca,
  StatusReservaBiblioteca,
  TipoAcessoBiblioteca,
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

function inicioDoDiaUTC(valor: string) {
  const data =
    new Date(`${valor}T00:00:00.000Z`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function fimDoDiaUTC(valor: string) {
  const data =
    new Date(`${valor}T23:59:59.999Z`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function dataISO(data: Date) {
  return data.toISOString().slice(0, 10);
}

function contarPorStatus<T extends string>(
  valores: Array<{ status: T }>,
) {
  const resultado: Record<string, number> = {};

  for (const item of valores) {
    resultado[item.status] =
      (resultado[item.status] || 0) + 1;
  }

  return resultado;
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
      "biblioteca.relatorios.ver",
    );

    const parametros =
      request.nextUrl.searchParams;

    const hoje = new Date();

    const fimPadrao =
      new Date(
        Date.UTC(
          hoje.getUTCFullYear(),
          hoje.getUTCMonth(),
          hoje.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

    const inicioPadrao =
      new Date(fimPadrao);

    inicioPadrao.setUTCDate(
      inicioPadrao.getUTCDate() - 29,
    );

    inicioPadrao.setUTCHours(
      0,
      0,
      0,
      0,
    );

    const inicioTexto =
      parametros.get("inicio")?.trim() ||
      dataISO(inicioPadrao);

    const fimTexto =
      parametros.get("fim")?.trim() ||
      dataISO(fimPadrao);

    const inicio =
      inicioDoDiaUTC(inicioTexto);

    const fim =
      fimDoDiaUTC(fimTexto);

    if (!inicio) {
      throw new ErroBiblioteca(
        400,
        "Data inicial invalida.",
        "DATA_INICIAL_INVALIDA",
      );
    }

    if (!fim) {
      throw new ErroBiblioteca(
        400,
        "Data final invalida.",
        "DATA_FINAL_INVALIDA",
      );
    }

    if (
      inicio.getTime() >
      fim.getTime()
    ) {
      throw new ErroBiblioteca(
        400,
        "A data inicial nao pode ser posterior a data final.",
        "PERIODO_INVALIDO",
      );
    }

    const instituicaoId =
      contexto.instituicaoId;

    const intervalo = {
      gte: inicio,
      lte: fim,
    };

    const [
      emprestimosPeriodo,
      devolucoesPeriodo,
      renovacoesPeriodo,
      reservasPeriodo,
      totalItens,
      totalExemplares,
      exemplaresPorStatus,
      acessosPeriodo,
      usuariosDigitais,
      progressosConcluidos,
      lancamentosMulta,
      emprestimosPorUsuario,
      emprestimosPorExemplar,
    ] = await Promise.all([
      prisma.bibliotecaEmprestimo.findMany({
        where: {
          instituicaoId,
          emprestadoEm: intervalo,
        },
        select: {
          status: true,
        },
      }),

      prisma.bibliotecaEmprestimo.count({
        where: {
          instituicaoId,
          devolvidoEm: intervalo,
        },
      }),

      prisma.bibliotecaRenovacao.findMany({
        where: {
          instituicaoId,
          solicitadaEm: intervalo,
        },
        select: {
          status: true,
        },
      }),

      prisma.bibliotecaReserva.findMany({
        where: {
          instituicaoId,
          reservadaEm: intervalo,
        },
        select: {
          status: true,
        },
      }),

      prisma.bibliotecaItem.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.bibliotecaExemplar.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.bibliotecaExemplar.groupBy({
        by: [
          "status",
        ],
        where: {
          instituicaoId,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.bibliotecaHistoricoAcesso.findMany({
        where: {
          instituicaoId,
          iniciadoEm: intervalo,
        },
        select: {
          tipo: true,
        },
      }),

      prisma.bibliotecaHistoricoAcesso.findMany({
        where: {
          instituicaoId,
          iniciadoEm: intervalo,
        },
        distinct: [
          "usuarioId",
        ],
        select: {
          usuarioId: true,
        },
      }),

      prisma.bibliotecaProgressoLeitura.count({
        where: {
          instituicaoId,
          concluidoEm: intervalo,
        },
      }),

      prisma.lancamentoFinanceiro.findMany({
        where: {
          instituicaoId,
          createdAt: intervalo,
          bibliotecaEmprestimoMulta: {
            isNot: null,
          },
        },
        select: {
          status: true,
          valorOriginal: true,
          valorPago: true,
        },
      }),

      prisma.bibliotecaEmprestimo.groupBy({
        by: [
          "usuarioId",
        ],
        where: {
          instituicaoId,
          emprestadoEm: intervalo,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.bibliotecaEmprestimo.groupBy({
        by: [
          "exemplarId",
        ],
        where: {
          instituicaoId,
          emprestadoEm: intervalo,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const usuariosRanking =
      [...emprestimosPorUsuario]
        .sort(
          (a, b) =>
            b._count._all -
            a._count._all,
        )
        .slice(
          0,
          10,
        );

    const usuariosIds =
      usuariosRanking.map(
        (item) =>
          item.usuarioId,
      );

    const usuarios =
      usuariosIds.length
        ? await prisma.user.findMany({
            where: {
              instituicaoId,
              id: {
                in: usuariosIds,
              },
            },
            select: {
              id: true,
              nome: true,
              email: true,
            },
          })
        : [];

    const usuariosMapa =
      new Map<
        number,
        (typeof usuarios)[number]
      >();

    for (const item of usuarios) {
      usuariosMapa.set(
        item.id,
        item,
      );
    }

    const exemplaresIds =
      emprestimosPorExemplar.map(
        (item) =>
          item.exemplarId,
      );

    const exemplares =
      exemplaresIds.length
        ? await prisma.bibliotecaExemplar.findMany({
            where: {
              instituicaoId,
              id: {
                in: exemplaresIds,
              },
            },
            select: {
              id: true,
              item: {
                select: {
                  id: true,
                  titulo: true,
                  subtitulo: true,
                  isbn13: true,
                },
              },
            },
          })
        : [];

    const exemplarMapa =
      new Map<
        number,
        (typeof exemplares)[number]
      >();

    for (const item of exemplares) {
      exemplarMapa.set(
        item.id,
        item,
      );
    }

    const itensRanking =
      new Map<
        number,
        {
          itemId: number;
          titulo: string;
          subtitulo: string | null;
          isbn13: string | null;
          quantidade: number;
        }
      >();

    for (
      const grupo
      of emprestimosPorExemplar
    ) {
      const exemplar =
        exemplarMapa.get(
          grupo.exemplarId,
        );

      if (!exemplar) {
        continue;
      }

      const atual =
        itensRanking.get(
          exemplar.item.id,
        );

      if (atual) {
        atual.quantidade +=
          grupo._count._all;
      } else {
        itensRanking.set(
          exemplar.item.id,
          {
            itemId:
              exemplar.item.id,

            titulo:
              exemplar.item.titulo,

            subtitulo:
              exemplar.item.subtitulo,

            isbn13:
              exemplar.item.isbn13,

            quantidade:
              grupo._count._all,
          },
        );
      }
    }

    const rankingItens =
      [...itensRanking.values()]
        .sort(
          (a, b) =>
            b.quantidade -
            a.quantidade,
        )
        .slice(
          0,
          10,
        );

    const multas = {
      quantidade:
        lancamentosMulta.length,

      valorGerado:
        lancamentosMulta.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.valorOriginal ||
                0,
            ),
          0,
        ),

      valorPago:
        lancamentosMulta.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.valorPago ||
                0,
            ),
          0,
        ),

      pendentes:
        lancamentosMulta.filter(
          (item) =>
            item.status ===
              StatusLancamentoFinanceiro.PENDENTE ||
            item.status ===
              StatusLancamentoFinanceiro.PARCIAL ||
            item.status ===
              StatusLancamentoFinanceiro.ATRASADO,
        ).length,

      pagas:
        lancamentosMulta.filter(
          (item) =>
            item.status ===
            StatusLancamentoFinanceiro.PAGO,
        ).length,

      canceladas:
        lancamentosMulta.filter(
          (item) =>
            item.status ===
            StatusLancamentoFinanceiro.CANCELADO,
        ).length,
    };

    const valorEmAberto =
      Number(
        (
          multas.valorGerado -
          multas.valorPago
        ).toFixed(
          2,
        ),
      );

    return NextResponse.json({
      periodo: {
        inicio:
          inicioTexto,
        fim:
          fimTexto,
      },

      circulacao: {
        emprestimos:
          emprestimosPeriodo.length,

        devolucoes:
          devolucoesPeriodo,

        ativos:
          emprestimosPeriodo.filter(
            (item) =>
              item.status ===
              StatusEmprestimoBiblioteca.ATIVO,
          ).length,

        atrasados:
          emprestimosPeriodo.filter(
            (item) =>
              item.status ===
              StatusEmprestimoBiblioteca.ATRASADO,
          ).length,

        devolvidos:
          emprestimosPeriodo.filter(
            (item) =>
              item.status ===
              StatusEmprestimoBiblioteca.DEVOLVIDO,
          ).length,

        perdidos:
          emprestimosPeriodo.filter(
            (item) =>
              item.status ===
              StatusEmprestimoBiblioteca.PERDIDO,
          ).length,

        danificados:
          emprestimosPeriodo.filter(
            (item) =>
              item.status ===
              StatusEmprestimoBiblioteca.DANIFICADO,
          ).length,

        cancelados:
          emprestimosPeriodo.filter(
            (item) =>
              item.status ===
              StatusEmprestimoBiblioteca.CANCELADO,
          ).length,
      },

      renovacoes: {
        total:
          renovacoesPeriodo.length,

        solicitadas:
          renovacoesPeriodo.filter(
            (item) =>
              item.status ===
              StatusRenovacaoBiblioteca.SOLICITADA,
          ).length,

        aprovadas:
          renovacoesPeriodo.filter(
            (item) =>
              item.status ===
              StatusRenovacaoBiblioteca.APROVADA,
          ).length,

        recusadas:
          renovacoesPeriodo.filter(
            (item) =>
              item.status ===
              StatusRenovacaoBiblioteca.RECUSADA,
          ).length,

        canceladas:
          renovacoesPeriodo.filter(
            (item) =>
              item.status ===
              StatusRenovacaoBiblioteca.CANCELADA,
          ).length,
      },

      reservas: {
        total:
          reservasPeriodo.length,

        aguardando:
          reservasPeriodo.filter(
            (item) =>
              item.status ===
              StatusReservaBiblioteca.AGUARDANDO,
          ).length,

        disponiveis:
          reservasPeriodo.filter(
            (item) =>
              item.status ===
              StatusReservaBiblioteca.DISPONIVEL,
          ).length,

        atendidas:
          reservasPeriodo.filter(
            (item) =>
              item.status ===
              StatusReservaBiblioteca.ATENDIDA,
          ).length,

        expiradas:
          reservasPeriodo.filter(
            (item) =>
              item.status ===
              StatusReservaBiblioteca.EXPIRADA,
          ).length,

        canceladas:
          reservasPeriodo.filter(
            (item) =>
              item.status ===
              StatusReservaBiblioteca.CANCELADA,
          ).length,
      },

      multas: {
        ...multas,
        valorEmAberto,
      },

      acervo: {
        titulos:
          totalItens,

        exemplares:
          totalExemplares,

        porStatus:
          Object.fromEntries(
            exemplaresPorStatus.map(
              (item) => [
                item.status,
                item._count._all,
              ],
            ),
          ),
      },

      digital: {
        acessos:
          acessosPeriodo.length,

        usuariosUnicos:
          usuariosDigitais.length,

        leituras:
          acessosPeriodo.filter(
            (item) =>
              item.tipo ===
              TipoAcessoBiblioteca.LEITURA,
          ).length,

        visualizacoes:
          acessosPeriodo.filter(
            (item) =>
              item.tipo ===
              TipoAcessoBiblioteca.VISUALIZACAO,
          ).length,

        downloads:
          acessosPeriodo.filter(
            (item) =>
              item.tipo ===
              TipoAcessoBiblioteca.DOWNLOAD,
          ).length,

        reproducoes:
          acessosPeriodo.filter(
            (item) =>
              item.tipo ===
              TipoAcessoBiblioteca.REPRODUCAO,
          ).length,

        retomadas:
          acessosPeriodo.filter(
            (item) =>
              item.tipo ===
              TipoAcessoBiblioteca.RETOMADA,
          ).length,

        conclusoesRegistradas:
          acessosPeriodo.filter(
            (item) =>
              item.tipo ===
              TipoAcessoBiblioteca.CONCLUSAO,
          ).length,

        leiturasConcluidas:
          progressosConcluidos,
      },

      rankings: {
        itensMaisEmprestados:
          rankingItens,

        usuariosMaisAtivos:
          usuariosRanking.map(
            (item) => {
              const usuarioRanking =
                usuariosMapa.get(
                  item.usuarioId,
                );

              return {
                usuarioId:
                  item.usuarioId,

                nome:
                  usuarioRanking?.nome ||
                  "-",

                email:
                  usuarioRanking?.email ||
                  null,

                quantidade:
                  item._count._all,
              };
            },
          ),
      },

      statusInternos: {
        emprestimos:
          contarPorStatus(
            emprestimosPeriodo,
          ),

        renovacoes:
          contarPorStatus(
            renovacoesPeriodo,
          ),

        reservas:
          contarPorStatus(
            reservasPeriodo,
          ),
      },
    });
  } catch (erro) {
    const resposta =
      respostaErroBiblioteca(
        erro,
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      },
    );
  }
}
