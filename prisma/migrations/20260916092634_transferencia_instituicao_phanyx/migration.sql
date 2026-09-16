-- AlterEnum
ALTER TYPE "StatusTransferenciaMatricula" ADD VALUE 'AGUARDANDO_ACEITE_DESTINO';
ALTER TYPE "StatusTransferenciaMatricula" ADD VALUE 'ACEITA_DESTINO';
ALTER TYPE "StatusTransferenciaMatricula" ADD VALUE 'REJEITADA_DESTINO';

-- AlterTable
ALTER TABLE "TransferenciaMatricula"
ADD COLUMN "analisadoDestinoEm" TIMESTAMP(3),
ADD COLUMN "analisadoDestinoPorId" INTEGER,
ADD COLUMN "analisadoDestinoPorNomeSnapshot" TEXT,
ADD COLUMN "matriculaDestinoId" INTEGER,
ADD COLUMN "motivoRejeicaoDestino" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaMatricula_matriculaDestinoId_key"
ON "TransferenciaMatricula"("matriculaDestinoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_instituicaoDestinoId_status_idx"
ON "TransferenciaMatricula"("instituicaoDestinoId", "status");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_analisadoDestinoPorId_idx"
ON "TransferenciaMatricula"("analisadoDestinoPorId");

-- AddForeignKey
ALTER TABLE "TransferenciaMatricula"
ADD CONSTRAINT "TransferenciaMatricula_instituicaoDestinoId_fkey"
FOREIGN KEY ("instituicaoDestinoId")
REFERENCES "Instituicao"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaMatricula"
ADD CONSTRAINT "TransferenciaMatricula_matriculaDestinoId_fkey"
FOREIGN KEY ("matriculaDestinoId")
REFERENCES "Matricula"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaMatricula"
ADD CONSTRAINT "TransferenciaMatricula_analisadoDestinoPorId_fkey"
FOREIGN KEY ("analisadoDestinoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;