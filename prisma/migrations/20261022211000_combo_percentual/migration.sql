-- Desconto configurável; não cadastra ou ativa regras comerciais.
ALTER TYPE "ModoPrecoCombo" ADD VALUE 'PERCENTUAL';
ALTER TABLE "ComboModalidades" ADD COLUMN "descontoPercentual" DECIMAL(5,2);
