BEGIN;
-- Aditiva: conserva IDs, históricos e a classificação dos registros existentes.
CREATE TYPE "OrganizacaoCurricular" AS ENUM ('SEMESTRAL', 'ANUAL');
ALTER TABLE "Curso" ADD COLUMN "organizacaoCurricular" "OrganizacaoCurricular" NOT NULL DEFAULT 'SEMESTRAL', ADD COLUMN "quantidadeEtapas" INTEGER;
ALTER TABLE "CursoSemestre" ADD COLUMN "organizacaoCurricular" "OrganizacaoCurricular" NOT NULL DEFAULT 'SEMESTRAL';
ALTER TABLE "Turma" ADD COLUMN "organizacaoCurricular" "OrganizacaoCurricular" NOT NULL DEFAULT 'SEMESTRAL', ADD COLUMN "etapaNumero" INTEGER;
ALTER TABLE "TurmaSemestre" ADD COLUMN "organizacaoCurricular" "OrganizacaoCurricular" NOT NULL DEFAULT 'SEMESTRAL';
ALTER TABLE "Matricula" ADD COLUMN "organizacaoCurricular" "OrganizacaoCurricular" NOT NULL DEFAULT 'SEMESTRAL', ADD COLUMN "etapaNumero" INTEGER;
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_quantidadeEtapas_positiva" CHECK ("quantidadeEtapas" IS NULL OR "quantidadeEtapas" > 0);
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_etapaNumero_positiva" CHECK ("etapaNumero" IS NULL OR "etapaNumero" > 0);
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_etapaNumero_positiva" CHECK ("etapaNumero" IS NULL OR "etapaNumero" > 0);

-- A mesma denominação pode existir em anos curriculares distintos.
-- Mantém a regra antiga exatamente para registros semestrais.
DROP INDEX "Turma_instituicaoId_nome_semestre_periodoLetivo_key";
CREATE UNIQUE INDEX "Turma_semestral_nome_periodo_key" ON "Turma" ("instituicaoId", "nome", "semestre", "periodoLetivo") WHERE "organizacaoCurricular" = 'SEMESTRAL';
CREATE UNIQUE INDEX "Turma_anual_nome_etapa_periodo_key" ON "Turma" ("instituicaoId", "nome", "etapaNumero", "periodoLetivo") WHERE "organizacaoCurricular" = 'ANUAL';
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_anual_etapa_definida" CHECK ("organizacaoCurricular" <> 'ANUAL' OR ("etapaNumero" IS NOT NULL AND "semestre" = ''));
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_anual_etapa_definida" CHECK ("organizacaoCurricular" <> 'ANUAL' OR ("etapaNumero" IS NOT NULL AND "semestre" IS NULL));

COMMIT;
