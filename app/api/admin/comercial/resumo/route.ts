import {
  NextResponse,
} from "next/server";

import {
  StatusLancamentoComissaoRH,
  StatusMatricula,
  StatusMetaComercial,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";
import { apurarMetaComercial } from "@/lib/comercial/apurar-meta-comercial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function numeroSeguro(
  valor: unknown
) {
  const numero =
    Number(valor ?? 0);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function arredondarCentavos(
  valor: number
) {
  return Math.round(
    (valor + Number.EPSILON) *
      100
  ) / 100;
}

function inicioDoMes(
  data: Date
) {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function fimDoMes(
  data: Date
) {
  return new Date(
    data.getFullYear(),
    data.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const permitido =
      await usuarioPossuiPermissao(
        user,
        "comercial.dashboard.ver"
      );

    const podeVerComercial =
      permitido ||
      (await usuarioPossuiPermissao(
        user,
        "comercial.ver"
      ));

    if (!podeVerComercial) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para visualizar o painel comercial.",
        },
        {
          status: 403,
        }
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
      return NextResponse.json(
        {
          error:
            "Instituição inválida.",
        },
        {
          status: 403,
        }
      );
    }

    const agora =
      new Date();

    const inicioMes =
      inicioDoMes(agora);

    const fimMes =
      fimDoMes(agora);

    /*
     * 1. LEADS ATIVOS
     *
     * FECHADO e PERDIDO não fazem
     * mais parte do funil ativo.
     */

    const leadsAtivos =
      await prisma.lead.count({
        where: {
          instituicaoGestoraId:
            instituicaoId,

          tipo:
            "INSTITUICAO",

          status: {
            in: [
              "NOVO",
              "CONTATO",
              "NEGOCIACAO",
              "PROPOSTA",
            ],
          },
        },
      });

    /*
     * 2. VENDAS NO PERÍODO
     *
     * Usamos as matrículas comerciais
     * válidas do mês atual.
     */

    const vendasPeriodo =
      await prisma.matricula.count({
        where: {
          instituicaoId,

          status: {
            in: [
              StatusMatricula.ATIVA,
              StatusMatricula.A_INICIAR,
              StatusMatricula.CONCLUIDA,
            ],
          },

          OR: [
            {
              confirmadaEm: {
                gte: inicioMes,
                lte: fimMes,
              },
            },

            {
              confirmadaEm:
                null,

              createdAt: {
                gte: inicioMes,
                lte: fimMes,
              },
            },
          ],
        },
      });

    /*
     * 3. METAS DO PERÍODO
     *
     * Consideramos metas ativas ou
     * encerradas que cruzam o mês atual.
     */

    const metasPeriodo =
      await prisma.metaComercial.findMany({
        where: {
          instituicaoId,

          status: {
            in: [
              StatusMetaComercial.ATIVA,
              StatusMetaComercial.ENCERRADA,
            ],
          },

          dataInicio: {
            lte: fimMes,
          },

          dataFim: {
            gte: inicioMes,
          },
        },

        select: {
          id: true,
          instituicaoId: true,
          equipeId: true,
          funcionarioId: true,
          cursoId: true,
          poloId: true,
          escopo: true,
          indicador: true,
          valorAlvo: true,
          dataInicio: true,
          dataFim: true,
        },
      });

    const apuracoesMetas =
      await Promise.all(
        metasPeriodo.map(
          async (meta) => {
            return apurarMetaComercial({
              id:
                meta.id,

              instituicaoId:
                meta.instituicaoId,

              equipeId:
                meta.equipeId,

              funcionarioId:
                meta.funcionarioId,

              cursoId:
                meta.cursoId,

              poloId:
                meta.poloId,

              escopo:
                meta.escopo,

              indicador:
                meta.indicador,

              valorAlvo:
                meta.valorAlvo,

              dataInicio:
                meta.dataInicio,

              dataFim:
                meta.dataFim,
            });
          }
        )
      );

    const metasAtingidas =
      apuracoesMetas.filter(
        (apuracao) =>
          apuracao.atingida
      ).length;

    /*
     * 4. COMISSÕES PENDENTES
     *
     * Valor ainda aguardando análise
     * comercial na competência atual.
     */

    const comissoesPendentes =
      await prisma.lancamentoComissaoRH.findMany({
        where: {
          instituicaoId,

          status:
            StatusLancamentoComissaoRH.PENDENTE,

          competenciaMes:
            agora.getMonth() + 1,

          competenciaAno:
            agora.getFullYear(),
        },

        select: {
          id: true,
          valorCalculado: true,
        },
      });

    const comissoesPendentesValor =
      arredondarCentavos(
        comissoesPendentes.reduce(
          (
            total,
            lancamento
          ) =>
            total +
            numeroSeguro(
              lancamento.valorCalculado
            ),
          0
        )
      );

    return NextResponse.json(
      {
        leadsAtivos,

        vendasPeriodo,

        metasAtingidas,

        metasTotal:
          metasPeriodo.length,

        comissoesPendentesQuantidade:
          comissoesPendentes.length,

        comissoesPendentesValor,

        periodo: {
          mes:
            agora.getMonth() +
            1,

          ano:
            agora.getFullYear(),
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar resumo comercial:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar o resumo comercial.",
      },
      {
        status: 500,
      }
    );
  }
}