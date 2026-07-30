BEGIN;

CREATE TYPE "ModoParticipacaoPlanoComissaoRH" AS ENUM (
  'SOMENTE_PARTICIPANTES_MATRICULA',
  'TODOS_VINCULADOS_PLANO'
);

CREATE TYPE "EscopoRegraComissaoRH" AS ENUM (
  'GERAL',
  'DEPARTAMENTO',
  'CARGO',
  'FUNCIONARIO'
);

ALTER TABLE "PlanoComissaoRH"
ADD COLUMN "modoParticipacao"
"ModoParticipacaoPlanoComissaoRH"
NOT NULL
DEFAULT 'SOMENTE_PARTICIPANTES_MATRICULA';

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "regraBaseId" INTEGER;

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "escopoAplicacao"
"EscopoRegraComissaoRH"
NOT NULL
DEFAULT 'GERAL';

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "departamentoAlvoId" INTEGER;

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "departamentoAlvoNomeSnapshot" TEXT;

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "cargoAlvo" TEXT;

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "cargoAlvoNormalizado" TEXT;

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "funcionarioAlvoId" INTEGER;

ALTER TABLE "RegraComissaoRH"
ADD COLUMN "funcionarioAlvoNomeSnapshot" TEXT;

CREATE INDEX
"RegraComissaoRH_regraBaseId_idx"
ON "RegraComissaoRH"("regraBaseId");

CREATE INDEX
"RegraComissaoRH_escopoAplicacao_idx"
ON "RegraComissaoRH"("escopoAplicacao");

CREATE INDEX
"RegraComissaoRH_departamentoAlvoId_idx"
ON "RegraComissaoRH"("departamentoAlvoId");

CREATE INDEX
"RegraComissaoRH_cargoAlvoNormalizado_idx"
ON "RegraComissaoRH"("cargoAlvoNormalizado");

CREATE INDEX
"RegraComissaoRH_funcionarioAlvoId_idx"
ON "RegraComissaoRH"("funcionarioAlvoId");

CREATE INDEX
"RegraComissaoRH_planoId_regraBaseId_escopoAplicacao_idx"
ON "RegraComissaoRH"(
  "planoId",
  "regraBaseId",
  "escopoAplicacao"
);

ALTER TABLE "RegraComissaoRH"
ADD CONSTRAINT "RegraComissaoRH_regraBaseId_fkey"
FOREIGN KEY ("regraBaseId")
REFERENCES "RegraComissaoRH"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMIT;