-- CreateEnum
CREATE TYPE "OrigemAnaliseStudentSuccess" AS ENUM (
  'INICIAL',
  'AUTOMATICA',
  'MANUAL',
  'ALTERACAO_ACADEMICA'
);

-- CreateTable
CREATE TABLE "StudentSuccessAnaliseHistorico" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "alunoId" INTEGER NOT NULL,
  "origem" "OrigemAnaliseStudentSuccess" NOT NULL DEFAULT 'AUTOMATICA',
  "executadoPorId" INTEGER,
  "versaoMotor" TEXT NOT NULL DEFAULT 'v1',
  "nivelRisco" TEXT NOT NULL,
  "pontuacaoRisco" INTEGER,
  "pontuacaoBruta" INTEGER,
  "maximoDisponivel" INTEGER,
  "coberturaPercentual" INTEGER NOT NULL,
  "confiabilidade" TEXT NOT NULL,
  "componentes" JSONB,
  "fatoresPrincipais" JSONB,
  "indicadores" JSONB,
  "assinaturaEstado" TEXT NOT NULL,
  "analisadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudentSuccessAnaliseHistorico_pkey"
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_instituicaoId_idx"
ON "StudentSuccessAnaliseHistorico"("instituicaoId");

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_alunoId_idx"
ON "StudentSuccessAnaliseHistorico"("alunoId");

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_executadoPorId_idx"
ON "StudentSuccessAnaliseHistorico"("executadoPorId");

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_origem_idx"
ON "StudentSuccessAnaliseHistorico"("origem");

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_nivelRisco_idx"
ON "StudentSuccessAnaliseHistorico"("nivelRisco");

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_analisadoEm_idx"
ON "StudentSuccessAnaliseHistorico"("analisadoEm");

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_instituicaoId_alunoId_analisadoEm_idx"
ON "StudentSuccessAnaliseHistorico"(
  "instituicaoId",
  "alunoId",
  "analisadoEm"
);

-- CreateIndex
CREATE INDEX "StudentSuccessAnaliseHistorico_instituicaoId_nivelRisco_analisadoEm_idx"
ON "StudentSuccessAnaliseHistorico"(
  "instituicaoId",
  "nivelRisco",
  "analisadoEm"
);

-- AddForeignKey
ALTER TABLE "StudentSuccessAnaliseHistorico"
ADD CONSTRAINT "StudentSuccessAnaliseHistorico_instituicaoId_fkey"
FOREIGN KEY ("instituicaoId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSuccessAnaliseHistorico"
ADD CONSTRAINT "StudentSuccessAnaliseHistorico_alunoId_fkey"
FOREIGN KEY ("alunoId")
REFERENCES "Aluno"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSuccessAnaliseHistorico"
ADD CONSTRAINT "StudentSuccessAnaliseHistorico_executadoPorId_fkey"
FOREIGN KEY ("executadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
