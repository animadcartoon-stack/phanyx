-- AlterTable
ALTER TABLE "StudentSuccessIntervencao"
ADD COLUMN "indicadoresNoRegistro" JSONB,
ADD COLUMN "nivelRiscoNoEncerramento" TEXT,
ADD COLUMN "pontuacaoNoEncerramento" INTEGER,
ADD COLUMN "coberturaNoEncerramento" INTEGER,
ADD COLUMN "confiabilidadeNoEncerramento" TEXT,
ADD COLUMN "fatoresNoEncerramento" JSONB,
ADD COLUMN "indicadoresNoEncerramento" JSONB;