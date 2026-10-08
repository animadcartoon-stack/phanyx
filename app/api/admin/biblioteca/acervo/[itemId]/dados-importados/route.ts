import { NextRequest, NextResponse } from "next/server";
import { ErroBiblioteca, exigirPermissaoBiblioteca, obterContextoBiblioteca, respostaErroBiblioteca } from "@/lib/biblioteca-acesso";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(usuario);
    if (!usuario) throw new ErroBiblioteca(401, "Usuário não autenticado.", "NAO_AUTENTICADO");
    exigirPermissaoBiblioteca(usuario, contexto, "biblioteca.catalogo.ver");
    const id = Number(params.itemId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new ErroBiblioteca(400, "Item inválido.", "ITEM_INVALIDO");
    const item = await prisma.bibliotecaItem.findFirst({ where: { id, instituicaoId: contexto.instituicaoId },
      select: { id: true, titulo: true, registrosImportados: true, imagensImportadas: true } });
    if (!item) throw new ErroBiblioteca(404, "Item não encontrado nesta biblioteca.", "ITEM_NAO_ENCONTRADO");
    return NextResponse.json({ ok: true, item }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    const resposta = respostaErroBiblioteca(erro);
    return NextResponse.json(resposta.corpo, { status: resposta.status });
  }
}
