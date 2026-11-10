import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const PAGINAS_PROFESSOR: ReadonlyArray<{ chave: string; nome: string; padrao: boolean }> = [
  { chave: "professor.painel", nome: "Painel", padrao: true },
  { chave: "professor.turmas", nome: "Turmas", padrao: true },
  { chave: "professor.substituicoes", nome: "Substituições docentes", padrao: true },
  { chave: "professor.alunos", nome: "Alunos", padrao: true },
  { chave: "professor.materiais", nome: "Materiais e aulas", padrao: true },
  { chave: "professor.biblioteca", nome: "Biblioteca", padrao: false },
  { chave: "professor.atividades", nome: "Atividades", padrao: true },
  { chave: "professor.provas", nome: "Avaliações e provas", padrao: true },
  { chave: "professor.trabalhos", nome: "Trabalhos", padrao: true },
  { chave: "professor.reunioes", nome: "Reuniões", padrao: true },
  { chave: "professor.mobilidade", nome: "Mobilidade", padrao: false },
  { chave: "professor.ouvidoria", nome: "Ouvidoria", padrao: true },
  { chave: "professor.planejamento", nome: "Planejamento de aulas", padrao: false },
  { chave: "professor.relatorios", nome: "Relatórios de aulas", padrao: false },
  { chave: "professor.desenvolvimento", nome: "Desenvolvimento dos alunos", padrao: false },
];

// Cache somente da requisicao: evita consultas repetidas para cada link do portal.
const lerConfiguracaoEfetiva = cache(async (instituicaoId: number, professorId: number) => {
  const [institucionais, individuais] = await Promise.all([
    prisma.configuracaoPortalInstituicao.findMany({
      where: { instituicaoId, portal: "PROFESSOR" },
      select: { chavePagina: true, visivel: true },
    }),
    prisma.professorPaginaPortal.findMany({
      where: { instituicaoId, professorId },
      select: { chavePagina: true, modo: true },
    }),
  ]);
  return {
    institucionais: new Map<string, boolean>(institucionais.map(p => [p.chavePagina, p.visivel] as const)),
    individuais: new Map<string, string>(individuais.map(p => [p.chavePagina, p.modo] as const)),
  };
});

export async function paginaProfessorVisivel(
  instituicaoId: number,
  portal: "ALUNO" | "PROFESSOR",
  chavePagina: string,
  professorId: number,
  visivelPadrao = true,
): Promise<boolean> {
  if (portal !== "PROFESSOR") return false;
  const { institucionais, individuais } = await lerConfiguracaoEfetiva(instituicaoId, professorId);
  const override = individuais.get(chavePagina);
  if (override === "HABILITADA") return true;
  if (override === "DESABILITADA") return false;
  return institucionais.get(chavePagina) ?? visivelPadrao;
}

export async function professorAutorizado(userId: number, instituicaoId: number, chavePagina: string) {
  const professor = await prisma.professor.findFirst({
    where: { userId, instituicaoId, ativo: true }, select: { id: true, nome: true },
  });
  if (!professor) return null;
  const pagina = PAGINAS_PROFESSOR.find(item => item.chave === chavePagina);
  const visivel = await paginaProfessorVisivel(instituicaoId, "PROFESSOR", chavePagina, professor.id, pagina?.padrao ?? false);
  return visivel ? professor : null;
}
