import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
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

  const mensagens = await prisma.chatMensagem.findMany({
    where: { conversaId },
    include: { anexos: true },
    orderBy: { criadoEm: "asc" },
  });

  return NextResponse.json({ mensagens });
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const conversaId = Number(ctx.params.id);
  const body = await req.json();
  const texto = String(body.texto || "").trim();

  if (!texto) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

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

  const mensagem = await prisma.chatMensagem.create({
    data: {
      conversaId,
      autorId: user.id,
      texto,
      tipo: "TEXTO",
    },
  });

  await prisma.chatConversa.update({
    where: { id: conversaId },
    data: { atualizadoEm: new Date() },
  });

  return NextResponse.json({ mensagem });
}