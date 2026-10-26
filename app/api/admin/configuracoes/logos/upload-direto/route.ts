import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUserFromToken } from "@/lib/server-auth";
import { caminhoLogoDaInstituicao, ErroArquivoLogo, LIMITE_LOGO_INSTITUCIONAL, limparNomeLogo, validarArquivoLogo } from "@/lib/logos-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ErroAutorizacaoLogo extends Error {}

async function obterAdministrador() {
  const user = await getUserFromToken();
  if (!user || user.role !== "ADMIN" || !Number.isSafeInteger(user.instituicaoId) || Number(user.instituicaoId) <= 0) {
    throw new ErroAutorizacaoLogo();
  }
  return { userId: user.id, instituicaoId: Number(user.instituicaoId) };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.type === "logo.prepare-upload") {
      const user = await obterAdministrador();
      validarArquivoLogo({ type: body.mimeType, size: body.tamanho });
      const pathname = `instituicoes/${user.instituicaoId}/logos/${randomUUID()}-${limparNomeLogo(body.nome)}`;
      return NextResponse.json({ pathname }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (body?.type !== "blob.generate-client-token" && body?.type !== "blob.upload-completed") {
      return NextResponse.json({ error: "uploadError" }, { status: 400 });
    }
    const resultado = await handleUpload({
      request, body: body as HandleUploadBody,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // A sessão é verificada ao gerar a autorização, nunca confiada ao cliente.
        const user = await obterAdministrador();
        if (!caminhoLogoDaInstituicao(pathname, user.instituicaoId)) throw new ErroAutorizacaoLogo();
        const arquivo = JSON.parse(clientPayload || "{}");
        validarArquivoLogo({ type: arquivo.mimeType, size: arquivo.tamanho });
        return {
          allowedContentTypes: [arquivo.mimeType],
          maximumSizeInBytes: LIMITE_LOGO_INSTITUCIONAL,
          addRandomSuffix: true, allowOverwrite: false,
          validUntil: Date.now() + 5 * 60 * 1000,
          tokenPayload: JSON.stringify(user),
        };
      },
      // O SDK verifica a assinatura. O cadastro continua no POST autenticado de logos.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(resultado, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof ErroAutorizacaoLogo) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (error instanceof ErroArquivoLogo) return NextResponse.json({ error: error.codigo }, { status: 400 });
    console.error("Falha no envio direto de logo institucional.");
    return NextResponse.json({ error: "uploadError" }, { status: 400 });
  }
}
