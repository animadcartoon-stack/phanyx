ALTER TABLE "PagamentoHoleriteRH"
ADD COLUMN "tokenAssinaturaHash" TEXT,
ADD COLUMN "tokenAssinaturaExpiraEm" TIMESTAMP(3),
ADD COLUMN "assinaturaSolicitadaEm" TIMESTAMP(3),
ADD COLUMN "tipoAssinatura" TEXT,
ADD COLUMN "assinaturaImagemUrl" TEXT,
ADD COLUMN "assinaturaImagemHash" TEXT;

CREATE UNIQUE INDEX "PagamentoHoleriteRH_tokenAssinaturaHash_key"
ON "PagamentoHoleriteRH"("tokenAssinaturaHash");

CREATE INDEX "PagamentoHoleriteRH_tokenAssinaturaExpiraEm_idx"
ON "PagamentoHoleriteRH"("tokenAssinaturaExpiraEm");