-- Internacionalizacao dos dados pessoais do funcionario
-- Campos opcionais para preservar compatibilidade com registros existentes.

ALTER TABLE "Funcionario"
ADD COLUMN IF NOT EXISTS "paisTelefone" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "nacionalidade" TEXT,
ADD COLUMN IF NOT EXISTS "paisResidencia" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "tipoDocumento" TEXT,
ADD COLUMN IF NOT EXISTS "numeroDocumento" TEXT,
ADD COLUMN IF NOT EXISTS "tipoDocumentoFiscal" TEXT,
ADD COLUMN IF NOT EXISTS "numeroDocumentoFiscal" TEXT;
