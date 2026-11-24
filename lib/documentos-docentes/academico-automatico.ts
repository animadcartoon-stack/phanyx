// Explicit academic markers: manual fields and old snapshots are not reinterpreted.
export const chavesAcademicas = {
  className: "nomeTurma", courseName: "nomeCurso", subjectName: "nomeDisciplina",
  academicModality: "modalidade", academicPeriod: "periodoLetivo", academicYear: "anoLetivo",
  twoMonthTerm: "bimestre", academicSemester: "semestre", campusName: "nomePolo",
  classShift: "turno", classroom: "sala",
} as const;
export type ChaveAcademica = keyof typeof chavesAcademicas;
const mapa = new Map<string, ChaveAcademica>();
for (const [en, pt] of Object.entries(chavesAcademicas)) { mapa.set(en, en as ChaveAcademica); mapa.set(pt, en as ChaveAcademica); }
const re = /\{\{\s*docente:([A-Za-z]+)\s*\}\}/g;
function textos(html: string, fn: (s: string) => string) {
  return String(html || "").split(/(<!--[\s\S]*?-->|<(?:(?:"[^"]*"|'[^']*')|[^'">])*>)/g).map((s,i) => i % 2 ? s : fn(s)).join("");
}
export function camposAcademicos(html: string): ChaveAcademica[] {
  const keys = new Set<ChaveAcademica>();
  textos(html,s => { for (const m of s.matchAll(re)) { const k = mapa.get(m[1]); if(k) keys.add(k); } return s; });
  return [...keys];
}
function escape(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/\{/g,"&#123;").replace(/\}/g,"&#125;"); }
export function preencherAcademico(html: string, dados: Partial<Record<ChaveAcademica,string>>) {
  return textos(html,s => s.replace(re,(tag,k: string) => { const chave = mapa.get(k); return chave && typeof dados[chave] === "string" && dados[chave]!.trim() ? escape(dados[chave]!) : tag; }));
}
export const rotulosAcademicos = {
  "pt-BR": ["Turma","Curso","Disciplina","Modalidade","Período letivo","Ano letivo","Bimestre","Semestre","Polo/unidade","Turno","Sala"],
  "pt-PT": ["Turma","Curso","Disciplina","Modalidade","Período letivo","Ano letivo","Bimestre","Semestre","Polo/unidade","Turno","Sala"],
  "en-US": ["Class","Course","Subject","Modality","Academic period","Academic year","Two-month term","Semester","Campus","Shift","Classroom"],
  "es-ES": ["Grupo","Curso","Asignatura","Modalidad","Periodo lectivo","Año lectivo","Bimestre","Semestre","Sede","Turno","Aula"],
  "fr-FR": ["Classe","Cursus","Matière","Modalité","Période scolaire","Année scolaire","Bimestre","Semestre","Site","Créneau","Salle"],
} as const;
export function rotulosAcademico(locale: string) { return rotulosAcademicos[locale as keyof typeof rotulosAcademicos] ?? rotulosAcademicos["en-US"]; }
export function legendaAcademica(locale: string) {
  const m = {
    "pt-BR": ["Dados acadêmicos","Selecione a turma e, quando aplicável, a disciplina. Os dados serão fixados ao salvar a versão.","Selecione","Sem disciplina","Informe o ano e bimestre quando solicitados. Dados não cadastrados serão sinalizados.","Não cadastrado","Variáveis acadêmicas"],
    "pt-PT": ["Dados académicos","Selecione a turma e, quando aplicável, a disciplina. Os dados serão fixados ao guardar a versão.","Selecione","Sem disciplina","Indique o ano e bimestre quando solicitados. Dados não registados serão sinalizados.","Não registado","Variáveis académicas"],
    "en-US": ["Academic data","Select the class and subject if applicable. Values are fixed when the version is saved.","Select","No subject","Enter year and term when requested. Missing records will be indicated.","Not recorded","Academic variables"],
    "es-ES": ["Datos académicos","Seleccione el grupo y la asignatura cuando corresponda. Los datos se fijan al guardar la versión.","Seleccione","Sin asignatura","Indique año y bimestre cuando se soliciten. Se indican los datos no registrados.","No registrado","Variables académicas"],
    "fr-FR": ["Données scolaires","Choisissez la classe et la matière si nécessaire. Les données sont fixées à l'enregistrement de la version.","Sélectionner","Sans matière","Indiquez l'année et le bimestre si demandés. Les données manquantes seront signalées.","Non renseigné","Variables scolaires"],
  } as const;
  return m[locale as keyof typeof m] ?? m["en-US"];
}