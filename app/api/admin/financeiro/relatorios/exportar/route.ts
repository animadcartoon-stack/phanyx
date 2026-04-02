import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return new Response("Sem permissão", { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    const where: any = {
      instituicaoId: user.instituicaoId,
    };

    if (inicio || fim) {
      where.createdAt = {};

      if (inicio) {
        where.createdAt.gte = new Date(`${inicio}T00:00:00`);
      }

      if (fim) {
        where.createdAt.lte = new Date(`${fim}T23:59:59`);
      }
    }

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where,
      include: {
        aluno: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const linhas = [
      [
        "Aluno",
        "Matrícula",
        "Tipo",
        "Descrição",
        "Valor",
        "Pago",
        "Status",
        "Vencimento",
      ],
    ];

    lancamentos.forEach((l) => {
      linhas.push([
        l.aluno?.nome || "",
        l.aluno?.matricula || "",
        l.tipo,
        l.descricao || "",
        String(l.valorFinal ?? l.valorOriginal ?? 0),
        String(l.valorPago ?? 0),
        l.status,
        l.vencimento
          ? new Date(l.vencimento).toLocaleDateString("pt-BR")
          : "",
      ]);
    });

    const csv = linhas
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="relatorio_financeiro.csv"',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Erro ao exportar", { status: 500 });
  }
}