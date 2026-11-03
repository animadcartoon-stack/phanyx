-- Opcional: planos personalizados exclusivos por combo, sem afetar precos ou cobrancas existentes.
ALTER TABLE "ComboModalidades" ADD COLUMN "planosPagamento" JSONB;
