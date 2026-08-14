-- CreateEnum
CREATE TYPE "TipoCanalCaptacaoLead" AS ENUM ('SITE', 'LANDING_PAGE', 'FORMULARIO', 'META_ADS', 'GOOGLE_ADS', 'WHATSAPP', 'INDICACAO', 'EVENTO', 'PARCERIA', 'IMPORTACAO', 'API', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusCampanhaCaptacaoLead" AS ENUM ('RASCUNHO', 'AGENDADA', 'ATIVA', 'PAUSADA', 'ENCERRADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "StatusFormularioCaptacaoLead" AS ENUM ('RASCUNHO', 'PUBLICADO', 'PAUSADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoCampoFormularioCaptacaoLead" AS ENUM ('TEXTO_CURTO', 'TEXTO_LONGO', 'EMAIL', 'TELEFONE', 'NUMERO', 'DATA', 'SELECAO_UNICA', 'SELECAO_MULTIPLA', 'CHECKBOX', 'CONSENTIMENTO', 'OCULTO');

-- CreateEnum
CREATE TYPE "MapeamentoCampoFormularioCaptacaoLead" AS ENUM ('NOME', 'EMAIL', 'TELEFONE', 'INSTITUICAO_NOME', 'CARGO', 'INTERESSE', 'OBSERVACOES', 'CURSO_INTERESSE_ID', 'POLO_INTERESSE_ID', 'CONSENTIMENTO', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "EstrategiaDistribuicaoLead" AS ENUM ('RODIZIO', 'MENOR_CARGA', 'ALEATORIA', 'RESPONSAVEL_FIXO', 'EQUIPE_SEM_RESPONSAVEL', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoIntegracaoCaptacaoLead" AS ENUM ('WEBHOOK_ENTRADA', 'WEBHOOK_SAIDA', 'META_LEAD_ADS', 'GOOGLE_LEAD_FORM', 'API', 'IMPORTACAO', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusIntegracaoCaptacaoLead" AS ENUM ('INATIVA', 'ATIVA', 'PAUSADA', 'ERRO', 'REVOGADA');

-- CreateEnum
CREATE TYPE "StatusSubmissaoCaptacaoLead" AS ENUM ('RECEBIDA', 'VALIDANDO', 'PROCESSANDO', 'PROCESSADA', 'DUPLICADA', 'REJEITADA', 'SPAM', 'ERRO');

-- CreateEnum
CREATE TYPE "ResultadoDeduplicacaoCaptacaoLead" AS ENUM ('NAO_VERIFICADA', 'NOVO_LEAD', 'LEAD_EXISTENTE_ATUALIZADO', 'DUPLICADA_IGNORADA', 'REVISAO_MANUAL');

-- CreateEnum
CREATE TYPE "DirecaoEventoIntegracaoCaptacaoLead" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "StatusEventoIntegracaoCaptacaoLead" AS ENUM ('RECEBIDO', 'PENDENTE', 'PROCESSANDO', 'PROCESSADO', 'ENTREGUE', 'ERRO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "CanalCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoCanalCaptacaoLead" NOT NULL,
    "cor" TEXT DEFAULT '#64748B',
    "icone" TEXT,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanalCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampanhaCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "canalId" INTEGER,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusCampanhaCaptacaoLead" NOT NULL DEFAULT 'RASCUNHO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "orcamento" DECIMAL(14,2),
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "urlDestino" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampanhaCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormularioCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "canalId" INTEGER,
    "campanhaId" INTEGER,
    "funilPadraoId" INTEGER,
    "etapaPadraoId" INTEGER,
    "equipePadraoId" INTEGER,
    "responsavelPadraoId" INTEGER,
    "cursoPadraoId" INTEGER,
    "poloPadraoId" INTEGER,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tokenPublico" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "mensagemSucesso" TEXT,
    "urlRedirecionamento" TEXT,
    "status" "StatusFormularioCaptacaoLead" NOT NULL DEFAULT 'RASCUNHO',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "publico" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "exigeConsentimento" BOOLEAN NOT NULL DEFAULT true,
    "textoConsentimento" TEXT,
    "versaoConsentimento" TEXT,
    "politicaPrivacidadeUrl" TEXT,
    "bloquearDuplicados" BOOLEAN NOT NULL DEFAULT true,
    "atualizarLeadExistente" BOOLEAN NOT NULL DEFAULT true,
    "criarTarefaPrimeiroContato" BOOLEAN NOT NULL DEFAULT true,
    "tipoTarefaInicial" "TipoTarefaComercial" NOT NULL DEFAULT 'RETORNO',
    "prazoPrimeiroContatoMinutos" INTEGER NOT NULL DEFAULT 15,
    "recaptchaAtivo" BOOLEAN NOT NULL DEFAULT false,
    "honeypotAtivo" BOOLEAN NOT NULL DEFAULT true,
    "limiteSubmissoesPorIpHora" INTEGER NOT NULL DEFAULT 20,
    "configuracaoVisual" JSONB,
    "metadados" JSONB,
    "publicadoEm" TIMESTAMP(3),
    "pausadoEm" TIMESTAMP(3),
    "arquivadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormularioCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoFormularioCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "chave" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "tipo" "TipoCampoFormularioCaptacaoLead" NOT NULL DEFAULT 'TEXTO_CURTO',
    "mapeamento" "MapeamentoCampoFormularioCaptacaoLead" NOT NULL DEFAULT 'PERSONALIZADO',
    "placeholder" TEXT,
    "textoAjuda" TEXT,
    "valorPadrao" TEXT,
    "mascara" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,
    "largura" INTEGER NOT NULL DEFAULT 12,
    "opcoes" JSONB,
    "validacoes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampoFormularioCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraDistribuicaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "canalId" INTEGER,
    "campanhaId" INTEGER,
    "formularioId" INTEGER,
    "cursoId" INTEGER,
    "poloId" INTEGER,
    "equipeId" INTEGER,
    "responsavelFixoId" INTEGER,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "estrategia" "EstrategiaDistribuicaoLead" NOT NULL DEFAULT 'RODIZIO',
    "ordemPrioridade" INTEGER NOT NULL DEFAULT 0,
    "maximoLeadsAbertosPorResponsavel" INTEGER,
    "somenteMembrosAtivos" BOOLEAN NOT NULL DEFAULT true,
    "respeitarDisponibilidade" BOOLEAN NOT NULL DEFAULT true,
    "proximoIndiceRodizio" INTEGER NOT NULL DEFAULT 0,
    "criterios" JSONB,
    "configuracao" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraDistribuicaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracaoCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "canalId" INTEGER,
    "campanhaId" INTEGER,
    "formularioId" INTEGER,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "tipo" "TipoIntegracaoCaptacaoLead" NOT NULL,
    "status" "StatusIntegracaoCaptacaoLead" NOT NULL DEFAULT 'INATIVA',
    "chavePublica" TEXT NOT NULL,
    "segredoCriptografado" TEXT,
    "urlEndpoint" TEXT,
    "configuracao" JSONB,
    "eventosAssinados" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoSucessoEm" TIMESTAMP(3),
    "ultimoErroEm" TIMESTAMP(3),
    "ultimoErro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissaoCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "canalId" INTEGER,
    "campanhaId" INTEGER,
    "formularioId" INTEGER,
    "integracaoId" INTEGER,
    "leadId" INTEGER,
    "identificadorExterno" TEXT,
    "chaveDeduplicacao" TEXT,
    "status" "StatusSubmissaoCaptacaoLead" NOT NULL DEFAULT 'RECEBIDA',
    "resultadoDeduplicacao" "ResultadoDeduplicacaoCaptacaoLead" NOT NULL DEFAULT 'NAO_VERIFICADA',
    "nomeSnapshot" TEXT,
    "emailSnapshot" TEXT,
    "telefoneSnapshot" TEXT,
    "dadosOriginais" JSONB NOT NULL,
    "dadosNormalizados" JSONB,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,
    "msclkid" TEXT,
    "paginaOrigem" TEXT,
    "referrer" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "idioma" TEXT,
    "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "versaoConsentimento" TEXT,
    "textoConsentimentoSnapshot" TEXT,
    "tentativasProcessamento" INTEGER NOT NULL DEFAULT 0,
    "codigoErro" TEXT,
    "mensagemErro" TEXT,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissaoCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoIntegracaoCaptacaoLead" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "integracaoId" INTEGER NOT NULL,
    "submissaoId" INTEGER,
    "identificadorEvento" TEXT,
    "tipoEvento" TEXT NOT NULL,
    "direcao" "DirecaoEventoIntegracaoCaptacaoLead" NOT NULL,
    "status" "StatusEventoIntegracaoCaptacaoLead" NOT NULL DEFAULT 'RECEBIDO',
    "headers" JSONB,
    "payload" JSONB NOT NULL,
    "resposta" JSONB,
    "codigoHttp" INTEGER,
    "numeroTentativas" INTEGER NOT NULL DEFAULT 0,
    "proximaTentativaEm" TIMESTAMP(3),
    "mensagemErro" TEXT,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoIntegracaoCaptacaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanalCaptacaoLead_instituicaoId_idx" ON "CanalCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "CanalCaptacaoLead_instituicaoId_ativo_idx" ON "CanalCaptacaoLead"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "CanalCaptacaoLead_instituicaoId_tipo_idx" ON "CanalCaptacaoLead"("instituicaoId", "tipo");

-- CreateIndex
CREATE INDEX "CanalCaptacaoLead_instituicaoId_padrao_idx" ON "CanalCaptacaoLead"("instituicaoId", "padrao");

-- CreateIndex
CREATE INDEX "CanalCaptacaoLead_criadoPorId_idx" ON "CanalCaptacaoLead"("criadoPorId");

-- CreateIndex
CREATE INDEX "CanalCaptacaoLead_atualizadoPorId_idx" ON "CanalCaptacaoLead"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "CanalCaptacaoLead_instituicaoId_slug_key" ON "CanalCaptacaoLead"("instituicaoId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CanalCaptacaoLead_instituicaoId_nome_key" ON "CanalCaptacaoLead"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_instituicaoId_idx" ON "CampanhaCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_instituicaoId_status_idx" ON "CampanhaCaptacaoLead"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_instituicaoId_ativo_idx" ON "CampanhaCaptacaoLead"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_canalId_idx" ON "CampanhaCaptacaoLead"("canalId");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_dataInicio_dataFim_idx" ON "CampanhaCaptacaoLead"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_utmCampaign_idx" ON "CampanhaCaptacaoLead"("utmCampaign");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_criadoPorId_idx" ON "CampanhaCaptacaoLead"("criadoPorId");

-- CreateIndex
CREATE INDEX "CampanhaCaptacaoLead_atualizadoPorId_idx" ON "CampanhaCaptacaoLead"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "CampanhaCaptacaoLead_instituicaoId_codigo_key" ON "CampanhaCaptacaoLead"("instituicaoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "FormularioCaptacaoLead_tokenPublico_key" ON "FormularioCaptacaoLead"("tokenPublico");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_instituicaoId_idx" ON "FormularioCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_instituicaoId_status_idx" ON "FormularioCaptacaoLead"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_instituicaoId_ativo_idx" ON "FormularioCaptacaoLead"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_canalId_idx" ON "FormularioCaptacaoLead"("canalId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_campanhaId_idx" ON "FormularioCaptacaoLead"("campanhaId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_funilPadraoId_idx" ON "FormularioCaptacaoLead"("funilPadraoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_etapaPadraoId_idx" ON "FormularioCaptacaoLead"("etapaPadraoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_equipePadraoId_idx" ON "FormularioCaptacaoLead"("equipePadraoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_responsavelPadraoId_idx" ON "FormularioCaptacaoLead"("responsavelPadraoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_cursoPadraoId_idx" ON "FormularioCaptacaoLead"("cursoPadraoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_poloPadraoId_idx" ON "FormularioCaptacaoLead"("poloPadraoId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_criadoPorId_idx" ON "FormularioCaptacaoLead"("criadoPorId");

-- CreateIndex
CREATE INDEX "FormularioCaptacaoLead_atualizadoPorId_idx" ON "FormularioCaptacaoLead"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "FormularioCaptacaoLead_instituicaoId_slug_key" ON "FormularioCaptacaoLead"("instituicaoId", "slug");

-- CreateIndex
CREATE INDEX "CampoFormularioCaptacaoLead_instituicaoId_idx" ON "CampoFormularioCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "CampoFormularioCaptacaoLead_formularioId_ativo_ordem_idx" ON "CampoFormularioCaptacaoLead"("formularioId", "ativo", "ordem");

-- CreateIndex
CREATE INDEX "CampoFormularioCaptacaoLead_mapeamento_idx" ON "CampoFormularioCaptacaoLead"("mapeamento");

-- CreateIndex
CREATE UNIQUE INDEX "CampoFormularioCaptacaoLead_formularioId_chave_key" ON "CampoFormularioCaptacaoLead"("formularioId", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "CampoFormularioCaptacaoLead_formularioId_ordem_key" ON "CampoFormularioCaptacaoLead"("formularioId", "ordem");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_instituicaoId_idx" ON "RegraDistribuicaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_instituicaoId_ativo_ordemPrioridade_idx" ON "RegraDistribuicaoLead"("instituicaoId", "ativo", "ordemPrioridade");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_canalId_idx" ON "RegraDistribuicaoLead"("canalId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_campanhaId_idx" ON "RegraDistribuicaoLead"("campanhaId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_formularioId_idx" ON "RegraDistribuicaoLead"("formularioId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_cursoId_idx" ON "RegraDistribuicaoLead"("cursoId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_poloId_idx" ON "RegraDistribuicaoLead"("poloId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_equipeId_idx" ON "RegraDistribuicaoLead"("equipeId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_responsavelFixoId_idx" ON "RegraDistribuicaoLead"("responsavelFixoId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_estrategia_idx" ON "RegraDistribuicaoLead"("estrategia");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_criadoPorId_idx" ON "RegraDistribuicaoLead"("criadoPorId");

-- CreateIndex
CREATE INDEX "RegraDistribuicaoLead_atualizadoPorId_idx" ON "RegraDistribuicaoLead"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "RegraDistribuicaoLead_instituicaoId_nome_key" ON "RegraDistribuicaoLead"("instituicaoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "IntegracaoCaptacaoLead_chavePublica_key" ON "IntegracaoCaptacaoLead"("chavePublica");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_instituicaoId_idx" ON "IntegracaoCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_instituicaoId_status_idx" ON "IntegracaoCaptacaoLead"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_instituicaoId_tipo_idx" ON "IntegracaoCaptacaoLead"("instituicaoId", "tipo");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_instituicaoId_ativo_idx" ON "IntegracaoCaptacaoLead"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_canalId_idx" ON "IntegracaoCaptacaoLead"("canalId");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_campanhaId_idx" ON "IntegracaoCaptacaoLead"("campanhaId");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_formularioId_idx" ON "IntegracaoCaptacaoLead"("formularioId");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_criadoPorId_idx" ON "IntegracaoCaptacaoLead"("criadoPorId");

-- CreateIndex
CREATE INDEX "IntegracaoCaptacaoLead_atualizadoPorId_idx" ON "IntegracaoCaptacaoLead"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegracaoCaptacaoLead_instituicaoId_nome_key" ON "IntegracaoCaptacaoLead"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_instituicaoId_idx" ON "SubmissaoCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_instituicaoId_status_recebidoEm_idx" ON "SubmissaoCaptacaoLead"("instituicaoId", "status", "recebidoEm");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_canalId_idx" ON "SubmissaoCaptacaoLead"("canalId");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_campanhaId_idx" ON "SubmissaoCaptacaoLead"("campanhaId");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_formularioId_idx" ON "SubmissaoCaptacaoLead"("formularioId");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_integracaoId_idx" ON "SubmissaoCaptacaoLead"("integracaoId");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_leadId_idx" ON "SubmissaoCaptacaoLead"("leadId");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_chaveDeduplicacao_idx" ON "SubmissaoCaptacaoLead"("chaveDeduplicacao");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_emailSnapshot_idx" ON "SubmissaoCaptacaoLead"("emailSnapshot");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_telefoneSnapshot_idx" ON "SubmissaoCaptacaoLead"("telefoneSnapshot");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_utmCampaign_idx" ON "SubmissaoCaptacaoLead"("utmCampaign");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_recebidoEm_idx" ON "SubmissaoCaptacaoLead"("recebidoEm");

-- CreateIndex
CREATE INDEX "SubmissaoCaptacaoLead_processadoEm_idx" ON "SubmissaoCaptacaoLead"("processadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissaoCaptacaoLead_integracaoId_identificadorExterno_key" ON "SubmissaoCaptacaoLead"("integracaoId", "identificadorExterno");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_instituicaoId_idx" ON "EventoIntegracaoCaptacaoLead"("instituicaoId");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_integracaoId_idx" ON "EventoIntegracaoCaptacaoLead"("integracaoId");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_submissaoId_idx" ON "EventoIntegracaoCaptacaoLead"("submissaoId");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_status_idx" ON "EventoIntegracaoCaptacaoLead"("status");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_direcao_idx" ON "EventoIntegracaoCaptacaoLead"("direcao");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_tipoEvento_idx" ON "EventoIntegracaoCaptacaoLead"("tipoEvento");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_proximaTentativaEm_idx" ON "EventoIntegracaoCaptacaoLead"("proximaTentativaEm");

-- CreateIndex
CREATE INDEX "EventoIntegracaoCaptacaoLead_recebidoEm_idx" ON "EventoIntegracaoCaptacaoLead"("recebidoEm");

-- CreateIndex
CREATE UNIQUE INDEX "EventoIntegracaoCaptacaoLead_integracaoId_identificadorEven_key" ON "EventoIntegracaoCaptacaoLead"("integracaoId", "identificadorEvento");

-- AddForeignKey
ALTER TABLE "CanalCaptacaoLead" ADD CONSTRAINT "CanalCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanalCaptacaoLead" ADD CONSTRAINT "CanalCaptacaoLead_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanalCaptacaoLead" ADD CONSTRAINT "CanalCaptacaoLead_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampanhaCaptacaoLead" ADD CONSTRAINT "CampanhaCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampanhaCaptacaoLead" ADD CONSTRAINT "CampanhaCaptacaoLead_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampanhaCaptacaoLead" ADD CONSTRAINT "CampanhaCaptacaoLead_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampanhaCaptacaoLead" ADD CONSTRAINT "CampanhaCaptacaoLead_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "CampanhaCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_funilPadraoId_fkey" FOREIGN KEY ("funilPadraoId") REFERENCES "FunilComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_etapaPadraoId_fkey" FOREIGN KEY ("etapaPadraoId") REFERENCES "EtapaFunilComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_equipePadraoId_fkey" FOREIGN KEY ("equipePadraoId") REFERENCES "EquipeComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_responsavelPadraoId_fkey" FOREIGN KEY ("responsavelPadraoId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_cursoPadraoId_fkey" FOREIGN KEY ("cursoPadraoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_poloPadraoId_fkey" FOREIGN KEY ("poloPadraoId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioCaptacaoLead" ADD CONSTRAINT "FormularioCaptacaoLead_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoFormularioCaptacaoLead" ADD CONSTRAINT "CampoFormularioCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoFormularioCaptacaoLead" ADD CONSTRAINT "CampoFormularioCaptacaoLead_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "FormularioCaptacaoLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "CampanhaCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "FormularioCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "EquipeComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_responsavelFixoId_fkey" FOREIGN KEY ("responsavelFixoId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDistribuicaoLead" ADD CONSTRAINT "RegraDistribuicaoLead_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoCaptacaoLead" ADD CONSTRAINT "IntegracaoCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoCaptacaoLead" ADD CONSTRAINT "IntegracaoCaptacaoLead_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoCaptacaoLead" ADD CONSTRAINT "IntegracaoCaptacaoLead_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "CampanhaCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoCaptacaoLead" ADD CONSTRAINT "IntegracaoCaptacaoLead_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "FormularioCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoCaptacaoLead" ADD CONSTRAINT "IntegracaoCaptacaoLead_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoCaptacaoLead" ADD CONSTRAINT "IntegracaoCaptacaoLead_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoCaptacaoLead" ADD CONSTRAINT "SubmissaoCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoCaptacaoLead" ADD CONSTRAINT "SubmissaoCaptacaoLead_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoCaptacaoLead" ADD CONSTRAINT "SubmissaoCaptacaoLead_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "CampanhaCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoCaptacaoLead" ADD CONSTRAINT "SubmissaoCaptacaoLead_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "FormularioCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoCaptacaoLead" ADD CONSTRAINT "SubmissaoCaptacaoLead_integracaoId_fkey" FOREIGN KEY ("integracaoId") REFERENCES "IntegracaoCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoCaptacaoLead" ADD CONSTRAINT "SubmissaoCaptacaoLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoIntegracaoCaptacaoLead" ADD CONSTRAINT "EventoIntegracaoCaptacaoLead_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoIntegracaoCaptacaoLead" ADD CONSTRAINT "EventoIntegracaoCaptacaoLead_integracaoId_fkey" FOREIGN KEY ("integracaoId") REFERENCES "IntegracaoCaptacaoLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoIntegracaoCaptacaoLead" ADD CONSTRAINT "EventoIntegracaoCaptacaoLead_submissaoId_fkey" FOREIGN KEY ("submissaoId") REFERENCES "SubmissaoCaptacaoLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
