/*
  Warnings:

  - A unique constraint covering the columns `[cursoId,cursoSemestreId,disciplinaId]` on the table `CursoDisciplinaExtraPermitida` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoId,turmaId,disciplinaId]` on the table `ResultadoFinal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,nome,semestre,periodoLetivo]` on the table `Turma` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusPeriodoMatricula" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusRematriculaSemestral" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'APROVADA', 'DEVOLVIDA', 'RECUSADA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "TipoItemRematriculaSemestral" AS ENUM ('PROXIMO_SEMESTRE', 'PENDENCIA_ANTERIOR', 'EXTRACURRICULAR');

-- DropIndex
DROP INDEX "CursoDisciplinaExtraPermitida_cursoId_disciplinaId_key";

-- DropIndex
DROP INDEX "ResultadoFinal_alunoId_turmaId_key";

-- DropIndex
DROP INDEX "Turma_instituicaoId_nome_semestre_key";

-- AlterTable
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contaCargaMaxima" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contaCargaMinima" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cursoSemestreId" INTEGER,
ADD COLUMN     "obrigatoria" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PeriodoMatricula" ADD COLUMN     "bloqueiaInadimplente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cargaMaximaOverride" INTEGER,
ADD COLUMN     "cargaMinimaOverride" INTEGER,
ADD COLUMN     "cursoSemestreId" INTEGER,
ADD COLUMN     "dataInicioAulas" TIMESTAMP(3),
ADD COLUMN     "exigeAprovacao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instrucoes" TEXT,
ADD COLUMN     "permiteRascunho" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "StatusPeriodoMatricula" NOT NULL DEFAULT 'RASCUNHO';

-- CreateTable
CREATE TABLE "ImpersonacaoSuporte" (
    "id" SERIAL NOT NULL,
    "masterUserId" INTEGER,
    "usuarioAlvoId" INTEGER,
    "instituicaoId" INTEGER,
    "masterEmailSnapshot" TEXT NOT NULL,
    "usuarioAlvoEmailSnapshot" TEXT NOT NULL,
    "usuarioAlvoNomeSnapshot" TEXT NOT NULL,
    "instituicaoNomeSnapshot" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "encerradoEm" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ImpersonacaoSuporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RematriculaSemestral" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "periodoMatriculaId" INTEGER NOT NULL,
    "cursoSemestreDestinoId" INTEGER NOT NULL,
    "matriculaOrigemId" INTEGER,
    "matriculaGeradaId" INTEGER,
    "analisadoPorId" INTEGER,
    "protocolo" TEXT NOT NULL,
    "status" "StatusRematriculaSemestral" NOT NULL DEFAULT 'RASCUNHO',
    "cargaHorariaSelecionada" INTEGER NOT NULL DEFAULT 0,
    "declaracaoAceitaEm" TIMESTAMP(3),
    "enviadaEm" TIMESTAMP(3),
    "analisadaEm" TIMESTAMP(3),
    "aprovadaEm" TIMESTAMP(3),
    "devolvidaEm" TIMESTAMP(3),
    "recusadaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "motivoDevolucao" TEXT,
    "motivoRecusa" TEXT,
    "motivoCancelamento" TEXT,
    "observacoes" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RematriculaSemestral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RematriculaSemestralItem" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "rematriculaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "turmaDisciplinaId" INTEGER NOT NULL,
    "tipo" "TipoItemRematriculaSemestral" NOT NULL,
    "cargaHorariaSnapshot" INTEGER NOT NULL,
    "semestreOrigemNumero" INTEGER,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RematriculaSemestralItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImpersonacaoSuporte_masterUserId_iniciadoEm_idx" ON "ImpersonacaoSuporte"("masterUserId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "ImpersonacaoSuporte_usuarioAlvoId_iniciadoEm_idx" ON "ImpersonacaoSuporte"("usuarioAlvoId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "ImpersonacaoSuporte_instituicaoId_idx" ON "ImpersonacaoSuporte"("instituicaoId");

-- CreateIndex
CREATE INDEX "ImpersonacaoSuporte_ativa_expiraEm_idx" ON "ImpersonacaoSuporte"("ativa", "expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "RematriculaSemestral_matriculaGeradaId_key" ON "RematriculaSemestral"("matriculaGeradaId");

-- CreateIndex
CREATE UNIQUE INDEX "RematriculaSemestral_protocolo_key" ON "RematriculaSemestral"("protocolo");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_instituicaoId_idx" ON "RematriculaSemestral"("instituicaoId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_alunoId_idx" ON "RematriculaSemestral"("alunoId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_periodoMatriculaId_idx" ON "RematriculaSemestral"("periodoMatriculaId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_cursoSemestreDestinoId_idx" ON "RematriculaSemestral"("cursoSemestreDestinoId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_matriculaOrigemId_idx" ON "RematriculaSemestral"("matriculaOrigemId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_matriculaGeradaId_idx" ON "RematriculaSemestral"("matriculaGeradaId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_analisadoPorId_idx" ON "RematriculaSemestral"("analisadoPorId");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_status_idx" ON "RematriculaSemestral"("status");

-- CreateIndex
CREATE INDEX "RematriculaSemestral_criadaEm_idx" ON "RematriculaSemestral"("criadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "RematriculaSemestral_alunoId_periodoMatriculaId_key" ON "RematriculaSemestral"("alunoId", "periodoMatriculaId");

-- CreateIndex
CREATE INDEX "RematriculaSemestralItem_instituicaoId_idx" ON "RematriculaSemestralItem"("instituicaoId");

-- CreateIndex
CREATE INDEX "RematriculaSemestralItem_rematriculaId_idx" ON "RematriculaSemestralItem"("rematriculaId");

-- CreateIndex
CREATE INDEX "RematriculaSemestralItem_disciplinaId_idx" ON "RematriculaSemestralItem"("disciplinaId");

-- CreateIndex
CREATE INDEX "RematriculaSemestralItem_turmaDisciplinaId_idx" ON "RematriculaSemestralItem"("turmaDisciplinaId");

-- CreateIndex
CREATE INDEX "RematriculaSemestralItem_tipo_idx" ON "RematriculaSemestralItem"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "RematriculaSemestralItem_rematriculaId_disciplinaId_key" ON "RematriculaSemestralItem"("rematriculaId", "disciplinaId");

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_cursoSemestreId_idx" ON "CursoDisciplinaExtraPermitida"("cursoSemestreId");

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_ativa_idx" ON "CursoDisciplinaExtraPermitida"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "CursoDisciplinaExtraPermitida_cursoId_cursoSemestreId_disci_key" ON "CursoDisciplinaExtraPermitida"("cursoId", "cursoSemestreId", "disciplinaId");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_cursoSemestreId_idx" ON "PeriodoMatricula"("cursoSemestreId");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_status_idx" ON "PeriodoMatricula"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoFinal_alunoId_turmaId_disciplinaId_key" ON "ResultadoFinal"("alunoId", "turmaId", "disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Turma_instituicaoId_nome_semestre_periodoLetivo_key" ON "Turma"("instituicaoId", "nome", "semestre", "periodoLetivo");

-- AddForeignKey
ALTER TABLE "ImpersonacaoSuporte" ADD CONSTRAINT "ImpersonacaoSuporte_masterUserId_fkey" FOREIGN KEY ("masterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonacaoSuporte" ADD CONSTRAINT "ImpersonacaoSuporte_usuarioAlvoId_fkey" FOREIGN KEY ("usuarioAlvoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonacaoSuporte" ADD CONSTRAINT "ImpersonacaoSuporte_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_cursoSemestreId_fkey" FOREIGN KEY ("cursoSemestreId") REFERENCES "CursoSemestre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoMatricula" ADD CONSTRAINT "PeriodoMatricula_cursoSemestreId_fkey" FOREIGN KEY ("cursoSemestreId") REFERENCES "CursoSemestre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_periodoMatriculaId_fkey" FOREIGN KEY ("periodoMatriculaId") REFERENCES "PeriodoMatricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_cursoSemestreDestinoId_fkey" FOREIGN KEY ("cursoSemestreDestinoId") REFERENCES "CursoSemestre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_matriculaOrigemId_fkey" FOREIGN KEY ("matriculaOrigemId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_matriculaGeradaId_fkey" FOREIGN KEY ("matriculaGeradaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestral" ADD CONSTRAINT "RematriculaSemestral_analisadoPorId_fkey" FOREIGN KEY ("analisadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestralItem" ADD CONSTRAINT "RematriculaSemestralItem_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestralItem" ADD CONSTRAINT "RematriculaSemestralItem_rematriculaId_fkey" FOREIGN KEY ("rematriculaId") REFERENCES "RematriculaSemestral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestralItem" ADD CONSTRAINT "RematriculaSemestralItem_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RematriculaSemestralItem" ADD CONSTRAINT "RematriculaSemestralItem_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "TurmaDisciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
