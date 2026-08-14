ALTER TABLE "WhatsAppMensagem"
ADD COLUMN "chaveIdempotencia" TEXT;

CREATE UNIQUE INDEX "WhatsAppMensagem_chaveIdempotencia_key"
ON "WhatsAppMensagem"("chaveIdempotencia");