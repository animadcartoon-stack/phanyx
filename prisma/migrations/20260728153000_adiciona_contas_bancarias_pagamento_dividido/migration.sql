-- CreateEnum
CREATE TYPE "FinalidadeContaBancariaRH" AS ENUM (
  'SALARIO',
  'COMISSAO_REMUNERACAO_VARIAVEL'
);

-- CreateEnum
CREATE TYPE "TipoContaBancariaRH" AS ENUM (
  'CORRENTE',
  'POUPANCA',
  'SALARIO',
  'PAGAMENTO',
  'OUTRA'
);

-- CreateEnum
CREATE TYPE "TipoChavePixRH" AS ENUM (
  'CPF',
  'CNPJ',
  'EMAIL',
  'TELEFONE',
  'ALEATORIA'
);

-- CreateEnum
CREATE TYPE "TipoItemPagamentoHoleriteRH" AS ENUM (
  'SALARIO_E_DEMAIS',
  'COMISSAO',
  'REMUNERACAO_VARIAVEL',
  'OUTRO'
);

-- CreateEnum
CREATE TYPE "OrigemContaPagamentoHoleriteRH" AS ENUM (
  'CONTA_SALARIO',
  'CONTA_COMISSAO',
  'MANUAL'
);

-- CreateTable
CREATE TABLE "ContaBancariaFuncionarioRH" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "funcionarioId" INTEGER NOT NULL,
  "finalidade" "FinalidadeContaBancariaRH" NOT NULL,
  "bancoCodigo" TEXT,
  "bancoNome" TEXT,
  "agencia" TEXT,
  "conta" TEXT,
  "tipoConta" "TipoContaBancariaRH",
  "tipoChavePix" "TipoChavePixRH",
  "chavePix" TEXT,
  "titularNome" TEXT,
  "titularDocumento" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContaBancariaFuncionarioRH_pkey"
  PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPagamentoHoleriteRH" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "pagamentoHoleriteId" INTEGER NOT NULL,
  "contaBancariaFuncionarioId" INTEGER,
  "tipoItem" "TipoItemPagamentoHoleriteRH" NOT NULL,
  "origemConta" "OrigemContaPagamentoHoleriteRH" NOT NULL,
  "formaPagamento" "FormaPagamentoHoleriteRH" NOT NULL,
  "valorPago" DECIMAL(10,2) NOT NULL,
  "pagoEm" TIMESTAMP(3) NOT NULL,
  "identificadorTransacao" TEXT,
  "bancoOrigemCodigo" TEXT,
  "bancoOrigemNome" TEXT,
  "agenciaOrigemMascarada" TEXT,
  "contaOrigemMascarada" TEXT,
  "bancoDestinoCodigo" TEXT,
  "bancoDestinoNome" TEXT,
  "agenciaDestinoMascarada" TEXT,
  "contaDestinoMascarada" TEXT,
  "tipoContaDestino" "TipoContaBancariaRH",
  "tipoChavePixDestino" "TipoChavePixRH",
  "chavePixDestinoMascarada" TEXT,
  "chavePixDestinoHash" TEXT,
  "titularDestinoSnapshot" TEXT,
  "titularDocumentoMascarado" TEXT,
  "observacoes" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ItemPagamentoHoleriteRH_pkey"
  PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX
"ContaBancariaFuncionarioRH_funcionarioId_finalidade_key"
ON "ContaBancariaFuncionarioRH"(
  "funcionarioId",
  "finalidade"
);

-- CreateIndex
CREATE INDEX
"ContaBancariaFuncionarioRH_instituicaoId_idx"
ON "ContaBancariaFuncionarioRH"("instituicaoId");

-- CreateIndex
CREATE INDEX
"ContaBancariaFuncionarioRH_instituicaoId_finalidade_idx"
ON "ContaBancariaFuncionarioRH"(
  "instituicaoId",
  "finalidade"
);

-- CreateIndex
CREATE INDEX
"ContaBancariaFuncionarioRH_funcionarioId_idx"
ON "ContaBancariaFuncionarioRH"("funcionarioId");

-- CreateIndex
CREATE INDEX
"ItemPagamentoHoleriteRH_instituicaoId_idx"
ON "ItemPagamentoHoleriteRH"("instituicaoId");

-- CreateIndex
CREATE INDEX
"ItemPagamentoHoleriteRH_pagamentoHoleriteId_idx"
ON "ItemPagamentoHoleriteRH"("pagamentoHoleriteId");

-- CreateIndex
CREATE INDEX
"ItemPagamentoHoleriteRH_contaBancariaFuncionarioId_idx"
ON "ItemPagamentoHoleriteRH"(
  "contaBancariaFuncionarioId"
);

-- CreateIndex
CREATE INDEX
"ItemPagamentoHoleriteRH_tipoItem_idx"
ON "ItemPagamentoHoleriteRH"("tipoItem");

-- CreateIndex
CREATE INDEX
"ItemPagamentoHoleriteRH_origemConta_idx"
ON "ItemPagamentoHoleriteRH"("origemConta");

-- AddForeignKey
ALTER TABLE "ContaBancariaFuncionarioRH"
ADD CONSTRAINT
"ContaBancariaFuncionarioRH_instituicaoId_fkey"
FOREIGN KEY ("instituicaoId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancariaFuncionarioRH"
ADD CONSTRAINT
"ContaBancariaFuncionarioRH_funcionarioId_fkey"
FOREIGN KEY ("funcionarioId")
REFERENCES "Funcionario"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPagamentoHoleriteRH"
ADD CONSTRAINT
"ItemPagamentoHoleriteRH_instituicaoId_fkey"
FOREIGN KEY ("instituicaoId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPagamentoHoleriteRH"
ADD CONSTRAINT
"ItemPagamentoHoleriteRH_pagamentoHoleriteId_fkey"
FOREIGN KEY ("pagamentoHoleriteId")
REFERENCES "PagamentoHoleriteRH"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPagamentoHoleriteRH"
ADD CONSTRAINT
"ItemPagamentoHoleriteRH_contaBancariaFuncionarioId_fkey"
FOREIGN KEY ("contaBancariaFuncionarioId")
REFERENCES "ContaBancariaFuncionarioRH"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Copia os dados bancários antigos do funcionário
-- para a nova conta padrão de salário.
--
-- Nenhuma conta antiga é apagada ou modificada.
-- O tipo da chave PIX permanece vazio porque o sistema
-- não deve adivinhar se ela é CPF, e-mail, telefone etc.
INSERT INTO "ContaBancariaFuncionarioRH" (
  "instituicaoId",
  "funcionarioId",
  "finalidade",
  "bancoCodigo",
  "bancoNome",
  "agencia",
  "conta",
  "tipoConta",
  "tipoChavePix",
  "chavePix",
  "titularNome",
  "titularDocumento",
  "ativo",
  "criadoEm",
  "atualizadoEm"
)
SELECT
  funcionario."instituicaoId",
  funcionario."id",
  'SALARIO'::"FinalidadeContaBancariaRH",
  NULL,
  NULLIF(BTRIM(funcionario."banco"), ''),
  NULLIF(BTRIM(funcionario."agencia"), ''),
  NULLIF(BTRIM(funcionario."conta"), ''),
  NULL,
  NULL,
  NULLIF(BTRIM(funcionario."pix"), ''),
  NULLIF(BTRIM(funcionario."nome"), ''),
  NULLIF(BTRIM(funcionario."cpf"), ''),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Funcionario" AS funcionario
WHERE
  NULLIF(BTRIM(COALESCE(funcionario."banco", '')), '') IS NOT NULL
  OR NULLIF(BTRIM(COALESCE(funcionario."agencia", '')), '') IS NOT NULL
  OR NULLIF(BTRIM(COALESCE(funcionario."conta", '')), '') IS NOT NULL
  OR NULLIF(BTRIM(COALESCE(funcionario."pix", '')), '') IS NOT NULL
ON CONFLICT ("funcionarioId", "finalidade")
DO NOTHING;