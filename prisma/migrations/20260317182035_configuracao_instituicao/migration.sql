-- CreateTable
CREATE TABLE "ConfiguracaoInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nomeFantasia" TEXT,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "responsavelNome" TEXT,
    "responsavelCargo" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoInstituicao_instituicaoId_key" ON "ConfiguracaoInstituicao"("instituicaoId");

-- AddForeignKey
ALTER TABLE "ConfiguracaoInstituicao" ADD CONSTRAINT "ConfiguracaoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
