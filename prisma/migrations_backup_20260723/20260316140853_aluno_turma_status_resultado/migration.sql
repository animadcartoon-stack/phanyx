/*
  Warnings:

  - The values [CURSANDO,REPROVADO] on the enum `SituacaoFinal` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusAluno" AS ENUM ('ATIVO', 'TRANCADO', 'INADIMPLENTE', 'TRANSFERIDO', 'DESLIGADO', 'FORMADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusTurma" AS ENUM ('AGUARDANDO', 'A_INICIAR', 'ATIVA', 'INATIVA', 'CONCLUIDA', 'CANCELADA', 'NAO_FORMADA');

-- AlterEnum
BEGIN;
CREATE TYPE "SituacaoFinal_new" AS ENUM ('EM_ANDAMENTO', 'APROVADO', 'REPROVADO_NOTA', 'REPROVADO_FALTA', 'RECUPERACAO', 'TRANCADO');
ALTER TABLE "ResultadoFinal" ALTER COLUMN "situacao" DROP DEFAULT;
ALTER TABLE "ResultadoFinal" ALTER COLUMN "situacao" TYPE "SituacaoFinal_new" USING ("situacao"::text::"SituacaoFinal_new");
ALTER TYPE "SituacaoFinal" RENAME TO "SituacaoFinal_old";
ALTER TYPE "SituacaoFinal_new" RENAME TO "SituacaoFinal";
DROP TYPE "SituacaoFinal_old";
ALTER TABLE "ResultadoFinal" ALTER COLUMN "situacao" SET DEFAULT 'EM_ANDAMENTO';
COMMIT;

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "statusAluno" "StatusAluno" NOT NULL DEFAULT 'ATIVO';

-- AlterTable
ALTER TABLE "ResultadoFinal" ALTER COLUMN "situacao" SET DEFAULT 'EM_ANDAMENTO';

-- AlterTable
ALTER TABLE "Turma" ADD COLUMN     "capacidadeMinima" INTEGER,
ADD COLUMN     "statusTurma" "StatusTurma" NOT NULL DEFAULT 'AGUARDANDO';

-- CreateIndex
CREATE INDEX "Aluno_statusAluno_idx" ON "Aluno"("statusAluno");

-- CreateIndex
CREATE INDEX "ResultadoFinal_situacao_idx" ON "ResultadoFinal"("situacao");

-- CreateIndex
CREATE INDEX "Turma_statusTurma_idx" ON "Turma"("statusTurma");
