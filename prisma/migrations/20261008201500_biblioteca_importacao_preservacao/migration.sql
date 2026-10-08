ALTER TABLE "BibliotecaItem"
ADD COLUMN IF NOT EXISTS "registrosImportados" JSONB,
ADD COLUMN IF NOT EXISTS "imagensImportadas" JSONB;
