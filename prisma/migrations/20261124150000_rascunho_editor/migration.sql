-- CreateTable
CREATE TABLE "RascunhoEditor" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "editor" VARCHAR(100) NOT NULL,
    "chaveDocumento" VARCHAR(180) NOT NULL,
    "dados" JSONB NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RascunhoEditor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RascunhoEditor_instituicaoId_usuarioId_idx" ON "RascunhoEditor"("instituicaoId", "usuarioId");

-- CreateIndex
CREATE INDEX "RascunhoEditor_expiraEm_idx" ON "RascunhoEditor"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "RascunhoEditor_instituicaoId_usuarioId_editor_chaveDocument_key" ON "RascunhoEditor"("instituicaoId", "usuarioId", "editor", "chaveDocumento");

-- AddForeignKey
ALTER TABLE "RascunhoEditor" ADD CONSTRAINT "RascunhoEditor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RascunhoEditor" ADD CONSTRAINT "RascunhoEditor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
