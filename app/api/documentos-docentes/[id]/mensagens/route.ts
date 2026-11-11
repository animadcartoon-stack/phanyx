import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";
export const dynamic = "force-dynamic";
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({ error: "Documento não encontrado ou sem permissão" }, { status: 404 });
  if (auth.documento.status === "CANCELADO") return NextResponse.json({ error: "Documento cancelado" }, { status: 409 });
  const body = await req.json().catch(() => null);
  if (typeof body?.texto !== "string" || !body.texto.trim() || body.texto.length > 10000) return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
  const nova = await prisma.$transaction(async tx => {
    const mensagem = await tx.documentoDocenteMensagem.create({ data: { documentoId: auth.documento.id, autorId: auth.ctx.usuario.id, papel: auth.ctx.papel, texto: body.texto.trim() } });
    await tx.documentoDocenteEvento.create({ data: { documentoId: auth.documento.id, usuarioId: auth.ctx.usuario.id, tipo: "MENSAGEM_ENVIADA", versao: auth.documento.versaoAtual } });
    return mensagem;
  });
  return NextResponse.json({ ok: true, mensagem: nova }, { status: 201 });
}
