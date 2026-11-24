export const CONTEXTOS_EXTRAS = [
  ["INSTITUCIONAL", "Institucional / Geral", "Institucional / Geral", "Institutional / General", "Institucional / General", "Institutionnel / Général"],
  ["ADMINISTRATIVO", "Administrativo", "Administrativo", "Administration", "Administrativo", "Administration"],
  ["ACADEMICO", "Acadêmico", "Académico", "Academic", "Académico", "Scolarité"],
  ["SECRETARIA", "Secretaria", "Secretaria", "Registrar / Secretariat", "Secretaría", "Secrétariat"],
  ["DIRECAO", "Direção", "Direção", "Management", "Dirección", "Direction"],
  ["COORDENACAO", "Coordenação", "Coordenação", "Coordination", "Coordinación", "Coordination"],
  ["FINANCEIRO", "Financeiro", "Financeiro", "Finance", "Finanzas", "Finances"],
  ["JURIDICO", "Jurídico", "Jurídico", "Legal", "Jurídico", "Juridique"],
  ["COMERCIAL", "Comercial", "Comercial", "Commercial", "Comercial", "Commercial"],
  ["ALUNO", "Alunos", "Alunos", "Students", "Alumnos", "Élèves"],
  ["RESPONSAVEIS", "Pais e responsáveis", "Pais e encarregados de educação", "Parents and guardians", "Padres y tutores", "Parents et responsables"],
  ["EVENTOS_PROJETOS", "Eventos e projetos", "Eventos e projetos", "Events and projects", "Eventos y proyectos", "Événements et projets"],
  ["ESTAGIOS", "Estágios", "Estágios", "Internships", "Prácticas", "Stages"],
  ["PARCERIAS_CONVENIOS", "Parcerias e convênios", "Parcerias e protocolos", "Partnerships and agreements", "Alianzas y convenios", "Partenariats et conventions"],
  ["PESQUISA_EXTENSAO", "Pesquisa e extensão", "Investigação e extensão", "Research and outreach", "Investigación y extensión", "Recherche et extension"],
  ["BIBLIOTECA", "Biblioteca", "Biblioteca", "Library", "Biblioteca", "Bibliothèque"],
  ["MOBILIDADE_INTERNACIONAL", "Mobilidade internacional", "Mobilidade internacional", "International mobility", "Movilidad internacional", "Mobilité internationale"],
] as const;
const idiomas = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];
export function rotuloContextoExtra(codigo: string, locale: string): string | undefined {
  const row = CONTEXTOS_EXTRAS.find(c => c[0] === codigo);
  return row?.[Math.max(0, idiomas.indexOf(locale)) + 1];
}
export function normalizarNomeContexto(valor: unknown): string | null {
  if (typeof valor !== "string" || /[\x00-\x1f\x7f]/.test(valor)) return null;
  const nome = valor.normalize("NFC").trim().replace(/\s+/g, " ");
  if (nome.length < 2 || nome.length > 100 || !/^[\p{L}\p{N}][\p{L}\p{N}\p{M} .,&()/_'’+–-]*$/u.test(nome)) return null;
  return nome;
}
export function chaveNomeContexto(nome: string): string {
  return nome.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
export function valorContextoPersonalizado(nome: string): string { return `PERSONALIZADO:${nome}`; }
export function nomeContextoPersonalizado(valor: string): string | undefined {
  return valor.startsWith("PERSONALIZADO:") ? valor.slice("PERSONALIZADO:".length) : undefined;
}
export const CONTEXTOS_BASE = ["MATRICULA", "FUNCIONARIO", "CANCELAMENTO_MATRICULA", "DOCENTE_PLANO_AULA", "DOCENTE_RELATORIO", "DOCENTE_OUTRO", "PROFESSOR", "RH"] as const;
export function contextosOutros(legados: readonly (string | null | undefined)[], personalizados: readonly string[]): string[] {
  return [...new Set<string>(["INSTITUCIONAL", ...CONTEXTOS_BASE, ...CONTEXTOS_EXTRAS.map(c => c[0]), ...personalizados.map(valorContextoPersonalizado), ...legados.filter((c): c is string => typeof c === "string" && !!c.trim())])];
}
export const textosContextoPersonalizado = {
  "pt-BR": ["+ Criar novo contexto", "Nome do novo contexto", "Cadastrar contexto", "Cancelar", "Contexto cadastrado.", "Não foi possível carregar os contextos. Tente novamente.", "Informe um nome válido de 2 a 100 caracteres.", "Não foi possível cadastrar o contexto.", "Tentar novamente"],
  "pt-PT": ["+ Criar novo contexto", "Nome do novo contexto", "Registar contexto", "Cancelar", "Contexto registado.", "Não foi possível carregar os contextos. Tente novamente.", "Indique um nome válido de 2 a 100 caracteres.", "Não foi possível registar o contexto.", "Tentar novamente"],
  "en-US": ["+ Create new context", "New context name", "Create context", "Cancel", "Context created.", "Could not load contexts. Try again.", "Enter a valid name of 2 to 100 characters.", "Could not create context.", "Retry"],
  "es-ES": ["+ Crear nuevo contexto", "Nombre del nuevo contexto", "Crear contexto", "Cancelar", "Contexto creado.", "No se pudieron cargar los contextos. Inténtelo de nuevo.", "Introduzca un nombre válido de 2 a 100 caracteres.", "No se pudo crear el contexto.", "Reintentar"],
  "fr-FR": ["+ Créer un contexte", "Nom du nouveau contexte", "Créer le contexte", "Annuler", "Contexte créé.", "Impossible de charger les contextes. Réessayez.", "Saisissez un nom valide de 2 à 100 caractères.", "Impossible de créer le contexte.", "Réessayer"],
} as const;
