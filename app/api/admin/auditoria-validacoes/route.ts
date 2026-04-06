import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const suspeito = searchParams.get("suspeito");
    const status = searchParams.get("status");
    const busca = searchParams.get("busca") || "";

    const where: any = {
      ...(suspeito === "true" && { suspeito: true }),
      ...(status === "valido" && { valido: true }),
      ...(status === "invalido" && { valido: false }),
      ...(busca && {
        codigoConsultado: {
          contains: busca,
          mode: "insensitive",
        },
      }),
    };

    const dados = await prisma.auditoriaValidacaoDocumento.findMany({
      where,
      orderBy: {
        criadoEm: "desc",
      },
      take: 100,
    });

    return NextResponse.json(dados);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar auditoria" },
      { status: 500 }
    );
  }
}