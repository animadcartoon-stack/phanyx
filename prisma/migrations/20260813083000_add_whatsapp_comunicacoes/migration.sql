-- CreateEnum
CREATE TYPE "StatusWhatsAppMensagem" AS ENUM ('PENDENTE', 'PROCESSANDO', 'ENVIADA', 'ENTREGUE', 'LIDA', 'FALHOU', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoComunicacaoWhatsApp" AS ENUM ('REUNIAO_CRIADA', 'REUNIAO_ALTERADA', 'REUNIAO_CANCELADA', 'REUNIAO_LEMBRETE', 'OUVIDORIA_RESPONDIDA', 'MENSAGEM_ALUNO_PARA_PROFESSOR', 'MENSAGEM_PROFESSOR_PARA_ALUNO', 'ATIVIDADE_PUBLICADA', 'PROVA_PUBLICADA', 'DOCUMENTO_DISPONIVEL', 'AVISO_ACADEMICO', 'MENSALIDADE_VENCENDO', 'MENSALIDADE_VENCIDA', 'PAGAMENTO_CONFIRMADO', 'CORRECAO_PONTO_FUNCIONARIO', 'OUTRO');

-- CreateTable
CREATE TABLE "WhatsAppInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "conectado" BOOLEAN NOT NULL DEFAULT false,
    "numeroTelefone" TEXT,
    "numeroExibicao" TEXT,
    "nomeExibicao" TEXT,
    "phoneNumberId" TEXT,
    "whatsappBusinessId" TEXT,
    "metaBusinessId" TEXT,
    "tokenAcessoCriptografado" TEXT,
    "tokenExpiraEm" TIMESTAMP(3),
    "webhookAtivo" BOOLEAN NOT NULL DEFAULT false,
    "conectadoEm" TIMESTAMP(3),
    "desconectadoEm" TIMESTAMP(3),
    "ultimaSincronizacaoEm" TIMESTAMP(3),
    "ultimaFalhaEm" TIMESTAMP(3),
    "ultimaFalhaMensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "whatsappInstituicaoId" INTEGER,
    "nome" TEXT NOT NULL,
    "nomeMeta" TEXT,
    "tipoComunicacao" "TipoComunicacaoWhatsApp" NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'pt_BR',
    "categoriaMeta" TEXT,
    "statusMeta" TEXT,
    "titulo" TEXT,
    "corpo" TEXT NOT NULL,
    "rodape" TEXT,
    "aprovadoMeta" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConfiguracaoComunicacao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipoComunicacao" "TipoComunicacaoWhatsApp" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConfiguracaoComunicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMensagem" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "whatsappInstituicaoId" INTEGER,
    "templateId" INTEGER,
    "usuarioId" INTEGER,
    "tipoComunicacao" "TipoComunicacaoWhatsApp" NOT NULL,
    "status" "StatusWhatsAppMensagem" NOT NULL DEFAULT 'PENDENTE',
    "telefoneDestinatario" TEXT NOT NULL,
    "nomeDestinatario" TEXT,
    "mensagem" TEXT,
    "parametros" JSONB,
    "metaMessageId" TEXT,
    "tentativa" INTEGER NOT NULL DEFAULT 0,
    "erroCodigo" TEXT,
    "erroMensagem" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadaEm" TIMESTAMP(3),
    "enviadaEm" TIMESTAMP(3),
    "entregueEm" TIMESTAMP(3),
    "lidaEm" TIMESTAMP(3),
    "falhouEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMensagemEvento" (
    "id" SERIAL NOT NULL,
    "mensagemId" INTEGER NOT NULL,
    "status" "StatusWhatsAppMensagem" NOT NULL,
    "payload" JSONB,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMensagemEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppInstituicao_instituicaoId_key" ON "WhatsAppInstituicao"("instituicaoId");

-- CreateIndex
CREATE INDEX "WhatsAppInstituicao_ativo_idx" ON "WhatsAppInstituicao"("ativo");

-- CreateIndex
CREATE INDEX "WhatsAppInstituicao_conectado_idx" ON "WhatsAppInstituicao"("conectado");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_instituicaoId_idx" ON "WhatsAppTemplate"("instituicaoId");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_whatsappInstituicaoId_idx" ON "WhatsAppTemplate"("whatsappInstituicaoId");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_tipoComunicacao_idx" ON "WhatsAppTemplate"("tipoComunicacao");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_ativo_idx" ON "WhatsAppTemplate"("ativo");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_aprovadoMeta_idx" ON "WhatsAppTemplate"("aprovadoMeta");

-- CreateIndex
CREATE INDEX "WhatsAppConfiguracaoComunicacao_instituicaoId_idx" ON "WhatsAppConfiguracaoComunicacao"("instituicaoId");

-- CreateIndex
CREATE INDEX "WhatsAppConfiguracaoComunicacao_tipoComunicacao_idx" ON "WhatsAppConfiguracaoComunicacao"("tipoComunicacao");

-- CreateIndex
CREATE INDEX "WhatsAppConfiguracaoComunicacao_ativo_idx" ON "WhatsAppConfiguracaoComunicacao"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConfiguracaoComunicacao_instituicaoId_tipoComunicac_key" ON "WhatsAppConfiguracaoComunicacao"("instituicaoId", "tipoComunicacao");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMensagem_metaMessageId_key" ON "WhatsAppMensagem"("metaMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_instituicaoId_idx" ON "WhatsAppMensagem"("instituicaoId");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_whatsappInstituicaoId_idx" ON "WhatsAppMensagem"("whatsappInstituicaoId");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_templateId_idx" ON "WhatsAppMensagem"("templateId");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_usuarioId_idx" ON "WhatsAppMensagem"("usuarioId");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_tipoComunicacao_idx" ON "WhatsAppMensagem"("tipoComunicacao");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_status_idx" ON "WhatsAppMensagem"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMensagem_criadaEm_idx" ON "WhatsAppMensagem"("criadaEm");

-- CreateIndex
CREATE INDEX "WhatsAppMensagemEvento_mensagemId_idx" ON "WhatsAppMensagemEvento"("mensagemId");

-- CreateIndex
CREATE INDEX "WhatsAppMensagemEvento_status_idx" ON "WhatsAppMensagemEvento"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMensagemEvento_recebidoEm_idx" ON "WhatsAppMensagemEvento"("recebidoEm");

-- AddForeignKey
ALTER TABLE "WhatsAppInstituicao" ADD CONSTRAINT "WhatsAppInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_whatsappInstituicaoId_fkey" FOREIGN KEY ("whatsappInstituicaoId") REFERENCES "WhatsAppInstituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConfiguracaoComunicacao" ADD CONSTRAINT "WhatsAppConfiguracaoComunicacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMensagem" ADD CONSTRAINT "WhatsAppMensagem_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMensagem" ADD CONSTRAINT "WhatsAppMensagem_whatsappInstituicaoId_fkey" FOREIGN KEY ("whatsappInstituicaoId") REFERENCES "WhatsAppInstituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMensagem" ADD CONSTRAINT "WhatsAppMensagem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsAppTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMensagem" ADD CONSTRAINT "WhatsAppMensagem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMensagemEvento" ADD CONSTRAINT "WhatsAppMensagemEvento_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "WhatsAppMensagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

