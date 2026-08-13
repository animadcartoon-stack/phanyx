import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    mensagem: string,
    codigo: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const [podeVer, podeGerenciar] = await Promise.all([
      usuarioPossuiPermissao(
        user,
        "comercial.funis.ver"
      ),
      usuarioPossuiPermissao(
        user,
        "comercial.funis.gerenciar"
      ),
    ]);

    if (!podeVer && !podeGerenciar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para visualizar os funis comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const instituicaoId = Number(user.instituicaoId);

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

    const [
      funis,
      motivosPerda,
      totalLeads,
      leadsSemEstrutura,
    ] = await prisma.$transaction([
      prisma.funilComercial.findMany({
        where: {
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          padrao: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
          arquivadoEm: true,
          etapas: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              categoria: true,
              resultado: true,
              ordem: true,
              cor: true,
              probabilidadeConversao: true,
              prazoMaximoHoras: true,
              exigeProximaAcao: true,
              exigeMotivoPerda: true,
              permiteMovimentoManual: true,
              visivelNoKanban: true,
              ativo: true,
              criadoEm: true,
              atualizadoEm: true,
              arquivadoEm: true,
            },
            orderBy: {
              ordem: "asc",
            },
          },
        },
        orderBy: [
          {
            padrao: "desc",
          },
          {
            nome: "asc",
          },
        ],
      }),

      prisma.motivoPerdaComercial.findMany({
        where: {
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          exigeObservacao: true,
          ordem: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
          arquivadoEm: true,
        },
        orderBy: [
          {
            ordem: "asc",
          },
          {
            nome: "asc",
          },
        ],
      }),

      prisma.lead.count({
        where: {
          instituicaoGestoraId: instituicaoId,
        },
      }),

      prisma.lead.count({
        where: {
          instituicaoGestoraId: instituicaoId,
          OR: [
            {
              funilId: null,
            },
            {
              etapaFunilId: null,
            },
          ],
        },
      }),
    ]);

    const funilPadrao =
      funis.find(
        (funil) =>
          funil.padrao &&
          funil.ativo &&
          funil.etapas.some((etapa) => etapa.ativo)
      ) ?? null;

    return NextResponse.json(
      {
        success: true,
        permissoes: {
          podeVer,
          podeGerenciar,
        },
        configuracao: {
          estruturaConfigurada: Boolean(funilPadrao),
          funilPadraoId: funilPadrao?.id ?? null,
          quantidadeFunis: funis.length,
          quantidadeEtapas:
            funilPadrao?.etapas.length ?? 0,
          quantidadeMotivosPerda: motivosPerda.length,
          totalLeads,
          leadsSemEstrutura,
        },
        funis,
        motivosPerda,
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
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          codigo: error.codigo,
        },
        {
          status: error.status,
        }
      );
    }

    console.error(
      "Erro ao consultar os funis comerciais:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível consultar os funis comerciais.",
        codigo: "ERRO_INTERNO",
      },
      {
        status: 500,
      }
    );
  }
}