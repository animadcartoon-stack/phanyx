BEGIN;

CREATE TYPE "OrigemVinculoPlanoComissaoRH" AS ENUM (
  'INDIVIDUAL',
  'DEPARTAMENTO'
);

ALTER TABLE "FuncionarioPlanoComissaoRH"
ADD COLUMN "origemVinculo" "OrigemVinculoPlanoComissaoRH"
NOT NULL DEFAULT 'INDIVIDUAL';

ALTER TABLE "FuncionarioPlanoComissaoRH"
ADD COLUMN "departamentoOrigemId" INTEGER;

ALTER TABLE "FuncionarioPlanoComissaoRH"
ADD COLUMN "departamentoNomeSnapshot" TEXT;

ALTER TABLE "FuncionarioPlanoComissaoRH"
ADD COLUMN "loteVinculoId" TEXT;

CREATE INDEX
"FuncionarioPlanoComissaoRH_origemVinculo_idx"
ON "FuncionarioPlanoComissaoRH"("origemVinculo");

CREATE INDEX
"FuncionarioPlanoComissaoRH_departamentoOrigemId_idx"
ON "FuncionarioPlanoComissaoRH"("departamentoOrigemId");

CREATE INDEX
"FuncionarioPlanoComissaoRH_loteVinculoId_idx"
ON "FuncionarioPlanoComissaoRH"("loteVinculoId");

CREATE INDEX
"FuncionarioPlanoComissaoRH_instituicaoId_departamentoOrigemId_idx"
ON "FuncionarioPlanoComissaoRH"(
  "instituicaoId",
  "departamentoOrigemId"
);

COMMIT;