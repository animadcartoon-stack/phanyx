import type { Prisma } from "@prisma/client";
import type { UsuarioLogado } from "@/lib/server-auth";

export const dadosEdicaoMatricula = {
  alunoId: true,
  cursoId: true,
  turmaPrincipalId: true,
  cursoSemestreId: true,
  periodoMatriculaId: true,
  semestre: true,
  etapaNumero: true,
  organizacaoCurricular: true,
  periodoLetivo: true,
  modalidade: true,
  tipoContratacao: true,
  dataInicioCurso: true,
  valorMatricula: true,
  valorMensalidade: true,
  bolsaPercentual: true,
  quantidadeMensalidades: true,
  quantidadeParcelas: true,
  primeiroVencimento: true,
  dataPrimeiroVencimento: true,
  vendedorResponsavelId: true,
  itens: {
    where: { status: { in: ["A_CURSAR", "EM_CURSO"] } },
    orderBy: [{ turmaId: "asc" }, { disciplinaId: "asc" }],
    select: { turmaId: true, disciplinaId: true, tipoItem: true },
  },
  disciplinasContratadas: {
    orderBy: { ordemSnapshot: "asc" },
    select: { disciplinaId: true },
  },
} satisfies Prisma.MatriculaSelect;

export function diferencasEdicao(antes: object, depois: object): Prisma.InputJsonObject {
  // Prisma Decimal e Date são guardados nas suas representações estáveis de JSON.
  const anterior: Prisma.JsonObject = JSON.parse(JSON.stringify(antes));
  const novo: Prisma.JsonObject = JSON.parse(JSON.stringify(depois));
  return Object.fromEntries(Object.entries(novo).flatMap(([campo, valor]) =>
    JSON.stringify(anterior[campo]) === JSON.stringify(valor)
      ? [] : [[campo, { anterior: anterior[campo] ?? null, novo: valor ?? null }]],
  ));
}

type AutorEdicao = Pick<UsuarioLogado, "id" | "nome" | "funcionarioId" | "masterOriginalId">;

export function registrarEdicaoMatricula(
  db: Prisma.TransactionClient,
  vinculo: { matriculaId: number; instituicaoId: number },
  autor: AutorEdicao,
  acao: "EDICAO" | "DATA_INICIO" | "VALORES",
  alteracoes: Prisma.InputJsonObject,
  motivo?: string,
) {
  return db.edicaoMatricula.create({
    data: { ...vinculo, acao, motivo, alteracoes, usuarioId: autor.id,
      usuarioNome: autor.nome, funcionarioId: autor.funcionarioId, masterOriginalId: autor.masterOriginalId },
  });
}
