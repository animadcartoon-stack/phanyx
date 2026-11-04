CREATE TYPE "MobilidadePublicoOferta" AS ENUM ('ALUNOS', 'PROFESSORES', 'AMBOS');
ALTER TYPE "MobilidadeVinculoCandidato" ADD VALUE 'PROFESSOR_PHANYX';

ALTER TABLE "MobilidadeOferta"
ADD COLUMN "publico" "MobilidadePublicoOferta" NOT NULL DEFAULT 'ALUNOS',
ADD COLUMN "requisitosDocentes" TEXT;

ALTER TABLE "MobilidadeCandidatura" ADD COLUMN "professorId" INTEGER;
CREATE UNIQUE INDEX "MobilidadeCandidatura_ofertaId_professorId_key" ON "MobilidadeCandidatura"("ofertaId", "professorId");
CREATE INDEX "MobilidadeCandidatura_professorId_idx" ON "MobilidadeCandidatura"("professorId");
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_professorId_fkey"
FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
