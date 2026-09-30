-- AddForeignKey
ALTER TABLE
  "BibliotecaModeloEtiqueta"
ADD CONSTRAINT
  "BibliotecaModeloEtiqueta_criadoPorId_fkey"
FOREIGN KEY
  ("criadoPorId")
REFERENCES
  "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "BibliotecaModeloEtiqueta"
ADD CONSTRAINT
  "BibliotecaModeloEtiqueta_atualizadoPorId_fkey"
FOREIGN KEY
  ("atualizadoPorId")
REFERENCES
  "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
