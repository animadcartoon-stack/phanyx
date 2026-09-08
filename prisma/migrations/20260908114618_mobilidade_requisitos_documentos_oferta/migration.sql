-- CreateTable
CREATE TABLE "MobilidadeOfertaDocumentoRequisito" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "tipo" "MobilidadeTipoDocumento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "exigeValidade" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeOfertaDocumentoRequisito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MobilidadeOfertaDocumentoRequisito_instituicaoId_idx" ON "MobilidadeOfertaDocumentoRequisito"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaDocumentoRequisito_ofertaId_idx" ON "MobilidadeOfertaDocumentoRequisito"("ofertaId");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaDocumentoRequisito_tipo_idx" ON "MobilidadeOfertaDocumentoRequisito"("tipo");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaDocumentoRequisito_ativo_idx" ON "MobilidadeOfertaDocumentoRequisito"("ativo");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaDocumentoRequisito_ordem_idx" ON "MobilidadeOfertaDocumentoRequisito"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeOfertaDocumentoRequisito_ofertaId_tipo_titulo_key" ON "MobilidadeOfertaDocumentoRequisito"("ofertaId", "tipo", "titulo");

-- AddForeignKey
ALTER TABLE "MobilidadeOfertaDocumentoRequisito" ADD CONSTRAINT "MobilidadeOfertaDocumentoRequisito_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOfertaDocumentoRequisito" ADD CONSTRAINT "MobilidadeOfertaDocumentoRequisito_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "MobilidadeOferta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
