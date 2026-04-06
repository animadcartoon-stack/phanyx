import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const config = await prisma.configuracaoInstituicao.findUnique({
    where: {
      instituicaoId: user.instituicaoId,
    },
  });

  return NextResponse.json(config);
}

export async function POST(req: Request) {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();

  const config = await prisma.configuracaoInstituicao.upsert({
    where: {
      instituicaoId: user.instituicaoId,
    },
    update: body,
    create: {
      ...body,
      instituicaoId: user.instituicaoId,
    },
  });

  return NextResponse.json(config);
}