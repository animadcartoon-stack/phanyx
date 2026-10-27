CREATE TABLE "CursoRequisitoConjunto" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "cursoId" INTEGER NOT NULL,
  "cursoObrigatorioId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CursoRequisitoConjunto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CursoRequisitoConjunto_cursos_distintos" CHECK ("cursoId" <> "cursoObrigatorioId")
);
CREATE UNIQUE INDEX "CursoRequisitoConjunto_cursoId_cursoObrigatorioId_key" ON "CursoRequisitoConjunto"("cursoId", "cursoObrigatorioId");
CREATE INDEX "CursoRequisitoConjunto_instituicaoId_cursoId_idx" ON "CursoRequisitoConjunto"("instituicaoId", "cursoId");
CREATE INDEX "CursoRequisitoConjunto_instituicaoId_cursoObrigatorioId_idx" ON "CursoRequisitoConjunto"("instituicaoId", "cursoObrigatorioId");
ALTER TABLE "CursoRequisitoConjunto" ADD CONSTRAINT "CursoRequisitoConjunto_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CursoRequisitoConjunto" ADD CONSTRAINT "CursoRequisitoConjunto_cursoId_instituicaoId_fkey" FOREIGN KEY ("cursoId", "instituicaoId") REFERENCES "Curso"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CursoRequisitoConjunto" ADD CONSTRAINT "CursoRequisitoConjunto_cursoObrigatorioId_instituicaoId_fkey" FOREIGN KEY ("cursoObrigatorioId", "instituicaoId") REFERENCES "Curso"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;
