-- CreateEnum
CREATE TYPE "TipoModuloAdicional" AS ENUM ('BIBLIOTECA_VIRTUAL');

-- CreateEnum
CREATE TYPE "StatusModuloAdicional" AS ENUM ('PENDENTE', 'TESTE_GRATIS', 'ATIVO', 'EM_ATRASO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoArmazenamento" AS ENUM ('UPLOAD', 'SUBSTITUICAO', 'EXCLUSAO', 'RESTAURACAO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "AcaoAuditoriaBiblioteca" AS ENUM ('CRIAR', 'VISUALIZAR', 'ATUALIZAR', 'PUBLICAR', 'ARQUIVAR', 'RESTAURAR', 'EXCLUIR', 'BAIXAR', 'EMPRESTAR', 'RENOVAR', 'RESERVAR', 'DEVOLVER', 'CANCELAR', 'CONFIGURAR', 'CONCEDER_ACESSO', 'REVOGAR_ACESSO');

-- CreateTable
CREATE TABLE "ModuloAdicionalInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipo" "TipoModuloAdicional" NOT NULL,
    "plano" TEXT NOT NULL,
    "status" "StatusModuloAdicional" NOT NULL DEFAULT 'PENDENTE',
    "valorMensal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "armazenamentoContratadoBytes" BIGINT NOT NULL DEFAULT 0,
    "armazenamentoExtraBytes" BIGINT NOT NULL DEFAULT 0,
    "inicioEm" TIMESTAMP(3),
    "testeGratisFimEm" TIMESTAMP(3),
    "proximaCobrancaEm" TIMESTAMP(3),
    "suspensoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "motivoSuspensao" TEXT,
    "motivoCancelamento" TEXT,
    "asaasSubscriptionId" TEXT,
    "asaasCustomerId" TEXT,
    "asaasBillingType" TEXT,
    "asaasCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuloAdicionalInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaConfiguracao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nomeExibicao" TEXT NOT NULL DEFAULT 'Biblioteca Virtual',
    "descricao" TEXT,
    "permitirDownload" BOOLEAN NOT NULL DEFAULT false,
    "permitirAvaliacao" BOOLEAN NOT NULL DEFAULT true,
    "permitirFavoritos" BOOLEAN NOT NULL DEFAULT true,
    "permitirReserva" BOOLEAN NOT NULL DEFAULT true,
    "permitirRenovacao" BOOLEAN NOT NULL DEFAULT true,
    "permitirSugestaoAquisicao" BOOLEAN NOT NULL DEFAULT true,
    "diasEmprestimoPadrao" INTEGER NOT NULL DEFAULT 7,
    "diasReservaPadrao" INTEGER NOT NULL DEFAULT 2,
    "limiteRenovacoes" INTEGER NOT NULL DEFAULT 1,
    "limiteEmprestimos" INTEGER NOT NULL DEFAULT 3,
    "notificarVencimento" BOOLEAN NOT NULL DEFAULT true,
    "diasAvisoAntesVencimento" INTEGER NOT NULL DEFAULT 2,
    "bloquearAlunoComPendencia" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "corPrincipal" TEXT,
    "termosUso" TEXT,
    "politicaPrivacidade" TEXT,
    "armazenamentoUtilizadoBytes" BIGINT NOT NULL DEFAULT 0,
    "atualizadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaConfiguracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaOperador" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "podeCatalogar" BOOLEAN NOT NULL DEFAULT true,
    "podePublicar" BOOLEAN NOT NULL DEFAULT false,
    "podeArquivar" BOOLEAN NOT NULL DEFAULT false,
    "podeGerenciarEmprestimo" BOOLEAN NOT NULL DEFAULT true,
    "podeGerenciarReserva" BOOLEAN NOT NULL DEFAULT true,
    "podeGerenciarColecao" BOOLEAN NOT NULL DEFAULT true,
    "podeGerenciarLicenca" BOOLEAN NOT NULL DEFAULT false,
    "podeGerenciarOperador" BOOLEAN NOT NULL DEFAULT false,
    "podeVisualizarRelatorio" BOOLEAN NOT NULL DEFAULT true,
    "podeGerenciarConfiguracao" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" INTEGER,
    "revogadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "motivoRevogacao" TEXT,

    CONSTRAINT "BibliotecaOperador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaConsumoArmazenamento" (
    "id" BIGSERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipoMovimento" "TipoMovimentoArmazenamento" NOT NULL,
    "quantidadeBytes" BIGINT NOT NULL,
    "saldoAnteriorBytes" BIGINT NOT NULL,
    "saldoPosteriorBytes" BIGINT NOT NULL,
    "arquivoReferenciaId" TEXT,
    "arquivoNomeSnapshot" TEXT,
    "motivo" TEXT,
    "registradoPorId" INTEGER,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibliotecaConsumoArmazenamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaAuditoria" (
    "id" BIGSERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "acao" "AcaoAuditoriaBiblioteca" NOT NULL,
    "descricao" TEXT,
    "dadosAnteriores" JSONB,
    "dadosPosteriores" JSONB,
    "metadados" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibliotecaAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalInstituicao_asaasSubscriptionId_key" ON "ModuloAdicionalInstituicao"("asaasSubscriptionId");

-- CreateIndex
CREATE INDEX "ModuloAdicionalInstituicao_instituicaoId_idx" ON "ModuloAdicionalInstituicao"("instituicaoId");

-- CreateIndex
CREATE INDEX "ModuloAdicionalInstituicao_tipo_idx" ON "ModuloAdicionalInstituicao"("tipo");

-- CreateIndex
CREATE INDEX "ModuloAdicionalInstituicao_status_idx" ON "ModuloAdicionalInstituicao"("status");

-- CreateIndex
CREATE INDEX "ModuloAdicionalInstituicao_instituicaoId_status_idx" ON "ModuloAdicionalInstituicao"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "ModuloAdicionalInstituicao_asaasCustomerId_idx" ON "ModuloAdicionalInstituicao"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloAdicionalInstituicao_instituicaoId_tipo_key" ON "ModuloAdicionalInstituicao"("instituicaoId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaConfiguracao_instituicaoId_key" ON "BibliotecaConfiguracao"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaConfiguracao_instituicaoId_idx" ON "BibliotecaConfiguracao"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaOperador_instituicaoId_idx" ON "BibliotecaOperador"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaOperador_funcionarioId_idx" ON "BibliotecaOperador"("funcionarioId");

-- CreateIndex
CREATE INDEX "BibliotecaOperador_usuarioId_idx" ON "BibliotecaOperador"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaOperador_instituicaoId_ativo_idx" ON "BibliotecaOperador"("instituicaoId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaOperador_instituicaoId_usuarioId_key" ON "BibliotecaOperador"("instituicaoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaOperador_instituicaoId_funcionarioId_key" ON "BibliotecaOperador"("instituicaoId", "funcionarioId");

-- CreateIndex
CREATE INDEX "BibliotecaConsumoArmazenamento_instituicaoId_idx" ON "BibliotecaConsumoArmazenamento"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaConsumoArmazenamento_instituicaoId_registradoEm_idx" ON "BibliotecaConsumoArmazenamento"("instituicaoId", "registradoEm");

-- CreateIndex
CREATE INDEX "BibliotecaConsumoArmazenamento_tipoMovimento_idx" ON "BibliotecaConsumoArmazenamento"("tipoMovimento");

-- CreateIndex
CREATE INDEX "BibliotecaConsumoArmazenamento_arquivoReferenciaId_idx" ON "BibliotecaConsumoArmazenamento"("arquivoReferenciaId");

-- CreateIndex
CREATE INDEX "BibliotecaAuditoria_instituicaoId_idx" ON "BibliotecaAuditoria"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaAuditoria_usuarioId_idx" ON "BibliotecaAuditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaAuditoria_entidade_entidadeId_idx" ON "BibliotecaAuditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "BibliotecaAuditoria_acao_idx" ON "BibliotecaAuditoria"("acao");

-- CreateIndex
CREATE INDEX "BibliotecaAuditoria_instituicaoId_criadoEm_idx" ON "BibliotecaAuditoria"("instituicaoId", "criadoEm");

-- AddForeignKey
ALTER TABLE "ModuloAdicionalInstituicao" ADD CONSTRAINT "ModuloAdicionalInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloAdicionalInstituicao" ADD CONSTRAINT "ModuloAdicionalInstituicao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloAdicionalInstituicao" ADD CONSTRAINT "ModuloAdicionalInstituicao_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaConfiguracao" ADD CONSTRAINT "BibliotecaConfiguracao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaConfiguracao" ADD CONSTRAINT "BibliotecaConfiguracao_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaOperador" ADD CONSTRAINT "BibliotecaOperador_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaOperador" ADD CONSTRAINT "BibliotecaOperador_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaOperador" ADD CONSTRAINT "BibliotecaOperador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaOperador" ADD CONSTRAINT "BibliotecaOperador_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaOperador" ADD CONSTRAINT "BibliotecaOperador_revogadoPorId_fkey" FOREIGN KEY ("revogadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaConsumoArmazenamento" ADD CONSTRAINT "BibliotecaConsumoArmazenamento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaConsumoArmazenamento" ADD CONSTRAINT "BibliotecaConsumoArmazenamento_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaAuditoria" ADD CONSTRAINT "BibliotecaAuditoria_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaAuditoria" ADD CONSTRAINT "BibliotecaAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
