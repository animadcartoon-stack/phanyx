-- CreateEnum
CREATE TYPE "PeriodicidadeCursoLivre" AS ENUM ('SEMANAL', 'MENSAL');


-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "valorSemanal" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "PeriodoCursoLivre" (
    "id" TEXT NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "lancamentoId" INTEGER NOT NULL,
    "periodicidade" "PeriodicidadeCursoLivre" NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "criadoPorId" INTEGER NOT NULL,
    "impersonacaoId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chaveOperacao" TEXT NOT NULL,
    "pedidoHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PeriodoCursoLivre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoCursoLivre_lancamentoId_key" ON "PeriodoCursoLivre"("lancamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoCursoLivre_chaveOperacao_key" ON "PeriodoCursoLivre"("chaveOperacao");

-- CreateIndex
CREATE INDEX "PeriodoCursoLivre_instituicaoId_matriculaId_dataInicio_data_idx" ON "PeriodoCursoLivre"("instituicaoId", "matriculaId", "dataInicio", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoCursoLivre_lancamentoId_instituicaoId_matriculaId_key" ON "PeriodoCursoLivre"("lancamentoId", "instituicaoId", "matriculaId");

-- CreateIndex
CREATE UNIQUE INDEX "LancamentoFinanceiro_id_instituicaoId_matriculaId_key" ON "LancamentoFinanceiro"("id", "instituicaoId", "matriculaId");

-- AddForeignKey
ALTER TABLE "PeriodoCursoLivre" ADD CONSTRAINT "PeriodoCursoLivre_matriculaId_instituicaoId_fkey" FOREIGN KEY ("matriculaId", "instituicaoId") REFERENCES "Matricula"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoCursoLivre" ADD CONSTRAINT "PeriodoCursoLivre_lancamentoId_instituicaoId_matriculaId_fkey" FOREIGN KEY ("lancamentoId", "instituicaoId", "matriculaId") REFERENCES "LancamentoFinanceiro"("id", "instituicaoId", "matriculaId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Um vínculo ativo por aluno/curso; renovações acrescentam períodos ao histórico.
CREATE UNIQUE INDEX "Matricula_curso_livre_vinculo_ativo_key"
ON "Matricula" ("instituicaoId", "alunoId", "cursoId")
WHERE "organizacaoCurricular" = 'LIVRE' AND "excluidaEm" IS NULL
AND "status" NOT IN ('CANCELADA', 'CONCLUIDA', 'TRANSFERIDA');
CREATE UNIQUE INDEX "Turma_livre_nome_periodo_key"
ON "Turma" ("instituicaoId", "nome", "periodoLetivo") WHERE "organizacaoCurricular" = 'LIVRE';
ALTER TABLE "PeriodoCursoLivre" ADD CONSTRAINT "PeriodoCursoLivre_datas_validas"
CHECK ("dataFim" >= "dataInicio" AND "dataFim" - "dataInicio" < CASE WHEN "periodicidade" = 'SEMANAL' THEN 7 ELSE 31 END);
ALTER TABLE "PeriodoCursoLivre" ADD CONSTRAINT "PeriodoCursoLivre_valor_positivo" CHECK ("valor" > 0);
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_valorSemanal_positivo" CHECK ("valorSemanal" IS NULL OR "valorSemanal" > 0);
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_livre_sem_parcelas" CHECK ("organizacaoCurricular" <> 'LIVRE' OR
("quantidadeEtapas" IS NULL AND "quantidadeSemestres" IS NULL AND COALESCE("valorMatricula", 0) = 0 AND "quantidadeParcelas" IS NULL));
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_livre_sem_parcelas" CHECK ("organizacaoCurricular" <> 'LIVRE' OR
("etapaNumero" IS NULL AND "semestre" IS NULL AND "cursoSemestreId" IS NULL AND COALESCE("valorMatricula", 0) = 0
AND "quantidadeMensalidades" IS NULL AND "quantidadeParcelas" IS NULL AND "valorMensalidade" IS NULL));
