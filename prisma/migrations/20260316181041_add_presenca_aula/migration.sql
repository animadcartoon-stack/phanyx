-- CreateEnum
CREATE TYPE "StatusPresencaAula" AS ENUM ('PRESENTE', 'FALTA', 'JUSTIFICADA', 'ATESTADO');

-- CreateTable
CREATE TABLE "PresencaAula" (
    "id" SERIAL NOT NULL,
    "status" "StatusPresencaAula" NOT NULL DEFAULT 'PRESENTE',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,

    CONSTRAINT "PresencaAula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PresencaAula_instituicaoId_idx" ON "PresencaAula"("instituicaoId");

-- CreateIndex
CREATE INDEX "PresencaAula_aulaId_idx" ON "PresencaAula"("aulaId");

-- CreateIndex
CREATE INDEX "PresencaAula_alunoId_idx" ON "PresencaAula"("alunoId");

-- CreateIndex
CREATE INDEX "PresencaAula_status_idx" ON "PresencaAula"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PresencaAula_aulaId_alunoId_key" ON "PresencaAula"("aulaId", "alunoId");

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
