-- CreateEnum
CREATE TYPE "NivelAcessoInstituicao" AS ENUM ('REITOR', 'DIRETOR', 'ADMINISTRADOR_REDE', 'GESTOR_CENTRAL', 'AUDITOR', 'LEITURA');

-- AlterTable
ALTER TABLE "Instituicao" ADD COLUMN     "herdaPlanoContratante" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redeInstitucionalId" INTEGER;

-- AlterTable
ALTER TABLE "Polo" ADD COLUMN     "instituicaoGeradaId" INTEGER;

-- CreateTable
CREATE TABLE "RedeInstitucional" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicaoContratanteId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedeInstitucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInstituicaoAcesso" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nivelAcesso" "NivelAcessoInstituicao" NOT NULL DEFAULT 'LEITURA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "revogadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "motivoRevogacao" TEXT,

    CONSTRAINT "UserInstituicaoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RedeInstitucional_instituicaoContratanteId_key" ON "RedeInstitucional"("instituicaoContratanteId");

-- CreateIndex
CREATE INDEX "RedeInstitucional_ativo_idx" ON "RedeInstitucional"("ativo");

-- CreateIndex
CREATE INDEX "UserInstituicaoAcesso_userId_idx" ON "UserInstituicaoAcesso"("userId");

-- CreateIndex
CREATE INDEX "UserInstituicaoAcesso_instituicaoId_idx" ON "UserInstituicaoAcesso"("instituicaoId");

-- CreateIndex
CREATE INDEX "UserInstituicaoAcesso_instituicaoId_ativo_idx" ON "UserInstituicaoAcesso"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "UserInstituicaoAcesso_criadoPorId_idx" ON "UserInstituicaoAcesso"("criadoPorId");

-- CreateIndex
CREATE INDEX "UserInstituicaoAcesso_revogadoPorId_idx" ON "UserInstituicaoAcesso"("revogadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInstituicaoAcesso_userId_instituicaoId_key" ON "UserInstituicaoAcesso"("userId", "instituicaoId");

-- CreateIndex
CREATE INDEX "Instituicao_redeInstitucionalId_idx" ON "Instituicao"("redeInstitucionalId");

-- CreateIndex
CREATE INDEX "Instituicao_redeInstitucionalId_ativo_idx" ON "Instituicao"("redeInstitucionalId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Polo_instituicaoGeradaId_key" ON "Polo"("instituicaoGeradaId");

-- AddForeignKey
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_redeInstitucionalId_fkey" FOREIGN KEY ("redeInstitucionalId") REFERENCES "RedeInstitucional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeInstitucional" ADD CONSTRAINT "RedeInstitucional_instituicaoContratanteId_fkey" FOREIGN KEY ("instituicaoContratanteId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInstituicaoAcesso" ADD CONSTRAINT "UserInstituicaoAcesso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInstituicaoAcesso" ADD CONSTRAINT "UserInstituicaoAcesso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInstituicaoAcesso" ADD CONSTRAINT "UserInstituicaoAcesso_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInstituicaoAcesso" ADD CONSTRAINT "UserInstituicaoAcesso_revogadoPorId_fkey" FOREIGN KEY ("revogadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_instituicaoGeradaId_fkey" FOREIGN KEY ("instituicaoGeradaId") REFERENCES "Instituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
