-- País da instituição para resolução do calendário nacional
ALTER TABLE "ConfiguracaoInstituicao"
ADD COLUMN "paisCodigo" VARCHAR(2);

-- Estados possíveis do cadastro global de feriados
CREATE TYPE "StatusFeriadoGlobal" AS ENUM (
  'RASCUNHO',
  'PUBLICADO',
  'ARQUIVADO'
);

-- Escopo geográfico do feriado
CREATE TYPE "TipoFeriadoGlobal" AS ENUM (
  'NACIONAL',
  'REGIONAL',
  'LOCAL'
);

-- Cadastro global administrado pelo PHANYX Master
CREATE TABLE "FeriadoGlobal" (
  "id" SERIAL NOT NULL,

  "paisCodigo" VARCHAR(2) NOT NULL,
  "regiaoCodigo" VARCHAR(30),
  "cidade" TEXT,

  "dataFeriado" DATE NOT NULL,
  "inicioExibicao" DATE NOT NULL,
  "fimExibicao" DATE NOT NULL,

  "tipo" "TipoFeriadoGlobal" NOT NULL DEFAULT 'NACIONAL',
  "status" "StatusFeriadoGlobal" NOT NULL DEFAULT 'RASCUNHO',

  "prioridade" INTEGER NOT NULL DEFAULT 0,

  "emoji" TEXT,

  "criadoPorId" INTEGER,
  "atualizadoPorId" INTEGER,
  "publicadoPorId" INTEGER,

  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  "publicadoEm" TIMESTAMP(3),

  CONSTRAINT "FeriadoGlobal_pkey"
    PRIMARY KEY ("id")
);

-- Conteúdo traduzido do feriado
CREATE TABLE "FeriadoGlobalTraducao" (
  "id" SERIAL NOT NULL,

  "feriadoId" INTEGER NOT NULL,
  "locale" VARCHAR(10) NOT NULL,

  "nome" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,

  CONSTRAINT "FeriadoGlobalTraducao_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX "FeriadoGlobal_paisCodigo_status_idx"
ON "FeriadoGlobal"("paisCodigo", "status");

CREATE INDEX "FeriadoGlobal_paisCodigo_dataFeriado_idx"
ON "FeriadoGlobal"("paisCodigo", "dataFeriado");

CREATE INDEX "FeriadoGlobal_inicioExibicao_fimExibicao_idx"
ON "FeriadoGlobal"("inicioExibicao", "fimExibicao");

CREATE INDEX "FeriadoGlobal_status_idx"
ON "FeriadoGlobal"("status");

CREATE UNIQUE INDEX "FeriadoGlobalTraducao_feriadoId_locale_key"
ON "FeriadoGlobalTraducao"("feriadoId", "locale");

CREATE INDEX "FeriadoGlobalTraducao_locale_idx"
ON "FeriadoGlobalTraducao"("locale");

ALTER TABLE "FeriadoGlobalTraducao"
ADD CONSTRAINT "FeriadoGlobalTraducao_feriadoId_fkey"
FOREIGN KEY ("feriadoId")
REFERENCES "FeriadoGlobal"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
