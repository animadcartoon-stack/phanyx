/*
  Warnings:

  - A unique constraint covering the columns `[alunoId,turmaId]` on the table `Nota` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `turmaId` to the `Matricula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turmaId` to the `Nota` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Matricula" DROP CONSTRAINT "Matricula_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_disciplinaId_fkey";

-- DropIndex
DROP INDEX "Nota_alunoId_disciplinaId_key";

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "turmaId" INTEGER NOT NULL,
ALTER COLUMN "disciplinaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Nota" ADD COLUMN     "turmaId" INTEGER NOT NULL,
ALTER COLUMN "disciplinaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Turma" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nota_alunoId_turmaId_key" ON "Nota"("alunoId", "turmaId");

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;
