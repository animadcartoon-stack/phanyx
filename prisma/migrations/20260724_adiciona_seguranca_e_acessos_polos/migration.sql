-- CreateEnum
CREATE TYPE "StatusComercialPolo" AS ENUM ('ATIVO', 'PENDENTE_ATIVACAO', 'SUSPENSO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoUnidadePolo" AS ENUM ('SEDE', 'CAMPUS', 'POLO', 'FILIAL', 'UNIDADE');

-- CreateEnum
CREATE TYPE "NivelAcessoPolo" AS ENUM ('RESPONSAVEL', 'GESTOR', 'OPERACIONAL', 'LEITURA');

-- AlterTable
ALTER TABLE "Polo" ADD COLUMN     "ativadoEm" TIMESTAMP(3),
ADD COLUMN     "ativadoPorId" INTEGER,
ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "criadoPorId" INTEGER,
ADD COLUMN     "encerradoEm" TIMESTAMP(3),
ADD COLUMN     "encerradoPorId" INTEGER,
ADD COLUMN     "motivoEncerramento" TEXT,
ADD COLUMN     "motivoSuspensao" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "responsavelCargo" TEXT,
ADD COLUMN     "responsavelEmail" TEXT,
ADD COLUMN     "responsavelNome" TEXT,
ADD COLUMN     "responsavelTelefone" TEXT,
ADD COLUMN     "statusComercial" "StatusComercialPolo" NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "suspensoEm" TIMESTAMP(3),
ADD COLUMN     "suspensoPorId" INTEGER,
ADD COLUMN     "tipoUnidade" "TipoUnidadePolo" NOT NULL DEFAULT 'POLO';

-- Preserva como suspensos os polos que já estavam inativos antes desta migration
UPDATE "Polo" SET "statusComercial" = 'SUSPENSO'::"StatusComercialPolo", "suspensoEm" = CURRENT_TIMESTAMP, "motivoSuspensao" = 'Polo já estava inativo antes da implantação do controle comercial de polos.' WHERE "ativo" = false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acessoTodosPolos" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserPolo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "poloId" INTEGER NOT NULL,
    "nivelAcesso" "NivelAcessoPolo" NOT NULL DEFAULT 'OPERACIONAL',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "revogadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "motivoRevogacao" TEXT,

    CONSTRAINT "UserPolo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPolo_instituicaoId_idx" ON "UserPolo"("instituicaoId");

-- CreateIndex
CREATE INDEX "UserPolo_poloId_idx" ON "UserPolo"("poloId");

-- CreateIndex
CREATE INDEX "UserPolo_userId_idx" ON "UserPolo"("userId");

-- CreateIndex
CREATE INDEX "UserPolo_instituicaoId_ativo_idx" ON "UserPolo"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "UserPolo_poloId_ativo_idx" ON "UserPolo"("poloId", "ativo");

-- CreateIndex
CREATE INDEX "UserPolo_criadoPorId_idx" ON "UserPolo"("criadoPorId");

-- CreateIndex
CREATE INDEX "UserPolo_revogadoPorId_idx" ON "UserPolo"("revogadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPolo_userId_poloId_key" ON "UserPolo"("userId", "poloId");

-- CreateIndex
CREATE INDEX "Polo_instituicaoId_statusComercial_idx" ON "Polo"("instituicaoId", "statusComercial");

-- CreateIndex
CREATE INDEX "Polo_instituicaoId_ativo_idx" ON "Polo"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "Polo_criadoPorId_idx" ON "Polo"("criadoPorId");

-- CreateIndex
CREATE INDEX "Polo_ativadoPorId_idx" ON "Polo"("ativadoPorId");

-- CreateIndex
CREATE INDEX "Polo_suspensoPorId_idx" ON "Polo"("suspensoPorId");

-- CreateIndex
CREATE INDEX "Polo_encerradoPorId_idx" ON "Polo"("encerradoPorId");

-- CreateIndex
CREATE INDEX "User_instituicaoId_acessoTodosPolos_idx" ON "User"("instituicaoId", "acessoTodosPolos");

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_ativadoPorId_fkey" FOREIGN KEY ("ativadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_suspensoPorId_fkey" FOREIGN KEY ("suspensoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_encerradoPorId_fkey" FOREIGN KEY ("encerradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolo" ADD CONSTRAINT "UserPolo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolo" ADD CONSTRAINT "UserPolo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolo" ADD CONSTRAINT "UserPolo_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolo" ADD CONSTRAINT "UserPolo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolo" ADD CONSTRAINT "UserPolo_revogadoPorId_fkey" FOREIGN KEY ("revogadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

