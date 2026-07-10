import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import {
  listarAniversariantes,
  obterFiltrosAniversariantes,
} from "@/lib/aniversariantes/listarAniversariantes";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN" || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const filtros = obterFiltrosAniversariantes(req);

    const resultado = await listarAniversariantes({
      instituicaoId: user.instituicaoId,
      filtros,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao listar aniversariantes:", error);

    return NextResponse.json(
      { error: "Erro ao listar aniversariantes." },
      { status: 500 }
    );
  }
}