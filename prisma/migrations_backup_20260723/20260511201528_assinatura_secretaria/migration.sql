ALTER TABLE "Contrato"
ADD COLUMN IF NOT EXISTS "assinaturaSecretariaImagem" TEXT,
ADD COLUMN IF NOT EXISTS "assinaturaSecretariaNome" TEXT,
ADD COLUMN IF NOT EXISTS "assinaturaSecretariaUserId" INTEGER,
ADD COLUMN IF NOT EXISTS "assinaturaSecretariaEm" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "assinaturaSecretariaIp" TEXT,
ADD COLUMN IF NOT EXISTS "assinaturaSecretariaUserAgent" TEXT;