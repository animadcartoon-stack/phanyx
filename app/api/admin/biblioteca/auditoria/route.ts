import {
  AcaoAuditoriaBiblioteca,
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

function responder(
  corpo: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
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
    respostaErroBiblioteca(erro);

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

function inteiroPositivo(
  valor: string | null,
  padrao: number,
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

function inicioDoDiaUtc(
  valor: string,
) {
  const data =
    new Date(`${valor}T00:00:00.000Z`);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return data;
}

function fimDoDiaUtc(
  valor: string,
) {
  const data =
    new Date(`${valor}T23:59:59.999Z`);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return data;
}

function dataIso(
  data: Date,
) {
  return data
    .toISOString()
    .slice(0, 10);
}

function periodoPadrao() {
  const fim = new Date();

  const inicio =
    new Date(
      fim.getTime() -
        29 *
          24 *
          60 *
          60 *
          1000,
    );

  return {
    inicio:
      dataIso(inicio),

    fim:
      dataIso(fim),
  };
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
      "biblioteca.auditoria.ver",
    );

    const url =
      new URL(request.url);

    const padrao =
      periodoPadrao();

    const inicioTexto =
      url.searchParams.get(
        "inicio",
      ) || padrao.inicio;

    const fimTexto =
      url.searchParams.get(
        "fim",
      ) || padrao.fim;

    const inicio =
      inicioDoDiaUtc(
        inicioTexto,
      );

    const fim =
      fimDoDiaUtc(
        fimTexto,
      );

    if (!inicio || !fim) {
      falhar(
        400,
        "O período informado é inválido.",
        "PERIODO_INVALIDO",
      );
    }

    if (
      inicio.getTime() >
      fim.getTime()
    ) {
      falhar(
        400,
        "A data inicial não pode ser posterior à data final.",
        "PERIODO_INVALIDO",
      );
    }

    const acaoTexto =
      String(
        url.searchParams.get(
          "acao",
        ) || "",
      )
        .trim()
        .toUpperCase();

    const entidade =
      String(
        url.searchParams.get(
          "entidade",
        ) || "",
      ).trim();

    const busca =
      String(
        url.searchParams.get(
          "busca",
        ) || "",
      ).trim();

    const usuarioIdTexto =
      url.searchParams.get(
        "usuarioId",
      );

    const usuarioId =
      usuarioIdTexto
        ? Number(
            usuarioIdTexto,
          )
        : null;

    if (
      usuarioIdTexto &&
      (
        !Number.isInteger(
          usuarioId,
        ) ||
        Number(
          usuarioId,
        ) <= 0
      )
    ) {
      falhar(
        400,
        "O usuário informado é inválido.",
        "USUARIO_INVALIDO",
      );
    }

    const pagina =
      inteiroPositivo(
        url.searchParams.get(
          "pagina",
        ),
        1,
      );

    const porPagina =
      Math.min(
        inteiroPositivo(
          url.searchParams.get(
            "porPagina",
          ),
          25,
        ),
        100,
      );

    const acoesDisponiveis =
      Object.values(
        AcaoAuditoriaBiblioteca,
      );

    let acao:
      | AcaoAuditoriaBiblioteca
      | undefined;

    if (acaoTexto) {
      if (
        !acoesDisponiveis.includes(
          acaoTexto as AcaoAuditoriaBiblioteca,
        )
      ) {
        falhar(
          400,
          "A ação de auditoria informada é inválida.",
          "ACAO_INVALIDA",
        );
      }

      acao =
        acaoTexto as AcaoAuditoriaBiblioteca;
    }

    let usuariosBusca:
      number[] = [];

    if (busca) {
      const encontrados =
        await prisma.user.findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,

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

          select: {
            id: true,
          },

          take: 100,
        });

      usuariosBusca =
        encontrados.map(
          (item) =>
            item.id,
        );
    }

    const where = {
      instituicaoId:
        contexto.instituicaoId,

      criadoEm: {
        gte:
          inicio,
        lte:
          fim,
      },

      ...(acao
        ? {
            acao,
          }
        : {}),

      ...(entidade
        ? {
            entidade,
          }
        : {}),

      ...(usuarioId
        ? {
            usuarioId,
          }
        : {}),

      ...(busca
        ? {
            OR: [
              {
                entidade: {
                  contains:
                    busca,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                entidadeId: {
                  contains:
                    busca,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                descricao: {
                  contains:
                    busca,
                  mode:
                    "insensitive" as const,
                },
              },
              ...(usuariosBusca.length
                ? [
                    {
                      usuarioId: {
                        in:
                          usuariosBusca,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [
      total,
      registros,
      entidadesAgrupadas,
      usuariosAuditoria,
      resumoAcoes,
    ] =
      await prisma.$transaction([
        prisma
          .bibliotecaAuditoria
          .count({
            where,
          }),

        prisma
          .bibliotecaAuditoria
          .findMany({
            where,

            orderBy: [
              {
                criadoEm:
                  "desc",
              },
              {
                id:
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

              entidade:
                true,

              entidadeId:
                true,

              acao:
                true,

              descricao:
                true,

              dadosAnteriores:
                true,

              dadosPosteriores:
                true,

              metadados:
                true,

              ip:
                true,

              userAgent:
                true,

              criadoEm:
                true,

              usuarioId:
                true,

              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  role: true,
                },
              },
            },
          }),

        prisma
          .bibliotecaAuditoria
          .groupBy({
            by: [
              "entidade",
            ],

            where: {
              instituicaoId:
                contexto.instituicaoId,
            },

            _count: {
              _all: true,
            },

            orderBy: {
              entidade:
                "asc",
            },
          }),

        prisma
          .bibliotecaAuditoria
          .findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,

              usuarioId: {
                not: null,
              },
            },

            distinct: [
              "usuarioId",
            ],

            orderBy: {
              criadoEm:
                "desc",
            },

            select: {
              usuarioId:
                true,

              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  role: true,
                },
              },
            },
          }),

        prisma
          .bibliotecaAuditoria
          .groupBy({
            by: [
              "acao",
            ],

            where: {
              instituicaoId:
                contexto.instituicaoId,

              criadoEm: {
                gte:
                  inicio,
                lte:
                  fim,
              },
            },

            _count: {
              _all: true,
            },
          }),
      ]);

    const totalPaginas =
      Math.max(
        1,
        Math.ceil(
          total /
            porPagina,
        ),
      );

    return responder({
      filtros: {
        inicio:
          inicioTexto,

        fim:
          fimTexto,

        acao:
          acao || "",

        entidade,

        usuarioId,

        busca,

        pagina,

        porPagina,
      },

      paginacao: {
        pagina,

        porPagina,

        total,

        totalPaginas,
      },

      opcoes: {
        acoes:
          acoesDisponiveis,

        entidades:
          entidadesAgrupadas.map(
            (item) => ({
              entidade:
                item.entidade,

              total:
                item._count._all,
            }),
          ),

        usuarios:
          usuariosAuditoria
            .filter(
              (item) =>
                item.usuario,
            )
            .map(
              (item) =>
                item.usuario,
            ),
      },

      resumo: {
        total,

        porAcao:
          Object.fromEntries(
            resumoAcoes.map(
              (item) => [
                item.acao,
                item._count._all,
              ],
            ),
          ),
      },

      registros:
        registros.map(
          (registro) => ({
            ...registro,

            id:
              registro.id.toString(),
          }),
        ),
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
