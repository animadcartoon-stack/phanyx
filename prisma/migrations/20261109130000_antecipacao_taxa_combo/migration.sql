ALTER TABLE "ComboModalidades" ADD COLUMN "taxaComoAntecipacao" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LancamentoFinanceiro" ADD COLUMN "valorAntecipacaoAbatida" DOUBLE PRECISION NOT NULL DEFAULT 0;
