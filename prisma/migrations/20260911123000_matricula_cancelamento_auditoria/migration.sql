ALTER TABLE "Matricula"
  ADD COLUMN IF NOT EXISTS "canceladaEm" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "canceladaPorId" INTEGER,
  ADD COLUMN IF NOT EXISTS "motivoCancelamento" TEXT;

CREATE INDEX IF NOT EXISTS "Matricula_instituicaoId_canceladaEm_idx"
  ON "Matricula"("instituicaoId", "canceladaEm");