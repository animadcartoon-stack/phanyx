import { NextResponse } from "next/server";
import { contextoDocumentosDocentes } from "@/lib/documentos-docentes/seguranca";
import { resolverLogoDocumentoInstituicao } from "@/lib/documentos/resolver-logo-documento";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contexto = await contextoDocumentosDocentes();
  if (!contexto) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
  const { instituicaoId } = contexto;
  const [instituicao, configuracao] = await Promise.all([
    prisma.instituicao.findUnique({ where: { id: instituicaoId }, select: { nome: true } }),
    prisma.configuracaoInstituicao.findUnique({
      where: { instituicaoId },
      select: { logoUrl: true, nomeFantasia: true },
    }),
  ]);
  if (!instituicao) return NextResponse.json({ error: "Instituição indisponível" }, { status: 404 });
  const { logoUrl } = await resolverLogoDocumentoInstituicao({
    instituicaoId,
    modoLogo: "PRINCIPAL",
    fallbackLogoUrl: configuracao?.logoUrl,
  });
  return NextResponse.json(
    { nome: configuracao?.nomeFantasia || instituicao.nome, logoUrl },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
