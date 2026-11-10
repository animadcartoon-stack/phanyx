// Somente páginas mapeadas participam do controle individual.
// O middleware define x-phanyx-rota-professor; cabeçalhos externos são descartados.
const rotas: ReadonlyArray<[string,string]> = [
  ["/professor/planejamento","professor.planejamento"],
  ["/professor/relatorios","professor.relatorios"],
  ["/professor/desenvolvimento","professor.desenvolvimento"],
  ["/professor/turmas","professor.turmas"],
  ["/professor/substituicoes","professor.substituicoes"],
  ["/professor/alunos","professor.alunos"],
  ["/professor/aulas","professor.materiais"],
  ["/professor/biblioteca","professor.biblioteca"],
  ["/professor/atividades","professor.atividades"],
  ["/professor/provas","professor.provas"],
  ["/professor/trabalhos","professor.trabalhos"],
  ["/professor/reunioes","professor.reunioes"],
  ["/professor/mobilidade","professor.mobilidade"],
  ["/professor/ouvidoria","professor.ouvidoria"],
];
export function chavePaginaProfessorPorRota(caminho: string): string|null {
  if (caminho === "/professor") return "professor.painel";
  for (const [prefixo,chave] of rotas) if(caminho===prefixo || caminho.startsWith(prefixo+"/")) return chave;
  return null;
}
