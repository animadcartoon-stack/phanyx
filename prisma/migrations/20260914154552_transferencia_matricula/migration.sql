-- CreateEnum
CREATE TYPE "TipoTransferenciaMatricula" AS ENUM ('POLO', 'CURSO_TURMA', 'INSTITUICAO_PHANYX', 'INSTITUICAO_EXTERNA', 'REATRIBUICAO_ALUNO');

-- CreateEnum
CREATE TYPE "StatusTransferenciaMatricula" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SituacaoItemTransferenciaMatricula" AS ENUM ('MIGRADO', 'AGUARDANDO_TURMA', 'AGUARDANDO_COMPATIBILIDADE');

-- AlterEnum
ALTER TYPE "StatusItemMatricula" ADD VALUE 'TRANSFERIDO';

-- CreateTable
CREATE TABLE "TransferenciaMatricula" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "tipo" "TipoTransferenciaMatricula" NOT NULL,
    "status" "StatusTransferenciaMatricula" NOT NULL DEFAULT 'PENDENTE',
    "dataTransferencia" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacoes" TEXT,
    "alunoOrigemId" INTEGER,
    "alunoOrigemNomeSnapshot" TEXT,
    "alunoDestinoId" INTEGER,
    "alunoDestinoNomeSnapshot" TEXT,
    "instituicaoOrigemId" INTEGER,
    "instituicaoOrigemNomeSnapshot" TEXT,
    "instituicaoDestinoId" INTEGER,
    "instituicaoDestinoNomeSnapshot" TEXT,
    "poloOrigemId" INTEGER,
    "poloOrigemNomeSnapshot" TEXT,
    "poloDestinoId" INTEGER,
    "poloDestinoNomeSnapshot" TEXT,
    "cursoOrigemId" INTEGER,
    "cursoOrigemNomeSnapshot" TEXT,
    "cursoDestinoId" INTEGER,
    "cursoDestinoNomeSnapshot" TEXT,
    "turmaOrigemId" INTEGER,
    "turmaOrigemNomeSnapshot" TEXT,
    "turmaDestinoId" INTEGER,
    "turmaDestinoNomeSnapshot" TEXT,
    "instituicaoExternaNome" TEXT,
    "instituicaoExternaPaisCodigo" VARCHAR(2),
    "realizadoPorId" INTEGER,
    "realizadoPorNomeSnapshot" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "snapshotAnterior" JSONB NOT NULL,
    "snapshotPosterior" JSONB,
    "concluidaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferenciaMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaMatriculaItem" (
    "id" SERIAL NOT NULL,
    "transferenciaId" INTEGER NOT NULL,
    "itemMatriculaOrigemId" INTEGER NOT NULL,
    "itemMatriculaDestinoId" INTEGER,
    "disciplinaId" INTEGER NOT NULL,
    "disciplinaNomeSnapshot" TEXT NOT NULL,
    "turmaOrigemId" INTEGER,
    "turmaOrigemNomeSnapshot" TEXT,
    "turmaDestinoId" INTEGER,
    "turmaDestinoNomeSnapshot" TEXT,
    "tipoItem" "TipoItemMatricula" NOT NULL,
    "statusOrigem" "StatusItemMatricula" NOT NULL,
    "statusDestino" "StatusItemMatricula",
    "situacao" "SituacaoItemTransferenciaMatricula" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaMatriculaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_instituicaoId_idx" ON "TransferenciaMatricula"("instituicaoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_matriculaId_idx" ON "TransferenciaMatricula"("matriculaId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_tipo_idx" ON "TransferenciaMatricula"("tipo");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_status_idx" ON "TransferenciaMatricula"("status");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_realizadoPorId_idx" ON "TransferenciaMatricula"("realizadoPorId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_dataTransferencia_idx" ON "TransferenciaMatricula"("dataTransferencia");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_poloOrigemId_idx" ON "TransferenciaMatricula"("poloOrigemId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_poloDestinoId_idx" ON "TransferenciaMatricula"("poloDestinoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_turmaOrigemId_idx" ON "TransferenciaMatricula"("turmaOrigemId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_turmaDestinoId_idx" ON "TransferenciaMatricula"("turmaDestinoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatricula_createdAt_idx" ON "TransferenciaMatricula"("createdAt");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_transferenciaId_idx" ON "TransferenciaMatriculaItem"("transferenciaId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_itemMatriculaOrigemId_idx" ON "TransferenciaMatriculaItem"("itemMatriculaOrigemId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_itemMatriculaDestinoId_idx" ON "TransferenciaMatriculaItem"("itemMatriculaDestinoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_disciplinaId_idx" ON "TransferenciaMatriculaItem"("disciplinaId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_turmaOrigemId_idx" ON "TransferenciaMatriculaItem"("turmaOrigemId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_turmaDestinoId_idx" ON "TransferenciaMatriculaItem"("turmaDestinoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaItem_situacao_idx" ON "TransferenciaMatriculaItem"("situacao");

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaMatriculaItem_transferenciaId_itemMatriculaOri_key" ON "TransferenciaMatriculaItem"("transferenciaId", "itemMatriculaOrigemId");

-- AddForeignKey
ALTER TABLE "TransferenciaMatricula" ADD CONSTRAINT "TransferenciaMatricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaMatricula" ADD CONSTRAINT "TransferenciaMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaMatricula" ADD CONSTRAINT "TransferenciaMatricula_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaMatriculaItem" ADD CONSTRAINT "TransferenciaMatriculaItem_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "TransferenciaMatricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
