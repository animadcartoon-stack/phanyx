ALTER TABLE "CobrancaFinanceira"
ADD COLUMN "ultimoEnvioEm" TIMESTAMP(3),
ADD COLUMN "ultimoEnvioCanal" TEXT,
ADD COLUMN "ultimoEnvioPorUsuarioId" INTEGER,
ADD COLUMN "ultimoEnvioPorNomeSnapshot" TEXT,
ADD COLUMN "quantidadeEnvios" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "CobrancaFinanceira_ultimoEnvioEm_idx"
ON "CobrancaFinanceira"("ultimoEnvioEm");

CREATE INDEX "CobrancaFinanceira_ultimoEnvioPorUsuarioId_idx"
ON "CobrancaFinanceira"("ultimoEnvioPorUsuarioId");

ALTER TABLE "CobrancaFinanceira"
ADD CONSTRAINT "CobrancaFinanceira_ultimoEnvioPorUsuarioId_instituicaoId_fkey"
FOREIGN KEY ("ultimoEnvioPorUsuarioId", "instituicaoId")
REFERENCES "User"("id", "instituicaoId")
ON DELETE RESTRICT
ON UPDATE CASCADE;