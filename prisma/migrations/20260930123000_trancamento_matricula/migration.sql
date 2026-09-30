-- CreateEnum
CREATE TYPE "StatusTrancamentoMatricula" AS ENUM ('RASCUNHO', 'CONFIRMADO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "UnidadeTrancamentoMatricula" AS ENUM ('DIAS', 'MESES', 'SEMESTRES', 'INDETERMINADO');

-- AlterTable
ALTER TABLE "DocumentoGerado" ADD COLUMN     "trancamentoMatriculaId" INTEGER;

-- CreateTable
CREATE TABLE "TrancamentoMatricula" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "numeroProtocolo" TEXT NOT NULL,
    "status" "StatusTrancamentoMatricula" NOT NULL DEFAULT 'RASCUNHO',
    "statusAnterior" "StatusMatricula" NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacoes" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataRetornoPrevista" TIMESTAMP(3),
    "duracaoQuantidade" INTEGER,
    "duracaoUnidade" "UnidadeTrancamentoMatricula",
    "registradoPorId" INTEGER,
    "registradoPorNomeSnapshot" TEXT,
    "registradoPorCargoSnapshot" TEXT,
    "confirmadoPorId" INTEGER,
    "confirmadoPorNomeSnapshot" TEXT,
    "confirmadoPorCargoSnapshot" TEXT,
    "ipConfirmacao" TEXT,
    "userAgentConfirmacao" TEXT,
    "confirmadoEm" TIMESTAMP(3),
    "encerradoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrancamentoMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_instituicaoId_idx" ON "TrancamentoMatricula"("instituicaoId");

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_matriculaId_idx" ON "TrancamentoMatricula"("matriculaId");

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_instituicaoId_matriculaId_idx" ON "TrancamentoMatricula"("instituicaoId", "matriculaId");

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_instituicaoId_status_idx" ON "TrancamentoMatricula"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_instituicaoId_confirmadoEm_idx" ON "TrancamentoMatricula"("instituicaoId", "confirmadoEm");

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_registradoPorId_idx" ON "TrancamentoMatricula"("registradoPorId");

-- CreateIndex
CREATE INDEX "TrancamentoMatricula_confirmadoPorId_idx" ON "TrancamentoMatricula"("confirmadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "TrancamentoMatricula_instituicaoId_numeroProtocolo_key" ON "TrancamentoMatricula"("instituicaoId", "numeroProtocolo");

-- CreateIndex
CREATE INDEX "DocumentoGerado_trancamentoMatriculaId_idx" ON "DocumentoGerado"("trancamentoMatriculaId");

-- AddForeignKey
ALTER TABLE "TrancamentoMatricula" ADD CONSTRAINT "TrancamentoMatricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrancamentoMatricula" ADD CONSTRAINT "TrancamentoMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrancamentoMatricula" ADD CONSTRAINT "TrancamentoMatricula_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrancamentoMatricula" ADD CONSTRAINT "TrancamentoMatricula_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGerado" ADD CONSTRAINT "DocumentoGerado_trancamentoMatriculaId_fkey" FOREIGN KEY ("trancamentoMatriculaId") REFERENCES "TrancamentoMatricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
