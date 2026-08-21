-- CreateEnum
CREATE TYPE "StatusManutencaoExemplarBiblioteca" AS ENUM ('ABERTA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ResultadoManutencaoExemplarBiblioteca" AS ENUM ('REPARADO', 'IRRECUPERAVEL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AcaoAuditoriaBiblioteca" ADD VALUE 'INICIAR_MANUTENCAO';
ALTER TYPE "AcaoAuditoriaBiblioteca" ADD VALUE 'CONCLUIR_MANUTENCAO';
ALTER TYPE "AcaoAuditoriaBiblioteca" ADD VALUE 'CANCELAR_MANUTENCAO';

-- CreateTable
CREATE TABLE "BibliotecaManutencaoExemplar" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "exemplarId" INTEGER NOT NULL,
    "status" "StatusManutencaoExemplarBiblioteca" NOT NULL DEFAULT 'ABERTA',
    "resultado" "ResultadoManutencaoExemplarBiblioteca",
    "motivo" TEXT NOT NULL,
    "observacaoEntrada" TEXT,
    "fornecedor" TEXT,
    "custoEstimado" DECIMAL(12,2),
    "custoFinal" DECIMAL(12,2),
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previsaoRetornoEm" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "observacaoConclusao" TEXT,
    "iniciadoPorId" INTEGER,
    "concluidoPorId" INTEGER,
    "canceladoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaManutencaoExemplar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_instituicaoId_idx" ON "BibliotecaManutencaoExemplar"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_instituicaoId_status_idx" ON "BibliotecaManutencaoExemplar"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_exemplarId_idx" ON "BibliotecaManutencaoExemplar"("exemplarId");

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_exemplarId_status_idx" ON "BibliotecaManutencaoExemplar"("exemplarId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_iniciadoPorId_idx" ON "BibliotecaManutencaoExemplar"("iniciadoPorId");

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_concluidoPorId_idx" ON "BibliotecaManutencaoExemplar"("concluidoPorId");

-- CreateIndex
CREATE INDEX "BibliotecaManutencaoExemplar_canceladoPorId_idx" ON "BibliotecaManutencaoExemplar"("canceladoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaManutencaoExemplar_id_instituicaoId_key" ON "BibliotecaManutencaoExemplar"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "BibliotecaManutencaoExemplar" ADD CONSTRAINT "BibliotecaManutencaoExemplar_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaManutencaoExemplar" ADD CONSTRAINT "BibliotecaManutencaoExemplar_exemplarId_instituicaoId_fkey" FOREIGN KEY ("exemplarId", "instituicaoId") REFERENCES "BibliotecaExemplar"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaManutencaoExemplar" ADD CONSTRAINT "BibliotecaManutencaoExemplar_iniciadoPorId_fkey" FOREIGN KEY ("iniciadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaManutencaoExemplar" ADD CONSTRAINT "BibliotecaManutencaoExemplar_concluidoPorId_fkey" FOREIGN KEY ("concluidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaManutencaoExemplar" ADD CONSTRAINT "BibliotecaManutencaoExemplar_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

