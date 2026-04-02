-- CreateEnum
CREATE TYPE "TipoLancamentoFinanceiro" AS ENUM ('MATRICULA', 'MENSALIDADE', 'TAXA', 'DESCONTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusLancamentoFinanceiro" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'OUTRO');

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "quantidadeParcelas" INTEGER,
ADD COLUMN     "valorMatricula" DOUBLE PRECISION,
ADD COLUMN     "valorMensalidade" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" SERIAL NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL,
    "pagoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formaPagamento" "FormaPagamento",
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "lancamentoId" INTEGER NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoLancamentoFinanceiro" NOT NULL,
    "descricao" TEXT,
    "valorOriginal" DOUBLE PRECISION NOT NULL,
    "valorPago" DOUBLE PRECISION DEFAULT 0,
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "status" "StatusLancamentoFinanceiro" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "matriculaId" INTEGER,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pagamento_instituicaoId_idx" ON "Pagamento"("instituicaoId");

-- CreateIndex
CREATE INDEX "Pagamento_alunoId_idx" ON "Pagamento"("alunoId");

-- CreateIndex
CREATE INDEX "Pagamento_lancamentoId_idx" ON "Pagamento"("lancamentoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_instituicaoId_idx" ON "LancamentoFinanceiro"("instituicaoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_alunoId_idx" ON "LancamentoFinanceiro"("alunoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_matriculaId_idx" ON "LancamentoFinanceiro"("matriculaId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_status_idx" ON "LancamentoFinanceiro"("status");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_tipo_idx" ON "LancamentoFinanceiro"("tipo");

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
