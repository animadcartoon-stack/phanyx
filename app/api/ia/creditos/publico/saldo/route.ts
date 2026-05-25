import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ saldo: 0 });
  }

  const credito = await prisma.creditoIAPublico.findUnique({
    where: { email },
  });

  return NextResponse.json({
    saldo: credito?.saldo || 0,
    liberado: (credito?.saldo || 0) > 0,
  });
}