// Capacidade real das ofertas avulsas que compartilham a turma de origem PEVI.
// Cada disciplina e sua turma fisica (origemId) formam um unico grupo de vagas.
// Sem migracao: referencia OFERTA-<origemId>-<cursoId> ja e gerada pela API.
export type OfertaParaVagas = {
  id: number;
  codigo?: string | null;
  cursoId?: number | null;
  capacidadeMaxima: number | null;
  disciplinas: Array<{ disciplinaId: number }>;
};
export type OcupanteParaVagas = {
  turmaId: number;
  disciplinaId: number;
  matricula: { alunoId: number };
};

export function origemOfertaVinculada(oferta: Pick<OfertaParaVagas, "id" | "codigo" | "cursoId">): number | null {
  const match = /^OFERTA-(\d+)-(\d+)$/.exec(String(oferta.codigo || ""));
  if (!match) return null;
  const origem = Number(match[1]);
  const destino = Number(match[2]);
  if (!Number.isSafeInteger(origem) || origem <= 0 || origem === oferta.id ||
      !Number.isSafeInteger(destino) || destino !== oferta.cursoId) return null;
  return origem;
}

export function capacidadePendenteOferta(oferta: OfertaParaVagas, todas: OfertaParaVagas[]): boolean {
  const origem = origemOfertaVinculada(oferta);
  if (origem === null) return false;
  // Oferta vinculada exige limite explicito. Nao herda "ilimitado" de null.
  return !Number.isInteger(oferta.capacidadeMaxima) || Number(oferta.capacidadeMaxima) <= 0 ||
    !todas.some(t => t.id === origem);
}

export function vagasOfertaCompartilhada(oferta: OfertaParaVagas, todas: OfertaParaVagas[], ocupacoes: OcupanteParaVagas[]): number | null {
  const origem = origemOfertaVinculada(oferta);
  if (origem === null) {
    if (oferta.capacidadeMaxima === null) return null; // preserva comportamento legado
    const alunos = new Set(ocupacoes.filter(o => o.turmaId === oferta.id).map(o => o.matricula.alunoId));
    return Math.max(0, oferta.capacidadeMaxima - alunos.size);
  }
  if (capacidadePendenteOferta(oferta, todas) || oferta.disciplinas.length === 0) return 0;
  const vinculadas = todas.filter(t => t.id === origem || origemOfertaVinculada(t) === origem);
  return Math.min(...oferta.disciplinas.map(d => {
    const participantes = vinculadas.filter(t => t.disciplinas.some(x => x.disciplinaId === d.disciplinaId));
    const idsTurmas = new Set(participantes.map(t => t.id));
    const limites = participantes.map(t => t.capacidadeMaxima).filter((n): n is number => n !== null && Number.isInteger(n) && n > 0);
    const limite = Math.min(...limites);
    const alunos = new Set(ocupacoes.filter(o => o.disciplinaId === d.disciplinaId && idsTurmas.has(o.turmaId)).map(o => o.matricula.alunoId));
    return Math.max(0, limite - alunos.size);
  }));
}
