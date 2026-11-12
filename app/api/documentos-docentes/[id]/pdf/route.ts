import { NextResponse } from "next/server";
import { gerarPdfDocente } from "@/lib/documentos-docentes/gerar-pdf";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({ error: "Documento inexistente ou sem permissão." }, { status: 404 });
  const consulta = new URL(req.url).searchParams;
  const versao = Number(consulta.get("versao") || auth.documento.versaoAtual);
  return gerarPdfDocente(auth, versao, consulta.get("branco") === "1", consulta.get("baixar") === "1");
}
