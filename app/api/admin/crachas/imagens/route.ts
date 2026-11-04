import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { LIMITE_LOGO_ENVIO } from "@/lib/imagens/preparar-logo-upload";
import { limparNomeLogo } from "@/lib/logos-upload";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

const FORMATOS_IMAGEM: ReadonlyMap<string, string> = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpeg"],
  ["image/jpg", "jpeg"],
  ["image/webp", "webp"],
]);

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user?.instituicaoId || !isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const plano = await obterPlanoInstituicao(user.instituicaoId);
    if (!planoTemRecurso(plano, "CRACHAS_EDITOR")) {
      return NextResponse.json({ error: "Recurso indisponível no plano." }, { status: 403 });
    }

    const arquivo = (await req.formData()).get("file");
    if (!(arquivo instanceof File) || !arquivo.size || !FORMATOS_IMAGEM.has(arquivo.type)) {
      return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
    }
    if (arquivo.size > LIMITE_LOGO_ENVIO) {
      return NextResponse.json({ error: "Imagem acima do limite de envio." }, { status: 413 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const metadados = await sharp(buffer).metadata().catch(() => null);
    if (metadados?.format !== FORMATOS_IMAGEM.get(arquivo.type)) {
      return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
    }

    const caminho = `instituicoes/${user.instituicaoId}/crachas/${limparNomeLogo(arquivo.name)}`;
    const blob = await put(caminho, buffer, {
      access: "public",
      contentType: arquivo.type,
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("Erro ao enviar imagem do crachá:", error);
    return NextResponse.json({ error: "Erro ao enviar imagem do crachá." }, { status: 500 });
  }
}
