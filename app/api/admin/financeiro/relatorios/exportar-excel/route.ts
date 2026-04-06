import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

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

    const dados = lancamentos.map((l) => ({
      Aluno: l.aluno?.nome || "",
      Matrícula: l.aluno?.matricula || "",
      Tipo: l.tipo,
      Descrição: l.descricao || "",
      Valor: Number(l.valorFinal ?? l.valorOriginal ?? 0),
      Pago: Number(l.valorPago ?? 0),
      Status: l.status,
      Vencimento: l.vencimento
        ? new Date(l.vencimento).toLocaleDateString("pt-BR")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="relatorio_financeiro.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Erro ao exportar Excel", { status: 500 });
  }
}