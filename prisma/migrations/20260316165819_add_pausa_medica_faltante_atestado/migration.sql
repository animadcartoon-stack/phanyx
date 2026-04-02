-- CreateEnum
CREATE TYPE "StatusAtestadoMedico" AS ENUM ('PENDENTE', 'VALIDADO', 'RECUSADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusAluno" ADD VALUE 'PAUSA_MEDICA';
ALTER TYPE "StatusAluno" ADD VALUE 'FALTANTE';

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "descricaoNecessidadeEspecial" TEXT,
ADD COLUMN     "observacoesAcessibilidade" TEXT,
ADD COLUMN     "possuiNecessidadeEspecial" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AtestadoMedico" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "arquivoUrl" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "status" "StatusAtestadoMedico" NOT NULL DEFAULT 'PENDENTE',
    "validadoPor" INTEGER,
    "validadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtestadoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtestadoMedico_alunoId_idx" ON "AtestadoMedico"("alunoId");

-- CreateIndex
CREATE INDEX "AtestadoMedico_instituicaoId_idx" ON "AtestadoMedico"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtestadoMedico_status_idx" ON "AtestadoMedico"("status");

-- AddForeignKey
ALTER TABLE "AtestadoMedico" ADD CONSTRAINT "AtestadoMedico_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtestadoMedico" ADD CONSTRAINT "AtestadoMedico_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
