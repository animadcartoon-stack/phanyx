-- Etapa 1. Somente estrutura ADITIVA; nao marca cursos existentes automaticamente.
ALTER TABLE "Curso" ADD COLUMN "matriculaDiretaTurma" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "TurmaHorarioAvulso" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TurmaHorarioAvulso_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TurmaHorarioAvulso_diaSemana_check" CHECK ("diaSemana" BETWEEN 0 AND 6),
    CONSTRAINT "TurmaHorarioAvulso_horario_check" CHECK ("horaInicio" < "horaFim")
);
CREATE UNIQUE INDEX "TurmaHorarioAvulso_turmaId_diaSemana_horaInicio_horaFim_key" ON "TurmaHorarioAvulso"("turmaId", "diaSemana", "horaInicio", "horaFim");
CREATE INDEX "TurmaHorarioAvulso_instituicaoId_diaSemana_idx" ON "TurmaHorarioAvulso"("instituicaoId", "diaSemana");
CREATE INDEX "TurmaHorarioAvulso_turmaId_ativo_idx" ON "TurmaHorarioAvulso"("turmaId", "ativo");
ALTER TABLE "TurmaHorarioAvulso" ADD CONSTRAINT "TurmaHorarioAvulso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TurmaHorarioAvulso" ADD CONSTRAINT "TurmaHorarioAvulso_turmaId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MatriculaTurmaAvulsa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "status" "StatusItemMatricula" NOT NULL DEFAULT 'A_CURSAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatriculaTurmaAvulsa_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MatriculaTurmaAvulsa_matriculaId_cursoId_key" ON "MatriculaTurmaAvulsa"("matriculaId", "cursoId");
CREATE UNIQUE INDEX "MatriculaTurmaAvulsa_matriculaId_turmaId_key" ON "MatriculaTurmaAvulsa"("matriculaId", "turmaId");
CREATE INDEX "MatriculaTurmaAvulsa_instituicaoId_turmaId_status_idx" ON "MatriculaTurmaAvulsa"("instituicaoId", "turmaId", "status");
CREATE INDEX "MatriculaTurmaAvulsa_instituicaoId_cursoId_idx" ON "MatriculaTurmaAvulsa"("instituicaoId", "cursoId");
ALTER TABLE "MatriculaTurmaAvulsa" ADD CONSTRAINT "MatriculaTurmaAvulsa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatriculaTurmaAvulsa" ADD CONSTRAINT "MatriculaTurmaAvulsa_matriculaId_fkey" FOREIGN KEY ("matriculaId", "instituicaoId") REFERENCES "Matricula"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatriculaTurmaAvulsa" ADD CONSTRAINT "MatriculaTurmaAvulsa_turmaId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatriculaTurmaAvulsa" ADD CONSTRAINT "MatriculaTurmaAvulsa_cursoId_fkey" FOREIGN KEY ("cursoId", "instituicaoId") REFERENCES "Curso"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;
