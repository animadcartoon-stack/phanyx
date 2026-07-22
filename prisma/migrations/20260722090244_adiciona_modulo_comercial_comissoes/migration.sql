-- CreateEnum
CREATE TYPE "TipoRegraComissaoRH" AS ENUM ('PERCENTUAL', 'VALOR_FIXO');

-- CreateEnum
CREATE TYPE "BaseCalculoComissaoRH" AS ENUM ('VALOR_MATRICULA', 'VALOR_MENSALIDADE', 'VALOR_TOTAL_CONTRATO', 'VALOR_RECEBIDO', 'LUCRO', 'QUANTIDADE_MATRICULAS');

-- CreateEnum
CREATE TYPE "GatilhoComissaoRH" AS ENUM ('MATRICULA_CONFIRMADA', 'PAGAMENTO_MATRICULA_CONFIRMADO', 'PRIMEIRA_MENSALIDADE_PAGA', 'MENSALIDADE_PAGA', 'MANUAL');

-- CreateEnum
CREATE TYPE "PapelParticipanteComercial" AS ENUM ('RESPONSAVEL', 'PARTICIPANTE');

-- CreateEnum
CREATE TYPE "StatusLancamentoComissaoRH" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO', 'ENVIADO_HOLERITE', 'PAGO', 'ESTORNADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OrigemLancamentoComissaoRH" AS ENUM ('AUTOMATICA', 'MANUAL', 'AJUSTE', 'ESTORNO');

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "atendidoComercialEm" TIMESTAMP(3),
ADD COLUMN     "campanhaComercial" TEXT,
ADD COLUMN     "observacaoComercial" TEXT,
ADD COLUMN     "origemComercial" TEXT,
ADD COLUMN     "vendedorResponsavelId" INTEGER,
ADD COLUMN     "vendedorResponsavelNomeSnapshot" TEXT;

-- CreateTable
CREATE TABLE "PlanoComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicioVigencia" TIMESTAMP(3),
    "fimVigencia" TIMESTAMP(3),
    "exigePagamentoConfirmado" BOOLEAN NOT NULL DEFAULT true,
    "permiteCompartilhamento" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "planoId" INTEGER NOT NULL,
    "cursoId" INTEGER,
    "criadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoRegraComissaoRH" NOT NULL,
    "baseCalculo" "BaseCalculoComissaoRH" NOT NULL,
    "gatilho" "GatilhoComissaoRH" NOT NULL,
    "percentual" DECIMAL(7,4),
    "valorFixo" DECIMAL(12,2),
    "quantidadeMinima" INTEGER,
    "quantidadeMaxima" INTEGER,
    "usarValorLiquidoRecebido" BOOLEAN NOT NULL DEFAULT true,
    "estornarEmCancelamento" BOOLEAN NOT NULL DEFAULT true,
    "estornarEmInadimplencia" BOOLEAN NOT NULL DEFAULT false,
    "diasCarenciaEstorno" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuncionarioPlanoComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "planoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "inicioVigencia" TIMESTAMP(3) NOT NULL,
    "fimVigencia" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "planoNomeSnapshot" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuncionarioPlanoComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatriculaParticipanteComercial" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "papel" "PapelParticipanteComercial" NOT NULL,
    "percentualParticipacao" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "funcionarioCargoSnapshot" TEXT,
    "funcionarioDepartamentoSnapshot" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriculaParticipanteComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "participanteComercialId" INTEGER,
    "planoId" INTEGER,
    "regraId" INTEGER,
    "pagamentoId" INTEGER,
    "holeriteEventoId" INTEGER,
    "criadoPorId" INTEGER,
    "aprovadoPorId" INTEGER,
    "reprovadoPorId" INTEGER,
    "estornadoPorId" INTEGER,
    "chaveCalculo" TEXT NOT NULL,
    "origem" "OrigemLancamentoComissaoRH" NOT NULL DEFAULT 'AUTOMATICA',
    "status" "StatusLancamentoComissaoRH" NOT NULL DEFAULT 'PENDENTE',
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "baseCalculo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percentualAplicado" DECIMAL(7,4),
    "valorFixoAplicado" DECIMAL(12,2),
    "percentualParticipacao" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "valorCalculado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorAprovado" DECIMAL(12,2),
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "planoNomeSnapshot" TEXT,
    "regraNomeSnapshot" TEXT,
    "alunoNomeSnapshot" TEXT,
    "cursoNomeSnapshot" TEXT,
    "matriculaNumeroSnapshot" TEXT,
    "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprovadoEm" TIMESTAMP(3),
    "reprovadoEm" TIMESTAMP(3),
    "enviadoHoleriteEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "estornadoEm" TIMESTAMP(3),
    "motivoAjuste" TEXT,
    "motivoReprovacao" TEXT,
    "motivoEstorno" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LancamentoComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanoComissaoRH_instituicaoId_idx" ON "PlanoComissaoRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "PlanoComissaoRH_ativo_idx" ON "PlanoComissaoRH"("ativo");

-- CreateIndex
CREATE INDEX "PlanoComissaoRH_inicioVigencia_fimVigencia_idx" ON "PlanoComissaoRH"("inicioVigencia", "fimVigencia");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_instituicaoId_idx" ON "RegraComissaoRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_planoId_idx" ON "RegraComissaoRH"("planoId");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_cursoId_idx" ON "RegraComissaoRH"("cursoId");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_tipo_idx" ON "RegraComissaoRH"("tipo");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_baseCalculo_idx" ON "RegraComissaoRH"("baseCalculo");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_gatilho_idx" ON "RegraComissaoRH"("gatilho");

-- CreateIndex
CREATE INDEX "RegraComissaoRH_ativo_idx" ON "RegraComissaoRH"("ativo");

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_instituicaoId_idx" ON "FuncionarioPlanoComissaoRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_funcionarioId_idx" ON "FuncionarioPlanoComissaoRH"("funcionarioId");

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_planoId_idx" ON "FuncionarioPlanoComissaoRH"("planoId");

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_ativo_idx" ON "FuncionarioPlanoComissaoRH"("ativo");

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_inicioVigencia_fimVigencia_idx" ON "FuncionarioPlanoComissaoRH"("inicioVigencia", "fimVigencia");

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_instituicaoId_idx" ON "MatriculaParticipanteComercial"("instituicaoId");

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_matriculaId_idx" ON "MatriculaParticipanteComercial"("matriculaId");

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_funcionarioId_idx" ON "MatriculaParticipanteComercial"("funcionarioId");

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_papel_idx" ON "MatriculaParticipanteComercial"("papel");

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaParticipanteComercial_matriculaId_funcionarioId_key" ON "MatriculaParticipanteComercial"("matriculaId", "funcionarioId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_instituicaoId_idx" ON "LancamentoComissaoRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_funcionarioId_idx" ON "LancamentoComissaoRH"("funcionarioId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_matriculaId_idx" ON "LancamentoComissaoRH"("matriculaId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_participanteComercialId_idx" ON "LancamentoComissaoRH"("participanteComercialId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_planoId_idx" ON "LancamentoComissaoRH"("planoId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_regraId_idx" ON "LancamentoComissaoRH"("regraId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_pagamentoId_idx" ON "LancamentoComissaoRH"("pagamentoId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_holeriteEventoId_idx" ON "LancamentoComissaoRH"("holeriteEventoId");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_status_idx" ON "LancamentoComissaoRH"("status");

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_competenciaMes_competenciaAno_idx" ON "LancamentoComissaoRH"("competenciaMes", "competenciaAno");

-- CreateIndex
CREATE UNIQUE INDEX "LancamentoComissaoRH_instituicaoId_chaveCalculo_key" ON "LancamentoComissaoRH"("instituicaoId", "chaveCalculo");

-- CreateIndex
CREATE INDEX "Matricula_vendedorResponsavelId_idx" ON "Matricula"("vendedorResponsavelId");

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_vendedorResponsavelId_fkey" FOREIGN KEY ("vendedorResponsavelId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoComissaoRH" ADD CONSTRAINT "PlanoComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoComissaoRH" ADD CONSTRAINT "PlanoComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoComissaoRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoComissaoRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_participanteComercialId_fkey" FOREIGN KEY ("participanteComercialId") REFERENCES "MatriculaParticipanteComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoComissaoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "RegraComissaoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_holeriteEventoId_fkey" FOREIGN KEY ("holeriteEventoId") REFERENCES "HoleriteEventoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_reprovadoPorId_fkey" FOREIGN KEY ("reprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_estornadoPorId_fkey" FOREIGN KEY ("estornadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
