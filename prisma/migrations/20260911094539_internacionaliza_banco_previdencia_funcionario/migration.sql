
-- Previdencia / seguridade social do funcionario

ALTER TABLE "Funcionario"
ADD COLUMN IF NOT EXISTS "paisIdentificacaoPrevidenciaria" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "tipoIdentificacaoPrevidenciaria" TEXT,
ADD COLUMN IF NOT EXISTS "numeroIdentificacaoPrevidenciaria" TEXT;

-- Conta bancaria internacional do funcionario

ALTER TABLE "ContaBancariaFuncionarioRH"
ADD COLUMN IF NOT EXISTS "paisCodigo" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "moeda" VARCHAR(3),
ADD COLUMN IF NOT EXISTS "iban" TEXT,
ADD COLUMN IF NOT EXISTS "bicSwift" TEXT,
ADD COLUMN IF NOT EXISTS "routingNumber" TEXT,
ADD COLUMN IF NOT EXISTS "sortCode" TEXT;
