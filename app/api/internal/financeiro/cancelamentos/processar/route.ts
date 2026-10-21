import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processarCancelamentosBancarios } from "@/lib/financeiro/cancelar-cobranca";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const informado = Buffer.from(req.headers.get("authorization") || "");
  const esperado = Buffer.from(`Bearer ${secret || ""}`);
  if (!secret || informado.length !== esperado.length || !timingSafeEqual(informado, esperado)) {
    return NextResponse.json({ codigo: "NAO_AUTORIZADO" }, { status: 401 });
  }
  try { return NextResponse.json(await processarCancelamentosBancarios()); }
  catch { return NextResponse.json({ codigo: "FALHA_RECONCILIACAO" }, { status: 500 }); }
}
