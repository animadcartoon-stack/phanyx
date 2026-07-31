-- =========================================================
-- Biblioteca de logos institucionais
-- Preserva ConfiguracaoInstituicao.logoUrl como fallback
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TipoLogoInstituicao'
  ) THEN
    CREATE TYPE "TipoLogoInstituicao" AS ENUM (
      'PRINCIPAL',
      'FUNDO_CLARO',
      'FUNDO_ESCURO',
      'MONOCROMATICA',
      'OUTRA'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ModoLogoDocumento'
  ) THEN
    CREATE TYPE "ModoLogoDocumento" AS ENUM (
      'AUTOMATICA',
      'PRINCIPAL',
      'FUNDO_CLARO',
      'FUNDO_ESCURO',
      'PERSONALIZADA',
      'SEM_LOGO'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "InstituicaoLogo" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "tipo" "TipoLogoInstituicao" NOT NULL DEFAULT 'OUTRA',
  "arquivoUrl" TEXT NOT NULL,
  "arquivoPath" TEXT,
  "mimeType" TEXT,
  "largura" INTEGER,
  "altura" INTEGER,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "criadoPorId" INTEGER,
  "atualizadoPorId" INTEGER,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstituicaoLogo_pkey"
    PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'InstituicaoLogo_instituicaoId_fkey'
  ) THEN
    ALTER TABLE "InstituicaoLogo"
      ADD CONSTRAINT "InstituicaoLogo_instituicaoId_fkey"
      FOREIGN KEY ("instituicaoId")
      REFERENCES "Instituicao"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS
  "InstituicaoLogo_instituicaoId_nome_key"
ON "InstituicaoLogo"(
  "instituicaoId",
  "nome"
);

CREATE INDEX IF NOT EXISTS
  "InstituicaoLogo_instituicaoId_ativa_idx"
ON "InstituicaoLogo"(
  "instituicaoId",
  "ativa"
);

CREATE INDEX IF NOT EXISTS
  "InstituicaoLogo_instituicaoId_tipo_ativa_idx"
ON "InstituicaoLogo"(
  "instituicaoId",
  "tipo",
  "ativa"
);

CREATE INDEX IF NOT EXISTS
  "InstituicaoLogo_instituicaoId_principal_idx"
ON "InstituicaoLogo"(
  "instituicaoId",
  "principal"
);

-- Garante somente uma logo principal por instituição.
CREATE UNIQUE INDEX IF NOT EXISTS
  "InstituicaoLogo_uma_principal_por_instituicao_key"
ON "InstituicaoLogo"(
  "instituicaoId"
)
WHERE "principal" = true;

ALTER TABLE "DocumentoTemplate"
  ADD COLUMN IF NOT EXISTS
    "modoLogo" "ModoLogoDocumento"
    NOT NULL
    DEFAULT 'AUTOMATICA';

ALTER TABLE "DocumentoTemplate"
  ADD COLUMN IF NOT EXISTS
    "logoInstituicaoId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'DocumentoTemplate_logoInstituicaoId_fkey'
  ) THEN
    ALTER TABLE "DocumentoTemplate"
      ADD CONSTRAINT "DocumentoTemplate_logoInstituicaoId_fkey"
      FOREIGN KEY ("logoInstituicaoId")
      REFERENCES "InstituicaoLogo"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS
  "DocumentoTemplate_logoInstituicaoId_idx"
ON "DocumentoTemplate"(
  "logoInstituicaoId"
);

-- =========================================================
-- Copia a logo já cadastrada para a nova biblioteca
-- sem remover logoUrl nem logoPath.
-- =========================================================

INSERT INTO "InstituicaoLogo" (
  "instituicaoId",
  "nome",
  "tipo",
  "arquivoUrl",
  "arquivoPath",
  "ativa",
  "principal",
  "criadoEm",
  "atualizadoEm"
)
SELECT
  configuracao."instituicaoId",
  'Logo principal',
  'PRINCIPAL'::"TipoLogoInstituicao",
  configuracao."logoUrl",
  configuracao."logoPath",
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ConfiguracaoInstituicao" configuracao
WHERE
  configuracao."logoUrl" IS NOT NULL
  AND BTRIM(configuracao."logoUrl") <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "InstituicaoLogo" logo
    WHERE
      logo."instituicaoId" =
        configuracao."instituicaoId"
  )
ON CONFLICT (
  "instituicaoId",
  "nome"
)
DO NOTHING;