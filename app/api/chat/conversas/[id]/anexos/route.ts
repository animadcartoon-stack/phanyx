import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function tipoMensagem(mime: string) {
  if (mime.startsWith("image/")) return "IMAGEM";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "ARQUIVO";
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const conversaId = Number(ctx.params.id);

    const participante = await prisma.chatParticipante.findFirst({
      where: {
        conversaId,
        usuarioId: user.id,
        conversa: {
          instituicaoId: user.instituicaoId,
        },
      },
    });

    if (!participante) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const blob = await put(
      `chat/${user.instituicaoId}/${conversaId}/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
      }
    );

    const mensagem = await prisma.chatMensagem.create({
      data: {
        conversaId,
        autorId: user.id,
        texto: file.name,
        tipo: tipoMensagem(file.type),
        anexos: {
          create: {
            nomeArquivo: file.name,
            url: blob.url,
            tipoMime: file.type,
            tamanho: file.size,
          },
        },
      },
      include: {
        anexos: true,
      },
    });

    await prisma.chatConversa.update({
      where: { id: conversaId },
      data: { atualizadoEm: new Date() },
    });

    return NextResponse.json({ mensagem });
  } catch (error) {
    console.error("Erro ao enviar anexo:", error);

    return NextResponse.json(
      { error: "Erro ao enviar anexo" },
      { status: 500 }
    );
  }
}