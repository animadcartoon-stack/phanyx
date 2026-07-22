-- AlterTable
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD COLUMN     "enviadoHoleritePorId" INTEGER;

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_enviadoHoleritePorId_idx" ON "LancamentoRemuneracaoVariavelRH"("enviadoHoleritePorId");

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_enviadoHoleritePorId_fkey" FOREIGN KEY ("enviadoHoleritePorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
