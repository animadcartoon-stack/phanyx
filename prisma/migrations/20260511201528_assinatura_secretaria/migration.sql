/*
  Warnings:

  - You are about to drop the column `disciplinaId` on the `Turma` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matriculaId,turmaId,disciplinaId]` on the table `ItemMatricula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,nome,semestre]` on the table `Turma` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `disciplinaId` to the `ItemMatricula` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('PENDENTE', 'ASSINADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoDocumentoTemplate" AS ENUM ('CONTRATO', 'DECLARACAO', 'RECIBO', 'COMPROVANTE', 'TRANCAMENTO', 'COMPARECIMENTO', 'HISTORICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDocumentoGerado" AS ENUM ('RASCUNHO', 'GERADO', 'ASSINADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'CONTATO', 'NEGOCIACAO', 'PROPOSTA', 'FECHADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "LeadPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "TipoItemMatricula" AS ENUM ('GRADE_PRINCIPAL', 'EXTRA_MESMO_CURSO', 'EXTRA_OUTRO_CURSO');

-- CreateEnum
CREATE TYPE "TipoPeriodoMatricula" AS ENUM ('MATRICULA_INICIAL', 'REMATRICULA');

-- DropForeignKey
ALTER TABLE "Turma" DROP CONSTRAINT "Turma_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Turma" DROP CONSTRAINT "Turma_professorId_fkey";

-- DropIndex
DROP INDEX "ItemMatricula_matriculaId_turmaId_key";

-- DropIndex
DROP INDEX "Turma_disciplinaId_idx";

-- DropIndex
DROP INDEX "Turma_instituicaoId_nome_semestre_disciplinaId_key";

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "fotoPerfil" TEXT,
ADD COLUMN     "genero" TEXT,
ADD COLUMN     "nomeSocial" TEXT,
ADD COLUMN     "poloId" INTEGER;

-- AlterTable
ALTER TABLE "ConfiguracaoFinanceiraInstituicao" ADD COLUMN     "quantidadeMensalidadesParaBloqueio" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "ConfiguracaoInstituicao" ADD COLUMN     "estiloDocumento" TEXT DEFAULT 'INSTITUCIONAL',
ADD COLUMN     "estiloPapelTimbrado" TEXT DEFAULT 'SEM_COR',
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "papelTimbradoUrl" TEXT,
ADD COLUMN     "usarPapelTimbrado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "cargaHorariaMaximaSemestre" INTEGER;

-- AlterTable
ALTER TABLE "CursoSemestre" ADD COLUMN     "cargaMaxima" INTEGER,
ADD COLUMN     "cargaMinima" INTEGER;

-- AlterTable
ALTER TABLE "Disciplina" ADD COLUMN     "professorId" INTEGER;

-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "motivoStatus" TEXT,
ADD COLUMN     "statusFuncionario" TEXT NOT NULL DEFAULT 'ATIVO';

-- AlterTable
ALTER TABLE "Instituicao" ADD COLUMN     "certificadoAssinaturaUrl" TEXT,
ADD COLUMN     "certificadoCidade" TEXT,
ADD COLUMN     "certificadoCoordenadorNome" TEXT,
ADD COLUMN     "certificadoPreviewUrl" TEXT,
ADD COLUMN     "certificadoTemplateUrl" TEXT,
ADD COLUMN     "certificadoTextoPadrao" TEXT,
ADD COLUMN     "plano" TEXT NOT NULL DEFAULT 'ESSENCIAL';

-- AlterTable
ALTER TABLE "ItemMatricula" ADD COLUMN     "disciplinaId" INTEGER NOT NULL,
ADD COLUMN     "tipoItem" "TipoItemMatricula" NOT NULL DEFAULT 'GRADE_PRINCIPAL';

-- AlterTable
ALTER TABLE "LancamentoFinanceiro" ADD COLUMN     "poloId" INTEGER;

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "confirmadaEm" TIMESTAMP(3),
ADD COLUMN     "cursoSemestreId" INTEGER,
ADD COLUMN     "dataPrimeiroVencimento" TIMESTAMP(3),
ADD COLUMN     "periodoLetivo" TEXT,
ADD COLUMN     "periodoMatriculaId" INTEGER,
ADD COLUMN     "poloId" INTEGER,
ADD COLUMN     "primeiroVencimento" TIMESTAMP(3),
ADD COLUMN     "quantidadeMensalidades" INTEGER,
ADD COLUMN     "quantidadeParcelas" INTEGER,
ADD COLUMN     "realizadaPeloAluno" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "valorMatricula" DECIMAL(10,2),
ADD COLUMN     "valorMensalidade" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "poloId" INTEGER;

-- AlterTable
ALTER TABLE "ProgressoAula" ADD COLUMN     "tempoAssistidoSegundos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tempoMinimoSegundos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Turma" DROP COLUMN "disciplinaId",
ADD COLUMN     "cursoId" INTEGER,
ADD COLUMN     "dataFim" TIMESTAMP(3),
ADD COLUMN     "dataInicio" TIMESTAMP(3),
ADD COLUMN     "poloId" INTEGER,
ALTER COLUMN "professorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isMasterAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpira" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TurmaDisciplina" (
    "id" SERIAL NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "professorId" INTEGER,
    "instituicaoId" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "status" TEXT,
    "turmaSemestreId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAssinatura" TIMESTAMP(3),
    "ipAssinatura" TEXT,
    "userAgent" TEXT,
    "matriculaId" INTEGER,
    "tokenAssinatura" TEXT,
    "status" "StatusContrato" NOT NULL DEFAULT 'PENDENTE',
    "assinaturaSecretariaImagem" TEXT,
    "assinaturaSecretariaNome" TEXT,
    "assinaturaSecretariaUserId" INTEGER,
    "assinaturaSecretariaEm" TIMESTAMP(3),
    "assinaturaSecretariaIp" TEXT,
    "assinaturaSecretariaUserAgent" TEXT,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoTemplate" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoDocumentoTemplate" NOT NULL,
    "contexto" TEXT,
    "conteudo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "exigeAssinatura" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "DocumentoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoGerado" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoDocumentoTemplate" NOT NULL,
    "contexto" TEXT,
    "conteudo" TEXT NOT NULL,
    "status" "StatusDocumentoGerado" NOT NULL DEFAULT 'RASCUNHO',
    "exigeAssinatura" BOOLEAN NOT NULL DEFAULT false,
    "assinadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "matriculaId" INTEGER,
    "templateId" INTEGER,
    "cursoId" INTEGER,
    "codigoValidacao" TEXT,

    CONSTRAINT "DocumentoGerado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobranca" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "poloId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaValidacaoDocumento" (
    "id" SERIAL NOT NULL,
    "codigoConsultado" TEXT NOT NULL,
    "documentoId" INTEGER,
    "instituicaoId" INTEGER,
    "valido" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "suspeito" BOOLEAN NOT NULL DEFAULT false,
    "risco" INTEGER NOT NULL DEFAULT 0,
    "motivoRisco" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaValidacaoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueioIP" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "motivo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "bloqueadoAte" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloqueioIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMatriculaIbe" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "mensagem" TEXT,
    "curso" TEXT NOT NULL DEFAULT 'Bacharel Livre em Teologia',
    "origem" TEXT NOT NULL DEFAULT 'IBE_MATRICULA',
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadMatriculaIbe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "instituicaoNome" TEXT,
    "instituicaoId" INTEGER,
    "cargo" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'SITE_PHANYX',
    "tipo" TEXT NOT NULL DEFAULT 'PHANYX',
    "interesse" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "valorEstimado" DOUBLE PRECISION,
    "proximoContatoEm" TIMESTAMP(3),
    "ultimoContatoEm" TIMESTAMP(3),
    "responsavelNome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadInteracao" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadInteracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutPagamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pixCode" TEXT,
    "asaasId" TEXT,
    "asaasPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdesaoInstituicao" (
    "id" TEXT NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "nomeInstituicao" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cpfCnpj" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pixCode" TEXT,
    "asaasId" TEXT,
    "instituicaoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdesaoInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificadoCampo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "largura" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "fonte" TEXT,
    "tamanho" INTEGER,
    "cor" TEXT,
    "alinhamento" TEXT,
    "dadosJson" JSONB,
    "lineHeight" DOUBLE PRECISION,
    "marcador" TEXT,
    "pagina" INTEGER NOT NULL DEFAULT 1,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificadoCampo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaPreRequisito" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "prerequisitoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaPreRequisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoDisciplinaExtraPermitida" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CursoDisciplinaExtraPermitida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoMatricula" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoId" INTEGER,
    "periodoLetivo" TEXT NOT NULL,
    "semestreNumero" INTEGER,
    "titulo" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "permiteAluno" BOOLEAN NOT NULL DEFAULT true,
    "bloqueiaAlunoForaDoPrazo" BOOLEAN NOT NULL DEFAULT true,
    "tipo" "TipoPeriodoMatricula" NOT NULL DEFAULT 'REMATRICULA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodoMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Polo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "cnpj" TEXT,
    "descricao" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "Polo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoPolo" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "poloId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CursoPolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessorDisciplina" (
    "id" SERIAL NOT NULL,
    "professorId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessorDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaSemestre" (
    "id" SERIAL NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'A_INICIAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaSemestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatriculaOnlineIbe" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "cpf" TEXT,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "disciplinasIds" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "externalReference" TEXT NOT NULL,
    "asaasPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriculaOnlineIbe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TurmaDisciplina_turmaId_idx" ON "TurmaDisciplina"("turmaId");

-- CreateIndex
CREATE INDEX "TurmaDisciplina_disciplinaId_idx" ON "TurmaDisciplina"("disciplinaId");

-- CreateIndex
CREATE INDEX "TurmaDisciplina_professorId_idx" ON "TurmaDisciplina"("professorId");

-- CreateIndex
CREATE INDEX "TurmaDisciplina_instituicaoId_idx" ON "TurmaDisciplina"("instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaDisciplina_turmaId_disciplinaId_key" ON "TurmaDisciplina"("turmaId", "disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_tokenAssinatura_key" ON "Contrato"("tokenAssinatura");

-- CreateIndex
CREATE INDEX "Contrato_matriculaId_idx" ON "Contrato"("matriculaId");

-- CreateIndex
CREATE INDEX "Contrato_alunoId_idx" ON "Contrato"("alunoId");

-- CreateIndex
CREATE INDEX "Contrato_instituicaoId_idx" ON "Contrato"("instituicaoId");

-- CreateIndex
CREATE INDEX "Contrato_status_idx" ON "Contrato"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_contratoId_key" ON "Assinatura"("contratoId");

-- CreateIndex
CREATE INDEX "DocumentoTemplate_instituicaoId_idx" ON "DocumentoTemplate"("instituicaoId");

-- CreateIndex
CREATE INDEX "DocumentoTemplate_tipo_idx" ON "DocumentoTemplate"("tipo");

-- CreateIndex
CREATE INDEX "DocumentoTemplate_ativo_idx" ON "DocumentoTemplate"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoGerado_codigoValidacao_key" ON "DocumentoGerado"("codigoValidacao");

-- CreateIndex
CREATE INDEX "DocumentoGerado_instituicaoId_idx" ON "DocumentoGerado"("instituicaoId");

-- CreateIndex
CREATE INDEX "DocumentoGerado_alunoId_idx" ON "DocumentoGerado"("alunoId");

-- CreateIndex
CREATE INDEX "DocumentoGerado_matriculaId_idx" ON "DocumentoGerado"("matriculaId");

-- CreateIndex
CREATE INDEX "DocumentoGerado_templateId_idx" ON "DocumentoGerado"("templateId");

-- CreateIndex
CREATE INDEX "DocumentoGerado_tipo_idx" ON "DocumentoGerado"("tipo");

-- CreateIndex
CREATE INDEX "DocumentoGerado_status_idx" ON "DocumentoGerado"("status");

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_codigoConsultado_idx" ON "AuditoriaValidacaoDocumento"("codigoConsultado");

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_documentoId_idx" ON "AuditoriaValidacaoDocumento"("documentoId");

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_instituicaoId_idx" ON "AuditoriaValidacaoDocumento"("instituicaoId");

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_criadoEm_idx" ON "AuditoriaValidacaoDocumento"("criadoEm");

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_ip_idx" ON "AuditoriaValidacaoDocumento"("ip");

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_suspeito_idx" ON "AuditoriaValidacaoDocumento"("suspeito");

-- CreateIndex
CREATE INDEX "BloqueioIP_ip_idx" ON "BloqueioIP"("ip");

-- CreateIndex
CREATE INDEX "BloqueioIP_ativo_idx" ON "BloqueioIP"("ativo");

-- CreateIndex
CREATE INDEX "BloqueioIP_bloqueadoAte_idx" ON "BloqueioIP"("bloqueadoAte");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_origem_idx" ON "Lead"("origem");

-- CreateIndex
CREATE INDEX "Lead_tipo_idx" ON "Lead"("tipo");

-- CreateIndex
CREATE INDEX "Lead_instituicaoId_idx" ON "Lead"("instituicaoId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "LeadInteracao_leadId_idx" ON "LeadInteracao"("leadId");

-- CreateIndex
CREATE INDEX "LeadInteracao_createdAt_idx" ON "LeadInteracao"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutPagamento_asaasPaymentId_key" ON "CheckoutPagamento"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "CertificadoCampo_instituicaoId_idx" ON "CertificadoCampo"("instituicaoId");

-- CreateIndex
CREATE INDEX "CertificadoCampo_tipo_idx" ON "CertificadoCampo"("tipo");

-- CreateIndex
CREATE INDEX "DisciplinaPreRequisito_instituicaoId_idx" ON "DisciplinaPreRequisito"("instituicaoId");

-- CreateIndex
CREATE INDEX "DisciplinaPreRequisito_disciplinaId_idx" ON "DisciplinaPreRequisito"("disciplinaId");

-- CreateIndex
CREATE INDEX "DisciplinaPreRequisito_prerequisitoId_idx" ON "DisciplinaPreRequisito"("prerequisitoId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaPreRequisito_disciplinaId_prerequisitoId_key" ON "DisciplinaPreRequisito"("disciplinaId", "prerequisitoId");

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_instituicaoId_idx" ON "CursoDisciplinaExtraPermitida"("instituicaoId");

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_cursoId_idx" ON "CursoDisciplinaExtraPermitida"("cursoId");

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_disciplinaId_idx" ON "CursoDisciplinaExtraPermitida"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "CursoDisciplinaExtraPermitida_cursoId_disciplinaId_key" ON "CursoDisciplinaExtraPermitida"("cursoId", "disciplinaId");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_instituicaoId_idx" ON "PeriodoMatricula"("instituicaoId");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_cursoId_idx" ON "PeriodoMatricula"("cursoId");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_periodoLetivo_idx" ON "PeriodoMatricula"("periodoLetivo");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_ativo_idx" ON "PeriodoMatricula"("ativo");

-- CreateIndex
CREATE INDEX "PeriodoMatricula_dataInicio_dataFim_idx" ON "PeriodoMatricula"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "Polo_instituicaoId_idx" ON "Polo"("instituicaoId");

-- CreateIndex
CREATE INDEX "Polo_cnpj_idx" ON "Polo"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Polo_instituicaoId_nome_key" ON "Polo"("instituicaoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Polo_instituicaoId_codigo_key" ON "Polo"("instituicaoId", "codigo");

-- CreateIndex
CREATE INDEX "CursoPolo_instituicaoId_idx" ON "CursoPolo"("instituicaoId");

-- CreateIndex
CREATE INDEX "CursoPolo_cursoId_idx" ON "CursoPolo"("cursoId");

-- CreateIndex
CREATE INDEX "CursoPolo_poloId_idx" ON "CursoPolo"("poloId");

-- CreateIndex
CREATE UNIQUE INDEX "CursoPolo_cursoId_poloId_key" ON "CursoPolo"("cursoId", "poloId");

-- CreateIndex
CREATE INDEX "ProfessorDisciplina_professorId_idx" ON "ProfessorDisciplina"("professorId");

-- CreateIndex
CREATE INDEX "ProfessorDisciplina_disciplinaId_idx" ON "ProfessorDisciplina"("disciplinaId");

-- CreateIndex
CREATE INDEX "ProfessorDisciplina_instituicaoId_idx" ON "ProfessorDisciplina"("instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorDisciplina_professorId_disciplinaId_key" ON "ProfessorDisciplina"("professorId", "disciplinaId");

-- CreateIndex
CREATE INDEX "TurmaSemestre_turmaId_idx" ON "TurmaSemestre"("turmaId");

-- CreateIndex
CREATE INDEX "TurmaSemestre_instituicaoId_idx" ON "TurmaSemestre"("instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOnlineIbe_externalReference_key" ON "MatriculaOnlineIbe"("externalReference");

-- CreateIndex
CREATE INDEX "Aluno_poloId_idx" ON "Aluno"("poloId");

-- CreateIndex
CREATE INDEX "Disciplina_professorId_idx" ON "Disciplina"("professorId");

-- CreateIndex
CREATE INDEX "ItemMatricula_disciplinaId_idx" ON "ItemMatricula"("disciplinaId");

-- CreateIndex
CREATE INDEX "ItemMatricula_tipoItem_idx" ON "ItemMatricula"("tipoItem");

-- CreateIndex
CREATE UNIQUE INDEX "ItemMatricula_matriculaId_turmaId_disciplinaId_key" ON "ItemMatricula"("matriculaId", "turmaId", "disciplinaId");

-- CreateIndex
CREATE INDEX "Matricula_cursoSemestreId_idx" ON "Matricula"("cursoSemestreId");

-- CreateIndex
CREATE INDEX "Matricula_periodoMatriculaId_idx" ON "Matricula"("periodoMatriculaId");

-- CreateIndex
CREATE INDEX "Matricula_periodoLetivo_idx" ON "Matricula"("periodoLetivo");

-- CreateIndex
CREATE INDEX "Matricula_poloId_idx" ON "Matricula"("poloId");

-- CreateIndex
CREATE INDEX "Professor_poloId_idx" ON "Professor"("poloId");

-- CreateIndex
CREATE INDEX "Turma_poloId_idx" ON "Turma"("poloId");

-- CreateIndex
CREATE UNIQUE INDEX "Turma_instituicaoId_nome_semestre_key" ON "Turma"("instituicaoId", "nome", "semestre");

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_turmaSemestreId_fkey" FOREIGN KEY ("turmaSemestreId") REFERENCES "TurmaSemestre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_cursoSemestreId_fkey" FOREIGN KEY ("cursoSemestreId") REFERENCES "CursoSemestre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_periodoMatriculaId_fkey" FOREIGN KEY ("periodoMatriculaId") REFERENCES "PeriodoMatricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTemplate" ADD CONSTRAINT "DocumentoTemplate_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGerado" ADD CONSTRAINT "DocumentoGerado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGerado" ADD CONSTRAINT "DocumentoGerado_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGerado" ADD CONSTRAINT "DocumentoGerado_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGerado" ADD CONSTRAINT "DocumentoGerado_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGerado" ADD CONSTRAINT "DocumentoGerado_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaValidacaoDocumento" ADD CONSTRAINT "AuditoriaValidacaoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoGerado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadInteracao" ADD CONSTRAINT "LeadInteracao_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdesaoInstituicao" ADD CONSTRAINT "AdesaoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoCampo" ADD CONSTRAINT "CertificadoCampo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaPreRequisito" ADD CONSTRAINT "DisciplinaPreRequisito_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaPreRequisito" ADD CONSTRAINT "DisciplinaPreRequisito_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaPreRequisito" ADD CONSTRAINT "DisciplinaPreRequisito_prerequisitoId_fkey" FOREIGN KEY ("prerequisitoId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoMatricula" ADD CONSTRAINT "PeriodoMatricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoMatricula" ADD CONSTRAINT "PeriodoMatricula_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoPolo" ADD CONSTRAINT "CursoPolo_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoPolo" ADD CONSTRAINT "CursoPolo_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoPolo" ADD CONSTRAINT "CursoPolo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorDisciplina" ADD CONSTRAINT "ProfessorDisciplina_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorDisciplina" ADD CONSTRAINT "ProfessorDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorDisciplina" ADD CONSTRAINT "ProfessorDisciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSemestre" ADD CONSTRAINT "TurmaSemestre_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSemestre" ADD CONSTRAINT "TurmaSemestre_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
