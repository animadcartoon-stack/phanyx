-- CreateEnum
CREATE TYPE "TipoEventoAprendizagemAluno" AS ENUM ('AULA_ABERTA', 'MATERIAL_VISUALIZADO', 'MATERIAL_DOWNLOAD');

-- AlterTable
ALTER TABLE "Prova" ADD COLUMN     "disciplinaId" INTEGER;

-- CreateTable
CREATE TABLE "SessaoVideoAluno" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoRegistroEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMP(3),
    "posicaoInicialSegundos" INTEGER NOT NULL DEFAULT 0,
    "posicaoFinalSegundos" INTEGER NOT NULL DEFAULT 0,
    "maiorPosicaoSegundos" INTEGER NOT NULL DEFAULT 0,
    "tempoReproducaoSegundos" INTEGER NOT NULL DEFAULT 0,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "motivoEncerramento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessaoVideoAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoAprendizagemAluno" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "tipo" "TipoEventoAprendizagemAluno" NOT NULL,
    "aulaId" INTEGER,
    "materialAulaId" INTEGER,
    "ocorridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAprendizagemAluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_instituicaoId_idx" ON "SessaoVideoAluno"("instituicaoId");

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_alunoId_idx" ON "SessaoVideoAluno"("alunoId");

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_aulaId_idx" ON "SessaoVideoAluno"("aulaId");

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_turmaId_idx" ON "SessaoVideoAluno"("turmaId");

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_disciplinaId_idx" ON "SessaoVideoAluno"("disciplinaId");

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_instituicaoId_alunoId_turmaId_disciplinaId_idx" ON "SessaoVideoAluno"("instituicaoId", "alunoId", "turmaId", "disciplinaId");

-- CreateIndex
CREATE INDEX "SessaoVideoAluno_alunoId_aulaId_iniciadoEm_idx" ON "SessaoVideoAluno"("alunoId", "aulaId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_instituicaoId_idx" ON "EventoAprendizagemAluno"("instituicaoId");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_alunoId_idx" ON "EventoAprendizagemAluno"("alunoId");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_turmaId_idx" ON "EventoAprendizagemAluno"("turmaId");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_disciplinaId_idx" ON "EventoAprendizagemAluno"("disciplinaId");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_aulaId_idx" ON "EventoAprendizagemAluno"("aulaId");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_materialAulaId_idx" ON "EventoAprendizagemAluno"("materialAulaId");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_instituicaoId_alunoId_ocorridoEm_idx" ON "EventoAprendizagemAluno"("instituicaoId", "alunoId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "EventoAprendizagemAluno_turmaId_disciplinaId_ocorridoEm_idx" ON "EventoAprendizagemAluno"("turmaId", "disciplinaId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "Prova_disciplinaId_idx" ON "Prova"("disciplinaId");

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_turmaId_disciplinaId_idx" ON "Prova"("instituicaoId", "turmaId", "disciplinaId");

-- AddForeignKey
ALTER TABLE "SessaoVideoAluno" ADD CONSTRAINT "SessaoVideoAluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoVideoAluno" ADD CONSTRAINT "SessaoVideoAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoVideoAluno" ADD CONSTRAINT "SessaoVideoAluno_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoVideoAluno" ADD CONSTRAINT "SessaoVideoAluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoVideoAluno" ADD CONSTRAINT "SessaoVideoAluno_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAprendizagemAluno" ADD CONSTRAINT "EventoAprendizagemAluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAprendizagemAluno" ADD CONSTRAINT "EventoAprendizagemAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAprendizagemAluno" ADD CONSTRAINT "EventoAprendizagemAluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAprendizagemAluno" ADD CONSTRAINT "EventoAprendizagemAluno_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAprendizagemAluno" ADD CONSTRAINT "EventoAprendizagemAluno_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAprendizagemAluno" ADD CONSTRAINT "EventoAprendizagemAluno_materialAulaId_fkey" FOREIGN KEY ("materialAulaId") REFERENCES "MaterialAula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "StudentSuccessAnaliseHistorico_instituicaoId_alunoId_analisadoE" RENAME TO "StudentSuccessAnaliseHistorico_instituicaoId_alunoId_analis_idx";

-- RenameIndex
ALTER INDEX "StudentSuccessAnaliseHistorico_instituicaoId_nivelRisco_analisa" RENAME TO "StudentSuccessAnaliseHistorico_instituicaoId_nivelRisco_ana_idx";

