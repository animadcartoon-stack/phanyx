-- A preparação da aula na ausência do titular permanece separada dos registros
-- individuais de desenvolvimento dos alunos e das aulas efetivamente ministradas.
CREATE TABLE "PlanoCoberturaDocente" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "professorTitularId" INTEGER NOT NULL,
  "turmaId" INTEGER NOT NULL,
  "disciplinaId" INTEGER NOT NULL,
  "substituicaoDocenteId" INTEGER,
  "dataAula" DATE NOT NULL,
  "titulo" VARCHAR(150) NOT NULL,
  "orientacoes" TEXT NOT NULL,
  "materiais" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ENVIADO',
  "devolutiva" TEXT,
  "aprovadoEm" TIMESTAMP(3),
  "aprovadoPorId" INTEGER,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "PlanoCoberturaDocente_substituicaoDocenteId_key" ON "PlanoCoberturaDocente"("substituicaoDocenteId");
CREATE UNIQUE INDEX "PlanoCoberturaDocente_professorTurmaDisciplinaData_key" ON "PlanoCoberturaDocente"("professorTitularId", "turmaId", "disciplinaId", "dataAula");
CREATE INDEX "PlanoCoberturaDocente_instituicaoId_status_idx" ON "PlanoCoberturaDocente"("instituicaoId", "status");
CREATE INDEX "PlanoCoberturaDocente_professorTitularId_dataAula_idx" ON "PlanoCoberturaDocente"("professorTitularId", "dataAula");
ALTER TABLE "PlanoCoberturaDocente" ADD CONSTRAINT "PlanoCoberturaDocente_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanoCoberturaDocente" ADD CONSTRAINT "PlanoCoberturaDocente_professorTitularId_fkey" FOREIGN KEY ("professorTitularId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanoCoberturaDocente" ADD CONSTRAINT "PlanoCoberturaDocente_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanoCoberturaDocente" ADD CONSTRAINT "PlanoCoberturaDocente_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanoCoberturaDocente" ADD CONSTRAINT "PlanoCoberturaDocente_substituicaoDocenteId_fkey" FOREIGN KEY ("substituicaoDocenteId") REFERENCES "SubstituicaoDocente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
