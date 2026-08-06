-- CreateEnum
CREATE TYPE "TipoMovimentacaoLotacaoRH" AS ENUM ('LOTACAO_INICIAL', 'TRANSFERENCIA', 'CORRECAO');

-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "poloId" INTEGER;

-- CreateTable
CREATE TABLE "FuncionarioLotacaoRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipo" "TipoMovimentacaoLotacaoRH" NOT NULL DEFAULT 'LOTACAO_INICIAL',
    "poloAnteriorId" INTEGER,
    "poloNovoId" INTEGER NOT NULL,
    "departamentoAnteriorId" INTEGER,
    "departamentoNovoId" INTEGER,
    "cargoAnteriorSnapshot" TEXT,
    "cargoNovoSnapshot" TEXT,
    "setorAnteriorSnapshot" TEXT,
    "setorNovoSnapshot" TEXT,
    "poloAnteriorNomeSnapshot" TEXT,
    "poloNovoNomeSnapshot" TEXT NOT NULL,
    "departamentoAnteriorNomeSnapshot" TEXT,
    "departamentoNovoNomeSnapshot" TEXT,
    "vigenciaEm" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "observacoes" TEXT,
    "realizadoPorId" INTEGER,
    "realizadoPorNomeSnapshot" TEXT NOT NULL,
    "realizadoPorRoleSnapshot" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuncionarioLotacaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_funcionarioId_idx" ON "FuncionarioLotacaoRH"("funcionarioId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_instituicaoId_idx" ON "FuncionarioLotacaoRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_poloAnteriorId_idx" ON "FuncionarioLotacaoRH"("poloAnteriorId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_poloNovoId_idx" ON "FuncionarioLotacaoRH"("poloNovoId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_departamentoAnteriorId_idx" ON "FuncionarioLotacaoRH"("departamentoAnteriorId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_departamentoNovoId_idx" ON "FuncionarioLotacaoRH"("departamentoNovoId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_realizadoPorId_idx" ON "FuncionarioLotacaoRH"("realizadoPorId");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_vigenciaEm_idx" ON "FuncionarioLotacaoRH"("vigenciaEm");

-- CreateIndex
CREATE INDEX "FuncionarioLotacaoRH_funcionarioId_vigenciaEm_idx" ON "FuncionarioLotacaoRH"("funcionarioId", "vigenciaEm");

-- CreateIndex
CREATE INDEX "Funcionario_poloId_idx" ON "Funcionario"("poloId");

-- CreateIndex
CREATE INDEX "Funcionario_instituicaoId_poloId_idx" ON "Funcionario"("instituicaoId", "poloId");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_poloAnteriorId_fkey" FOREIGN KEY ("poloAnteriorId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_poloNovoId_fkey" FOREIGN KEY ("poloNovoId") REFERENCES "Polo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_departamentoAnteriorId_fkey" FOREIGN KEY ("departamentoAnteriorId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_departamentoNovoId_fkey" FOREIGN KEY ("departamentoNovoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioLotacaoRH" ADD CONSTRAINT "FuncionarioLotacaoRH_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
