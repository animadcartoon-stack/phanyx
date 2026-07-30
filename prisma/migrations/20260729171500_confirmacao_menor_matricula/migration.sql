ALTER TABLE "Matricula"
ADD COLUMN IF NOT EXISTS "alunoMenorNoMomentoMatricula" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "idadeNoMomentoMatricula" INTEGER,
ADD COLUMN IF NOT EXISTS "responsavelIncompletoNoMomentoMatricula" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "confirmacaoMenorEm" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "confirmacaoMenorPorUserId" INTEGER,
ADD COLUMN IF NOT EXISTS "confirmacaoMenorPorFuncionarioId" INTEGER,
ADD COLUMN IF NOT EXISTS "confirmacaoMenorPorNomeSnapshot" TEXT,
ADD COLUMN IF NOT EXISTS "textoConfirmacaoMenor" TEXT;

CREATE INDEX IF NOT EXISTS "Matricula_confirmacaoMenorPorUserId_idx"
ON "Matricula"("confirmacaoMenorPorUserId");

CREATE INDEX IF NOT EXISTS "Matricula_confirmacaoMenorPorFuncionarioId_idx"
ON "Matricula"("confirmacaoMenorPorFuncionarioId");

CREATE INDEX IF NOT EXISTS "Matricula_alunoMenorNoMomentoMatricula_idx"
ON "Matricula"("alunoMenorNoMomentoMatricula");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Matricula_confirmacaoMenorPorUserId_fkey'
  ) THEN
    ALTER TABLE "Matricula"
    ADD CONSTRAINT "Matricula_confirmacaoMenorPorUserId_fkey"
    FOREIGN KEY ("confirmacaoMenorPorUserId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Matricula_confirmacaoMenorPorFuncionarioId_fkey'
  ) THEN
    ALTER TABLE "Matricula"
    ADD CONSTRAINT "Matricula_confirmacaoMenorPorFuncionarioId_fkey"
    FOREIGN KEY ("confirmacaoMenorPorFuncionarioId")
    REFERENCES "Funcionario"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;