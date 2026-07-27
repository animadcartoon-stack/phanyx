ALTER TABLE "Turma"
ADD COLUMN IF NOT EXISTS "turno" TEXT;

ALTER TABLE "Turma"
ADD COLUMN IF NOT EXISTS "modalidade" TEXT;

UPDATE "Turma"
SET "turno" = "periodoLetivo"
WHERE "turno" IS NULL
  AND "periodoLetivo" IS NOT NULL;

UPDATE "Turma"
SET "modalidade" =
  CASE
    WHEN UPPER(COALESCE("periodoLetivo", '')) LIKE '%EAD%'
      THEN 'EAD'
    ELSE 'PRESENCIAL'
  END
WHERE "modalidade" IS NULL;