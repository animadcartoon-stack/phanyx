-- CreateEnum
CREATE TYPE "StatusContratacaoModulo" AS ENUM ('CRIADA', 'AGUARDANDO_PAGAMENTO', 'PAGA', 'EXPIRADA', 'CANCELADA', 'FALHA');

-- CreateEnum
CREATE TYPE "StatusProcessamentoWebhookAsaas" AS ENUM ('RECEBIDO', 'PROCESSANDO', 'PROCESSADO', 'ERRO');

-- CreateTable
CREATE TABLE "ModuloAdicionalContratacao" (
    "id" TEXT NOT NULL,
    "moduloId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipo" "TipoModuloAdicional" NOT NULL,
    "plano" TEXT NOT NULL,
    "status" "StatusContratacaoModulo" NOT NULL DEFAULT 'CRIADA',
    "valorMensal" DECIMAL(10,2) NOT NULL,
    "armazenamentoContratadoBytes" BIGINT NOT NULL,
    "chaveVigente" TEXT,
    "externalReference" TEXT NOT NULL,
    "asaasCheckoutId" TEXT,
    "asaasSubscriptionId" TEXT,
    "checkoutUrl" TEXT,
    "checkoutExpiraEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "expiradoEm" TIMESTAMP(3),
    "falhouEm" TIMESTAMP(3),
    "ultimoErro" TEXT,
    "solicitadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuloAdicionalContratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsaasWebhookEvento" (
    "id" SERIAL NOT NULL,
    "asaasEventoId" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "status" "StatusProcessamentoWebhookAsaas" NOT NULL DEFAULT 'RECEBIDO',
    "externalReference" TEXT,
    "asaasPaymentId" TEXT,
    "asaasSubscriptionId" TEXT,
    "asaasCheckoutId" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimoErro" TEXT,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsaasWebhookEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalContratacao_chaveVigente_key" ON "ModuloAdicionalContratacao"("chaveVigente");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalContratacao_externalReference_key" ON "ModuloAdicionalContratacao"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalContratacao_asaasCheckoutId_key" ON "ModuloAdicionalContratacao"("asaasCheckoutId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalContratacao_asaasSubscriptionId_key" ON "ModuloAdicionalContratacao"("asaasSubscriptionId");

-- CreateIndex
CREATE INDEX "ModuloAdicionalContratacao_instituicaoId_tipo_status_idx" ON "ModuloAdicionalContratacao"("instituicaoId", "tipo", "status");

-- CreateIndex
CREATE INDEX "ModuloAdicionalContratacao_moduloId_status_idx" ON "ModuloAdicionalContratacao"("moduloId", "status");

-- CreateIndex
CREATE INDEX "ModuloAdicionalContratacao_criadoEm_idx" ON "ModuloAdicionalContratacao"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "AsaasWebhookEvento_asaasEventoId_key" ON "AsaasWebhookEvento"("asaasEventoId");

-- CreateIndex
CREATE INDEX "AsaasWebhookEvento_status_recebidoEm_idx" ON "AsaasWebhookEvento"("status", "recebidoEm");

-- CreateIndex
CREATE INDEX "AsaasWebhookEvento_externalReference_idx" ON "AsaasWebhookEvento"("externalReference");

-- CreateIndex
CREATE INDEX "AsaasWebhookEvento_asaasSubscriptionId_idx" ON "AsaasWebhookEvento"("asaasSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalInstituicao_id_instituicaoId_key" ON "ModuloAdicionalInstituicao"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "ModuloAdicionalContratacao" ADD CONSTRAINT "ModuloAdicionalContratacao_moduloId_instituicaoId_fkey" FOREIGN KEY ("moduloId", "instituicaoId") REFERENCES "ModuloAdicionalInstituicao"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloAdicionalContratacao" ADD CONSTRAINT "ModuloAdicionalContratacao_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
