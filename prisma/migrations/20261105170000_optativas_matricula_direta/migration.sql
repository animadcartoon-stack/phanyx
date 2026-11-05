-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "optativasAvulsasAtivas" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SessaoOptativaAvulsa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "professorId" INTEGER,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoOptativaAvulsa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaSessaoOptativaAvulsa" (
    "instituicaoId" INTEGER NOT NULL,
    "sessaoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,

    CONSTRAINT "TurmaSessaoOptativaAvulsa_pkey" PRIMARY KEY ("sessaoId","turmaId","instituicaoId")
);

-- CreateTable
CREATE TABLE "MatriculaOptativaAvulsa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaAvulsaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "sessaoId" INTEGER NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatriculaOptativaAvulsa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaOptativaAvulsa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaOptativaId" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "status" "StatusPresencaAula" NOT NULL,
    "observacao" TEXT,
    "atualizadaPorId" INTEGER NOT NULL,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresencaOptativaAvulsa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessaoOptativaAvulsa_instituicaoId_cursoId_ativa_idx" ON "SessaoOptativaAvulsa"("instituicaoId", "cursoId", "ativa");

-- CreateIndex
CREATE INDEX "SessaoOptativaAvulsa_instituicaoId_professorId_ativa_idx" ON "SessaoOptativaAvulsa"("instituicaoId", "professorId", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoOptativaAvulsa_id_instituicaoId_key" ON "SessaoOptativaAvulsa"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "TurmaSessaoOptativaAvulsa_instituicaoId_turmaId_idx" ON "TurmaSessaoOptativaAvulsa"("instituicaoId", "turmaId");

-- CreateIndex
CREATE INDEX "MatriculaOptativaAvulsa_instituicaoId_sessaoId_idx" ON "MatriculaOptativaAvulsa"("instituicaoId", "sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOptativaAvulsa_id_instituicaoId_key" ON "MatriculaOptativaAvulsa"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOptativaAvulsa_matriculaAvulsaId_sessaoId_key" ON "MatriculaOptativaAvulsa"("matriculaAvulsaId", "sessaoId");

-- CreateIndex
CREATE INDEX "PresencaOptativaAvulsa_instituicaoId_data_idx" ON "PresencaOptativaAvulsa"("instituicaoId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "PresencaOptativaAvulsa_matriculaOptativaId_data_key" ON "PresencaOptativaAvulsa"("matriculaOptativaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaTurmaAvulsa_id_turmaId_instituicaoId_key" ON "MatriculaTurmaAvulsa"("id", "turmaId", "instituicaoId");

-- AddForeignKey
ALTER TABLE "SessaoOptativaAvulsa" ADD CONSTRAINT "SessaoOptativaAvulsa_cursoId_instituicaoId_fkey" FOREIGN KEY ("cursoId", "instituicaoId") REFERENCES "Curso"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoOptativaAvulsa" ADD CONSTRAINT "SessaoOptativaAvulsa_disciplinaId_instituicaoId_fkey" FOREIGN KEY ("disciplinaId", "instituicaoId") REFERENCES "Disciplina"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoOptativaAvulsa" ADD CONSTRAINT "SessaoOptativaAvulsa_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSessaoOptativaAvulsa" ADD CONSTRAINT "TurmaSessaoOptativaAvulsa_sessaoId_instituicaoId_fkey" FOREIGN KEY ("sessaoId", "instituicaoId") REFERENCES "SessaoOptativaAvulsa"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSessaoOptativaAvulsa" ADD CONSTRAINT "TurmaSessaoOptativaAvulsa_turmaId_instituicaoId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaOptativaAvulsa" ADD CONSTRAINT "MatriculaOptativaAvulsa_matriculaAvulsaId_turmaId_institui_fkey" FOREIGN KEY ("matriculaAvulsaId", "turmaId", "instituicaoId") REFERENCES "MatriculaTurmaAvulsa"("id", "turmaId", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaOptativaAvulsa" ADD CONSTRAINT "MatriculaOptativaAvulsa_sessaoId_turmaId_instituicaoId_fkey" FOREIGN KEY ("sessaoId", "turmaId", "instituicaoId") REFERENCES "TurmaSessaoOptativaAvulsa"("sessaoId", "turmaId", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaOptativaAvulsa" ADD CONSTRAINT "PresencaOptativaAvulsa_matriculaOptativaId_instituicaoId_fkey" FOREIGN KEY ("matriculaOptativaId", "instituicaoId") REFERENCES "MatriculaOptativaAvulsa"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
