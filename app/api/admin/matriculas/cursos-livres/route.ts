import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { ErroCursoLivre, idCursoLivre } from "@/lib/matriculas/cursos-livres";
import { contratarPeriodoCursoLivre } from "@/lib/matriculas/cursos-livres-servidor";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function erro(error: unknown) {
  if (error instanceof ErroCursoLivre) return NextResponse.json({ codigo: error.codigo, detalhes: error.detalhes }, { status: error.status, headers });
  return erroCombos(error);
}
export async function GET(request: Request) {
  try {
    const user = await administradorCombos();
    const params = new URL(request.url).searchParams;
    const alunoId = params.get("alunoId") ? idCursoLivre(params.get("alunoId")) : undefined;
    const matriculaId = params.get("matriculaId") ? idCursoLivre(params.get("matriculaId")) : undefined;
    const pagina = params.get("pagina") ? idCursoLivre(params.get("pagina")) : 1;
    if (pagina > 100000) throw new ErroCursoLivre("DADOS_INVALIDOS");
    const [cursos, matriculas] = await Promise.all([
      prisma.curso.findMany({ where: { instituicaoId: user.instituicaoId, organizacaoCurricular: "LIVRE", ativo: true, excluidoEm: null },
        select: { id: true, nome: true, valorSemanal: true, valorMensalidade: true, descontoMensalidadePercentual: true,
          turmas: { where: { instituicaoId: user.instituicaoId, ativa: true, organizacaoCurricular: "LIVRE", statusTurma: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] } }, select: { id: true, nome: true } } }, orderBy: { nome: "asc" } }),
      prisma.matricula.findMany({ where: { instituicaoId: user.instituicaoId, organizacaoCurricular: "LIVRE", excluidaEm: null, alunoId, id: matriculaId },
        select: { id: true, numeroMatricula: true, status: true, aluno: { select: { id: true, nome: true } }, curso: { select: { id: true, nome: true, valorSemanal: true, valorMensalidade: true, descontoMensalidadePercentual: true } },
          turmaPrincipal: { select: { id: true, nome: true } },
          periodosCursoLivre: { orderBy: [{ dataInicio: "desc" }, { id: "desc" }], take: matriculaId ? 20 : 3, skip: matriculaId ? (pagina - 1) * 20 : 0,
            select: { id: true, periodicidade: true, dataInicio: true, dataFim: true, valor: true, lancamentoId: true,
              lancamento: { select: { status: true, valorPago: true, valorFinal: true } } } }, _count: { select: { periodosCursoLivre: true } } },
        orderBy: { id: "desc" }, take: matriculaId ? 1 : 50 }),
    ]);
    return NextResponse.json({ cursos, matriculas, pagina }, { headers });
  } catch (error) { return erro(error); }
}
export async function POST(request: Request) {
  try {
    const user = await administradorCombos();
    const body = await request.json().catch(() => { throw new ErroCursoLivre("DADOS_INVALIDOS"); });
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ErroCursoLivre("DADOS_INVALIDOS");
    const resultado = await prisma.$transaction(tx => contratarPeriodoCursoLivre(tx, user, body, request),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
    return NextResponse.json(resultado, { status: 201, headers });
  } catch (error) { return erro(error); }
}
