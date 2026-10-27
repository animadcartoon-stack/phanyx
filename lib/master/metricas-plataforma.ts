import { Prisma, type PrismaClient } from "@prisma/client";

export async function consultarMetricasPlataforma(db: PrismaClient) {
  return db.$transaction(async tx => {
    const [instituicoes, instituicoesAtivas, alunos, alunosAtivos, professores, professoresAtivos,
      cursosAtivos, matriculasAtivas, turmasAtivas, usuariosAtivos, provas, documentos] = await Promise.all([
      tx.instituicao.count(), tx.instituicao.count({ where: { ativo: true } }),
      tx.aluno.count(), tx.aluno.count({ where: { ativo: true } }),
      tx.professor.count(), tx.professor.count({ where: { ativo: true } }),
      tx.curso.count({ where: { ativo: true, excluidoEm: null } }),
      tx.matricula.count({ where: { status: "ATIVA", excluidaEm: null, canceladaEm: null } }),
      tx.turma.count({ where: { ativa: true } }), tx.user.count({ where: { ativo: true } }),
      tx.prova.count(), tx.documentoGerado.count(),
    ]);
    return { geradoEm: new Date().toISOString(), instituicoes, instituicoesAtivas, alunos, alunosAtivos,
      professores, professoresAtivos, cursosAtivos, matriculasAtivas, turmasAtivas, usuariosAtivos, provas, documentos };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
