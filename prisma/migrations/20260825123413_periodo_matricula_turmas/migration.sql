CREATE TABLE "PeriodoMatriculaTurma" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "periodoMatriculaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodoMatriculaTurma_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PeriodoMatriculaTurma_periodoMatriculaId_turmaId_key"
ON "PeriodoMatriculaTurma"("periodoMatriculaId", "turmaId");

CREATE INDEX "PeriodoMatriculaTurma_instituicaoId_idx"
ON "PeriodoMatriculaTurma"("instituicaoId");

CREATE INDEX "PeriodoMatriculaTurma_periodoMatriculaId_idx"
ON "PeriodoMatriculaTurma"("periodoMatriculaId");

CREATE INDEX "PeriodoMatriculaTurma_turmaId_idx"
ON "PeriodoMatriculaTurma"("turmaId");

ALTER TABLE "PeriodoMatriculaTurma"
ADD CONSTRAINT "PeriodoMatriculaTurma_instituicaoId_fkey"
FOREIGN KEY ("instituicaoId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "PeriodoMatriculaTurma"
ADD CONSTRAINT "PeriodoMatriculaTurma_periodoMatriculaId_fkey"
FOREIGN KEY ("periodoMatriculaId")
REFERENCES "PeriodoMatricula"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "PeriodoMatriculaTurma"
ADD CONSTRAINT "PeriodoMatriculaTurma_turmaId_fkey"
FOREIGN KEY ("turmaId")
REFERENCES "Turma"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
