import { NextRequest } from "next/server";
import { finalizarUploadDocumentoMobilidade } from "@/lib/mobilidade-documentos-finalizar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function POST(request: NextRequest, context: { params: { id: string; documentoId: string } }) {
  return finalizarUploadDocumentoMobilidade(request, context, "PROFESSOR");
}
