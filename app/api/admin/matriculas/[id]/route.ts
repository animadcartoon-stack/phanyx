import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

// EDITAR MATRÍCULA
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();

  const matricula = await prisma.matricula.update({
    where: {
      id: Number(params.id),
    },
    data: {
      valorMatricula: body.valorMatricula ?? null,
      valorMensalidade: body.valorMensalidade ?? null,
      quantidadeParcelas: body.quantidadeParcelas ?? null,
      dataPrimeiroVencimento: body.dataPrimeiroVencimento
        ? new Date(body.dataPrimeiroVencimento)
        : null,
    },
  });

  return NextResponse.json(matricula);
}