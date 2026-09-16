CREATE TABLE "CreditoIAMovimento" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "emailPublico" TEXT,
    "quantidade" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "asaasPaymentId" TEXT NOT NULL,
    "asaasEventoId" TEXT,
    "externalReference" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditoIAMovimento_pkey"
        PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
    "CreditoIAMovimento_asaasPaymentId_key"
ON "CreditoIAMovimento"("asaasPaymentId");

CREATE UNIQUE INDEX
    "CreditoIAMovimento_asaasEventoId_key"
ON "CreditoIAMovimento"("asaasEventoId");

CREATE INDEX
    "CreditoIAMovimento_userId_criadoEm_idx"
ON "CreditoIAMovimento"("userId", "criadoEm");

CREATE INDEX
    "CreditoIAMovimento_emailPublico_criadoEm_idx"
ON "CreditoIAMovimento"("emailPublico", "criadoEm");
