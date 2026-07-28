CREATE TYPE "FormaPagamentoHoleriteRH" AS ENUM (
  'FOLHA_BANCARIA',
  'PIX',
  'TRANSFERENCIA',
  'CONTA_SALARIO',
  'DINHEIRO',
  'CHEQUE',
  'OUTRO'
);

CREATE TYPE "StatusPagamentoHoleriteRH" AS ENUM (
  'REGISTRADO',
  'CONFIRMADO_FUNCIONARIO',
  'CONTESTADO',
  'CANCELADO',
  'SUBSTITUIDO'
);

CREATE TABLE "PagamentoHoleriteRH" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "funcionarioId" INTEGER NOT NULL,
  "holeriteId" INTEGER NOT NULL,
  "registradoPorId" INTEGER,
  "confirmadoPorUserId" INTEGER,
  "contestadoPorUserId" INTEGER,
  "canceladoPorId" INTEGER,
  "substituiPagamentoId" INTEGER,
  "status" "StatusPagamentoHoleriteRH" NOT NULL DEFAULT 'REGISTRADO',
  "formaPagamento" "FormaPagamentoHoleriteRH" NOT NULL,
  "valorPago" DECIMAL(10,2) NOT NULL,
  "pagoEm" TIMESTAMP(3) NOT NULL,
  "identificadorTransacao" TEXT,
  "contaDestinoMascarada" TEXT,
  "bancoOrigem" TEXT,
  "observacoes" TEXT,
  "funcionarioNomeSnapshot" TEXT NOT NULL,
  "funcionarioCpfSnapshot" TEXT,
  "competenciaMesSnapshot" INTEGER NOT NULL,
  "competenciaAnoSnapshot" INTEGER NOT NULL,
  "valorLiquidoSnapshot" DECIMAL(10,2) NOT NULL,
  "eventosSnapshot" JSONB NOT NULL,
  "comprovanteUrl" TEXT,
  "comprovanteNome" TEXT,
  "comprovanteMime" TEXT,
  "comprovanteTamanho" INTEGER,
  "comprovanteHash" TEXT,
  "reciboNumero" TEXT NOT NULL,
  "reciboPdfUrl" TEXT,
  "reciboHash" TEXT,
  "reciboAssinadoUrl" TEXT,
  "reciboAssinadoHash" TEXT,
  "dadosPagamentoHash" TEXT NOT NULL,
  "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmadoPeloFuncionarioEm" TIMESTAMP(3),
  "ipConfirmacao" TEXT,
  "userAgentConfirmacao" TEXT,
  "confirmacaoHash" TEXT,
  "contestadoEm" TIMESTAMP(3),
  "motivoContestacao" TEXT,
  "canceladoEm" TIMESTAMP(3),
  "motivoCancelamento" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PagamentoHoleriteRH_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PagamentoHoleriteRH_substituiPagamentoId_key"
ON "PagamentoHoleriteRH"("substituiPagamentoId");

CREATE UNIQUE INDEX "PagamentoHoleriteRH_instituicaoId_reciboNumero_key"
ON "PagamentoHoleriteRH"("instituicaoId", "reciboNumero");

CREATE INDEX "PagamentoHoleriteRH_instituicaoId_idx"
ON "PagamentoHoleriteRH"("instituicaoId");

CREATE INDEX "PagamentoHoleriteRH_funcionarioId_idx"
ON "PagamentoHoleriteRH"("funcionarioId");

CREATE INDEX "PagamentoHoleriteRH_holeriteId_idx"
ON "PagamentoHoleriteRH"("holeriteId");

CREATE INDEX "PagamentoHoleriteRH_registradoPorId_idx"
ON "PagamentoHoleriteRH"("registradoPorId");

CREATE INDEX "PagamentoHoleriteRH_confirmadoPorUserId_idx"
ON "PagamentoHoleriteRH"("confirmadoPorUserId");

CREATE INDEX "PagamentoHoleriteRH_contestadoPorUserId_idx"
ON "PagamentoHoleriteRH"("contestadoPorUserId");

CREATE INDEX "PagamentoHoleriteRH_canceladoPorId_idx"
ON "PagamentoHoleriteRH"("canceladoPorId");

CREATE INDEX "PagamentoHoleriteRH_status_idx"
ON "PagamentoHoleriteRH"("status");

CREATE INDEX "PagamentoHoleriteRH_pagoEm_idx"
ON "PagamentoHoleriteRH"("pagoEm");

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_instituicaoId_fkey"
FOREIGN KEY ("instituicaoId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_funcionarioId_fkey"
FOREIGN KEY ("funcionarioId")
REFERENCES "Funcionario"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_holeriteId_fkey"
FOREIGN KEY ("holeriteId")
REFERENCES "HoleriteRH"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_registradoPorId_fkey"
FOREIGN KEY ("registradoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_confirmadoPorUserId_fkey"
FOREIGN KEY ("confirmadoPorUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_contestadoPorUserId_fkey"
FOREIGN KEY ("contestadoPorUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_canceladoPorId_fkey"
FOREIGN KEY ("canceladoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PagamentoHoleriteRH"
ADD CONSTRAINT "PagamentoHoleriteRH_substituiPagamentoId_fkey"
FOREIGN KEY ("substituiPagamentoId")
REFERENCES "PagamentoHoleriteRH"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;