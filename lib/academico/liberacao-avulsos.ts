// As flags do ambiente não liberam outras instituições por acidente.
// A lista explícita é compartilhada pela ativação e pela confirmação de matrícula.
export function instituicaoAvulsosHabilitada(instituicaoId: number): boolean {
  if (!Number.isSafeInteger(instituicaoId) || instituicaoId <= 0) return false;
  const lista = process.env.PHANYX_AVULSOS_INSTITUICOES_HABILITADAS?.trim();
  if (!lista) return false;
  const ids = lista.split(",").map(id => id.trim());
  if (ids.some(id => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) return false;
  return ids.some(id => Number(id) === instituicaoId);
}

export function ativacaoTurmasAvulsasHabilitada(instituicaoId: number): boolean {
  return process.env.PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA === "true" &&
    instituicaoAvulsosHabilitada(instituicaoId);
}

export function matriculaSemGradeHabilitada(instituicaoId: number): boolean {
  return process.env.PHANYX_MATRICULA_SEM_GRADE_HABILITADA === "true" &&
    instituicaoAvulsosHabilitada(instituicaoId);
}
