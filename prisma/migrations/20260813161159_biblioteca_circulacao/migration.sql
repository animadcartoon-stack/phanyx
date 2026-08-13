-- CreateEnum
CREATE TYPE "StatusEmprestimoBiblioteca" AS ENUM ('ATIVO', 'ATRASADO', 'DEVOLVIDO', 'PERDIDO', 'DANIFICADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CondicaoDevolucaoBiblioteca" AS ENUM ('NORMAL', 'DESGASTE', 'DANIFICADO', 'INCOMPLETO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "StatusRenovacaoBiblioteca" AS ENUM ('SOLICITADA', 'APROVADA', 'RECUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusReservaBiblioteca" AS ENUM ('AGUARDANDO', 'DISPONIVEL', 'ATENDIDA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "OrigemReservaBiblioteca" AS ENUM ('USUARIO', 'OPERADOR', 'PROFESSOR', 'SISTEMA');

-- CreateTable
CREATE TABLE "BibliotecaEmprestimo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "exemplarId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "status" "StatusEmprestimoBiblioteca" NOT NULL DEFAULT 'ATIVO',
    "emprestadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vencimentoEm" TIMESTAMP(3) NOT NULL,
    "devolvidoEm" TIMESTAMP(3),
    "quantidadeRenovacoes" INTEGER NOT NULL DEFAULT 0,
    "devolucaoCondicao" "CondicaoDevolucaoBiblioteca",
    "observacaoRetirada" TEXT,
    "observacaoDevolucao" TEXT,
    "diasAtrasoCalculado" INTEGER NOT NULL DEFAULT 0,
    "bloqueioGerado" BOOLEAN NOT NULL DEFAULT false,
    "multaGerada" BOOLEAN NOT NULL DEFAULT false,
    "valorMultaCalculado" DECIMAL(10,2),
    "registradoPorId" INTEGER,
    "devolvidoPorId" INTEGER,
    "canceladoPorId" INTEGER,
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaEmprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaRenovacao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "emprestimoId" INTEGER NOT NULL,
    "status" "StatusRenovacaoBiblioteca" NOT NULL DEFAULT 'SOLICITADA',
    "vencimentoAnterior" TIMESTAMP(3) NOT NULL,
    "novoVencimento" TIMESTAMP(3),
    "solicitadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analisadaEm" TIMESTAMP(3),
    "motivoSolicitacao" TEXT,
    "motivoRecusa" TEXT,
    "observacao" TEXT,
    "solicitadaPorId" INTEGER,
    "analisadaPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaRenovacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaReserva" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "exemplarId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "status" "StatusReservaBiblioteca" NOT NULL DEFAULT 'AGUARDANDO',
    "posicaoFila" INTEGER,
    "reservadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disponivelEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3),
    "atendidaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "origem" "OrigemReservaBiblioteca" NOT NULL DEFAULT 'USUARIO',
    "observacao" TEXT,
    "motivoCancelamento" TEXT,
    "criadaPorId" INTEGER,
    "atendidaPorId" INTEGER,
    "canceladaPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaReserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_instituicaoId_idx" ON "BibliotecaEmprestimo"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_instituicaoId_status_idx" ON "BibliotecaEmprestimo"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_exemplarId_idx" ON "BibliotecaEmprestimo"("exemplarId");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_usuarioId_idx" ON "BibliotecaEmprestimo"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_usuarioId_status_idx" ON "BibliotecaEmprestimo"("usuarioId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_vencimentoEm_idx" ON "BibliotecaEmprestimo"("vencimentoEm");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_devolvidoEm_idx" ON "BibliotecaEmprestimo"("devolvidoEm");

-- CreateIndex
CREATE INDEX "BibliotecaEmprestimo_emprestadoEm_idx" ON "BibliotecaEmprestimo"("emprestadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaEmprestimo_id_instituicaoId_key" ON "BibliotecaEmprestimo"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRenovacao_instituicaoId_idx" ON "BibliotecaRenovacao"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRenovacao_instituicaoId_status_idx" ON "BibliotecaRenovacao"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaRenovacao_emprestimoId_idx" ON "BibliotecaRenovacao"("emprestimoId");

-- CreateIndex
CREATE INDEX "BibliotecaRenovacao_solicitadaEm_idx" ON "BibliotecaRenovacao"("solicitadaEm");

-- CreateIndex
CREATE INDEX "BibliotecaRenovacao_analisadaEm_idx" ON "BibliotecaRenovacao"("analisadaEm");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_instituicaoId_idx" ON "BibliotecaReserva"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_instituicaoId_status_idx" ON "BibliotecaReserva"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_itemId_idx" ON "BibliotecaReserva"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_exemplarId_idx" ON "BibliotecaReserva"("exemplarId");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_usuarioId_idx" ON "BibliotecaReserva"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_usuarioId_status_idx" ON "BibliotecaReserva"("usuarioId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_itemId_status_posicaoFila_idx" ON "BibliotecaReserva"("itemId", "status", "posicaoFila");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_reservadaEm_idx" ON "BibliotecaReserva"("reservadaEm");

-- CreateIndex
CREATE INDEX "BibliotecaReserva_expiraEm_idx" ON "BibliotecaReserva"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaReserva_id_instituicaoId_key" ON "BibliotecaReserva"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_instituicaoId_key" ON "User"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "BibliotecaEmprestimo" ADD CONSTRAINT "BibliotecaEmprestimo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaEmprestimo" ADD CONSTRAINT "BibliotecaEmprestimo_exemplarId_instituicaoId_fkey" FOREIGN KEY ("exemplarId", "instituicaoId") REFERENCES "BibliotecaExemplar"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaEmprestimo" ADD CONSTRAINT "BibliotecaEmprestimo_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaEmprestimo" ADD CONSTRAINT "BibliotecaEmprestimo_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaEmprestimo" ADD CONSTRAINT "BibliotecaEmprestimo_devolvidoPorId_fkey" FOREIGN KEY ("devolvidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaEmprestimo" ADD CONSTRAINT "BibliotecaEmprestimo_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRenovacao" ADD CONSTRAINT "BibliotecaRenovacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRenovacao" ADD CONSTRAINT "BibliotecaRenovacao_emprestimoId_instituicaoId_fkey" FOREIGN KEY ("emprestimoId", "instituicaoId") REFERENCES "BibliotecaEmprestimo"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRenovacao" ADD CONSTRAINT "BibliotecaRenovacao_solicitadaPorId_fkey" FOREIGN KEY ("solicitadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRenovacao" ADD CONSTRAINT "BibliotecaRenovacao_analisadaPorId_fkey" FOREIGN KEY ("analisadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_exemplarId_instituicaoId_fkey" FOREIGN KEY ("exemplarId", "instituicaoId") REFERENCES "BibliotecaExemplar"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_criadaPorId_fkey" FOREIGN KEY ("criadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_atendidaPorId_fkey" FOREIGN KEY ("atendidaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaReserva" ADD CONSTRAINT "BibliotecaReserva_canceladaPorId_fkey" FOREIGN KEY ("canceladaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Impede dois empréstimos ativos para o mesmo exemplar
CREATE UNIQUE INDEX "BibliotecaEmprestimo_exemplar_ativo_key"
ON "BibliotecaEmprestimo" ("instituicaoId", "exemplarId")
WHERE "status" IN ('ATIVO', 'ATRASADO');

-- Impede o mesmo usuário de manter duas reservas ativas para o mesmo item
CREATE UNIQUE INDEX "BibliotecaReserva_usuario_item_ativa_key"
ON "BibliotecaReserva" ("instituicaoId", "usuarioId", "itemId")
WHERE "status" IN ('AGUARDANDO', 'DISPONIVEL');

-- Impede duas solicitações de renovação pendentes para o mesmo empréstimo
CREATE UNIQUE INDEX "BibliotecaRenovacao_solicitada_key"
ON "BibliotecaRenovacao" ("instituicaoId", "emprestimoId")
WHERE "status" = 'SOLICITADA';

-- Impede posições duplicadas na fila ativa do mesmo item
CREATE UNIQUE INDEX "BibliotecaReserva_fila_posicao_key"
ON "BibliotecaReserva" ("instituicaoId", "itemId", "posicaoFila")
WHERE "status" = 'AGUARDANDO' AND "posicaoFila" IS NOT NULL;