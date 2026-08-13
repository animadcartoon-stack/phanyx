-- AlterTable
ALTER TABLE "Cargo" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ConfiguracaoEmailInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "usuario" TEXT NOT NULL,
    "senhaCriptografada" TEXT NOT NULL,
    "remetenteNome" TEXT,
    "remetenteEmail" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoEmailInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoEmailInstituicao_instituicaoId_key" ON "ConfiguracaoEmailInstituicao"("instituicaoId");

-- CreateIndex
CREATE INDEX "ConfiguracaoEmailInstituicao_instituicaoId_idx" ON "ConfiguracaoEmailInstituicao"("instituicaoId");

-- CreateIndex
CREATE INDEX "ConfiguracaoEmailInstituicao_ativo_idx" ON "ConfiguracaoEmailInstituicao"("ativo");

-- AddForeignKey
ALTER TABLE "ConfiguracaoEmailInstituicao" ADD CONSTRAINT "ConfiguracaoEmailInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

