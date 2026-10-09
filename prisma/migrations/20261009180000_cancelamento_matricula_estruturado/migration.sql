-- CreateEnum
CREATE TYPE "StatusCancelamentoMatricula" AS ENUM ('RASCUNHO', 'FINALIZADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "DocumentoGerado"
  ADD COLUMN "cancelamentoMatriculaId" INTEGER;

-- CreateTable
CREATE TABLE "CancelamentoMatricula" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "numeroProtocolo" TEXT NOT NULL,
    "status" "StatusCancelamentoMatricula" NOT NULL DEFAULT 'RASCUNHO',
    "statusAnterior" "StatusMatricula" NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacoes" TEXT,
    "dataSolicitacao" TIMESTAMP(3) NOT NULL,
    "dataEfetiva" TIMESTAMP(3) NOT NULL,
    "regraContratual" TEXT,
    "baseCalculoMulta" DECIMAL(12,2),
    "percentualMulta" DECIMAL(7,4),
    "valorParcelasVencidas" DECIMAL(12,2),
    "valorMulta" DECIMAL(12,2),
    "valorJuros" DECIMAL(12,2),
    "valorCredito" DECIMAL(12,2),
    "valorDevolucao" DECIMAL(12,2),
    "valorTotal" DECIMAL(12,2),
    "situacaoFinanceira" TEXT,
    "registradoPorId" INTEGER,
    "registradoPorNomeSnapshot" TEXT,
    "registradoPorCargoSnapshot" TEXT,
    "finalizadoPorId" INTEGER,
    "finalizadoPorNomeSnapshot" TEXT,
    "finalizadoPorCargoSnapshot" TEXT,
    "ipFinalizacao" TEXT,
    "userAgentFinalizacao" TEXT,
    "finalizadoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CancelamentoMatricula_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CancelamentoMatricula_instituicaoId_numeroProtocolo_key"
  ON "CancelamentoMatricula"("instituicaoId", "numeroProtocolo");
CREATE INDEX "CancelamentoMatricula_instituicaoId_idx"
  ON "CancelamentoMatricula"("instituicaoId");
CREATE INDEX "CancelamentoMatricula_matriculaId_idx"
  ON "CancelamentoMatricula"("matriculaId");
CREATE INDEX "CancelamentoMatricula_instituicaoId_matriculaId_idx"
  ON "CancelamentoMatricula"("instituicaoId", "matriculaId");
CREATE INDEX "CancelamentoMatricula_instituicaoId_status_idx"
  ON "CancelamentoMatricula"("instituicaoId", "status");
CREATE INDEX "CancelamentoMatricula_instituicaoId_finalizadoEm_idx"
  ON "CancelamentoMatricula"("instituicaoId", "finalizadoEm");
CREATE INDEX "CancelamentoMatricula_registradoPorId_idx"
  ON "CancelamentoMatricula"("registradoPorId");
CREATE INDEX "CancelamentoMatricula_finalizadoPorId_idx"
  ON "CancelamentoMatricula"("finalizadoPorId");
CREATE INDEX "DocumentoGerado_cancelamentoMatriculaId_idx"
  ON "DocumentoGerado"("cancelamentoMatriculaId");

ALTER TABLE "CancelamentoMatricula"
  ADD CONSTRAINT "CancelamentoMatricula_instituicaoId_fkey"
  FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CancelamentoMatricula"
  ADD CONSTRAINT "CancelamentoMatricula_matriculaId_fkey"
  FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CancelamentoMatricula"
  ADD CONSTRAINT "CancelamentoMatricula_registradoPorId_fkey"
  FOREIGN KEY ("registradoPorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CancelamentoMatricula"
  ADD CONSTRAINT "CancelamentoMatricula_finalizadoPorId_fkey"
  FOREIGN KEY ("finalizadoPorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentoGerado"
  ADD CONSTRAINT "DocumentoGerado_cancelamentoMatriculaId_fkey"
  FOREIGN KEY ("cancelamentoMatriculaId") REFERENCES "CancelamentoMatricula"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
