import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: {
    externalReference: string;
  };
};

export async function GET(
  _req: Request,
  { params }: RouteContext
) {
  try {
    const externalReference = decodeURIComponent(
      String(params.externalReference || "")
    ).trim();

    if (
      !externalReference ||
      !externalReference.startsWith(
        "IBE_MATRICULA_"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Referência de matrícula inválida.",
        },
        { status: 400 }
      );
    }

    const preMatricula =
      await prisma.matriculaOnlineIbe.findUnique({
        where: {
          externalReference,
        },
        select: {
          externalReference: true,
          nome: true,
          email: true,
          valorTotal: true,
          valorPago: true,
          status: true,
          modoPagamento: true,
          quantidadePartes: true,
          createdAt: true,

          pagamentos: {
            orderBy: {
              ordem: "asc",
            },
            select: {
              ordem: true,
              formaSolicitada: true,
              billingTypeAsaas: true,
              tipoIntegracao: true,
              valor: true,
              status: true,
              checkoutUrl: true,
              expiraEm: true,
              pagoEm: true,
            },
          },
        },
      });

    if (!preMatricula) {
      return NextResponse.json(
        {
          error:
            "Pré-matrícula não encontrada.",
        },
        { status: 404 }
      );
    }

    const valorTotal = Number(
      preMatricula.valorTotal || 0
    );

    const valorPago = Number(
      preMatricula.valorPago || 0
    );

    const saldoRestante = Math.max(
      0,
      Number(
        (valorTotal - valorPago).toFixed(2)
      )
    );

    return NextResponse.json({
      matricula: {
        externalReference:
          preMatricula.externalReference,

        nome: preMatricula.nome,
        email: preMatricula.email,

        valorTotal,
        valorPago,
        saldoRestante,

        status: preMatricula.status,

        modoPagamento:
          preMatricula.modoPagamento,

        quantidadePartes:
          preMatricula.quantidadePartes,

        criadaEm:
          preMatricula.createdAt,
      },

      pagamentos:
        preMatricula.pagamentos.map(
          (pagamento) => ({
            ordem: pagamento.ordem,

            forma:
              pagamento.formaSolicitada,

            billingTypeAsaas:
              pagamento.billingTypeAsaas,

            tipoIntegracao:
              pagamento.tipoIntegracao,

            valor: Number(
              pagamento.valor || 0
            ),

            status: pagamento.status,

            urlPagamento:
              pagamento.checkoutUrl,

            expiraEm:
              pagamento.expiraEm,

            pagoEm:
              pagamento.pagoEm,
          })
        ),
    });
  } catch (error: any) {
    console.error(
      "Erro ao consultar pagamentos da matrícula IBE:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao consultar os pagamentos.",
      },
      { status: 500 }
    );
  }
}