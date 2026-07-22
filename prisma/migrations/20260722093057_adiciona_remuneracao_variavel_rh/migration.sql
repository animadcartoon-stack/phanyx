-- CreateEnum
CREATE TYPE "TipoRemuneracaoVariavelRH" AS ENUM ('BONUS', 'PREMIO', 'PARTICIPACAO_RESULTADOS', 'PARTICIPACAO_LUCROS', 'OUTRO');

-- CreateEnum
CREATE TYPE "AbrangenciaRemuneracaoVariavelRH" AS ENUM ('TODOS_FUNCIONARIOS', 'DEPARTAMENTO', 'FUNCIONARIOS_SELECIONADOS');

-- CreateEnum
CREATE TYPE "MetodoDistribuicaoRemuneracaoVariavelRH" AS ENUM ('VALOR_FIXO_INDIVIDUAL', 'IGUALITARIO', 'PROPORCIONAL_SALARIO', 'PROPORCIONAL_TEMPO_TRABALHADO', 'PERCENTUAL_INDIVIDUAL', 'PONTUACAO', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusProgramaRemuneracaoVariavelRH" AS ENUM ('RASCUNHO', 'ATIVO', 'EM_APURACAO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusLancamentoRemuneracaoVariavelRH" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO', 'ENVIADO_HOLERITE', 'PAGO', 'ESTORNADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "ProgramaRemuneracaoVariavelRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "departamentoId" INTEGER,
    "criadoPorId" INTEGER,
    "aprovadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoRemuneracaoVariavelRH" NOT NULL,
    "abrangencia" "AbrangenciaRemuneracaoVariavelRH" NOT NULL DEFAULT 'FUNCIONARIOS_SELECIONADOS',
    "metodoDistribuicao" "MetodoDistribuicaoRemuneracaoVariavelRH" NOT NULL DEFAULT 'MANUAL',
    "competenciaMes" INTEGER,
    "competenciaAno" INTEGER,
    "periodoInicio" TIMESTAMP(3),
    "periodoFim" TIMESTAMP(3),
    "percentualFundo" DECIMAL(7,4),
    "valorFundo" DECIMAL(12,2),
    "valorMinimoIndividual" DECIMAL(12,2),
    "valorMaximoIndividual" DECIMAL(12,2),
    "considerarSalarioBase" BOOLEAN NOT NULL DEFAULT false,
    "considerarTempoTrabalhado" BOOLEAN NOT NULL DEFAULT false,
    "exigirFuncionarioAtivo" BOOLEAN NOT NULL DEFAULT true,
    "excluirEmExperiencia" BOOLEAN NOT NULL DEFAULT false,
    "diasMinimosAdmissao" INTEGER,
    "permitirAjusteManual" BOOLEAN NOT NULL DEFAULT true,
    "criteriosElegibilidade" JSONB,
    "regrasCalculo" JSONB,
    "observacoes" TEXT,
    "status" "StatusProgramaRemuneracaoVariavelRH" NOT NULL DEFAULT 'RASCUNHO',
    "aprovadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramaRemuneracaoVariavelRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteProgramaRemuneracaoVariavelRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "incluidoPorId" INTEGER,
    "elegivel" BOOLEAN NOT NULL DEFAULT true,
    "peso" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "percentualIndividual" DECIMAL(7,4),
    "valorFixoIndividual" DECIMAL(12,2),
    "salarioBaseSnapshot" DECIMAL(12,2),
    "dataAdmissaoSnapshot" TIMESTAMP(3),
    "diasConsiderados" INTEGER,
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "funcionarioCargoSnapshot" TEXT,
    "funcionarioDepartamentoSnapshot" TEXT,
    "motivoExclusao" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoRemuneracaoVariavelRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "participanteId" INTEGER,
    "holeriteEventoId" INTEGER,
    "criadoPorId" INTEGER,
    "aprovadoPorId" INTEGER,
    "reprovadoPorId" INTEGER,
    "estornadoPorId" INTEGER,
    "chaveLancamento" TEXT NOT NULL,
    "status" "StatusLancamentoRemuneracaoVariavelRH" NOT NULL DEFAULT 'PENDENTE',
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "baseCalculo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percentualAplicado" DECIMAL(7,4),
    "pesoAplicado" DECIMAL(10,4),
    "valorCalculado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorAprovado" DECIMAL(12,2),
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "funcionarioCargoSnapshot" TEXT,
    "funcionarioDepartamentoSnapshot" TEXT,
    "programaNomeSnapshot" TEXT NOT NULL,
    "tipoRemuneracaoSnapshot" "TipoRemuneracaoVariavelRH" NOT NULL,
    "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprovadoEm" TIMESTAMP(3),
    "reprovadoEm" TIMESTAMP(3),
    "enviadoHoleriteEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "estornadoEm" TIMESTAMP(3),
    "motivoAjuste" TEXT,
    "motivoReprovacao" TEXT,
    "motivoEstorno" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LancamentoRemuneracaoVariavelRH_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_instituicaoId_idx" ON "ProgramaRemuneracaoVariavelRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_departamentoId_idx" ON "ProgramaRemuneracaoVariavelRH"("departamentoId");

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_tipo_idx" ON "ProgramaRemuneracaoVariavelRH"("tipo");

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_abrangencia_idx" ON "ProgramaRemuneracaoVariavelRH"("abrangencia");

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_status_idx" ON "ProgramaRemuneracaoVariavelRH"("status");

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_competenciaMes_competenciaAno_idx" ON "ProgramaRemuneracaoVariavelRH"("competenciaMes", "competenciaAno");

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_periodoInicio_periodoFim_idx" ON "ProgramaRemuneracaoVariavelRH"("periodoInicio", "periodoFim");

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_instituicaoId_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_programaId_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("programaId");

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_funcionarioId_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("funcionarioId");

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_elegivel_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("elegivel");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_programaId_funcio_key" ON "ParticipanteProgramaRemuneracaoVariavelRH"("programaId", "funcionarioId");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_instituicaoId_idx" ON "LancamentoRemuneracaoVariavelRH"("instituicaoId");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_programaId_idx" ON "LancamentoRemuneracaoVariavelRH"("programaId");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_funcionarioId_idx" ON "LancamentoRemuneracaoVariavelRH"("funcionarioId");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_participanteId_idx" ON "LancamentoRemuneracaoVariavelRH"("participanteId");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_holeriteEventoId_idx" ON "LancamentoRemuneracaoVariavelRH"("holeriteEventoId");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_status_idx" ON "LancamentoRemuneracaoVariavelRH"("status");

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_competenciaMes_competenciaA_idx" ON "LancamentoRemuneracaoVariavelRH"("competenciaMes", "competenciaAno");

-- CreateIndex
CREATE UNIQUE INDEX "LancamentoRemuneracaoVariavelRH_instituicaoId_chaveLancamen_key" ON "LancamentoRemuneracaoVariavelRH"("instituicaoId", "chaveLancamento");

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "ProgramaRemuneracaoVariavelRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_incluidoPorId_fkey" FOREIGN KEY ("incluidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "ProgramaRemuneracaoVariavelRH"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteProgramaRemuneracaoVariavelRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_holeriteEventoId_fkey" FOREIGN KEY ("holeriteEventoId") REFERENCES "HoleriteEventoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_reprovadoPorId_fkey" FOREIGN KEY ("reprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_estornadoPorId_fkey" FOREIGN KEY ("estornadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
