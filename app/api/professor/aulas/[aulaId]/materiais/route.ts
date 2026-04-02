import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: Request, { params }: { params: { aulaId: string } }) {
  const user = getUserFromToken();
  if (!user || user.role !== "professor") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const aulaId = Number(params.aulaId);
  if (!Number.isFinite(aulaId) || aulaId <= 0) return NextResponse.json({ error: "aulaId inválido" }, { status: 400 });

  // garante aula dentro da instituição e do professor
  const professor = await prisma.professor.findFirst({
    where: { userId: user.id, instituicaoId: user.instituicaoId },
    select: { id: true },
  });
  if (!professor) return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });

  const aula = await prisma.aula.findFirst({
    where: { id: aulaId, disciplina: { professorId: professor.id, instituicaoId: user.instituicaoId } },
    select: { id: true },
  });
  if (!aula) return NextResponse.json({ error: "Aula não encontrada/sem acesso" }, { status: 404 });

  const body = await req.json();

  const material = await prisma.materialAula.create({
    data: {
      aulaId,
      tipo: body.tipo, // "ARQUIVO" | "LINK" | "VIDEO"
      titulo: String(body.titulo ?? "Material"),
      url: body.url ? String(body.url) : null,
      arquivoNome: body.arquivoNome ? String(body.arquivoNome) : null,
      mimeType: body.mimeType ? String(body.mimeType) : null,
      tamanho: body.tamanho != null ? Number(body.tamanho) : null,
    },
  });

  return NextResponse.json(material);
}