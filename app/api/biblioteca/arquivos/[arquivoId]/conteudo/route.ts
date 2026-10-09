import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterTokenBibliotecaBlob } from "@/lib/biblioteca-storage";
import { arquivoPdfLeitor, erroLeitor, falhaLeitor, idLeitor, obterLeitorBiblioteca } from "@/lib/biblioteca-leitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca();
    const { arquivo } = await arquivoPdfLeitor(leitor, idLeitor(params.arquivoId));
    const resultado = await get(arquivo.storageKey!, {
      access: "private", token: obterTokenBibliotecaBlob(), abortSignal: request.signal,
    });
    if (resultado?.statusCode !== 200 || !resultado.stream) falhaLeitor(404, "PDF_INDISPONIVEL");
    if (!leitor.impersonacao) await prisma.bibliotecaHistoricoAcesso.create({ data: {
      instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId,
      itemId: arquivo.itemId, arquivoId: arquivo.id, tipo: "LEITURA",
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent")?.slice(0, 2000) || null,
    } });
    return new NextResponse(resultado.stream, { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": "inline",
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN",
    } });
  } catch (erro) { return erroLeitor(erro); }
}
