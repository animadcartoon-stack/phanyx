import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: {
    id: string;
  };
};

function calcularPercentual(
  concluido: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (concluido / total) * 100
      )
    )
  );
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        {
          error: "Sem permissão.",
        },
        {
          status: 403,
        }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        {
          status: 400,
        }
      );
    }

    const plano =
      await obterPlanoInstituicao(
        user.instituicaoId
      );

    if (
      !planoTemRecurso(
        plano,
        "CRACHAS_EMISSAO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A emissão de crachás está disponível a partir do Plano Profissional.",
          codigo:
            "RECURSO_NAO_DISPONIVEL_NO_PLANO",
        },
        {
          status: 403,
        }
      );
    }

    const loteId = Number(params.id);

    if (
      !Number.isInteger(loteId) ||
      loteId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Identificador de lote inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const lote =
      await prisma.crachaLoteEmissao.findFirst({
        where: {
          id: loteId,
          instituicaoId:
            user.instituicaoId,
        },
      });

    if (!lote) {
      return NextResponse.json(
        {
          error:
            "Lote de emissão não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const [
      modelo,
      arquivos,
      cancelados,
      pendentes,
    ] = await Promise.all([
      prisma.crachaModelo.findFirst({
        where: {
          id: lote.modeloId,
          instituicaoId:
            user.instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          tipoPessoa: true,
        },
      }),

      prisma.crachaLoteArquivo.findMany({
        where: {
          loteId: lote.id,
        },
        orderBy: {
          numero: "asc",
        },
        select: {
          id: true,
          numero: true,
          status: true,
          total: true,
          processados: true,
          erros: true,
          tentativas: true,
          pdfUrl: true,
          tamanhoBytes: true,
          erroMensagem: true,
          iniciadoEm: true,
          finalizadoEm: true,
          atualizadoEm: true,
        },
      }),

      prisma.crachaLoteItem.count({
        where: {
          loteId: lote.id,
          status: "CANCELADO",
        },
      }),

      prisma.crachaLoteItem.count({
        where: {
          loteId: lote.id,
          status: {
            in: [
              "PENDENTE",
              "PROCESSANDO",
            ],
          },
        },
      }),
    ]);

    const quantidadeConcluida =
      lote.processados +
      lote.erros +
      lote.semFoto +
      cancelados;

    const percentual =
      calcularPercentual(
        quantidadeConcluida,
        lote.total
      );

    return NextResponse.json({
      lote: {
        id: lote.id,
        nome: lote.nome,
        tipoPessoa: lote.tipoPessoa,
        status: lote.status,
        total: lote.total,
        aptos: lote.aptos,
        semFoto: lote.semFoto,
        processados: lote.processados,
        erros: lote.erros,
        cancelados,
        pendentes,
        percentual,
        tamanhoArquivo:
          lote.tamanhoArquivo,
        totalArquivos:
          lote.totalArquivos,
        arquivosConcluidos:
          lote.arquivosConcluidos,
        cancelamentoSolicitado:
          lote.cancelamentoSolicitado,
        erroMensagem:
          lote.erroMensagem,
        criadoEm: lote.criadoEm,
        iniciadoEm: lote.iniciadoEm,
        atualizadoEm:
          lote.atualizadoEm,
        finalizadoEm:
          lote.finalizadoEm,
        modelo,
        arquivos: arquivos.map(
          (arquivo) => ({
            ...arquivo,
            tamanhoBytes:
              arquivo.tamanhoBytes !==
              null
                ? arquivo.tamanhoBytes.toString()
                : null,
            disponivelDownload:
              arquivo.status ===
                "CONCLUIDO" &&
              Boolean(arquivo.pdfUrl),
            downloadUrl:
              arquivo.status ===
                "CONCLUIDO" &&
              arquivo.pdfUrl
                ? `/api/admin/crachas/lotes-massivos/${lote.id}/arquivos/${arquivo.id}/download`
                : null,
          })
        ),
      },
    });
  } catch (error: any) {
    console.error(
      "ERRO AO CONSULTAR LOTE MASSIVO DE CRACHÁS:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Não foi possível consultar o lote.",
      },
      {
        status: 500,
      }
    );
  }
}