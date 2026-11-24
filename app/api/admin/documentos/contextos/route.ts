import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { normalizarNomeContexto, chaveNomeContexto } from "@/lib/documentos/contextos-documento";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "ADMIN" || typeof user.instituicaoId !== "number" || !Number.isSafeInteger(user.instituicaoId) || user.instituicaoId <= 0) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const contextos = await prisma.contextoDocumentoPersonalizado.findMany({ where: { instituicaoId: user.instituicaoId }, select: { nome: true }, orderBy: { nome: "asc" } });
    return NextResponse.json(contextos.map(c => c.nome), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Erro ao listar contextos", error);
    return NextResponse.json({ error: "CONTEXT_LOAD_FAILED" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "ADMIN" || typeof user.instituicaoId !== "number" || !Number.isSafeInteger(user.instituicaoId) || user.instituicaoId <= 0) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json().catch(() => null);
    const nome = normalizarNomeContexto(body?.nome);
    if (!nome) return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    const chave = chaveNomeContexto(nome);
    // Atomic uniqueness per institution, including concurrent requests.
    await prisma.contextoDocumentoPersonalizado.createMany({ data: [{ instituicaoId: user.instituicaoId, nome, chave }], skipDuplicates: true });
    const contexto = await prisma.contextoDocumentoPersonalizado.findUniqueOrThrow({ where: { instituicaoId_chave: { instituicaoId: user.instituicaoId, chave } }, select: { nome: true } });
    return NextResponse.json(contexto, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Erro ao cadastrar contexto", error);
    return NextResponse.json({ error: "CONTEXT_CREATE_FAILED" }, { status: 500 });
  }
}
