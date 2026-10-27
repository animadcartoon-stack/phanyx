-- Regras opcionais: cursos e matrículas existentes permanecem sem ativação.
ALTER TABLE "Curso" ADD COLUMN "regrasSelecaoDisciplinas" JSONB;
ALTER TABLE "Matricula" ADD COLUMN "regrasSelecaoDisciplinas" JSONB;
