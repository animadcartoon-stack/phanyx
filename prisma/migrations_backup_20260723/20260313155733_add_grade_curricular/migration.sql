-- CreateTable
CREATE TABLE "GradeCurricular" (
    "id" SERIAL NOT NULL,
    "semestre" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,

    CONSTRAINT "GradeCurricular_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeCurricular_instituicaoId_idx" ON "GradeCurricular"("instituicaoId");

-- CreateIndex
CREATE INDEX "GradeCurricular_cursoId_idx" ON "GradeCurricular"("cursoId");

-- CreateIndex
CREATE INDEX "GradeCurricular_disciplinaId_idx" ON "GradeCurricular"("disciplinaId");

-- CreateIndex
CREATE INDEX "GradeCurricular_semestre_idx" ON "GradeCurricular"("semestre");

-- CreateIndex
CREATE UNIQUE INDEX "GradeCurricular_cursoId_disciplinaId_semestre_key" ON "GradeCurricular"("cursoId", "disciplinaId", "semestre");

-- AddForeignKey
ALTER TABLE "GradeCurricular" ADD CONSTRAINT "GradeCurricular_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeCurricular" ADD CONSTRAINT "GradeCurricular_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeCurricular" ADD CONSTRAINT "GradeCurricular_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
