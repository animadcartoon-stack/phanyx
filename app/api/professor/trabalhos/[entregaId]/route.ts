import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { entregaId: string } }
) {
  return NextResponse.json({
    ok: true,
    entregaId: Number(params.entregaId),
  });
}