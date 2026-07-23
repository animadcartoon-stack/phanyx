/*
  Warnings:

  - Made the column `instituicaoId` on table `Disciplina` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Disciplina" DROP CONSTRAINT "Disciplina_instituicaoId_fkey";

-- AlterTable
ALTER TABLE "Disciplina" ALTER COLUMN "instituicaoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
