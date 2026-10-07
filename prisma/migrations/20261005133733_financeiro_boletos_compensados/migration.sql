-- CreateEnum
CREATE TYPE "StatusBancarioCobranca" AS ENUM ('PENDENTE', 'VENCIDO', 'EM_PROCESSAMENTO', 'COMPENSADO', 'CANCELADO', 'ESTORNADO', 'FALHA');

-- CreateEnum
CREATE TYPE "StatusOperacionalCobranca" AS ENUM ('AGUARDANDO_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO', 'DIVERGENCIA', 'CANCELADO');

-- CreateTable
CREATE TABLE "ContaFinanceiraInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'BANCO',
    "bancoCodigo" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "contaDigito" TEXT,
    "titularNome" TEXT,
    "titularDocumento" TEXT,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "contaExternaId" TEXT,
    "integracaoAtiva" BOOLEAN NOT NULL DEFAULT false,
    "statusIntegracao" TEXT NOT NULL DEFAULT 'NAO_CONFIGURADA',
    "ambienteIntegracao" TEXT NOT NULL DEFAULT 'PRODUCAO',
    "credenciaisCriptografadas" TEXT,
    "webhookSecretCriptografado" TEXT,
    "webhookUrl" TEXT,
    "webhookAtivo" BOOLEAN NOT NULL DEFAULT false,
    "suportaBoleto" BOOLEAN NOT NULL DEFAULT false,
    "padraoRecebimentos" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSincronizacaoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaFinanceiraInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteFinanceiroExterno" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "contaFinanceiraId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "provedor" TEXT NOT NULL,
    "clienteExternoId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteFinanceiroExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CobrancaFinanceira" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "contaFinanceiraId" INTEGER NOT NULL,
    "lancamentoFinanceiroId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "matriculaId" INTEGER,
    "provedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'BOLETO',
    "referenciaInterna" TEXT NOT NULL,
    "cobrancaExternaId" TEXT,
    "clienteExternoId" TEXT,
    "referenciaExterna" TEXT,
    "statusBancario" "StatusBancarioCobranca" NOT NULL DEFAULT 'PENDENTE',
    "statusOperacional" "StatusOperacionalCobranca" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "valorCobrado" DECIMAL(12,2) NOT NULL,
    "valorCompensado" DECIMAL(12,2),
    "vencimento" TIMESTAMP(3) NOT NULL,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagoEm" TIMESTAMP(3),
    "compensadoEm" TIMESTAMP(3),
    "linhaDigitavel" TEXT,
    "codigoBarras" TEXT,
    "boletoUrl" TEXT,
    "invoiceUrl" TEXT,
    "erroIntegracao" TEXT,
    "baixadoEm" TIMESTAMP(3),
    "baixadoPorUsuarioId" INTEGER,
    "baixadoPorNomeSnapshot" TEXT,
    "movimentoCaixaId" INTEGER,
    "observacao" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CobrancaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContaFinanceiraInstituicao_instituicaoId_idx" ON "ContaFinanceiraInstituicao"("instituicaoId");

-- CreateIndex
CREATE INDEX "ContaFinanceiraInstituicao_provedor_idx" ON "ContaFinanceiraInstituicao"("provedor");

-- CreateIndex
CREATE INDEX "ContaFinanceiraInstituicao_ativa_idx" ON "ContaFinanceiraInstituicao"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "ContaFinanceiraInstituicao_id_instituicaoId_key" ON "ContaFinanceiraInstituicao"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "ClienteFinanceiroExterno_instituicaoId_idx" ON "ClienteFinanceiroExterno"("instituicaoId");

-- CreateIndex
CREATE INDEX "ClienteFinanceiroExterno_alunoId_idx" ON "ClienteFinanceiroExterno"("alunoId");

-- CreateIndex
CREATE INDEX "ClienteFinanceiroExterno_provedor_idx" ON "ClienteFinanceiroExterno"("provedor");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFinanceiroExterno_contaFinanceiraId_alunoId_key" ON "ClienteFinanceiroExterno"("contaFinanceiraId", "alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFinanceiroExterno_contaFinanceiraId_clienteExternoId_key" ON "ClienteFinanceiroExterno"("contaFinanceiraId", "clienteExternoId");

-- CreateIndex
CREATE UNIQUE INDEX "CobrancaFinanceira_referenciaInterna_key" ON "CobrancaFinanceira"("referenciaInterna");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_instituicaoId_idx" ON "CobrancaFinanceira"("instituicaoId");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_contaFinanceiraId_idx" ON "CobrancaFinanceira"("contaFinanceiraId");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_lancamentoFinanceiroId_idx" ON "CobrancaFinanceira"("lancamentoFinanceiroId");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_alunoId_idx" ON "CobrancaFinanceira"("alunoId");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_matriculaId_idx" ON "CobrancaFinanceira"("matriculaId");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_statusBancario_idx" ON "CobrancaFinanceira"("statusBancario");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_statusOperacional_idx" ON "CobrancaFinanceira"("statusOperacional");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_instituicaoId_statusBancario_idx" ON "CobrancaFinanceira"("instituicaoId", "statusBancario");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_instituicaoId_statusOperacional_idx" ON "CobrancaFinanceira"("instituicaoId", "statusOperacional");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_vencimento_idx" ON "CobrancaFinanceira"("vencimento");

-- CreateIndex
CREATE INDEX "CobrancaFinanceira_baixadoPorUsuarioId_idx" ON "CobrancaFinanceira"("baixadoPorUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "CobrancaFinanceira_contaFinanceiraId_cobrancaExternaId_key" ON "CobrancaFinanceira"("contaFinanceiraId", "cobrancaExternaId");

-- CreateIndex
CREATE UNIQUE INDEX "CobrancaFinanceira_movimentoCaixaId_instituicaoId_key" ON "CobrancaFinanceira"("movimentoCaixaId", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "LancamentoFinanceiro_id_instituicaoId_key" ON "LancamentoFinanceiro"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_id_instituicaoId_key" ON "Matricula"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoCaixa_id_instituicaoId_key" ON "MovimentoCaixa"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "ContaFinanceiraInstituicao" ADD CONSTRAINT "ContaFinanceiraInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteFinanceiroExterno" ADD CONSTRAINT "ClienteFinanceiroExterno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteFinanceiroExterno" ADD CONSTRAINT "ClienteFinanceiroExterno_contaFinanceiraId_instituicaoId_fkey" FOREIGN KEY ("contaFinanceiraId", "instituicaoId") REFERENCES "ContaFinanceiraInstituicao"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteFinanceiroExterno" ADD CONSTRAINT "ClienteFinanceiroExterno_alunoId_instituicaoId_fkey" FOREIGN KEY ("alunoId", "instituicaoId") REFERENCES "Aluno"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_contaFinanceiraId_instituicaoId_fkey" FOREIGN KEY ("contaFinanceiraId", "instituicaoId") REFERENCES "ContaFinanceiraInstituicao"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_lancamentoFinanceiroId_instituicaoId_fkey" FOREIGN KEY ("lancamentoFinanceiroId", "instituicaoId") REFERENCES "LancamentoFinanceiro"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_alunoId_instituicaoId_fkey" FOREIGN KEY ("alunoId", "instituicaoId") REFERENCES "Aluno"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_matriculaId_instituicaoId_fkey" FOREIGN KEY ("matriculaId", "instituicaoId") REFERENCES "Matricula"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_baixadoPorUsuarioId_instituicaoId_fkey" FOREIGN KEY ("baixadoPorUsuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobrancaFinanceira" ADD CONSTRAINT "CobrancaFinanceira_movimentoCaixaId_instituicaoId_fkey" FOREIGN KEY ("movimentoCaixaId", "instituicaoId") REFERENCES "MovimentoCaixa"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

