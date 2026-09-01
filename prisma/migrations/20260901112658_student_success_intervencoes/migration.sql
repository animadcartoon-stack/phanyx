-- CreateEnum
CREATE TYPE "TipoIntervencaoStudentSuccess" AS ENUM ('CONTATO', 'ORIENTACAO', 'REUNIAO', 'ENCAMINHAMENTO', 'ACOMPANHAMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CanalIntervencaoStudentSuccess" AS ENUM ('WHATSAPP', 'LIGACAO', 'EMAIL', 'PRESENCIAL', 'VIDEOCHAMADA', 'SISTEMA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusIntervencaoStudentSuccess" AS ENUM ('REGISTRADA', 'AGUARDANDO_RETORNO', 'EM_ACOMPANHAMENTO', 'RESOLVIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "StudentSuccessIntervencao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "tipo" "TipoIntervencaoStudentSuccess" NOT NULL,
    "canal" "CanalIntervencaoStudentSuccess" NOT NULL,
    "status" "StatusIntervencaoStudentSuccess" NOT NULL DEFAULT 'REGISTRADA',
    "observacao" TEXT NOT NULL,
    "retornoEm" TIMESTAMP(3),
    "resultado" TEXT,
    "nivelRiscoNoRegistro" TEXT NOT NULL,
    "pontuacaoNoRegistro" INTEGER,
    "coberturaNoRegistro" INTEGER NOT NULL,
    "confiabilidadeNoRegistro" TEXT NOT NULL,
    "fatoresNoRegistro" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "StudentSuccessIntervencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_instituicaoId_idx" ON "StudentSuccessIntervencao"("instituicaoId");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_alunoId_idx" ON "StudentSuccessIntervencao"("alunoId");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_criadoPorId_idx" ON "StudentSuccessIntervencao"("criadoPorId");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_status_idx" ON "StudentSuccessIntervencao"("status");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_tipo_idx" ON "StudentSuccessIntervencao"("tipo");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_canal_idx" ON "StudentSuccessIntervencao"("canal");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_retornoEm_idx" ON "StudentSuccessIntervencao"("retornoEm");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_criadoEm_idx" ON "StudentSuccessIntervencao"("criadoEm");

-- CreateIndex
CREATE INDEX "StudentSuccessIntervencao_instituicaoId_alunoId_criadoEm_idx" ON "StudentSuccessIntervencao"("instituicaoId", "alunoId", "criadoEm");

-- AddForeignKey
ALTER TABLE "StudentSuccessIntervencao" ADD CONSTRAINT "StudentSuccessIntervencao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSuccessIntervencao" ADD CONSTRAINT "StudentSuccessIntervencao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSuccessIntervencao" ADD CONSTRAINT "StudentSuccessIntervencao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
