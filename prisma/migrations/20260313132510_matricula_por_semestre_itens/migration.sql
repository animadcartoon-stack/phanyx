/*
  Warnings:

  - You are about to drop the column `turmaId` on the `Matricula` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Matricula" DROP CONSTRAINT "Matricula_turmaId_fkey";

-- DropIndex
DROP INDEX "Matricula_alunoId_turmaId_key";

-- DropIndex
DROP INDEX "Matricula_turmaId_idx";

-- AlterTable
ALTER TABLE "DocumentoAluno" ADD COLUMN     "matriculaId" INTEGER;

-- AlterTable
ALTER TABLE "Matricula" DROP COLUMN "turmaId",
ADD COLUMN     "cursoId" INTEGER,
ADD COLUMN     "semestre" INTEGER;

-- CreateTable
CREATE TABLE "ItemMatricula" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,

    CONSTRAINT "ItemMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemMatricula_instituicaoId_idx" ON "ItemMatricula"("instituicaoId");

-- CreateIndex
CREATE INDEX "ItemMatricula_matriculaId_idx" ON "ItemMatricula"("matriculaId");

-- CreateIndex
CREATE INDEX "ItemMatricula_turmaId_idx" ON "ItemMatricula"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemMatricula_matriculaId_turmaId_key" ON "ItemMatricula"("matriculaId", "turmaId");

-- CreateIndex
CREATE INDEX "Matricula_cursoId_idx" ON "Matricula"("cursoId");

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
