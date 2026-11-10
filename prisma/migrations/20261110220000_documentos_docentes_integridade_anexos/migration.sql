-- Metadados de integridade e vínculo do anexo à versão existente na data do envio.
-- Migração aditiva; NÃO altera nem substitui arquivos antigos.
ALTER TABLE "DocumentoDocenteAnexo"
  ADD COLUMN "versao" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "sha256" TEXT;
CREATE INDEX "DocumentoDocenteAnexo_documentoId_versao_idx"
  ON "DocumentoDocenteAnexo" ("documentoId", "versao");
