// Tags aditivas para contratos e documentos; o snapshot pertence a matricula.
// Nao confundir o nome do combo com os nomes dos cursos efetivamente contratados.
type Oferta = {
  cursoNome?: unknown;
  disciplinas?: unknown;
};
const texto = (valor: unknown) => typeof valor === "string" ? valor.trim() : "";
export function resumoCursosDocumento(snapshot: unknown, cursoPadrao?: string | null) {
  const s = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? snapshot as { versao?: unknown; ofertas?: unknown } : null;
  const ofertas: Oferta[] = s?.versao === 1 && Array.isArray(s.ofertas)
    ? s.ofertas.filter((item): item is Oferta => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
  const nomes = [...new Set(ofertas.map(o => texto(o.cursoNome)).filter(Boolean))];
  if (!nomes.length && texto(cursoPadrao)) nomes.push(texto(cursoPadrao));
  const nomesDisciplinas = new Set<string>();
  const grupos = ofertas.map(oferta => {
    const nome = texto(oferta.cursoNome);
    const disciplinas = Array.isArray(oferta.disciplinas)
      ? [...new Set(oferta.disciplinas.map((item: unknown) =>
          item && typeof item === "object" && "nome" in item
            ? texto((item as { nome?: unknown }).nome) : "").filter(Boolean))]
      : [];
    for (const disciplina of disciplinas) nomesDisciplinas.add(disciplina);
    return nome && disciplinas.length
      ? `${nome}\n${disciplinas.map(d => `- ${d}`).join("\n")}`
      : nome ? nome : "";
  }).filter(Boolean);
  return {
    temModalidades: ofertas.length > 0,
    cursosContratados: nomes.length ? nomes.map(nome => `- ${nome}`).join("\n") : "- Não informado",
    disciplinasPorCurso: grupos.length ? grupos.join("\n\n") : "- Não informado",
    disciplinasContratadasCombo: nomesDisciplinas.size
      ? [...nomesDisciplinas].map(nome => `- ${nome}`).join("\n") : null,
  };
}
