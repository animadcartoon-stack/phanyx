/*
  Warnings:

  - You are about to drop the `GradeCurricular` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GradeCurricular" DROP CONSTRAINT "GradeCurricular_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "GradeCurricular" DROP CONSTRAINT "GradeCurricular_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "GradeCurricular" DROP CONSTRAINT "GradeCurricular_instituicaoId_fkey";

-- DropTable
DROP TABLE "GradeCurricular";

-- CreateTable
CREATE TABLE "CursoSemestre" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,

    CONSTRAINT "CursoSemestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoSemestreDisciplina" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoSemestreId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,

    CONSTRAINT "CursoSemestreDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CursoSemestre_instituicaoId_idx" ON "CursoSemestre"("instituicaoId");

-- CreateIndex
CREATE INDEX "CursoSemestre_cursoId_idx" ON "CursoSemestre"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "CursoSemestre_cursoId_numero_key" ON "CursoSemestre"("cursoId", "numero");

-- CreateIndex
CREATE INDEX "CursoSemestreDisciplina_instituicaoId_idx" ON "CursoSemestreDisciplina"("instituicaoId");

-- CreateIndex
CREATE INDEX "CursoSemestreDisciplina_cursoSemestreId_idx" ON "CursoSemestreDisciplina"("cursoSemestreId");

-- CreateIndex
CREATE INDEX "CursoSemestreDisciplina_disciplinaId_idx" ON "CursoSemestreDisciplina"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "CursoSemestreDisciplina_cursoSemestreId_disciplinaId_key" ON "CursoSemestreDisciplina"("cursoSemestreId", "disciplinaId");

-- AddForeignKey
ALTER TABLE "CursoSemestre" ADD CONSTRAINT "CursoSemestre_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestre" ADD CONSTRAINT "CursoSemestre_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestreDisciplina" ADD CONSTRAINT "CursoSemestreDisciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestreDisciplina" ADD CONSTRAINT "CursoSemestreDisciplina_cursoSemestreId_fkey" FOREIGN KEY ("cursoSemestreId") REFERENCES "CursoSemestre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestreDisciplina" ADD CONSTRAINT "CursoSemestreDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
