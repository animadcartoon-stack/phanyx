ALTER TABLE "Matricula"
ADD COLUMN "turmaPrincipalId" INTEGER;

CREATE INDEX "Matricula_turmaPrincipalId_idx"
ON "Matricula"("turmaPrincipalId");

ALTER TABLE "Matricula"
ADD CONSTRAINT "Matricula_turmaPrincipalId_fkey"
FOREIGN KEY ("turmaPrincipalId")
REFERENCES "Turma"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;