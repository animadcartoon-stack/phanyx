import { revisarContratacao } from "@/lib/matriculas/revisar-contratacao";

type Contexto = { params: { id: string } };

export function POST(request: Request, contexto: Contexto) {
  return revisarContratacao(request, contexto, false, "VALORES");
}

export function PATCH(request: Request, contexto: Contexto) {
  return revisarContratacao(request, contexto, true, "VALORES");
}
