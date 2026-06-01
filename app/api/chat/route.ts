import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const conversas = await prisma.chatConversa.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      participantes: {
        some: {
          usuarioId: user.id,
        },
      },
    },
    include: {
      participantes: true,
      mensagens: {
        orderBy: { criadoEm: "desc" },
        take: 1,
      },
    },
    orderBy: { atualizadoEm: "desc" },
  });

  return NextResponse.json({ conversas });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();

  const titulo = String(body.titulo || "").trim();
  const participanteIds = Array.isArray(body.participanteIds)
    ? body.participanteIds.map(Number).filter(Boolean)
    : [];

  const ids = Array.from(new Set([user.id, ...participanteIds]));

  const conversa = await prisma.chatConversa.create({
    data: {
      instituicaoId: user.instituicaoId,
      titulo: titulo || null,
      tipo: ids.length > 2 ? "GRUPO" : "INDIVIDUAL",
      criadaPorId: user.id,
      participantes: {
        create: ids.map((id) => ({
          usuarioId: id,
        })),
      },
    },
    include: {
      participantes: true,
    },
  });

  return NextResponse.json({ conversa });
}