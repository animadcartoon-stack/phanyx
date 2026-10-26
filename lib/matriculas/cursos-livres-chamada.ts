import type { Prisma } from "@prisma/client";
import { periodoEstaPago } from "@/lib/matriculas/cursos-livres";
type Banco = Prisma.TransactionClient;

/** A chamada recebe apenas a situação do período, sem expor valores ao professor. */
export async function situacaoPeriodosNaChamada(db: Banco, instituicaoId: number, data: Date,
  vinculos: { alunoId: number; matriculaId: number; organizacaoCurricular: string }[]) {
  const livres = vinculos.filter(v => v.organizacaoCurricular === "LIVRE");
  const mapa = new Map<number, "PAGO" | "PENDENTE" | "SEM_PERIODO">();
  if (!livres.length) return mapa;
  const periodos = await db.periodoCursoLivre.findMany({ where: {
    instituicaoId, matriculaId: { in: [...new Set(livres.map(v => v.matriculaId))] }, dataInicio: { lte: data }, dataFim: { gte: data },
    lancamento: { status: { not: "CANCELADO" } },
  }, select: { matriculaId: true, lancamento: { select: { status: true, valorPago: true, valorFinal: true } } } });
  const regulares = new Set(vinculos.filter(v => v.organizacaoCurricular !== "LIVRE").map(v => v.alunoId));
  const porMatricula = new Map<number, "PAGO" | "PENDENTE">();
  for (const p of periodos) {
    if (porMatricula.get(p.matriculaId) !== "PAGO") porMatricula.set(p.matriculaId, periodoEstaPago(p.lancamento) ? "PAGO" : "PENDENTE");
  }
  for (const v of livres) {
    if (regulares.has(v.alunoId)) continue;
    const status = porMatricula.get(v.matriculaId) ?? "SEM_PERIODO";
    if (mapa.get(v.alunoId) !== "PAGO" && (status !== "SEM_PERIODO" || !mapa.has(v.alunoId))) mapa.set(v.alunoId, status);
  }
  return mapa;
}
