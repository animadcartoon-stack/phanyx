type Elemento = { id: number | string; grupoId?: string | number | null; oculto?: boolean | null; dadosJson?: any; arrayPreview?: boolean };

/** Preserva a ordem da selecao e expande cada grupo somente uma vez. */
export function expandirSelecaoCertificado<T extends Elemento>(campos: T[], ids: readonly T["id"][]) {
  const porId = new Map(campos.map(c => [c.id, c])), porGrupo = new Map<string | number, T["id"][]>();
  for (const c of campos) if (c.grupoId && !c.arrayPreview) { const grupo = porGrupo.get(c.grupoId) || [];grupo.push(c.id);porGrupo.set(c.grupoId, grupo); }
  const grupos = new Set<string | number>(), resultado = new Set<T["id"]>();
  for (const id of ids) {
    const c = porId.get(id);if (!c || c.arrayPreview) continue;
    if (!c.grupoId) resultado.add(c.id);
    else if (!grupos.has(c.grupoId)) { grupos.add(c.grupoId);for (const membro of porGrupo.get(c.grupoId) || []) resultado.add(membro); }
  }
  return [...resultado];
}

export function elementoOculto(campo: { oculto?: boolean | null; dadosJson?: any }) {
  return (campo.oculto ?? campo.dadosJson?.oculto) === true;
}

export function alterarVisibilidadeCertificado<T extends Elemento>(campos: T[], ids: readonly T["id"][], oculto: boolean, incluirGrupos = true): T[] {
  const alvos = new Set<number | string>(ids);
  const grupos = new Set(campos.filter(c => alvos.has(c.id) && c.grupoId).map(c => c.grupoId));
  return campos.map(campo => {
    if (!alvos.has(campo.id) && !(incluirGrupos && campo.grupoId && grupos.has(campo.grupoId))) return campo;
    if (elementoOculto(campo) === oculto) return campo;
    return { ...campo, oculto, dadosJson: { ...(campo.dadosJson || {}), oculto } };
  });
}
