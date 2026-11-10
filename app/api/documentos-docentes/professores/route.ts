import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoDocumentosDocentes } from "@/lib/documentos-docentes/seguranca";
export const dynamic = "force-dynamic";
export async function GET() {
  const contexto = await contextoDocumentosDocentes();
  if (!contexto || contexto.papel !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const professores = await prisma.professor.findMany({
    where: { instituicaoId: contexto.instituicaoId, ativo: true },
    select: { id: true, nome: true }, orderBy: { nome: "asc" }, take: 500,
  });
  return NextResponse.json({ professores }, { headers: { "Cache-Control": "private, no-store" } });
}
