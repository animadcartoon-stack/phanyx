-- Opcional. Cursos existentes permanecem com o preço integral.
ALTER TABLE "Curso" ADD COLUMN "descontoMensalidadePercentual" DECIMAL(5,2);
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_descontoMensalidadePercentual_valido"
CHECK ("descontoMensalidadePercentual" IS NULL OR "descontoMensalidadePercentual" BETWEEN 0 AND 100);
-- Um período com desconto integral pode ser quitado sem movimentação de caixa.
ALTER TABLE "PeriodoCursoLivre" DROP CONSTRAINT "PeriodoCursoLivre_valor_positivo", ADD CONSTRAINT "PeriodoCursoLivre_valor_nao_negativo" CHECK ("valor" >= 0);
