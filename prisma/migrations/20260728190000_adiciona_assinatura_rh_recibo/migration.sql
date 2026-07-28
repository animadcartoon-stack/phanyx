ALTER TABLE "PagamentoHoleriteRH"
ADD COLUMN "assinadoRhPorId" INTEGER,
ADD COLUMN "assinadoRhEm" TIMESTAMP(3),
ADD COLUMN "tipoAssinaturaRh" TEXT,
ADD COLUMN "assinaturaRhImagemUrl" TEXT,
ADD COLUMN "assinaturaRhImagemHash" TEXT,
ADD COLUMN "assinadoRhNomeSnapshot" TEXT,
ADD COLUMN "assinadoRhEmailSnapshot" TEXT,
ADD COLUMN "assinadoRhRoleSnapshot" TEXT,
ADD COLUMN "ipAssinaturaRh" TEXT,
ADD COLUMN "userAgentAssinaturaRh" TEXT,
ADD COLUMN "confirmacaoAssinaturaRhHash" TEXT;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_assinadoRhPorId_fkey"
FOREIGN KEY ("assinadoRhPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "PagamentoHoleriteRH_assinadoRhPorId_idx"
ON "PagamentoHoleriteRH"("assinadoRhPorId");

CREATE INDEX "PagamentoHoleriteRH_assinadoRhEm_idx"
ON "PagamentoHoleriteRH"("assinadoRhEm");