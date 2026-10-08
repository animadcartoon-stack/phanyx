-- Codigo Cutter-base da autoridade/autoria.
-- Campo opcional e aditivo para preservar autores existentes.

ALTER TABLE "BibliotecaAutor"
ADD COLUMN "codigoCutterBase" TEXT;

CREATE INDEX
  "BibliotecaAutor_instituicaoId_codigoCutterBase_idx"
ON
  "BibliotecaAutor"("instituicaoId", "codigoCutterBase");
