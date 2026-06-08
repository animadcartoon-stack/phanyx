import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
      orderBy: {
        nome: "asc",
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
        setor: true,
        salario: true,
        salarioBase: true,
        codigoFuncionario: true,
        codigoPonto: true,
        pisPasep: true,
        dataAdmissao: true,
        statusFuncionario: true,
      },
    });

    return NextResponse.json({ funcionarios });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar funcionários" },
      { status: 500 }
    );
  }
}