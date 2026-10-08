import { AcaoAuditoriaBiblioteca } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ErroBiblioteca, exigirPermissaoBiblioteca, obterContextoBiblioteca, respostaErroBiblioteca } from "@/lib/biblioteca-acesso";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { loteId: string } }) {
  try {
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(usuario);
    if (!usuario) throw new ErroBiblioteca(401, "Usuário não autenticado.", "NAO_AUTENTICADO");
    exigirPermissaoBiblioteca(usuario, contexto, "biblioteca.catalogo.ver");
    if (!/^[a-f\d-]{36}$/i.test(params.loteId)) throw new ErroBiblioteca(400, "Lote inválido.", "LOTE_INVALIDO");
    const auditoria = await prisma.bibliotecaAuditoria.findFirst({ where: {
      instituicaoId: contexto.instituicaoId, entidade: "BibliotecaImportacaoLote",
      entidadeId: params.loteId, acao: AcaoAuditoriaBiblioteca.CRIAR,
    }, select: { metadados: true } });
    const m = auditoria?.metadados;
    if (!m || typeof m !== "object" || Array.isArray(m) || typeof m.conteudoOriginalBase64 !== "string")
      throw new ErroBiblioteca(404, "Arquivo original não encontrado neste lote.", "ORIGINAL_NAO_ENCONTRADO");
    const nome = typeof m.arquivoNome === "string" ? m.arquivoNome.replace(/\\/g, "/").split("/").pop()! : "acervo-original";
    return new NextResponse(Buffer.from(m.conteudoOriginalBase64, "base64"), { headers: {
      "Content-Type": "application/octet-stream", "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome).replace(/'/g, "%27")}`,
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (erro) {
    const resposta = respostaErroBiblioteca(erro);
    return NextResponse.json(resposta.corpo, { status: resposta.status });
  }
}
