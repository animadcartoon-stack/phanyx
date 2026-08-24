ALTER TABLE "Aluno"
  ADD COLUMN IF NOT EXISTS "nacionalidade" TEXT,
  ADD COLUMN IF NOT EXISTS "paisNascimento" TEXT,
  ADD COLUMN IF NOT EXISTS "paisResidencia" TEXT,
  ADD COLUMN IF NOT EXISTS "tipoDocumento" TEXT,
  ADD COLUMN IF NOT EXISTS "numeroDocumento" TEXT,
  ADD COLUMN IF NOT EXISTS "paisTelefone" TEXT,
  ADD COLUMN IF NOT EXISTS "tipoDocumentoResponsavel" TEXT,
  ADD COLUMN IF NOT EXISTS "numeroDocumentoResponsavel" TEXT,
  ADD COLUMN IF NOT EXISTS "paisTelefoneResponsavel" TEXT;
