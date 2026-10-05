-- CreateTable
CREATE TABLE "EventoWebhookFinanceiro" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "contaFinanceiraId" INTEGER NOT NULL,
    "cobrancaFinanceiraId" INTEGER,
    "provedor" TEXT NOT NULL,
    "eventoExternoId" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "resultado" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "tentativas" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processadoEm" TIMESTAMP(3),
    "erro" TEXT,

    CONSTRAINT "EventoWebhookFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoWebhookFinanceiro_instituicaoId_idx" ON "EventoWebhookFinanceiro"("instituicaoId");

-- CreateIndex
CREATE INDEX "EventoWebhookFinanceiro_cobrancaFinanceiraId_idx" ON "EventoWebhookFinanceiro"("cobrancaFinanceiraId");

-- CreateIndex
CREATE INDEX "EventoWebhookFinanceiro_tipoEvento_idx" ON "EventoWebhookFinanceiro"("tipoEvento");

-- CreateIndex
CREATE INDEX "EventoWebhookFinanceiro_recebidoEm_idx" ON "EventoWebhookFinanceiro"("recebidoEm");

-- CreateIndex
CREATE UNIQUE INDEX "EventoWebhookFinanceiro_contaFinanceiraId_eventoExternoId_key" ON "EventoWebhookFinanceiro"("contaFinanceiraId", "eventoExternoId");

-- CreateIndex
CREATE UNIQUE INDEX "CobrancaFinanceira_id_instituicaoId_key" ON "CobrancaFinanceira"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "EventoWebhookFinanceiro" ADD CONSTRAINT "EventoWebhookFinanceiro_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoWebhookFinanceiro" ADD CONSTRAINT "EventoWebhookFinanceiro_contaFinanceiraId_instituicaoId_fkey" FOREIGN KEY ("contaFinanceiraId", "instituicaoId") REFERENCES "ContaFinanceiraInstituicao"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoWebhookFinanceiro" ADD CONSTRAINT "EventoWebhookFinanceiro_cobrancaFinanceiraId_instituicaoId_fkey" FOREIGN KEY ("cobrancaFinanceiraId", "instituicaoId") REFERENCES "CobrancaFinanceira"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

