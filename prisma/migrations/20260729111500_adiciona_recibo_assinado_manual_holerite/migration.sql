BEGIN;

CREATE TYPE "TipoConfirmacaoRecebimentoHoleriteRH" AS ENUM (
  'ASSINATURA_DIGITAL',
  'DOCUMENTO_MANUAL'
);

ALTER TABLE "PagamentoHoleriteRH"
ADD COLUMN "tipoConfirmacaoRecebimento"
"TipoConfirmacaoRecebimentoHoleriteRH";

UPDATE "PagamentoHoleriteRH"
SET "tipoConfirmacaoRecebimento" = 'ASSINATURA_DIGITAL'
WHERE
  "status" = 'CONFIRMADO_FUNCIONARIO'
  AND "confirmadoPeloFuncionarioEm" IS NOT NULL
  AND "tipoConfirmacaoRecebimento" IS NULL;

CREATE TABLE "DocumentoAssinadoManualHoleriteRH" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "funcionarioId" INTEGER NOT NULL,
  "holeriteId" INTEGER NOT NULL,
  "pagamentoHoleriteId" INTEGER NOT NULL,
  "enviadoPorId" INTEGER,
  "enviadoPorFuncionarioIdSnapshot" INTEGER,
  "enviadoPorNomeSnapshot" TEXT NOT NULL,
  "enviadoPorEmailSnapshot" TEXT,
  "arquivoUrl" TEXT NOT NULL,
  "arquivoNome" TEXT NOT NULL,
  "arquivoMime" TEXT NOT NULL,
  "arquivoTamanho" INTEGER NOT NULL,
  "arquivoHash" TEXT NOT NULL,
  "dataAssinaturaDeclarada" TIMESTAMP(3),
  "observacao" TEXT NOT NULL,
  "ipEnvio" TEXT,
  "userAgentEnvio" TEXT,
  "confirmacaoHash" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "substituiDocumentoId" INTEGER,
  "substituidoEm" TIMESTAMP(3),
  "motivoSubstituicao" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentoAssinadoManualHoleriteRH_pkey"
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"DocumentoAssinadoManualHoleriteRH_substituiDocumentoId_key"
ON "DocumentoAssinadoManualHoleriteRH"("substituiDocumentoId");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_instituicaoId_idx"
ON "DocumentoAssinadoManualHoleriteRH"("instituicaoId");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_funcionarioId_idx"
ON "DocumentoAssinadoManualHoleriteRH"("funcionarioId");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_holeriteId_idx"
ON "DocumentoAssinadoManualHoleriteRH"("holeriteId");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_pagamentoHoleriteId_idx"
ON "DocumentoAssinadoManualHoleriteRH"("pagamentoHoleriteId");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_enviadoPorId_idx"
ON "DocumentoAssinadoManualHoleriteRH"("enviadoPorId");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_arquivoHash_idx"
ON "DocumentoAssinadoManualHoleriteRH"("arquivoHash");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_ativo_idx"
ON "DocumentoAssinadoManualHoleriteRH"("ativo");

CREATE INDEX
"DocumentoAssinadoManualHoleriteRH_criadoEm_idx"
ON "DocumentoAssinadoManualHoleriteRH"("criadoEm");

ALTER TABLE "DocumentoAssinadoManualHoleriteRH"
ADD CONSTRAINT
"DocumentoAssinadoManualHoleriteRH_pagamentoHoleriteId_fkey"
FOREIGN KEY ("pagamentoHoleriteId")
REFERENCES "PagamentoHoleriteRH"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "DocumentoAssinadoManualHoleriteRH"
ADD CONSTRAINT
"DocumentoAssinadoManualHoleriteRH_enviadoPorId_fkey"
FOREIGN KEY ("enviadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "DocumentoAssinadoManualHoleriteRH"
ADD CONSTRAINT
"DocumentoAssinadoManualHoleriteRH_substituiDocumentoId_fkey"
FOREIGN KEY ("substituiDocumentoId")
REFERENCES "DocumentoAssinadoManualHoleriteRH"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMIT;