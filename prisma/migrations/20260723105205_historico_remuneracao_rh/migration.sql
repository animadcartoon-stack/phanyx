-- CreateTable
CREATE TABLE "HistoricoRemuneracaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER,
    "professorId" INTEGER,
    "alteradoPorId" INTEGER,
    "origem" TEXT NOT NULL DEFAULT 'PROFESSORES_RH',
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "professorNomeSnapshot" TEXT,
    "alteradoPorNomeSnapshot" TEXT NOT NULL,
    "alteradoPorRoleSnapshot" TEXT,
    "tipoAnterior" "TipoRemuneracaoRH",
    "tipoNovo" "TipoRemuneracaoRH" NOT NULL,
    "dadosAnteriores" JSONB NOT NULL,
    "dadosNovos" JSONB NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoRemuneracaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_instituicaoId_idx" ON "HistoricoRemuneracaoRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_funcionarioId_idx" ON "HistoricoRemuneracaoRH"("funcionarioId");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_professorId_idx" ON "HistoricoRemuneracaoRH"("professorId");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_alteradoPorId_idx" ON "HistoricoRemuneracaoRH"("alteradoPorId");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_vigenciaInicio_idx" ON "HistoricoRemuneracaoRH"("vigenciaInicio");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_alteradoEm_idx" ON "HistoricoRemuneracaoRH"("alteradoEm");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_instituicaoId_alteradoEm_idx" ON "HistoricoRemuneracaoRH"("instituicaoId", "alteradoEm");

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_funcionarioId_alteradoEm_idx" ON "HistoricoRemuneracaoRH"("funcionarioId", "alteradoEm");

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_alteradoPorId_fkey" FOREIGN KEY ("alteradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
