-- Identifica se o Cutter da obra foi gerado automaticamente.
-- Registros existentes permanecem como manuais para nunca serem sobrescritos.

ALTER TABLE "BibliotecaItem"
ADD COLUMN "codigoCutterAutomatico" BOOLEAN NOT NULL DEFAULT false;
