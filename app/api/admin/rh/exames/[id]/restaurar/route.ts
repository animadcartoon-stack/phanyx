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
      return NextResponse.json({ error: "Exame inválido." }, { status: 400 });
    }

    const exame = await prisma.exameMedicoRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!exame) {
      return NextResponse.json(
        { error: "Exame médico não encontrado." },
        { status: 404 }
      );
    }

    const motivo = body?.motivo
      ? String(body.motivo).trim()
      : "Restauração realizada pelo Admin.";

    const atualizado = await prisma.$transaction(async (tx) => {
      const exameRestaurado = await tx.exameMedicoRH.update({
        where: { id },
        data: {
          arquivado: false,
          arquivadoEm: null,
          arquivadoPorId: null,
          motivoArquivo: null,

          restauradoEm: new Date(),
          restauradoPorId: user.id,
          motivoRestauracao: motivo,
        },
      });

      await tx.historicoRH.create({
        data: {
          funcionarioId: exame.funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,
          tipo: "EXAME_MEDICO",
          titulo: "Exame médico restaurado",
          descricao: "Registro de exame médico restaurado.",
          dataEvento: new Date(),
          observacoes: motivo,
        },
      });

      return exameRestaurado;
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    console.error("Erro ao restaurar exame médico RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar exame médico RH" },
      { status: 500 }
    );
  }
}