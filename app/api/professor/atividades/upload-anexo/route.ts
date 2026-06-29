import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const nomeSeguro = sanitizeFileName(file.name || "anexo");
    const caminho = `atividades/${user.instituicaoId}/${user.id}/${Date.now()}-${nomeSeguro}`;

    const blob = await put(caminho, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      ok: true,
      key: blob.pathname,
      url: blob.url,
      nomeOriginal: file.name,
      mimeType: file.type || "application/octet-stream",
      tamanho: file.size,
    });
  } catch (error: any) {
    console.error("ERRO UPLOAD ANEXO ATIVIDADE:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao enviar anexo da atividade" },
      { status: 500 }
    );
  }
}