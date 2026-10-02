CREATE TYPE "TipoContratacaoMatricula" AS ENUM ('CURSO_COMPLETO', 'PARCIAL');

ALTER TABLE "Matricula"
ADD COLUMN "tipoContratacao" "TipoContratacaoMatricula";

CREATE TABLE "MatriculaDisciplinaContratada" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "cursoSemestreIdSnapshot" INTEGER,
    "semestreNumeroSnapshot" INTEGER,
    "semestreTituloSnapshot" TEXT,
    "disciplinaNomeSnapshot" TEXT NOT NULL,
    "cargaHorariaSnapshot" INTEGER,
    "ordemSnapshot" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriculaDisciplinaContratada_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"MatriculaDisciplinaContratada_matriculaId_disciplinaId_key"
ON "MatriculaDisciplinaContratada"("matriculaId", "disciplinaId");

CREATE INDEX
"MatriculaDisciplinaContratada_instituicaoId_idx"
ON "MatriculaDisciplinaContratada"("instituicaoId");

CREATE INDEX
"MatriculaDisciplinaContratada_matriculaId_idx"
ON "MatriculaDisciplinaContratada"("matriculaId");

CREATE INDEX
"MatriculaDisciplinaContratada_disciplinaId_idx"
ON "MatriculaDisciplinaContratada"("disciplinaId");

CREATE INDEX
"MatriculaDisciplinaContratada_cursoSemestreIdSnapshot_idx"
ON "MatriculaDisciplinaContratada"("cursoSemestreIdSnapshot");

ALTER TABLE "MatriculaDisciplinaContratada"
ADD CONSTRAINT "MatriculaDisciplinaContratada_matriculaId_fkey"
FOREIGN KEY ("matriculaId")
REFERENCES "Matricula"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;