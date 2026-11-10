import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONTEXTOS_DOCENTES, camposDoModelo, contextoDocumentosDocentes } from "@/lib/documentos-docentes/seguranca";

export const dynamic = "force-dynamic";
export async function GET() {
  const ctx = await contextoDocumentosDocentes();
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const modelos = await prisma.documentoTemplate.findMany({
    where: { instituicaoId: ctx.instituicaoId, ativo: true, tipo: "OUTRO", contexto: { in: [...CONTEXTOS_DOCENTES] } },
    select: { id: true, nome: true, descricao: true, contexto: true, atualizadoEm: true, conteudo: true },
    orderBy: { nome: "asc" }, take: 100,
  });
  return NextResponse.json({ modelos: modelos.map(m => ({ ...m, campos: camposDoModelo(m.conteudo), conteudo: undefined })) }, { headers: { "Cache-Control": "private, no-store" } });
}
