-- AlterTable
ALTER TABLE "MobilidadeCandidaturaDocumento" ADD COLUMN     "descricaoRequisito" TEXT,
ADD COLUMN     "exigeValidade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requisitoOfertaId" INTEGER;

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_requisitoOfertaId_idx" ON "MobilidadeCandidaturaDocumento"("requisitoOfertaId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeCandidaturaDocumento_candidaturaId_requisitoOfert_key" ON "MobilidadeCandidaturaDocumento"("candidaturaId", "requisitoOfertaId");

-- AddForeignKey
ALTER TABLE "MobilidadeCandidaturaDocumento" ADD CONSTRAINT "MobilidadeCandidaturaDocumento_requisitoOfertaId_fkey" FOREIGN KEY ("requisitoOfertaId") REFERENCES "MobilidadeOfertaDocumentoRequisito"("id") ON DELETE SET NULL ON UPDATE CASCADE;
