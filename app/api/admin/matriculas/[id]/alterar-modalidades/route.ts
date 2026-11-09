import { NextResponse } from "next/server";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { listarModalidadesParaRevisao } from "@/lib/matriculas/revisao-modalidades";
import { ErroRevisaoValores } from "@/lib/matriculas/revisao-valores";
import { revisarContratacao } from "@/lib/matriculas/revisar-contratacao";
import { prisma } from "@/lib/prisma";

type Contexto = { params: { id: string } };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { instituicaoId } = await administradorCombos();
    const matriculaId = Number(params.id);
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0) {
      throw new ErroRevisaoValores("Informe uma matrícula válida.", 400);
    }
    const dados = await listarModalidadesParaRevisao(prisma, { matriculaId, instituicaoId });
    return NextResponse.json(dados);
  } catch (erro) {
    if (erro instanceof ErroRevisaoValores) return NextResponse.json({ error: erro.message }, { status: erro.status });
    return erroCombos(erro);
  }
}

export function POST(request: Request, contexto: Contexto) {
  return revisarContratacao(request, contexto, false, "MODALIDADES");
}

export function PATCH(request: Request, contexto: Contexto) {
  return revisarContratacao(request, contexto, true, "MODALIDADES");
}
