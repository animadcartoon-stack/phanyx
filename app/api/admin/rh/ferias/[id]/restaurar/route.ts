import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);
    const body = await req.json().catch(() => ({}));

    if (!id) {
      return NextResponse.json({ error: "Férias inválida." }, { status: 400 });
    }

    const ferias = await prisma.feriasRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!ferias) {
      return NextResponse.json(
        { error: "Férias não encontrada." },
        { status: 404 }
      );
    }

    const atualizada = await prisma.$transaction(async (tx) => {
  const feriasRestaurada = await tx.feriasRH.update({
    where: { id },
    data: {
      arquivada: false,
      arquivadaEm: null,
      arquivadaPorId: null,
      motivoArquivo: null,

      restauradoEm: new Date(),
      restauradoPorId: user.id,
      motivoRestauracao: body?.motivo
        ? String(body.motivo).trim()
        : "Restauração realizada pelo Admin.",
    },
  });

  await tx.historicoRH.create({
    data: {
      funcionarioId: ferias.funcionarioId,
      instituicaoId: user.instituicaoId,
      criadoPorId: user.id,
      tipo: "FERIAS",
      titulo: "Férias restauradas",
      descricao: "Registro de férias restaurado.",
      dataEvento: new Date(),
      observacoes: body?.motivo
        ? String(body.motivo).trim()
        : "Restauração realizada pelo Admin.",
    },
  });

  return feriasRestaurada;
});

return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao restaurar férias RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar férias RH" },
      { status: 500 }
    );
  }
}