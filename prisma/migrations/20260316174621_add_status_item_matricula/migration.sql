-- CreateEnum
CREATE TYPE "StatusItemMatricula" AS ENUM ('A_CURSAR', 'EM_CURSO', 'CONCLUIDO', 'TRANCADO', 'REPROVADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "ItemMatricula" ADD COLUMN     "status" "StatusItemMatricula" NOT NULL DEFAULT 'A_CURSAR';

-- CreateIndex
CREATE INDEX "ItemMatricula_status_idx" ON "ItemMatricula"("status");
