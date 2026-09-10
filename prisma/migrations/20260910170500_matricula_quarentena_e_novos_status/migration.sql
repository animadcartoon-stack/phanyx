-- Novos estados acadêmicos da matrícula
ALTER TYPE "StatusMatricula"
ADD VALUE IF NOT EXISTS 'AGUARDANDO';

ALTER TYPE "StatusMatricula"
ADD VALUE IF NOT EXISTS 'TRANSFERIDA';

ALTER TYPE "StatusMatricula"
ADD VALUE IF NOT EXISTS 'INTERCAMBIO';


-- Exclusão lógica / quarentena de matrículas
ALTER TABLE "Matricula"
ADD COLUMN "excluidaEm" TIMESTAMP(3),
ADD COLUMN "excluidaPorId" INTEGER,
ADD COLUMN "motivoExclusao" TEXT;


-- Índice para listagens normais e quarentena por instituição
CREATE INDEX "Matricula_instituicaoId_excluidaEm_idx"
ON "Matricula"("instituicaoId", "excluidaEm");