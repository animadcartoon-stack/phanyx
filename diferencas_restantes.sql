-- CreateEnum
CREATE TYPE "CategoriaEtapaFunilComercial" AS ENUM ('ENTRADA', 'PRIMEIRO_CONTATO', 'EM_ATENDIMENTO', 'QUALIFICACAO', 'APRESENTACAO', 'PROPOSTA', 'NEGOCIACAO', 'DOCUMENTACAO', 'PAGAMENTO', 'CONVERSAO', 'PERDA', 'PAUSA', 'DESCARTE');

-- CreateEnum
CREATE TYPE "ResultadoEtapaFunilComercial" AS ENUM ('ABERTA', 'GANHA', 'PERDIDA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "OrigemMovimentacaoFunilComercial" AS ENUM ('MANUAL', 'AUTOMATICA', 'CONVERSAO', 'REABERTURA', 'IMPORTACAO');

-- CreateEnum
CREATE TYPE "TipoTarefaComercial" AS ENUM ('LIGACAO', 'WHATSAPP', 'EMAIL', 'REUNIAO', 'RETORNO', 'ENVIAR_PROPOSTA', 'SOLICITAR_DOCUMENTOS', 'CONFIRMAR_PAGAMENTO', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusTarefaComercial" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadeTarefaComercial" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "CategoriaMotivoPerdaComercial" AS ENUM ('SEM_INTERESSE', 'PRECO', 'CONCORRENCIA', 'SEM_CONTATO', 'CURSO_INDISPONIVEL', 'HORARIO_INCOMPATIVEL', 'LOCALIZACAO', 'DOCUMENTACAO', 'FINANCEIRO', 'DESISTENCIA', 'DUPLICIDADE', 'FORA_DO_PERFIL', 'OUTRO');

-- CreateEnum
CREATE TYPE "OrigemTransferenciaLead" AS ENUM ('MANUAL', 'RODIZIO', 'REDISTRIBUICAO', 'AUSENCIA', 'CAPACIDADE', 'AUTOMATICA');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "arquivadoEm" TIMESTAMP(3),
ADD COLUMN     "arquivadoPorId" INTEGER,
ADD COLUMN     "cursoInteresseId" INTEGER,
ADD COLUMN     "encerradoEm" TIMESTAMP(3),
ADD COLUMN     "entrouEtapaEm" TIMESTAMP(3),
ADD COLUMN     "equipeResponsavelId" INTEGER,
ADD COLUMN     "etapaFunilId" INTEGER,
ADD COLUMN     "funilId" INTEGER,
ADD COLUMN     "motivoPerdaId" INTEGER,
ADD COLUMN     "motivoPerdaObservacao" TEXT,
ADD COLUMN     "perdidoEm" TIMESTAMP(3),
ADD COLUMN     "perdidoPorId" INTEGER,
ADD COLUMN     "poloInteresseId" INTEGER,
ADD COLUMN     "primeiroContatoEm" TIMESTAMP(3),
ADD COLUMN     "qualificadoEm" TIMESTAMP(3),
ADD COLUMN     "restauradoEm" TIMESTAMP(3),
ADD COLUMN     "restauradoPorId" INTEGER;

-- CreateTable
CREATE TABLE "FunilComercial" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "arquivadoPorId" INTEGER,
    "restauradoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivadoEm" TIMESTAMP(3),
    "restauradoEm" TIMESTAMP(3),

    CONSTRAINT "FunilComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaFunilComercial" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funilId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "arquivadoPorId" INTEGER,
    "restauradoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaEtapaFunilComercial" NOT NULL,
    "resultado" "ResultadoEtapaFunilComercial" NOT NULL DEFAULT 'ABERTA',
    "ordem" INTEGER NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#64748B',
    "probabilidadeConversao" INTEGER NOT NULL DEFAULT 0,
    "prazoMaximoHoras" INTEGER,
    "exigeProximaAcao" BOOLEAN NOT NULL DEFAULT false,
    "exigeMotivoPerda" BOOLEAN NOT NULL DEFAULT false,
    "permiteMovimentoManual" BOOLEAN NOT NULL DEFAULT true,
    "visivelNoKanban" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivadoEm" TIMESTAMP(3),
    "restauradoEm" TIMESTAMP(3),

    CONSTRAINT "EtapaFunilComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivoPerdaComercial" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "arquivadoPorId" INTEGER,
    "restauradoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaMotivoPerdaComercial" NOT NULL,
    "exigeObservacao" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivadoEm" TIMESTAMP(3),
    "restauradoEm" TIMESTAMP(3),

    CONSTRAINT "MotivoPerdaComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunilComercial_instituicaoId_idx" ON "FunilComercial"("instituicaoId");

-- CreateIndex
CREATE INDEX "FunilComercial_instituicaoId_ativo_idx" ON "FunilComercial"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "FunilComercial_instituicaoId_padrao_idx" ON "FunilComercial"("instituicaoId", "padrao");

-- CreateIndex
CREATE INDEX "FunilComercial_criadoPorId_idx" ON "FunilComercial"("criadoPorId");

-- CreateIndex
CREATE INDEX "FunilComercial_atualizadoPorId_idx" ON "FunilComercial"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "FunilComercial_arquivadoPorId_idx" ON "FunilComercial"("arquivadoPorId");

-- CreateIndex
CREATE INDEX "FunilComercial_restauradoPorId_idx" ON "FunilComercial"("restauradoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "FunilComercial_instituicaoId_nome_key" ON "FunilComercial"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_instituicaoId_idx" ON "EtapaFunilComercial"("instituicaoId");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_instituicaoId_ativo_idx" ON "EtapaFunilComercial"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_funilId_idx" ON "EtapaFunilComercial"("funilId");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_funilId_ativo_ordem_idx" ON "EtapaFunilComercial"("funilId", "ativo", "ordem");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_categoria_idx" ON "EtapaFunilComercial"("categoria");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_resultado_idx" ON "EtapaFunilComercial"("resultado");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_criadoPorId_idx" ON "EtapaFunilComercial"("criadoPorId");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_atualizadoPorId_idx" ON "EtapaFunilComercial"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_arquivadoPorId_idx" ON "EtapaFunilComercial"("arquivadoPorId");

-- CreateIndex
CREATE INDEX "EtapaFunilComercial_restauradoPorId_idx" ON "EtapaFunilComercial"("restauradoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaFunilComercial_funilId_nome_key" ON "EtapaFunilComercial"("funilId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaFunilComercial_funilId_ordem_key" ON "EtapaFunilComercial"("funilId", "ordem");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_instituicaoId_idx" ON "MotivoPerdaComercial"("instituicaoId");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_instituicaoId_ativo_idx" ON "MotivoPerdaComercial"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_instituicaoId_categoria_idx" ON "MotivoPerdaComercial"("instituicaoId", "categoria");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_ordem_idx" ON "MotivoPerdaComercial"("ordem");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_criadoPorId_idx" ON "MotivoPerdaComercial"("criadoPorId");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_atualizadoPorId_idx" ON "MotivoPerdaComercial"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_arquivadoPorId_idx" ON "MotivoPerdaComercial"("arquivadoPorId");

-- CreateIndex
CREATE INDEX "MotivoPerdaComercial_restauradoPorId_idx" ON "MotivoPerdaComercial"("restauradoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "MotivoPerdaComercial_instituicaoId_nome_key" ON "MotivoPerdaComercial"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "Lead_instituicaoGestoraId_equipeResponsavelId_idx" ON "Lead"("instituicaoGestoraId", "equipeResponsavelId");

-- CreateIndex
CREATE INDEX "Lead_instituicaoGestoraId_funilId_idx" ON "Lead"("instituicaoGestoraId", "funilId");

-- CreateIndex
CREATE INDEX "Lead_instituicaoGestoraId_etapaFunilId_idx" ON "Lead"("instituicaoGestoraId", "etapaFunilId");

-- CreateIndex
CREATE INDEX "Lead_instituicaoGestoraId_cursoInteresseId_idx" ON "Lead"("instituicaoGestoraId", "cursoInteresseId");

-- CreateIndex
CREATE INDEX "Lead_instituicaoGestoraId_poloInteresseId_idx" ON "Lead"("instituicaoGestoraId", "poloInteresseId");

-- CreateIndex
CREATE INDEX "Lead_instituicaoGestoraId_etapaFunilId_responsavelFuncionar_idx" ON "Lead"("instituicaoGestoraId", "etapaFunilId", "responsavelFuncionarioId");

-- CreateIndex
CREATE INDEX "Lead_equipeResponsavelId_idx" ON "Lead"("equipeResponsavelId");

-- CreateIndex
CREATE INDEX "Lead_funilId_idx" ON "Lead"("funilId");

-- CreateIndex
CREATE INDEX "Lead_etapaFunilId_idx" ON "Lead"("etapaFunilId");

-- CreateIndex
CREATE INDEX "Lead_motivoPerdaId_idx" ON "Lead"("motivoPerdaId");

-- CreateIndex
CREATE INDEX "Lead_cursoInteresseId_idx" ON "Lead"("cursoInteresseId");

-- CreateIndex
CREATE INDEX "Lead_poloInteresseId_idx" ON "Lead"("poloInteresseId");

-- CreateIndex
CREATE INDEX "Lead_perdidoPorId_idx" ON "Lead"("perdidoPorId");

-- CreateIndex
CREATE INDEX "Lead_arquivadoPorId_idx" ON "Lead"("arquivadoPorId");

-- CreateIndex
CREATE INDEX "Lead_restauradoPorId_idx" ON "Lead"("restauradoPorId");

-- CreateIndex
CREATE INDEX "Lead_proximoContatoEm_idx" ON "Lead"("proximoContatoEm");

-- CreateIndex
CREATE INDEX "Lead_entrouEtapaEm_idx" ON "Lead"("entrouEtapaEm");

-- CreateIndex
CREATE INDEX "Lead_perdidoEm_idx" ON "Lead"("perdidoEm");

-- CreateIndex
CREATE INDEX "Lead_arquivadoEm_idx" ON "Lead"("arquivadoEm");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_equipeResponsavelId_fkey" FOREIGN KEY ("equipeResponsavelId") REFERENCES "EquipeComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_funilId_fkey" FOREIGN KEY ("funilId") REFERENCES "FunilComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_etapaFunilId_fkey" FOREIGN KEY ("etapaFunilId") REFERENCES "EtapaFunilComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_motivoPerdaId_fkey" FOREIGN KEY ("motivoPerdaId") REFERENCES "MotivoPerdaComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_cursoInteresseId_fkey" FOREIGN KEY ("cursoInteresseId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_poloInteresseId_fkey" FOREIGN KEY ("poloInteresseId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_perdidoPorId_fkey" FOREIGN KEY ("perdidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunilComercial" ADD CONSTRAINT "FunilComercial_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunilComercial" ADD CONSTRAINT "FunilComercial_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunilComercial" ADD CONSTRAINT "FunilComercial_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunilComercial" ADD CONSTRAINT "FunilComercial_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunilComercial" ADD CONSTRAINT "FunilComercial_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaFunilComercial" ADD CONSTRAINT "EtapaFunilComercial_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaFunilComercial" ADD CONSTRAINT "EtapaFunilComercial_funilId_fkey" FOREIGN KEY ("funilId") REFERENCES "FunilComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaFunilComercial" ADD CONSTRAINT "EtapaFunilComercial_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaFunilComercial" ADD CONSTRAINT "EtapaFunilComercial_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaFunilComercial" ADD CONSTRAINT "EtapaFunilComercial_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaFunilComercial" ADD CONSTRAINT "EtapaFunilComercial_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoPerdaComercial" ADD CONSTRAINT "MotivoPerdaComercial_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoPerdaComercial" ADD CONSTRAINT "MotivoPerdaComercial_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoPerdaComercial" ADD CONSTRAINT "MotivoPerdaComercial_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoPerdaComercial" ADD CONSTRAINT "MotivoPerdaComercial_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoPerdaComercial" ADD CONSTRAINT "MotivoPerdaComercial_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
