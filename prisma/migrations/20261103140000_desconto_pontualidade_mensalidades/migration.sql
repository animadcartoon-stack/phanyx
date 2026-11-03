BEGIN;

ALTER TABLE "ConfiguracaoFinanceiraInstituicao" ADD COLUMN "descontoPontualidade" JSONB;
ALTER TABLE "Matricula" ADD COLUMN "descontoPontualidade" JSONB;

COMMIT;
