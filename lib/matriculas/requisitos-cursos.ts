import type { Prisma } from "@prisma/client";
import { ErroModalidades } from "./combos";

type Banco = Prisma.TransactionClient;
export type ContextoRequisitoCurso = { cursoIds: number[]; alunoId: number; periodoLetivo?: string | null;
  inicio?: Date | null; fim?: Date | null; matriculaId?: number };
export type FaltaRequisitoCurso = { cursoId: number; cursoNome: string; obrigatorioId: number; obrigatorioNome: string };

export function normalizarIdsRequisitos(valor: unknown): number[] | undefined {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor) || valor.length > 30) throw new ErroModalidades("REQUISITOS_CURSOS_INVALIDOS");
  const ids = valor.map(v => {
    if (!["string", "number"].includes(typeof v) || !/^\d+$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) <= 0)
      throw new ErroModalidades("REQUISITOS_CURSOS_INVALIDOS");
    return Number(v);
  });
  if (new Set(ids).size !== ids.length) throw new ErroModalidades("REQUISITOS_CURSOS_INVALIDOS");
  return ids.sort((a, b) => a - b);
}
export function validarGrafoRequisitos(arestas: { cursoId: number; cursoObrigatorioId: number }[]) {
  const adj = new Map<number, number[]>();
  for (const a of arestas) {
    if (a.cursoId === a.cursoObrigatorioId) throw new ErroModalidades("REQUISITO_PROPRIO_CURSO");
    adj.set(a.cursoId, [...(adj.get(a.cursoId) ?? []), a.cursoObrigatorioId]);
  }
  const visitados = new Set<number>(), caminho = new Set<number>();
  function visitar(id: number) {
    if (caminho.has(id)) throw new ErroModalidades("REQUISITOS_CURSOS_CICLICOS");
    if (visitados.has(id)) return;
    caminho.add(id);for (const outro of adj.get(id) ?? []) visitar(outro);
    caminho.delete(id);visitados.add(id);
  }
  for (const id of adj.keys()) visitar(id);
}
// A chamada e a gravação do curso devem ocorrer na mesma transação serializável.
export async function salvarRequisitosCursos(db: Banco, instituicaoId: number, cursoId: number, ids: number[] | undefined) {
  if (ids === undefined) return;
  if (ids.includes(cursoId)) throw new ErroModalidades("REQUISITO_PROPRIO_CURSO");
  const curso = await db.curso.findFirst({ where: { id: cursoId, instituicaoId }, select: { id: true } });
  if (!curso) throw new ErroModalidades("REQUISITOS_CURSOS_INVALIDOS");
  const validos = await db.curso.findMany({ where: { id: { in: ids }, instituicaoId, ativo: true, excluidoEm: null }, select: { id: true } });
  if (validos.length !== ids.length) throw new ErroModalidades("REQUISITOS_CURSOS_INVALIDOS");
  // Não copiamos IDs de dependências entre instituições da rede.
  if (ids.length && await db.cursoPublicacaoRede.count({ where: { OR: [
    { cursoOrigemId: cursoId, instituicaoOrigemId: instituicaoId },
    { cursoDestinoId: cursoId, instituicaoDestinoId: instituicaoId },
  ] } })) throw new ErroModalidades("REQUISITOS_CURSOS_REDE", 409);
  const atuais = await db.cursoRequisitoConjunto.findMany({ where: { instituicaoId }, select: { cursoId: true, cursoObrigatorioId: true } });
  validarGrafoRequisitos([...atuais.filter(a => a.cursoId !== cursoId), ...ids.map(cursoObrigatorioId => ({ cursoId, cursoObrigatorioId }))]);
  await db.cursoRequisitoConjunto.deleteMany({ where: { cursoId, instituicaoId } });
  if (ids.length) await db.cursoRequisitoConjunto.createMany({ data: ids.map(cursoObrigatorioId => ({ instituicaoId, cursoId, cursoObrigatorioId })) });
}
const dia = (d: Date) => d.toISOString().slice(0, 10);
export function cobrirIntervaloLivre(intervalos: { dataInicio: Date; dataFim: Date }[], inicio: Date, fim: Date) {
  let proximo = new Date(dia(inicio) + "T00:00:00.000Z").getTime();
  const ultimo = new Date(dia(fim) + "T00:00:00.000Z").getTime();
  for (const p of [...intervalos].sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime())) {
    if (p.dataInicio.getTime() > proximo) return false;
    if (p.dataFim.getTime() >= proximo) proximo = p.dataFim.getTime() + 86400000;
    if (proximo > ultimo) return true;
  }
  return false;
}
export async function validarRequisitosCursos(db: Banco, instituicaoId: number, contexto: ContextoRequisitoCurso) {
  const ids = [...new Set(contexto.cursoIds)].sort((a, b) => a - b);
  if (!ids.length) return [];
  const regras = await db.cursoRequisitoConjunto.findMany({
    where: { instituicaoId, cursoId: { in: ids } },
    include: { curso: { select: { nome: true } }, cursoObrigatorio: { select: { nome: true, ativo: true, excluidoEm: true } } },
    orderBy: [{ cursoId: "asc" }, { cursoObrigatorioId: "asc" }],
  });
  if (!regras.length) return [];
  const requeridos = [...new Set(regras.map(r => r.cursoObrigatorioId))];
  const existentes = await db.matricula.findMany({
    where: { instituicaoId, alunoId: contexto.alunoId, status: "ATIVA", excluidaEm: null, canceladaEm: null,
      ...(contexto.matriculaId ? { id: { not: contexto.matriculaId } } : {}),
      OR: [{ cursoId: { in: requeridos } }, { itens: { some: { instituicaoId, status: { in: ["A_CURSAR", "EM_CURSO"] }, turma: { instituicaoId, cursoId: { in: requeridos } } } } }],
    },
    select: { id: true, cursoId: true, periodoLetivo: true, dataInicioCurso: true, organizacaoCurricular: true,
      turmaPrincipal: { select: { cursoId: true, periodoLetivo: true, dataInicio: true, dataFim: true } },
      itens: { where: { instituicaoId, status: { in: ["A_CURSAR", "EM_CURSO"] }, turma: { instituicaoId, cursoId: { in: requeridos } } },
        select: { turma: { select: { cursoId: true, periodoLetivo: true, dataInicio: true, dataFim: true } } } },
      periodosCursoLivre: { where: { instituicaoId, lancamento: { status: { not: "CANCELADO" } }, ...(contexto.inicio ? { dataFim: { gte: contexto.inicio }, dataInicio: { lte: contexto.fim ?? contexto.inicio } } : { id: "__sem_data_requisito__" }) }, select: { dataInicio: true, dataFim: true } },
    },
  });
  const periodo = contexto.periodoLetivo?.trim() || "";
  const faltantes: FaltaRequisitoCurso[] = [];
  const atendidos: { cursoId: number; cursoObrigatorioId: number; matriculaId: number | null }[] = [];
  for (const r of regras) {
    let atendida = false;
    let matriculaId: number | null = null;
    if (r.cursoObrigatorio.ativo && !r.cursoObrigatorio.excluidoEm) {
      if (ids.includes(r.cursoObrigatorioId)) atendida = true;
      else for (const m of existentes) {
        const ofertas = [ ...(m.cursoId === r.cursoObrigatorioId ? [m.turmaPrincipal] : []),
          ...m.itens.filter(i => i.turma.cursoId === r.cursoObrigatorioId).map(i => i.turma) ];
        if (!ofertas.length) continue;
        if (m.organizacaoCurricular === "LIVRE") {
          if (contexto.inicio && cobrirIntervaloLivre(m.periodosCursoLivre, contexto.inicio, contexto.fim ?? contexto.inicio)) atendida = true;
        } else atendida = ofertas.some(o => {
          const termo = o?.periodoLetivo?.trim() || m.periodoLetivo?.trim() || "";
          if (!periodo || /^\d{1,3}$/.test(periodo) || termo !== periodo) return false;
          if (contexto.inicio && [m.dataInicioCurso, o?.dataInicio].some(inicio => inicio && dia(inicio) > dia(contexto.inicio!))) return false;
          if (o?.dataFim && dia(o.dataFim) < dia(contexto.fim ?? contexto.inicio ?? new Date())) return false;
          return true;
        });
        if (atendida) { matriculaId = m.id;break; }
      }
    }
    if (!atendida) faltantes.push({ cursoId: r.cursoId, cursoNome: r.curso.nome, obrigatorioId: r.cursoObrigatorioId, obrigatorioNome: r.cursoObrigatorio.nome });
    else atendidos.push({ cursoId: r.cursoId, cursoObrigatorioId: r.cursoObrigatorioId, matriculaId });
  }
  if (faltantes.length) throw new ErroModalidades("CURSO_CONJUNTO_PENDENTE", 409, { faltantes });
  return atendidos;
}
