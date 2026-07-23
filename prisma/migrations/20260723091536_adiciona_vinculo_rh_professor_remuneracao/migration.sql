-- CreateEnum
CREATE TYPE "TipoRemuneracaoRH" AS ENUM ('MENSAL', 'HORA_AULA', 'HORA_TRABALHADA', 'POR_AULA', 'POR_TURMA', 'POR_DISCIPLINA', 'MISTO', 'SEM_REMUNERACAO');

-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "cargaHorariaSemanal" DECIMAL(8,2),
ADD COLUMN     "duracaoHoraAulaMinutos" INTEGER,
ADD COLUMN     "observacoesRemuneracao" TEXT,
ADD COLUMN     "tipoRemuneracao" "TipoRemuneracaoRH",
ADD COLUMN     "valorHoraAula" DECIMAL(10,2),
ADD COLUMN     "valorHoraTrabalhada" DECIMAL(10,2),
ADD COLUMN     "valorPorAula" DECIMAL(10,2),
ADD COLUMN     "valorPorDisciplina" DECIMAL(10,2),
ADD COLUMN     "valorPorTurma" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "funcionarioId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Professor_funcionarioId_key" ON "Professor"("funcionarioId");

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
