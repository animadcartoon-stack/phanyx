ALTER TABLE "Certificado"
ADD COLUMN IF NOT EXISTS "certificadoModeloId" INTEGER,
ADD COLUMN IF NOT EXISTS "certificadoModeloVersaoId" INTEGER;

CREATE INDEX IF NOT EXISTS "Certificado_certificadoModeloId_idx"
ON "Certificado"("certificadoModeloId");

CREATE INDEX IF NOT EXISTS "Certificado_certificadoModeloVersaoId_idx"
ON "Certificado"("certificadoModeloVersaoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Certificado_certificadoModeloId_fkey'
  ) THEN
    ALTER TABLE "Certificado"
    ADD CONSTRAINT "Certificado_certificadoModeloId_fkey"
    FOREIGN KEY ("certificadoModeloId")
    REFERENCES "CertificadoModelo"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Certificado_certificadoModeloVersaoId_fkey'
  ) THEN
    ALTER TABLE "Certificado"
    ADD CONSTRAINT "Certificado_certificadoModeloVersaoId_fkey"
    FOREIGN KEY ("certificadoModeloVersaoId")
    REFERENCES "CertificadoModeloVersao"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END
$$;