import { Prisma } from "@prisma/client";
import { ErroModalidades } from "./combos";
import { origemOfertaVinculada } from "./vagas-ofertas-compartilhadas";

// Protege vagas na matricula tradicional e na edicao. A confirmacao conjunta
// possui sua propria verificacao, com a mesma referencia fisica de origem.
type Item = { turmaId: number; disciplinaId: number };
type TurmaVaga = {
  id: number;
  codigo: string | null;
  cursoId: number | null;
  ativa: boolean;
  capacidadeMaxima: number | null;
  disciplinas: Array<{ disciplinaId: number }>;
};
const estadosMatricula = ["ATIVA", "A_INICIAR", "AGUARDANDO"] as const;
const estadosItens = ["A_CURSAR", "EM_CURSO"] as const;

function falhaVagas(turmaId: number, disciplinaId: number, motivo: string, restantes?: number): never {
  throw new ErroModalidades("TURMA_SEM_VAGAS", 409, { turmaId, disciplinaId, motivo,
    ...(restantes !== undefined ? { vagasRestantes: restantes } : {}) });
}

export async function verificarVagasMatricula(
  db: Prisma.TransactionClient,
  args: { instituicaoId: number; alunoId: number; itens: Item[]; matriculaIdIgnorada?: number },
): Promise<void> {
  const { instituicaoId, alunoId, matriculaIdIgnorada } = args;
  const itens = [...new Map(args.itens.map(i => [i.turmaId + ":" + i.disciplinaId, i])).values()];
  if (!itens.length) return;
  if (itens.some(i => !Number.isSafeInteger(i.turmaId) || i.turmaId <= 0 ||
    !Number.isSafeInteger(i.disciplinaId) || i.disciplinaId <= 0))
    throw new ErroModalidades("SELECAO_INVALIDA", 400);

  const idsSelecionados = [...new Set(itens.map(i => i.turmaId))];
  const referencias = await db.turma.findMany({
    where: { instituicaoId, id: { in: idsSelecionados } },
    select: { id: true, codigo: true, cursoId: true },
  });
  if (referencias.length !== idsSelecionados.length)
    throw new ErroModalidades("TURMA_INDISPONIVEL", 409);
  const raizes = [...new Set(referencias.map(t => origemOfertaVinculada(t) ?? t.id))];
  const idsTrava = [...new Set([...idsSelecionados, ...raizes])].sort((a,b)=>a-b);

  // Ambas as rotas (avulsa e tradicional) travam as mesmas turmas de origem.
  // Leitura de capacidade e ocupantes ocorre DEPOIS do lock.
  await db.$queryRaw(Prisma.sql`SELECT "id" FROM "Turma"
    WHERE "instituicaoId" = ${instituicaoId}
      AND "id" IN (${Prisma.join(idsTrava)}) ORDER BY "id" FOR UPDATE`);

  const selecionar = { id: true, codigo: true, cursoId: true, ativa: true,
    capacidadeMaxima: true, disciplinas: { select: { disciplinaId: true } } } as const;
  const base = await db.turma.findMany({
    where: { instituicaoId, id: { in: idsTrava } }, select: selecionar,
  });
  const baseMap = new Map<number, TurmaVaga>(base.map(t => [t.id,t]));
  if (base.length !== idsTrava.length)
    throw new ErroModalidades("TURMA_INDISPONIVEL", 409);

  const irmas = await db.turma.findMany({
    where: { instituicaoId, OR: raizes.map(id => ({ codigo: { startsWith: `OFERTA-${id}-` } })) },
    select: selecionar,
  });
  const todas = new Map(baseMap);
  for (const t of irmas) {
    if (raizes.includes(origemOfertaVinculada(t) ?? -1)) todas.set(t.id, t);
  }
  const idsGrupo = [...todas.keys()];
  const ocupacoes = await db.itemMatricula.findMany({
    where: { instituicaoId, turmaId: { in: idsGrupo }, status: { in: [...estadosItens] },
      matricula: { instituicaoId, excluidaEm: null, canceladaEm: null,
        status: { in: [...estadosMatricula] },
        ...(matriculaIdIgnorada ? { id: { not: matriculaIdIgnorada } } : {}) } },
    select: { turmaId: true, disciplinaId: true, matricula: { select: { alunoId: true } } },
  });

  for (const item of itens) {
    const selecionada = todas.get(item.turmaId)!;
    if (!selecionada?.ativa || !selecionada.disciplinas.some(d => d.disciplinaId === item.disciplinaId))
      throw new ErroModalidades("TURMA_INDISPONIVEL", 409);
    const raizId = origemOfertaVinculada(selecionada) ?? selecionada.id;
    const raiz = todas.get(raizId);
    if (!raiz) throw new ErroModalidades("TURMA_INDISPONIVEL",409);
    const doMesmoEspaco = [...todas.values()].filter(t =>
      (t.id === raizId || origemOfertaVinculada(t) === raizId) &&
      t.disciplinas.some(d => d.disciplinaId === item.disciplinaId));
    const vinculadasAtivas = doMesmoEspaco.filter(t => t.id !== raizId && t.ativa);
    const ehVinculada = raizId !== selecionada.id;
    if (ehVinculada && (!Number.isInteger(selecionada.capacidadeMaxima) || Number(selecionada.capacidadeMaxima) <= 0))
      falhaVagas(item.turmaId, item.disciplinaId, "CAPACIDADE_NAO_CONFIGURADA");
    if (vinculadasAtivas.some(t => !Number.isInteger(t.capacidadeMaxima) || Number(t.capacidadeMaxima) <= 0))
      falhaVagas(item.turmaId, item.disciplinaId, "CAPACIDADE_NAO_CONFIGURADA");

    if (vinculadasAtivas.length === 0 && !ehVinculada) {
      // Mantem a regra legada: turma comum tem um teto global de alunos.
      if (raiz.capacidadeMaxima === null) continue;
      const alunos = new Set(ocupacoes.filter(o => o.turmaId === raizId).map(o => o.matricula.alunoId));
      if (alunos.size >= raiz.capacidadeMaxima && !alunos.has(alunoId))
        falhaVagas(item.turmaId,item.disciplinaId,"TURMA_LOTADA",0);
      continue;
    }
    // Se ha duas ofertas da mesma atividade, o menor limite configurado
    // prevalece, e o mesmo aluno conta uma unica vez no grupo fisico.
    const limites = doMesmoEspaco.filter(t => t.id === raizId || t.ativa)
      .map(t=>t.capacidadeMaxima).filter((n): n is number => n !== null && Number.isInteger(n) && n >= 0);
    if (!limites.length) falhaVagas(item.turmaId,item.disciplinaId,"CAPACIDADE_NAO_CONFIGURADA");
    const limite = Math.min(...limites);
    const idsDasAulas = new Set(doMesmoEspaco.map(t=>t.id));
    const alunos = new Set(ocupacoes.filter(o => o.disciplinaId === item.disciplinaId &&
      idsDasAulas.has(o.turmaId)).map(o=>o.matricula.alunoId));
    if (alunos.size >= limite && !alunos.has(alunoId))
      falhaVagas(item.turmaId,item.disciplinaId,"ATIVIDADE_LOTADA",0);
  }
}
