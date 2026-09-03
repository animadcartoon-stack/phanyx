ALTER TABLE "BibliotecaEmprestimo"
ADD COLUMN "multaLancamentoFinanceiroId" INTEGER;

CREATE UNIQUE INDEX "BibliotecaEmprestimo_multaLancamentoFinanceiroId_key"
ON "BibliotecaEmprestimo"("multaLancamentoFinanceiroId");

ALTER TABLE "BibliotecaEmprestimo"
ADD CONSTRAINT "BibliotecaEmprestimo_multaLancamentoFinanceiroId_fkey"
FOREIGN KEY ("multaLancamentoFinanceiroId")
REFERENCES "LancamentoFinanceiro"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;