ALTER TABLE "LancamentoComissaoRH"
ADD COLUMN "enviadoHoleritePorId" INTEGER;

CREATE INDEX "LancamentoComissaoRH_enviadoHoleritePorId_idx"
ON "LancamentoComissaoRH"("enviadoHoleritePorId");

ALTER TABLE "LancamentoComissaoRH"
ADD CONSTRAINT "LancamentoComissaoRH_enviadoHoleritePorId_fkey"
FOREIGN KEY ("enviadoHoleritePorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
