import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({
        googleAnalyticsId: process.env.NEXT_PUBLIC_PHANYX_GA_ID || null,
        googleAnalyticsAtivo: Boolean(process.env.NEXT_PUBLIC_PHANYX_GA_ID),
      });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: user.instituicaoId,
      },
      select: {
        googleAnalyticsId: true,
        googleAnalyticsAtivo: true,
      },
    });

    return NextResponse.json({
      googleAnalyticsId: instituicao?.googleAnalyticsId || null,
      googleAnalyticsAtivo: Boolean(instituicao?.googleAnalyticsAtivo),
    });
  } catch {
    return NextResponse.json({
      googleAnalyticsId: null,
      googleAnalyticsAtivo: false,
    });
  }
}