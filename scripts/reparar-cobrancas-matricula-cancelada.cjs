/*
 * Reconciliação explícita de um cancelamento SEM CUSTO já confirmado.
 * Consulta: node scripts/reparar-cobrancas-matricula-cancelada.cjs --matricula 37 --aluno "Claudio de Jesus"
 * Aplicar: acrescente --aplicar --sem-custo.
 * Não exclui pagamentos, não altera documentos/datas e não simula cancelamento no banco.
 */
const STATUS_PENDENTES = ["PENDENTE", "ATRASADO", "PARCIAL"];

async function reparar(prisma, { matriculaId, alunoNome, aplicar = false, semCusto = false }) {
  if (!Number.isInteger(matriculaId) || matriculaId <= 0 || !alunoNome?.trim()) {
    throw new Error("Informe --matricula ID e --aluno NOME para conferir o destinatário.");
  }
  if (aplicar && !semCusto) throw new Error("A aplicação exige --sem-custo para confirmar a isenção.");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Matricula" WHERE "id" = ${matriculaId} FOR UPDATE`;
    const matricula = await tx.matricula.findUnique({
      where: { id: matriculaId },
      select: { id: true, instituicaoId: true, status: true, aluno: { select: { nome: true } } },
    });
    if (!matricula || matricula.aluno.nome.trim().toLocaleLowerCase("pt-BR") !== alunoNome.trim().toLocaleLowerCase("pt-BR")) {
      throw new Error("Matrícula e nome do aluno não conferem. Nenhuma alteração realizada.");
    }
    if (matricula.status !== "CANCELADA") throw new Error("A matrícula precisa estar cancelada.");
    const parcelas = await tx.lancamentoFinanceiro.findMany({
      where: { matriculaId, instituicaoId: matricula.instituicaoId,
        tipo: { in: ["MATRICULA", "MENSALIDADE"] }, status: { in: STATUS_PENDENTES } },
      include: { cobrancasFinanceiras: true }, orderBy: { id: "asc" },
    });
    const boletos = await tx.cobrancaFinanceira.findMany({
      where: { instituicaoId: matricula.instituicaoId,
        lancamentoFinanceiro: { matriculaId, tipo: { in: ["MATRICULA", "MENSALIDADE"] } },
        statusBancario: { notIn: ["CANCELADO", "ESTORNADO"] } },
      select: { id: true, cobrancaExternaId: true, statusBancario: true, statusOperacional: true },
    });
    if (aplicar && boletos.some(b => b.cobrancaExternaId && !["CANCELADO", "ESTORNADO"].includes(b.statusBancario))) {
      throw new Error("CANCELAMENTO_BANCARIO_NECESSARIO: cancele/confira os boletos no Asaas antes de reconciliar os saldos locais.");
    }
    if (aplicar) {
      for (const parcela of parcelas) {
        await tx.lancamentoFinanceiro.updateMany({
          where: { id: parcela.id, matriculaId, instituicaoId: matricula.instituicaoId,
            status: { in: STATUS_PENDENTES } },
          data: { status: "CANCELADO", observacao: [parcela.observacao,
            `Reconciliação de cancelamento sem custo em ${new Date().toISOString()}. Saldo remanescente cancelado; pagamentos preservados.`
          ].filter(Boolean).join("\n") },
        });
      }
    }
    return { modo: aplicar ? "APLICADO" : "CONSULTA", matricula,
      parcelas: parcelas.map(({ id, status, valorPago }) => ({ id, statusAnterior: status,
        statusNovo: aplicar ? "CANCELADO" : status, valorPagoPreservado: valorPago })),
      boletosParaConferenciaBancaria: boletos,
      aviso: "Boletos externos listados precisam de conferência/cancelamento no provedor. Nenhum estado bancário foi alterado por este script." };
  }, { maxWait: 5000, timeout: 60000 });
}

if (require.main === module) {
  require("@next/env").loadEnvConfig(process.cwd());
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const args = process.argv.slice(2);
  const valor = (chave) => args[args.indexOf(chave) + 1];
  reparar(prisma, { matriculaId: Number(args.includes("--matricula") ? valor("--matricula") : 0),
    alunoNome: args.includes("--aluno") ? valor("--aluno") : "", aplicar: args.includes("--aplicar"), semCusto: args.includes("--sem-custo") })
    .then((resultado) => console.log(JSON.stringify(resultado, null, 2)))
    .catch((erro) => { console.error(erro.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
module.exports = { reparar };
