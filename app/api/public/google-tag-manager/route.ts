import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({
        containerId: null,
        ativo: false,
      });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: user.instituicaoId,
      },
      select: {
        googleTagManagerId: true,
        googleTagManagerAtivo: true,
      },
    });

    return NextResponse.json({
      containerId: instituicao?.googleTagManagerId || null,
      ativo: Boolean(instituicao?.googleTagManagerAtivo),
    });
  } catch {
    return NextResponse.json({
      containerId: null,
      ativo: false,
    });
  }
}