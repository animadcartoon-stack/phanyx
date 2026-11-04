import { NextRequest } from "next/server";
import { autorizarUploadDocumentoMobilidade } from "@/lib/mobilidade-documentos-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function POST(request: NextRequest, context: { params: { id: string; documentoId: string } }) {
  return autorizarUploadDocumentoMobilidade(request, context, "ALUNO");
}
