-- CreateTable
CREATE TABLE "ConfiguracaoFinanceiraInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "jurosPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "multaPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descontoPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "diasTolerancia" INTEGER NOT NULL DEFAULT 0,
    "bloquearAlunoInadimplente" BOOLEAN NOT NULL DEFAULT false,
    "permitirPagamentoParcial" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoFinanceiraInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxaAvulsa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'PERSONALIZADA',
    "valor" DECIMAL(10,2) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "exigeVencimento" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxaAvulsa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoCobranca" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "alunoNome" TEXT,
    "lancamentoFinanceiroId" INTEGER,
    "responsavelId" INTEGER,
    "responsavelNome" TEXT,
    "canal" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "observacao" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoCobranca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoFinanceiraInstituicao_instituicaoId_key" ON "ConfiguracaoFinanceiraInstituicao"("instituicaoId");

-- CreateIndex
CREATE INDEX "TaxaAvulsa_instituicaoId_idx" ON "TaxaAvulsa"("instituicaoId");

-- CreateIndex
CREATE INDEX "HistoricoCobranca_instituicaoId_idx" ON "HistoricoCobranca"("instituicaoId");

-- CreateIndex
CREATE INDEX "HistoricoCobranca_alunoId_idx" ON "HistoricoCobranca"("alunoId");

-- CreateIndex
CREATE INDEX "HistoricoCobranca_lancamentoFinanceiroId_idx" ON "HistoricoCobranca"("lancamentoFinanceiroId");
