-- DropForeignKey
ALTER TABLE "CrachaLoteEmissao" DROP CONSTRAINT "CrachaLoteEmissao_instituicaoId_fkey";

-- DropIndex
DROP INDEX "CrachaLoteEmissao_status_idx";

-- AlterTable
ALTER TABLE "CrachaLoteEmissao" ADD COLUMN     "aptos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "arquivoZipPathname" TEXT,
ADD COLUMN     "arquivosConcluidos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancelamentoSolicitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "chaveIdempotencia" TEXT,
ADD COLUMN     "criadoPorId" INTEGER,
ADD COLUMN     "erroMensagem" TEXT,
ADD COLUMN     "nome" TEXT,
ADD COLUMN     "semFoto" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tamanhoArquivo" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "totalArquivos" INTEGER NOT NULL DEFAULT 0;

-- Compatibilidade com lotes eventualmente existentes
UPDATE "CrachaLoteEmissao"
SET "chaveIdempotencia" = 'legado-' || "id"::TEXT
WHERE "chaveIdempotencia" IS NULL;

ALTER TABLE "CrachaLoteEmissao"
ALTER COLUMN "chaveIdempotencia" SET NOT NULL;

-- CreateTable
CREATE TABLE "CrachaLoteArquivo" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processados" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "primeiraOrdem" INTEGER NOT NULL,
    "ultimaOrdem" INTEGER NOT NULL,
    "pdfUrl" TEXT,
    "pdfPathname" TEXT,
    "tamanhoBytes" BIGINT,
    "erroMensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "iniciadoEm" TIMESTAMP(3),
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "CrachaLoteArquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrachaLoteItem" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "arquivoId" INTEGER,
    "ordem" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "nomeSnapshot" TEXT,
    "identificacaoSnapshot" TEXT,
    "fotoUrlSnapshot" TEXT,
    "codigoCracha" TEXT,
    "crachaEmitidoId" INTEGER,
    "erroMensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "processadoEm" TIMESTAMP(3),

    CONSTRAINT "CrachaLoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrachaLoteArquivo_loteId_status_idx" ON "CrachaLoteArquivo"("loteId", "status");

-- CreateIndex
CREATE INDEX "CrachaLoteArquivo_status_criadoEm_idx" ON "CrachaLoteArquivo"("status", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "CrachaLoteArquivo_loteId_numero_key" ON "CrachaLoteArquivo"("loteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "CrachaLoteItem_crachaEmitidoId_key" ON "CrachaLoteItem"("crachaEmitidoId");

-- CreateIndex
CREATE INDEX "CrachaLoteItem_arquivoId_status_idx" ON "CrachaLoteItem"("arquivoId", "status");

-- CreateIndex
CREATE INDEX "CrachaLoteItem_loteId_status_idx" ON "CrachaLoteItem"("loteId", "status");

-- CreateIndex
CREATE INDEX "CrachaLoteItem_tipoPessoa_pessoaId_idx" ON "CrachaLoteItem"("tipoPessoa", "pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "CrachaLoteItem_loteId_pessoaId_key" ON "CrachaLoteItem"("loteId", "pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "CrachaLoteItem_loteId_ordem_key" ON "CrachaLoteItem"("loteId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "CrachaLoteEmissao_chaveIdempotencia_key" ON "CrachaLoteEmissao"("chaveIdempotencia");

-- CreateIndex
CREATE INDEX "CrachaLoteEmissao_criadoPorId_idx" ON "CrachaLoteEmissao"("criadoPorId");

-- CreateIndex
CREATE INDEX "CrachaLoteEmissao_instituicaoId_status_idx" ON "CrachaLoteEmissao"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "CrachaLoteEmissao_status_criadoEm_idx" ON "CrachaLoteEmissao"("status", "criadoEm");

-- AddForeignKey
ALTER TABLE "CrachaLoteEmissao" ADD CONSTRAINT "CrachaLoteEmissao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteEmissao" ADD CONSTRAINT "CrachaLoteEmissao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteArquivo" ADD CONSTRAINT "CrachaLoteArquivo_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "CrachaLoteEmissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteItem" ADD CONSTRAINT "CrachaLoteItem_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "CrachaLoteEmissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteItem" ADD CONSTRAINT "CrachaLoteItem_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "CrachaLoteArquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteItem" ADD CONSTRAINT "CrachaLoteItem_crachaEmitidoId_fkey" FOREIGN KEY ("crachaEmitidoId") REFERENCES "CrachaEmitido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
