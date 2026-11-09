import { NextResponse } from "next/server";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { instituicaoId } = await administradorCombos();
    const matriculaId = Number(params.id);
    const antesParam = new URL(request.url).searchParams.get("antes");
    const antes = antesParam === null ? null : Number(antesParam);
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0 ||
        (antes !== null && (!Number.isSafeInteger(antes) || antes <= 0))) {
      return NextResponse.json({ error: "Matrícula ou página inválida." }, { status: 400 });
    }
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId, instituicaoId }, select: { id: true },
    });
    if (!matricula) return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 });

    const edicoes = await prisma.edicaoMatricula.findMany({
      where: { instituicaoId, matriculaId, ...(antes !== null ? { id: { lt: antes } } : {}) },
      orderBy: { id: "desc" },
      take: 21,
      select: { id: true, acao: true, usuarioId: true, usuarioNome: true, funcionarioId: true,
        masterOriginalId: true, criadoEm: true, motivo: true, alteracoes: true },
    });
    const pagina = edicoes.slice(0, 20);
    return NextResponse.json({ edicoes: pagina, proximo: edicoes.length > 20 ? pagina[19].id : null });
  } catch (erro) {
    return erroCombos(erro);
  }
}
