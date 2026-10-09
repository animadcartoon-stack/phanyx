import "server-only";
import { Prisma, TipoDestinoRecomendacaoBiblioteca } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { falhaLeitor, type LeitorBiblioteca } from "@/lib/biblioteca-leitor";

export type DestinoLeitor = { chave: string; tipo: TipoDestinoRecomendacaoBiblioteca; id: number | null; nome: string };

export async function destinosProfessor(leitor: LeitorBiblioteca): Promise<DestinoLeitor[]> {
  if (leitor.portal !== "professor") return [];
  const [turmas, disciplinas] = await Promise.all([
    prisma.turma.findMany({ where: { instituicaoId: leitor.instituicaoId, ativa: true,
      OR: [{ professorId: leitor.vinculoId }, { disciplinas: { some: { instituicaoId: leitor.instituicaoId, professorId: leitor.vinculoId } } }] },
      select: { id: true, nome: true, cursoId: true }, orderBy: { nome: "asc" }, take: 1000 }),
    prisma.disciplina.findMany({ where: { instituicaoId: leitor.instituicaoId, ativo: true,
      OR: [{ professorId: leitor.vinculoId }, { turmaDisciplinas: { some: { instituicaoId: leitor.instituicaoId, professorId: leitor.vinculoId } } }] },
      select: { id: true, nome: true, cursoId: true }, orderBy: { nome: "asc" }, take: 1000 }),
  ]);
  const ids = [...new Set([...turmas, ...disciplinas].map((x) => x.cursoId).filter((x): x is number => x !== null))];
  const cursos = await prisma.curso.findMany({ where: { instituicaoId: leitor.instituicaoId, id: { in: ids } },
    select: { id: true, nome: true }, orderBy: { nome: "asc" } });
  return [
    { chave: "TODOS", tipo: "TODA_INSTITUICAO", id: null, nome: "" },
    ...cursos.map((x) => ({ chave: `CURSO:${x.id}`, tipo: "CURSO" as const, id: x.id, nome: x.nome })),
    ...turmas.map((x) => ({ chave: `TURMA:${x.id}`, tipo: "TURMA" as const, id: x.id, nome: x.nome })),
    ...disciplinas.map((x) => ({ chave: `DISCIPLINA:${x.id}`, tipo: "DISCIPLINA" as const, id: x.id, nome: x.nome })),
  ];
}

export async function filtroDestinosLeitor(leitor: LeitorBiblioteca): Promise<Prisma.BibliotecaRecomendacaoDestinoWhereInput> {
  if (leitor.portal === "professor") {
    const destinos = await destinosProfessor(leitor);
    return { instituicaoId: leitor.instituicaoId, chaveDestino: { in: destinos.map((d) => d.chave) } };
  }
  const matriculas = await prisma.matricula.findMany({ where: {
    instituicaoId: leitor.instituicaoId, alunoId: leitor.vinculoId, status: "ATIVA", excluidaEm: null, canceladaEm: null,
  }, select: { cursoId: true, turmaPrincipalId: true,
    itens: { where: { instituicaoId: leitor.instituicaoId }, select: { turmaId: true, disciplinaId: true } } } });
  const chaves = new Set(["TODOS"]);
  for (const matricula of matriculas) {
    if (matricula.cursoId) chaves.add(`CURSO:${matricula.cursoId}`);
    if (matricula.turmaPrincipalId) chaves.add(`TURMA:${matricula.turmaPrincipalId}`);
    for (const item of matricula.itens) { chaves.add(`TURMA:${item.turmaId}`); chaves.add(`DISCIPLINA:${item.disciplinaId}`); }
  }
  return { instituicaoId: leitor.instituicaoId, chaveDestino: { in: [...chaves] } };
}

export const selecaoRecomendacao = {
  id: true, itemId: true, titulo: true, mensagem: true, status: true, obrigatoria: true,
  destaque: true, disponivelInicioEm: true, disponivelFimEm: true,
  professor: { select: { nome: true } },
  item: { select: { titulo: true, slug: true, capaUrl: true } },
  destinos: { select: { chaveDestino: true, tipo: true, curso: { select: { nome: true } },
    turma: { select: { nome: true } }, disciplina: { select: { nome: true } } } },
} satisfies Prisma.BibliotecaRecomendacaoSelect;

export async function listarRecomendacoes(leitor: LeitorBiblioteca) {
  const agora = new Date();
  const destinos = await filtroDestinosLeitor(leitor);
  return prisma.bibliotecaRecomendacao.findMany({ where: {
    instituicaoId: leitor.instituicaoId, status: "PUBLICADA",
    item: { instituicaoId: leitor.instituicaoId, status: "PUBLICADO" }, destinos: { some: destinos },
    OR: [{ disponivelInicioEm: null }, { disponivelInicioEm: { lte: agora } }],
    AND: [{ OR: [{ disponivelFimEm: null }, { disponivelFimEm: { gte: agora } }] }],
  }, select: selecaoRecomendacao, orderBy: [{ destaque: "desc" }, { publicadaEm: "desc" }], take: 100 });
}

export async function validarDadosRecomendacao(leitor: LeitorBiblioteca, corpo: Record<string, unknown>) {
  if (leitor.portal !== "professor") falhaLeitor(403, "SOMENTE_PROFESSOR");
  const titulo = typeof corpo.titulo === "string" ? corpo.titulo.trim() : "";
  const mensagem = typeof corpo.mensagem === "string" ? corpo.mensagem.trim() : "";
  const status = corpo.status;
  if (titulo.length > 200 || mensagem.length > 10000 || !["RASCUNHO", "PUBLICADA"].includes(String(status)) ||
      typeof corpo.obrigatoria !== "boolean" || !Array.isArray(corpo.destinos) ||
      !corpo.destinos.length || corpo.destinos.length > 20 || corpo.destinos.some((d) => typeof d !== "string")) {
    falhaLeitor(400, "RECOMENDACAO_INVALIDA");
  }
  function data(valor: unknown) {
    if (valor === null || valor === undefined || valor === "") return null;
    if (typeof valor !== "string" || valor.length > 40) falhaLeitor(400, "RECOMENDACAO_INVALIDA");
    const d = new Date(valor); if (!Number.isFinite(d.getTime())) falhaLeitor(400, "RECOMENDACAO_INVALIDA"); return d;
  }
  const inicio = data(corpo.disponivelInicioEm); const fim = data(corpo.disponivelFimEm);
  if (inicio && fim && inicio > fim) falhaLeitor(400, "RECOMENDACAO_INVALIDA");
  const permitidos = await destinosProfessor(leitor);
  const chaves = [...new Set(corpo.destinos as string[])];
  const destinos = chaves.map((chave) => {
    const destino = permitidos.find((d) => d.chave === chave);
    if (!destino) falhaLeitor(403, "DESTINO_NAO_AUTORIZADO");
    return { instituicaoId: leitor.instituicaoId, tipo: destino.tipo, chaveDestino: destino.chave,
      cursoId: destino.tipo === "CURSO" ? destino.id : null,
      turmaId: destino.tipo === "TURMA" ? destino.id : null,
      disciplinaId: destino.tipo === "DISCIPLINA" ? destino.id : null };
  });
  return { titulo: titulo || null, mensagem: mensagem || null, status: status as "RASCUNHO" | "PUBLICADA",
    obrigatoria: corpo.obrigatoria as boolean, disponivelInicioEm: inicio, disponivelFimEm: fim, destinos };
}
