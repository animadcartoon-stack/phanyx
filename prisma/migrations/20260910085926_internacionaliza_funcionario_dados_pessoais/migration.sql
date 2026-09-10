-- Internacionalizacao dos dados pessoais do funcionario.
-- Todos os novos campos sao opcionais para preservar os registros existentes.

ALTER TABLE "Funcionario"
ADD COLUMN "paisTelefone" VARCHAR(2),
ADD COLUMN "nacionalidade" TEXT,
ADD COLUMN "paisResidencia" VARCHAR(2),
ADD COLUMN "tipoDocumento" TEXT,
ADD COLUMN "numeroDocumento" TEXT,
ADD COLUMN "tipoDocumentoFiscal" TEXT,
ADD COLUMN "numeroDocumentoFiscal" TEXT;
