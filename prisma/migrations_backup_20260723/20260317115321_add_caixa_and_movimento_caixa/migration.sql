-- CreateEnum
CREATE TYPE "StatusCaixa" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoCaixa" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "Caixa" (
    "id" SERIAL NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoSistema" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoInformado" DOUBLE PRECISION,
    "diferenca" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacaoAbertura" TEXT,
    "observacaoFechamento" TEXT,
    "status" "StatusCaixa" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "abertoPorId" INTEGER,
    "fechadoPorId" INTEGER,

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoCaixa" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMovimentoCaixa" NOT NULL,
    "descricao" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "formaPagamento" "FormaPagamento",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "caixaId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "lancamentoId" INTEGER,

    CONSTRAINT "MovimentoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Caixa_instituicaoId_idx" ON "Caixa"("instituicaoId");

-- CreateIndex
CREATE INDEX "Caixa_status_idx" ON "Caixa"("status");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_instituicaoId_idx" ON "MovimentoCaixa"("instituicaoId");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_caixaId_idx" ON "MovimentoCaixa"("caixaId");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_alunoId_idx" ON "MovimentoCaixa"("alunoId");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_lancamentoId_idx" ON "MovimentoCaixa"("lancamentoId");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_tipo_idx" ON "MovimentoCaixa"("tipo");

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
