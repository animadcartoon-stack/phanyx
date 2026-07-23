-- CreateEnum
CREATE TYPE "AbrangenciaRemuneracaoVariavelRH" AS ENUM ('TODOS_FUNCIONARIOS', 'DEPARTAMENTO', 'FUNCIONARIOS_SELECIONADOS');

-- CreateEnum
CREATE TYPE "BaseCalculoComissaoRH" AS ENUM ('VALOR_MATRICULA', 'VALOR_MENSALIDADE', 'VALOR_TOTAL_CONTRATO', 'VALOR_RECEBIDO', 'LUCRO', 'QUANTIDADE_MATRICULAS');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "GatilhoComissaoRH" AS ENUM ('MATRICULA_CONFIRMADA', 'PAGAMENTO_MATRICULA_CONFIRMADO', 'PRIMEIRA_MENSALIDADE_PAGA', 'MENSALIDADE_PAGA', 'MANUAL');

-- CreateEnum
CREATE TYPE "LeadPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'CONTATO', 'NEGOCIACAO', 'PROPOSTA', 'FECHADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "MaterialTipo" AS ENUM ('arquivo', 'pdf', 'doc', 'ppt', 'link', 'video');

-- CreateEnum
CREATE TYPE "MetodoDistribuicaoRemuneracaoVariavelRH" AS ENUM ('VALOR_FIXO_INDIVIDUAL', 'IGUALITARIO', 'PROPORCIONAL_SALARIO', 'PROPORCIONAL_TEMPO_TRABALHADO', 'PERCENTUAL_INDIVIDUAL', 'PONTUACAO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ModalidadeCertificado" AS ENUM ('GERAL', 'BACHARELADO', 'LICENCIATURA', 'TECNOLOGO', 'POS_GRADUACAO', 'MBA', 'MESTRADO', 'DOUTORADO', 'TECNICO', 'CURSO_LIVRE', 'OFICINA', 'ENSINO_MEDIO', 'ENSINO_FUNDAMENTAL', 'EDUCACAO_INFANTIL', 'PRE_ESCOLA', 'EXTENSAO', 'CAPACITACAO', 'TREINAMENTO', 'EJA', 'OUTRO');

-- CreateEnum
CREATE TYPE "NotaTipo" AS ENUM ('PROVA', 'ATIVIDADE', 'AJUSTE', 'RECUPERACAO');

-- CreateEnum
CREATE TYPE "OrigemLancamentoComissaoRH" AS ENUM ('AUTOMATICA', 'MANUAL', 'AJUSTE', 'ESTORNO');

-- CreateEnum
CREATE TYPE "PapelParticipanteComercial" AS ENUM ('RESPONSAVEL', 'PARTICIPANTE');

-- CreateEnum
CREATE TYPE "QuestaoTipo" AS ENUM ('multipla_escolha', 'discursiva');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROFESSOR', 'ALUNO', 'SECRETARIA', 'COORDENADOR', 'FINANCEIRO', 'SUPORTE');

-- CreateEnum
CREATE TYPE "SituacaoFinal" AS ENUM ('EM_ANDAMENTO', 'APROVADO', 'REPROVADO_NOTA', 'REPROVADO_FALTA', 'RECUPERACAO', 'TRANCADO');

-- CreateEnum
CREATE TYPE "StatusAluno" AS ENUM ('ATIVO', 'TRANCADO', 'INADIMPLENTE', 'TRANSFERIDO', 'DESLIGADO', 'FORMADO', 'CANCELADO', 'SUSPENSO', 'PAUSA_MEDICA', 'FALTANTE');

-- CreateEnum
CREATE TYPE "StatusAtestadoMedico" AS ENUM ('PENDENTE', 'VALIDADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "StatusAtividade" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA', 'AGUARDANDO_PUBLICACAO');

-- CreateEnum
CREATE TYPE "StatusCaixa" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('PENDENTE', 'ASSINADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusDocumentoGerado" AS ENUM ('RASCUNHO', 'GERADO', 'ASSINADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusItemMatricula" AS ENUM ('A_CURSAR', 'EM_CURSO', 'CONCLUIDO', 'TRANCADO', 'REPROVADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusLancamentoComissaoRH" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO', 'ENVIADO_HOLERITE', 'PAGO', 'ESTORNADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusLancamentoFinanceiro" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusLancamentoRemuneracaoVariavelRH" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO', 'ENVIADO_HOLERITE', 'PAGO', 'ESTORNADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('ATIVA', 'TRANCADA', 'CANCELADA', 'CONCLUIDA', 'A_INICIAR', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "StatusPresencaAula" AS ENUM ('PRESENTE', 'FALTA', 'JUSTIFICADA', 'ATESTADO');

-- CreateEnum
CREATE TYPE "StatusProgramaRemuneracaoVariavelRH" AS ENUM ('RASCUNHO', 'ATIVO', 'EM_APURACAO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "StatusTentativa" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'CORRIGIDA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "StatusTurma" AS ENUM ('AGUARDANDO', 'A_INICIAR', 'ATIVA', 'INATIVA', 'CONCLUIDA', 'CANCELADA', 'NAO_FORMADA');

-- CreateEnum
CREATE TYPE "StatusVisitante" AS ENUM ('AGUARDANDO', 'DENTRO', 'SAIU', 'CANCELADO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoDocumentoAluno" AS ENUM ('CONTRATO', 'DECLARACAO', 'HISTORICO', 'CERTIFICADO', 'DOCUMENTO_PESSOAL', 'RG', 'CPF', 'CNH', 'HISTORICO_ESCOLAR', 'COMPROVANTE_RESIDENCIA', 'TITULO_ELEITOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoDocumentoTemplate" AS ENUM ('CONTRATO', 'DECLARACAO', 'RECIBO', 'COMPROVANTE', 'TRANCAMENTO', 'COMPARECIMENTO', 'HISTORICO', 'OUTRO', 'HOLERITE', 'DOCUMENTO_RH', 'CONTRATO_TRABALHO', 'CONTRATO_EXPERIENCIA', 'TERMO_LGPD_RH', 'TERMO_EQUIPAMENTOS', 'ADMISSAO', 'DEMISSAO', 'PEDIDO_DEMISSAO', 'AVISO_PREVIO', 'TRCT', 'FERIAS', 'AVISO_FERIAS', 'RECIBO_FERIAS', 'ADVERTENCIA', 'SUSPENSAO', 'AFASTAMENTO_MEDICO', 'AFASTAMENTO_MATERNIDADE', 'AFASTAMENTO_PERICIA', 'RETORNO_TRABALHO', 'ASO', 'ASO_ADMISSIONAL', 'ASO_PERIODICO', 'ASO_RETORNO', 'ASO_MUDANCA_FUNCAO', 'ASO_DEMISSIONAL');

-- CreateEnum
CREATE TYPE "TipoItemMatricula" AS ENUM ('GRADE_PRINCIPAL', 'EXTRA_MESMO_CURSO', 'EXTRA_OUTRO_CURSO');

-- CreateEnum
CREATE TYPE "TipoLancamentoFinanceiro" AS ENUM ('MATRICULA', 'MENSALIDADE', 'TAXA', 'DESCONTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoModeloCracha" AS ENUM ('ALUNO', 'PROFESSOR', 'FUNCIONARIO', 'VISITANTE', 'MEMBRO', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoCaixa" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoPeriodoMatricula" AS ENUM ('MATRICULA_INICIAL', 'REMATRICULA');

-- CreateEnum
CREATE TYPE "TipoRegraComissaoRH" AS ENUM ('PERCENTUAL', 'VALOR_FIXO');

-- CreateEnum
CREATE TYPE "TipoRemuneracaoRH" AS ENUM ('MENSAL', 'HORA_AULA', 'HORA_TRABALHADA', 'POR_AULA', 'POR_TURMA', 'POR_DISCIPLINA', 'MISTO', 'SEM_REMUNERACAO');

-- CreateEnum
CREATE TYPE "TipoRemuneracaoVariavelRH" AS ENUM ('BONUS', 'PREMIO', 'PARTICIPACAO_RESULTADOS', 'PARTICIPACAO_LUCROS', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoVersaoCertificado" AS ENUM ('RASCUNHO', 'PUBLICADO');

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
CREATE TABLE "AjusteMarcacaoPontoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "marcacaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "acao" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AjusteMarcacaoPontoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "questaoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "matricula" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bairro" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "complemento" TEXT,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "documentoUrl" TEXT,
    "endereco" TEXT,
    "estado" TEXT,
    "numero" TEXT,
    "rg" TEXT,
    "slug" TEXT,
    "telefone" TEXT,
    "cpfResponsavel" TEXT,
    "emailResponsavel" TEXT,
    "nomeResponsavel" TEXT,
    "parentescoResponsavel" TEXT,
    "telefoneResponsavel" TEXT,
    "statusAluno" "StatusAluno" NOT NULL DEFAULT 'ATIVO',
    "descricaoNecessidadeEspecial" TEXT,
    "observacoesAcessibilidade" TEXT,
    "possuiNecessidadeEspecial" BOOLEAN NOT NULL DEFAULT false,
    "genero" TEXT,
    "nomeSocial" TEXT,
    "poloId" INTEGER,
    "fotoPerfil" TEXT,
    "recebeMensagemAniversario" BOOLEAN NOT NULL DEFAULT true,
    "recebeWhatsappAniversario" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "AssinaturaPhanyx" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "adesaoInstituicaoId" TEXT,
    "plano" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TESTE_GRATIS',
    "testeGratisInicioEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testeGratisFimEm" TIMESTAMP(3) NOT NULL,
    "primeiraCobrancaEm" TIMESTAMP(3),
    "proximaCobrancaEm" TIMESTAMP(3),
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "asaasBillingType" TEXT,
    "asaasCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "valorBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorPorAluno" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorPorPoloExtra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorMensalAtual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "alunosAtivosReferencia" INTEGER NOT NULL DEFAULT 0,
    "polosReferencia" INTEGER NOT NULL DEFAULT 1,
    "canceladaEm" TIMESTAMP(3),
    "canceladaPorId" INTEGER,
    "motivoCancelamento" TEXT,
    "ultimoEventoAsaas" TEXT,
    "ultimoWebhookAsaasEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturaPhanyx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtestadoMedico" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "arquivoUrl" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "status" "StatusAtestadoMedico" NOT NULL DEFAULT 'PENDENTE',
    "validadoPor" INTEGER,
    "validadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtestadoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" TIMESTAMP(3),
    "notaMaxima" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "status" "StatusAtividade" NOT NULL DEFAULT 'RASCUNHO',
    "publicadaAt" TIMESTAMP(3),
    "encerradaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "disciplinaId" INTEGER,
    "enviadoParaApoioDocenteEm" TIMESTAMP(3),
    "professorResponsavelId" INTEGER,
    "publicadoPeloApoioDocenteEm" TIMESTAMP(3),
    "publicadoPorId" INTEGER,
    "substituicaoDocenteId" INTEGER,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeAnexo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "arquivoNome" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,

    CONSTRAINT "AtividadeAnexo_pkey" PRIMARY KEY ("id")
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
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspeito" BOOLEAN NOT NULL DEFAULT false,
    "motivoRisco" TEXT,
    "risco" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AuditoriaValidacaoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aula" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "moduloId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,
    "duracaoMin" INTEGER,
    "instituicaoId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT true,
    "turmaId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoUrl" TEXT,
    "disciplinaId" INTEGER,
    "substituicaoDocenteId" INTEGER,

    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutorizacaoCorrecaoPontoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "pontoFuncionarioRHId" INTEGER,
    "dataLocal" TIMESTAMP(3) NOT NULL,
    "autorizadoPorId" INTEGER NOT NULL,
    "autorizadoPorNome" TEXT NOT NULL,
    "motivoAutorizacao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "autorizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validoAte" TIMESTAMP(3) NOT NULL,
    "limiteEnvios" INTEGER NOT NULL DEFAULT 1,
    "enviosRealizados" INTEGER NOT NULL DEFAULT 0,
    "utilizadoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "canceladoPorId" INTEGER,
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutorizacaoCorrecaoPontoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvisoWhatsappCorrecaoPontoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "autorizacaoId" INTEGER,
    "solicitacaoId" INTEGER,
    "destinatarioUsuarioId" INTEGER NOT NULL,
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioTelefone" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'CORRECAO_PONTO_FUNCIONARIO',
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE_CONFIGURACAO',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "provedor" TEXT,
    "mensagemExternaId" TEXT,
    "ultimoErro" TEXT,
    "agendadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisoWhatsappCorrecaoPontoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BancoHorasRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "pontoId" INTEGER,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "horas" DECIMAL(10,2) NOT NULL,
    "saldoApos" DECIMAL(10,2),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BancoHorasRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficioRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "valorPadrao" DECIMAL(10,2),
    "percentual" DECIMAL(5,2),
    "descontaFolha" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficioRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueioIP" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "motivo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "bloqueadoAte" TIMESTAMP(3),

    CONSTRAINT "BloqueioIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheGeocodificacaoEndereco" (
    "id" SERIAL NOT NULL,
    "chave" TEXT NOT NULL,
    "consulta" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "nomeExibicao" TEXT,
    "provedor" TEXT NOT NULL DEFAULT 'NOMINATIM',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "ultimoUsoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CacheGeocodificacaoEndereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caixa" (
    "id" SERIAL NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoSistema" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoInformado" DOUBLE PRECISION,
    "diferenca" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacaoAbertura" TEXT,
    "observacaoFechamento" TEXT,
    "status" "StatusCaixa" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "abertoPorId" INTEGER,
    "fechadoPorId" INTEGER,
    "fechamentoAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "identificadorOnline" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "arquivoUrl" TEXT,
    "codigo" TEXT NOT NULL,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "certificadoModeloId" INTEGER,
    "certificadoModeloVersaoId" INTEGER,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
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
    "pagina" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "lineHeight" DOUBLE PRECISION,
    "marcador" TEXT,
    "dadosJson" JSONB,
    "certificadoModeloVersaoId" INTEGER,

    CONSTRAINT "CertificadoCampo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificadoModelo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "modalidade" "ModalidadeCertificado" NOT NULL DEFAULT 'GERAL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "padraoGeral" BOOLEAN NOT NULL DEFAULT false,
    "padraoModalidade" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" INTEGER,
    "publicadoPorId" INTEGER,
    "publicadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificadoModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificadoModeloVersao" (
    "id" SERIAL NOT NULL,
    "modeloId" INTEGER NOT NULL,
    "tipo" "TipoVersaoCertificado" NOT NULL,
    "templateUrl" TEXT,
    "previewUrl" TEXT,
    "textoPadrao" TEXT,
    "assinaturaUrl" TEXT,
    "coordenadorNome" TEXT,
    "cidade" TEXT,
    "modoFundo" TEXT NOT NULL DEFAULT 'modelo',
    "corFundoPagina" TEXT NOT NULL DEFAULT '#ffffff',
    "tamanhoPapel" TEXT NOT NULL DEFAULT 'A4',
    "orientacao" TEXT NOT NULL DEFAULT 'paisagem',
    "larguraBase" INTEGER NOT NULL DEFAULT 1123,
    "alturaBase" INTEGER NOT NULL DEFAULT 794,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificadoModeloVersao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAnexo" (
    "id" SERIAL NOT NULL,
    "mensagemId" INTEGER NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipoMime" TEXT,
    "tamanho" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "titulo" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "setor" TEXT,
    "criadaPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMensagem" (
    "id" SERIAL NOT NULL,
    "conversaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "texto" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'TEXTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadaEm" TIMESTAMP(3),

    CONSTRAINT "ChatMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipante" (
    "id" SERIAL NOT NULL,
    "conversaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nomeExibicao" TEXT,
    "papel" TEXT,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatPresenca" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "ultimaAtividade" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatPresenca_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Cobranca" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "poloId" INTEGER,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoFinanceiraInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "jurosPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "multaPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descontoPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "diasTolerancia" INTEGER NOT NULL DEFAULT 0,
    "bloquearAlunoInadimplente" BOOLEAN NOT NULL DEFAULT false,
    "permitirPagamentoParcial" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quantidadeMensalidadesParaBloqueio" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "ConfiguracaoFinanceiraInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nomeFantasia" TEXT,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "responsavelNome" TEXT,
    "responsavelCargo" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoPath" TEXT,
    "cidadeAssinatura" TEXT,
    "contratoTemplate" TEXT,
    "observacoesContrato" TEXT,
    "numero" TEXT,
    "estiloDocumento" TEXT DEFAULT 'INSTITUCIONAL',
    "papelTimbradoUrl" TEXT,
    "usarPapelTimbrado" BOOLEAN NOT NULL DEFAULT false,
    "estiloPapelTimbrado" TEXT DEFAULT 'SEM_COR',
    "certificadoAssinaturaUrl" TEXT,
    "corRelatorio" TEXT DEFAULT 'AZUL',
    "cep" TEXT,

    CONSTRAINT "ConfiguracaoInstituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoPontoMobileRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "exigirFoto" BOOLEAN NOT NULL DEFAULT true,
    "exigirLocalizacao" BOOLEAN NOT NULL DEFAULT true,
    "reconhecimentoFacialAtivo" BOOLEAN NOT NULL DEFAULT false,
    "exigirProvaVida" BOOLEAN NOT NULL DEFAULT false,
    "permitirForaDoRaio" BOOLEAN NOT NULL DEFAULT true,
    "exigirFuncionarioLiberado" BOOLEAN NOT NULL DEFAULT true,
    "raioPadraoMetros" INTEGER NOT NULL DEFAULT 150,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "fusoHorario" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',

    CONSTRAINT "ConfiguracaoPontoMobileRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoPortalInstituicao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "portal" TEXT NOT NULL,
    "chavePagina" TEXT NOT NULL,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoPortalInstituicao_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CrachaEmitido" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "modeloId" INTEGER NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "frenteUrl" TEXT,
    "versoUrl" TEXT,
    "pdfUrl" TEXT,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emitidoPorId" INTEGER,
    "codigoCracha" TEXT,
    "validadeEm" TIMESTAMP(3),

    CONSTRAINT "CrachaEmitido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrachaLoteEmissao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "modeloId" INTEGER NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "filtrosJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processados" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "arquivoZipUrl" TEXT,
    "arquivoPdfUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "iniciadoEm" TIMESTAMP(3),
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "CrachaLoteEmissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrachaModelo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "larguraMm" DOUBLE PRECISION NOT NULL,
    "alturaMm" DOUBLE PRECISION NOT NULL,
    "frenteJson" JSONB,
    "versoJson" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "corFundoFrente" TEXT DEFAULT '#ffffff',
    "corFundoVerso" TEXT DEFAULT '#ffffff',
    "criadoPorId" INTEGER,
    "observacoes" TEXT,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "tipoFuro" TEXT DEFAULT 'RASGO_HORIZONTAL',
    "corFundoFrenteSecundaria" TEXT,
    "corFundoVersoSecundaria" TEXT,
    "direcaoGradienteFrente" TEXT DEFAULT 'VERTICAL',
    "direcaoGradienteVerso" TEXT DEFAULT 'VERTICAL',
    "tipoFundoFrente" TEXT NOT NULL DEFAULT 'SOLIDO',
    "tipoFundoVerso" TEXT NOT NULL DEFAULT 'SOLIDO',
    "gradientePontosFundoFrente" JSONB,
    "gradientePontosFundoVerso" JSONB,

    CONSTRAINT "CrachaModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditoIA" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditoIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditoIAPublico" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditoIAPublico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "codigo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quantidadeParcelas" INTEGER,
    "valorMatricula" DOUBLE PRECISION,
    "valorMensalidade" DOUBLE PRECISION,
    "quantidadeSemestres" INTEGER,
    "cargaHorariaMaximaSemestre" INTEGER,
    "excluidoEm" TIMESTAMP(3),
    "expiraExclusaoEm" TIMESTAMP(3),
    "criadoPorId" INTEGER,
    "excluidoPorId" INTEGER,
    "certificadoModeloId" INTEGER,
    "modalidadeCertificado" "ModalidadeCertificado" NOT NULL DEFAULT 'GERAL',

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CursoPolo" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "poloId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CursoPolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoSemestre" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "cargaMaxima" INTEGER,
    "cargaMinima" INTEGER,

    CONSTRAINT "CursoSemestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoSemestreDisciplina" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cursoSemestreId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,

    CONSTRAINT "CursoSemestreDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartamentoPermissao" (
    "id" SERIAL NOT NULL,
    "departamentoId" INTEGER NOT NULL,
    "chave" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartamentoPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cursoId" INTEGER,
    "instituicaoId" INTEGER NOT NULL,
    "cargaHoraria" INTEGER,
    "descricao" TEXT,
    "semestre" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "codigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "professorId" INTEGER,

    CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "DocumentoAluno" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoDocumentoAluno" NOT NULL,
    "arquivoUrl" TEXT,
    "conteudo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alunoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER,
    "arquivoNome" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mimeType" TEXT,
    "proprietario" TEXT NOT NULL DEFAULT 'ALUNO',
    "tamanho" INTEGER,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "arquivadoEm" TIMESTAMP(3),
    "arquivadoPorId" INTEGER,
    "motivoArquivamento" TEXT,
    "motivoRestauracao" TEXT,
    "restauradoEm" TIMESTAMP(3),
    "restauradoPorId" INTEGER,

    CONSTRAINT "DocumentoAluno_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "DocumentoProfessor" (
    "id" SERIAL NOT NULL,
    "professorId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "arquivoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "arquivadoEm" TIMESTAMP(3),
    "arquivadoPorId" INTEGER,
    "motivoArquivo" TEXT,
    "restauradoEm" TIMESTAMP(3),
    "restauradoPorId" INTEGER,
    "motivoRestauracao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoProfessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "templateId" INTEGER,
    "arquivoUrl" TEXT,
    "conteudo" TEXT,
    "dataDocumento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "arquivadoEm" TIMESTAMP(3),
    "arquivadoPorId" INTEGER,
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "canceladoEm" TIMESTAMP(3),
    "canceladoPorId" INTEGER,
    "motivoArquivo" TEXT,
    "motivoCancelamento" TEXT,
    "restauradoEm" TIMESTAMP(3),
    "restauradoPorId" INTEGER,
    "motivoRestauracao" TEXT,

    CONSTRAINT "DocumentoRH_pkey" PRIMARY KEY ("id")
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
    "camposVisuais" JSONB,
    "formatoImpressao" TEXT NOT NULL DEFAULT 'A4_INTEIRA',

    CONSTRAINT "DocumentoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaAtividade" (
    "id" SERIAL NOT NULL,
    "texto" TEXT,
    "link" TEXT,
    "arquivoUrl" TEXT,
    "nota" DOUBLE PRECISION,
    "feedback" TEXT,
    "entregueEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corrigidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,

    CONSTRAINT "EntregaAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaAtividadeHistorico" (
    "id" SERIAL NOT NULL,
    "texto" TEXT,
    "link" TEXT,
    "arquivoUrl" TEXT,
    "nota" DOUBLE PRECISION,
    "feedback" TEXT,
    "entregueEm" TIMESTAMP(3),
    "corrigidaEm" TIMESTAMP(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "entregaId" INTEGER NOT NULL,

    CONSTRAINT "EntregaAtividadeHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalaTrabalhoRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PADRAO',
    "diaSemana" INTEGER,
    "horaEntrada" TEXT,
    "horaSaida" TEXT,
    "intervaloMin" INTEGER NOT NULL DEFAULT 60,
    "cargaHorariaDia" DECIMAL(10,2),
    "toleranciaAtrasoMin" INTEGER NOT NULL DEFAULT 10,
    "toleranciaExtraMin" INTEGER NOT NULL DEFAULT 10,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalaTrabalhoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoFolhaRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "natureza" TEXT,
    "incideINSS" BOOLEAN NOT NULL DEFAULT false,
    "incideFGTS" BOOLEAN NOT NULL DEFAULT false,
    "incideIRRF" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoFolhaRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExameMedicoRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "tipo" TEXT NOT NULL,
    "dataExame" TIMESTAMP(3) NOT NULL,
    "clinica" TEXT,
    "medico" TEXT,
    "crm" TEXT,
    "resultado" TEXT,
    "validade" TIMESTAMP(3),
    "arquivoUrl" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "arquivadoEm" TIMESTAMP(3),
    "arquivadoPorId" INTEGER,
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "canceladoEm" TIMESTAMP(3),
    "canceladoPorId" INTEGER,
    "motivoArquivo" TEXT,
    "motivoCancelamento" TEXT,
    "restauradoEm" TIMESTAMP(3),
    "restauradoPorId" INTEGER,
    "motivoRestauracao" TEXT,

    CONSTRAINT "ExameMedicoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeriasRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "periodoAquisitivoInicio" TIMESTAMP(3),
    "periodoAquisitivoFim" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "dias" INTEGER NOT NULL,
    "abonoPecuniario" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "avisoUrl" TEXT,
    "reciboUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "dataRetorno" TIMESTAMP(3),
    "valorFerias" DECIMAL(10,2),
    "valorLiquidoFerias" DECIMAL(10,2),
    "valorTercoConstitucional" DECIMAL(10,2),
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "arquivadaEm" TIMESTAMP(3),
    "arquivadaPorId" INTEGER,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "canceladaEm" TIMESTAMP(3),
    "canceladaPorId" INTEGER,
    "motivoArquivo" TEXT,
    "motivoCancelamento" TEXT,
    "restauradoEm" TIMESTAMP(3),
    "restauradoPorId" INTEGER,
    "motivoRestauracao" TEXT,

    CONSTRAINT "FeriasRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "cargo" TEXT,
    "setor" TEXT,
    "fotoPerfil" TEXT,
    "documentoUrl" TEXT,
    "codigoFuncionario" TEXT,
    "instituicaoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "departamentoId" INTEGER,
    "motivoStatus" TEXT,
    "statusFuncionario" TEXT NOT NULL DEFAULT 'ATIVO',
    "agencia" TEXT,
    "banco" TEXT,
    "conta" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "dataDesligamento" TIMESTAMP(3),
    "jornadaTrabalho" TEXT,
    "pix" TEXT,
    "salario" DECIMAL(10,2),
    "tipoContrato" TEXT,
    "cargaHorariaMensal" INTEGER,
    "codigoPonto" TEXT,
    "pisPasep" TEXT,
    "salarioBase" DECIMAL(10,2),
    "recebeMensagemAniversario" BOOLEAN NOT NULL DEFAULT true,
    "recebeWhatsappAniversario" BOOLEAN NOT NULL DEFAULT true,
    "pontoMobileLiberado" BOOLEAN NOT NULL DEFAULT false,
    "pontoMobileLiberadoEm" TIMESTAMP(3),
    "pontoMobileLiberadoPorId" INTEGER,
    "pontoMobileValidoAte" TIMESTAMP(3),
    "pontoMobileConviteCriadoEm" TIMESTAMP(3),
    "pontoMobileConviteCriadoPorId" INTEGER,
    "pontoMobileConviteExpiraEm" TIMESTAMP(3),
    "pontoMobileConviteToken" TEXT,
    "pontoMobileConviteUsadoEm" TIMESTAMP(3),
    "cargaHorariaSemanal" DECIMAL(8,2),
    "duracaoHoraAulaMinutos" INTEGER,
    "observacoesRemuneracao" TEXT,
    "tipoRemuneracao" "TipoRemuneracaoRH",
    "valorHoraAula" DECIMAL(10,2),
    "valorHoraTrabalhada" DECIMAL(10,2),
    "valorPorAula" DECIMAL(10,2),
    "valorPorDisciplina" DECIMAL(10,2),
    "valorPorTurma" DECIMAL(10,2),

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuncionarioBeneficioRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "beneficioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "valor" DECIMAL(10,2),
    "percentual" DECIMAL(5,2),
    "descontaFolha" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuncionarioBeneficioRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuncionarioPermissao" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "chave" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuncionarioPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuncionarioPlanoComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "planoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "inicioVigencia" TIMESTAMP(3) NOT NULL,
    "fimVigencia" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "planoNomeSnapshot" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuncionarioPlanoComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoCobranca" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "alunoNome" TEXT,
    "lancamentoFinanceiroId" INTEGER,
    "responsavelId" INTEGER,
    "responsavelNome" TEXT,
    "canal" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "observacao" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoCobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataEvento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentoGerado" TEXT,
    "observacoes" TEXT,
    "criadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "HistoricoRH_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "HoleriteEventoRH" (
    "id" SERIAL NOT NULL,
    "holeriteId" INTEGER NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT NOT NULL,
    "referencia" TEXT,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "HoleriteEventoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoleriteRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "salarioBase" DECIMAL(10,2),
    "totalVencimentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDescontos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorLiquido" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "baseInss" DECIMAL(10,2),
    "baseFgts" DECIMAL(10,2),
    "fgtsMes" DECIMAL(10,2),
    "baseIrrf" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "arquivoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "arquivadoEm" TIMESTAMP(3),
    "arquivadoPorId" INTEGER,
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "canceladoEm" TIMESTAMP(3),
    "canceladoPorId" INTEGER,
    "motivoArquivo" TEXT,
    "motivoCancelamento" TEXT,
    "substituidoPorId" INTEGER,

    CONSTRAINT "HoleriteRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instituicao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dominio" TEXT,
    "slug" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'ESSENCIAL',
    "certificadoTemplateUrl" TEXT,
    "certificadoTextoPadrao" TEXT,
    "certificadoAssinaturaUrl" TEXT,
    "certificadoCidade" TEXT,
    "certificadoCoordenadorNome" TEXT,
    "certificadoPreviewUrl" TEXT,
    "proximoNumeroMatricula" INTEGER NOT NULL DEFAULT 1,
    "googleAdsAtivo" BOOLEAN NOT NULL DEFAULT false,
    "googleAdsId" TEXT,
    "googleAnalyticsAtivo" BOOLEAN NOT NULL DEFAULT false,
    "googleAnalyticsId" TEXT,
    "googleBusinessAtivo" BOOLEAN NOT NULL DEFAULT false,
    "googleBusinessUrl" TEXT,
    "googleTagManagerAtivo" BOOLEAN NOT NULL DEFAULT false,
    "googleTagManagerId" TEXT,
    "searchConsoleAtivo" BOOLEAN NOT NULL DEFAULT false,
    "searchConsoleDominio" TEXT,
    "googleSearchConsoleMeta" TEXT,
    "googleSearchConsoleAtivo" BOOLEAN NOT NULL DEFAULT false,
    "googleAnalyticsPropertyId" TEXT,
    "metaAccessToken" TEXT,
    "metaConectado" BOOLEAN NOT NULL DEFAULT false,
    "metaPageId" TEXT,
    "metaPageName" TEXT,
    "metaPageAccessToken" TEXT,
    "googleAdsAccountName" TEXT,
    "googleAdsCustomerId" TEXT,
    "googleAdsRefreshToken" TEXT,
    "googleBusinessAccountId" TEXT,
    "googleBusinessLocationId" TEXT,
    "googleBusinessName" TEXT,
    "googleBusinessRefreshToken" TEXT,
    "statusAssinatura" TEXT NOT NULL DEFAULT 'ATIVA',
    "emailRH" TEXT,
    "responsavelRH" TEXT,
    "telefoneRH" TEXT,
    "usaBancoHoras" BOOLEAN NOT NULL DEFAULT true,
    "usaControlePonto" BOOLEAN NOT NULL DEFAULT false,
    "isentaPagamento" BOOLEAN NOT NULL DEFAULT false,
    "motivoIsencao" TEXT,
    "frequenciaMinimaCertificado" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "liberarCertificadoAutomatico" BOOLEAN NOT NULL DEFAULT true,
    "mediaMinimaCertificado" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "regraLiberacaoCertificado" TEXT NOT NULL DEFAULT 'CURSO_COMPLETO',
    "certificadoAlturaBase" INTEGER NOT NULL DEFAULT 794,
    "certificadoCorFundoPagina" TEXT NOT NULL DEFAULT '#ffffff',
    "certificadoLarguraBase" INTEGER NOT NULL DEFAULT 1123,
    "certificadoModoFundo" TEXT NOT NULL DEFAULT 'modelo',
    "certificadoOrientacao" TEXT NOT NULL DEFAULT 'paisagem',
    "certificadoTamanhoPapel" TEXT NOT NULL DEFAULT 'A4',
    "aniversariantesAtivo" BOOLEAN NOT NULL DEFAULT true,
    "aniversarioEnviarChatPadrao" BOOLEAN NOT NULL DEFAULT true,
    "aniversarioEnviarWhatsappPadrao" BOOLEAN NOT NULL DEFAULT false,
    "aniversarioMensagemPadrao" TEXT,
    "aniversarioTituloPadrao" TEXT,

    CONSTRAINT "Instituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracaoPontoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "usuario" TEXT,
    "senha" TEXT,
    "token" TEXT,
    "ultimoSyncEm" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NAO_CONFIGURADA',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "coletorIdentificador" TEXT,
    "ipEquipamento" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'MANUAL',
    "porta" INTEGER,

    CONSTRAINT "IntegracaoPontoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMatricula" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "status" "StatusItemMatricula" NOT NULL DEFAULT 'A_CURSAR',
    "disciplinaId" INTEGER NOT NULL,
    "tipoItem" "TipoItemMatricula" NOT NULL DEFAULT 'GRADE_PRINCIPAL',

    CONSTRAINT "ItemMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "participanteComercialId" INTEGER,
    "planoId" INTEGER,
    "regraId" INTEGER,
    "pagamentoId" INTEGER,
    "holeriteEventoId" INTEGER,
    "criadoPorId" INTEGER,
    "aprovadoPorId" INTEGER,
    "reprovadoPorId" INTEGER,
    "estornadoPorId" INTEGER,
    "chaveCalculo" TEXT NOT NULL,
    "origem" "OrigemLancamentoComissaoRH" NOT NULL DEFAULT 'AUTOMATICA',
    "status" "StatusLancamentoComissaoRH" NOT NULL DEFAULT 'PENDENTE',
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "baseCalculo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percentualAplicado" DECIMAL(7,4),
    "valorFixoAplicado" DECIMAL(12,2),
    "percentualParticipacao" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "valorCalculado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorAprovado" DECIMAL(12,2),
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "planoNomeSnapshot" TEXT,
    "regraNomeSnapshot" TEXT,
    "alunoNomeSnapshot" TEXT,
    "cursoNomeSnapshot" TEXT,
    "matriculaNumeroSnapshot" TEXT,
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

    CONSTRAINT "LancamentoComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoLancamentoFinanceiro" NOT NULL,
    "descricao" TEXT,
    "valorOriginal" DOUBLE PRECISION NOT NULL,
    "valorPago" DOUBLE PRECISION DEFAULT 0,
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "status" "StatusLancamentoFinanceiro" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "matriculaId" INTEGER,
    "descontoValor" DOUBLE PRECISION DEFAULT 0,
    "jurosValor" DOUBLE PRECISION DEFAULT 0,
    "multaValor" DOUBLE PRECISION DEFAULT 0,
    "valorFinal" DOUBLE PRECISION DEFAULT 0,
    "poloId" INTEGER,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
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
    "enviadoHoleritePorId" INTEGER,

    CONSTRAINT "LancamentoRemuneracaoVariavelRH_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "LocalPontoMobileRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "raioMetros" INTEGER NOT NULL DEFAULT 150,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "bairro" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "complemento" TEXT,
    "estado" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,

    CONSTRAINT "LocalPontoMobileRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarcacaoPontoMobileRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "pontoFuncionarioRHId" INTEGER,
    "localId" INTEGER,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "fotoHash" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "precisaoMetros" DOUBLE PRECISION,
    "distanciaMetros" DOUBLE PRECISION,
    "statusLocalizacao" TEXT NOT NULL DEFAULT 'NAO_VERIFICADA',
    "reconhecimentoStatus" TEXT NOT NULL DEFAULT 'NAO_PROCESSADO',
    "similaridadeFacial" DOUBLE PRECISION,
    "provaVidaConfirmada" BOOLEAN,
    "origem" TEXT NOT NULL DEFAULT 'PWA',
    "dispositivoId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "comprovanteCodigo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotenciaChave" TEXT NOT NULL,
    "dataLocal" TIMESTAMP(3) NOT NULL,
    "fotoPathname" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'VALIDA',

    CONSTRAINT "MarcacaoPontoMobileRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAula" (
    "id" SERIAL NOT NULL,
    "tipo" "MaterialTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT,
    "arquivoNome" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,

    CONSTRAINT "MaterialAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "status" "StatusMatricula" NOT NULL DEFAULT 'ATIVA',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cursoId" INTEGER,
    "semestre" INTEGER,
    "dataPrimeiroVencimento" TIMESTAMP(3),
    "quantidadeParcelas" INTEGER,
    "valorMatricula" DECIMAL(10,2),
    "valorMensalidade" DECIMAL(10,2),
    "primeiroVencimento" TIMESTAMP(3),
    "quantidadeMensalidades" INTEGER,
    "cursoSemestreId" INTEGER,
    "periodoMatriculaId" INTEGER,
    "periodoLetivo" TEXT,
    "realizadaPeloAluno" BOOLEAN NOT NULL DEFAULT false,
    "confirmadaEm" TIMESTAMP(3),
    "poloId" INTEGER,
    "numeroMatricula" TEXT,
    "importadaSistemaAntigo" BOOLEAN NOT NULL DEFAULT false,
    "numeroMatriculaLegado" TEXT,
    "sistemaOrigem" TEXT,
    "modalidade" TEXT,
    "atendidoComercialEm" TIMESTAMP(3),
    "campanhaComercial" TEXT,
    "observacaoComercial" TEXT,
    "origemComercial" TEXT,
    "vendedorResponsavelId" INTEGER,
    "vendedorResponsavelNomeSnapshot" TEXT,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatriculaOnlineIbe" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "disciplinasIds" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "externalReference" TEXT NOT NULL,
    "asaasPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT,
    "modoPagamento" TEXT NOT NULL DEFAULT 'UNICO',
    "quantidadePartes" INTEGER NOT NULL DEFAULT 1,
    "valorPago" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "MatriculaOnlineIbe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatriculaOnlineIbePagamento" (
    "id" TEXT NOT NULL,
    "matriculaOnlineIbeId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipoIntegracao" TEXT NOT NULL DEFAULT 'CHECKOUT',
    "formaSolicitada" TEXT NOT NULL,
    "billingTypeAsaas" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "externalReference" TEXT NOT NULL,
    "asaasCheckoutId" TEXT,
    "asaasPaymentId" TEXT,
    "checkoutUrl" TEXT,
    "expiraEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriculaOnlineIbePagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatriculaParticipanteComercial" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "papel" "PapelParticipanteComercial" NOT NULL,
    "percentualParticipacao" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "funcionarioNomeSnapshot" TEXT NOT NULL,
    "funcionarioCargoSnapshot" TEXT,
    "funcionarioDepartamentoSnapshot" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriculaParticipanteComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoCaixa" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMovimentoCaixa" NOT NULL,
    "descricao" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "formaPagamento" "FormaPagamento",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "caixaId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "lancamentoId" INTEGER,
    "asaasPaymentId" TEXT,
    "externalReference" TEXT,
    "origem" TEXT,

    CONSTRAINT "MovimentoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turmaId" INTEGER NOT NULL,
    "atividadeId" INTEGER,
    "instituicaoId" INTEGER NOT NULL,
    "observacao" TEXT,
    "peso" DOUBLE PRECISION,
    "provaId" INTEGER,
    "tipo" "NotaTipo" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT DEFAULT 'SISTEMA',
    "chaveAgrupada" TEXT,
    "instituicaoId" INTEGER,
    "quantidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcorrenciaRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTRADA',
    "dataEvento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "dias" INTEGER,
    "cid" TEXT,
    "dataPericia" TIMESTAMP(3),
    "resultadoPericia" TEXT,
    "documentoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "arquivadaEm" TIMESTAMP(3),
    "arquivadaPorId" INTEGER,
    "motivoArquivo" TEXT,

    CONSTRAINT "OcorrenciaRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ouvidoria" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "origem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "sentimento" TEXT NOT NULL DEFAULT 'NEUTRO',
    "resposta" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "anonimo" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ouvidoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OuvidoriaPhanyx" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT,
    "mensagem" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "resposta" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OuvidoriaPhanyx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" SERIAL NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL,
    "pagoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formaPagamento" "FormaPagamento",
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "lancamentoId" INTEGER NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "PlanoComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicioVigencia" TIMESTAMP(3),
    "fimVigencia" TIMESTAMP(3),
    "exigePagamentoConfirmado" BOOLEAN NOT NULL DEFAULT true,
    "permiteCompartilhamento" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Polo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "cnpj" TEXT,

    CONSTRAINT "Polo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PontoFuncionarioRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "entrada" TIMESTAMP(3),
    "saidaAlmoco" TIMESTAMP(3),
    "retornoAlmoco" TIMESTAMP(3),
    "saida" TIMESTAMP(3),
    "horasTrabalhadas" DECIMAL(10,2),
    "horasExtras" DECIMAL(10,2),
    "horasAtraso" DECIMAL(10,2),
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PontoFuncionarioRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenciaAgendaOperacional" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "colunasTabela" JSONB,
    "colunasPdf" JSONB,
    "colunasExcel" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaAgendaOperacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaAula" (
    "id" SERIAL NOT NULL,
    "status" "StatusPresencaAula" NOT NULL DEFAULT 'PRESENTE',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "substituicaoDocenteId" INTEGER,

    CONSTRAINT "PresencaAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codigoFuncionario" TEXT,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "documentoUrl" TEXT,
    "especialidade" TEXT,
    "formacao" TEXT,
    "fotoPerfil" TEXT,
    "miniBio" TEXT,
    "rg" TEXT,
    "slug" TEXT,
    "telefone" TEXT,
    "titulacao" TEXT,
    "poloId" INTEGER,
    "departamentoId" INTEGER,
    "motivoStatus" TEXT,
    "recebeMensagemAniversario" BOOLEAN NOT NULL DEFAULT true,
    "recebeWhatsappAniversario" BOOLEAN NOT NULL DEFAULT true,
    "statusProfessor" TEXT NOT NULL DEFAULT 'ATIVO',
    "areaAtuacao" TEXT,
    "funcionarioId" INTEGER,

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ProgressoAula" (
    "id" SERIAL NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "tempoAssistidoSegundos" INTEGER NOT NULL DEFAULT 0,
    "tempoMinimoSegundos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgressoAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prova" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "notaMaxima" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,
    "disponivelEm" TIMESTAMP(3),
    "encerradaAt" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3),
    "instituicaoId" INTEGER NOT NULL,
    "publicadaAt" TIMESTAMP(3),
    "status" "StatusProva" NOT NULL DEFAULT 'RASCUNHO',
    "tempoMin" INTEGER,
    "tentativasMax" INTEGER NOT NULL DEFAULT 1,
    "turmaId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mostrarNotaAoFinal" BOOLEAN NOT NULL DEFAULT false,
    "notaDisponivelEm" TIMESTAMP(3),
    "exigirAulasConcluidas" BOOLEAN NOT NULL DEFAULT false,
    "tipoPublico" TEXT NOT NULL DEFAULT 'TURMA',
    "substituicaoDocenteId" INTEGER,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvaAluno" (
    "id" SERIAL NOT NULL,
    "provaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvaAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questao" (
    "id" SERIAL NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "provaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enunciado" TEXT NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "respostaModelo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipo" "QuestaoTipo" NOT NULL,

    CONSTRAINT "Questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraComissaoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "planoId" INTEGER NOT NULL,
    "cursoId" INTEGER,
    "criadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoRegraComissaoRH" NOT NULL,
    "baseCalculo" "BaseCalculoComissaoRH" NOT NULL,
    "gatilho" "GatilhoComissaoRH" NOT NULL,
    "percentual" DECIMAL(7,4),
    "valorFixo" DECIMAL(12,2),
    "quantidadeMinima" INTEGER,
    "quantidadeMaxima" INTEGER,
    "usarValorLiquidoRecebido" BOOLEAN NOT NULL DEFAULT true,
    "estornarEmCancelamento" BOOLEAN NOT NULL DEFAULT true,
    "estornarEmInadimplencia" BOOLEAN NOT NULL DEFAULT false,
    "diasCarenciaEstorno" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraComissaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RescisaoRH" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "tipo" TEXT NOT NULL,
    "dataAviso" TIMESTAMP(3),
    "dataDesligamento" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacoes" TEXT,
    "termoUrl" TEXT,
    "trctUrl" TEXT,
    "checklistUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "avisoPrevio" DECIMAL(10,2),
    "decimoTerceiroProporcional" DECIMAL(10,2),
    "feriasProporcionais" DECIMAL(10,2),
    "feriasVencidas" DECIMAL(10,2),
    "saldoSalario" DECIMAL(10,2),
    "valorRescisao" DECIMAL(10,2),
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "arquivadaEm" TIMESTAMP(3),
    "arquivadaPorId" INTEGER,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "canceladaEm" TIMESTAMP(3),
    "canceladaPorId" INTEGER,
    "motivoArquivo" TEXT,
    "motivoCancelamento" TEXT,
    "restauradoEm" TIMESTAMP(3),
    "restauradoPorId" INTEGER,
    "motivoRestauracao" TEXT,
    "calculoAutomatico" BOOLEAN NOT NULL DEFAULT true,
    "dataAdmissaoBase" TIMESTAMP(3),
    "dataComunicacaoOficial" TIMESTAMP(3),
    "descontoInss" DECIMAL(10,2),
    "descontoIrrf" DECIMAL(10,2),
    "diasAvisoPrevioIndenizado" INTEGER DEFAULT 0,
    "diasAvisoPrevioTrabalhado" INTEGER DEFAULT 0,
    "mesesDecimoTerceiro" INTEGER DEFAULT 0,
    "mesesFeriasProporcionais" INTEGER DEFAULT 0,
    "multaFgts" DECIMAL(10,2),
    "outrosDescontos" DECIMAL(10,2),
    "possuiFeriasVencidas" BOOLEAN NOT NULL DEFAULT false,
    "quantidadeDependentesIRRF" INTEGER DEFAULT 0,
    "quantidadeFeriasVencidas" INTEGER DEFAULT 0,
    "quantidadeFilhosSalarioFamilia" INTEGER DEFAULT 0,
    "salarioBaseMensal" DECIMAL(10,2),
    "saldoFgts" DECIMAL(10,2),
    "tipoAvisoPrevio" TEXT,
    "valorBrutoRescisao" DECIMAL(10,2),
    "valorLiquidoRescisao" DECIMAL(10,2),
    "fgtsMesAnterior" DECIMAL(10,2),
    "fgtsMesRescisao" DECIMAL(10,2),
    "motivoRescisaoDetalhado" TEXT,

    CONSTRAINT "RescisaoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaProva" (
    "id" SERIAL NOT NULL,
    "respostaTexto" TEXT,
    "correta" BOOLEAN,
    "nota" DOUBLE PRECISION,
    "feedback" TEXT,
    "corrigidaManual" BOOLEAN NOT NULL DEFAULT false,
    "corrigidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tentativaId" INTEGER NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "alternativaId" INTEGER,
    "alunoId" INTEGER,

    CONSTRAINT "RespostaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoFinal" (
    "id" SERIAL NOT NULL,
    "media" DOUBLE PRECISION,
    "frequencia" DOUBLE PRECISION,
    "situacao" "SituacaoFinal" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacao" TEXT,
    "fechadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,

    CONSTRAINT "ResultadoFinal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reuniao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "link" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "publicoTipo" TEXT NOT NULL,
    "setor" TEXT,
    "turmaId" INTEGER,
    "cursoId" INTEGER,
    "enviarWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "enviarChat" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "professorId" INTEGER,

    CONSTRAINT "Reuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReuniaoParticipante" (
    "id" SERIAL NOT NULL,
    "reuniaoId" INTEGER NOT NULL,
    "userId" INTEGER,
    "alunoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONVIDADO',
    "avisadoEm" TIMESTAMP(3),
    "entrouEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReuniaoParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoCorrecaoPontoItemRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "solicitacaoId" INTEGER NOT NULL,
    "marcacaoOriginalId" INTEGER,
    "marcacaoGeradaId" INTEGER,
    "acao" TEXT NOT NULL,
    "tipoOriginal" TEXT,
    "dataHoraOriginal" TIMESTAMP(3),
    "tipoProposto" TEXT,
    "dataHoraProposta" TIMESTAMP(3),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitacaoCorrecaoPontoItemRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoCorrecaoPontoRH" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "autorizacaoId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "pontoFuncionarioRHId" INTEGER,
    "dataLocal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "motivoFuncionario" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "enviadoEm" TIMESTAMP(3),
    "aplicadoEm" TIMESTAMP(3),
    "aplicadoPorId" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "dispositivoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitacaoCorrecaoPontoRH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituicaoDocente" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "professorTitularId" INTEGER NOT NULL,
    "professorSubstitutoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "motivo" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorId" INTEGER,
    "canceladoEm" TIMESTAMP(3),
    "canceladoPorId" INTEGER,
    "motivoCancelamento" TEXT,

    CONSTRAINT "SubstituicaoDocente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxaAvulsa" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'PERSONALIZADA',
    "valor" DECIMAL(10,2) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "exigeVencimento" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxaAvulsa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaProva" (
    "id" SERIAL NOT NULL,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alunoId" INTEGER NOT NULL,
    "provaId" INTEGER NOT NULL,
    "corrigidaEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "instituicaoId" INTEGER NOT NULL,
    "notaFinal" DOUBLE PRECISION,
    "notaObjetiva" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusTentativa" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "tentativaNumero" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "professorId" INTEGER,
    "instituicaoId" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "codigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodoLetivo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "capacidadeMaxima" INTEGER,
    "capacidadeMinima" INTEGER,
    "statusTurma" "StatusTurma" NOT NULL DEFAULT 'AGUARDANDO',
    "poloId" INTEGER,
    "cursoId" INTEGER,
    "dataFim" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3),
    "ala" TEXT,
    "andar" TEXT,
    "predio" TEXT,
    "sala" TEXT,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaDisciplina" (
    "id" SERIAL NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3),
    "professorId" INTEGER,
    "status" TEXT,
    "turmaSemestreId" INTEGER,

    CONSTRAINT "TurmaDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaDisciplinaHorario" (
    "id" SERIAL NOT NULL,
    "turmaDisciplinaId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaDisciplinaHorario_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL,
    "ultimoLoginAt" TIMESTAMP(3),
    "isMasterAdmin" BOOLEAN NOT NULL DEFAULT false,
    "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpira" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitante" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER,
    "nome" TEXT NOT NULL,
    "documentoTipo" TEXT,
    "documentoNumero" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "empresa" TEXT,
    "destino" TEXT,
    "pessoaVisitada" TEXT,
    "setorVisitado" TEXT,
    "motivo" TEXT,
    "evento" TEXT,
    "fotoPerfil" TEXT,
    "codigoVisitante" TEXT NOT NULL,
    "codigoCracha" TEXT,
    "status" "StatusVisitante" NOT NULL DEFAULT 'AGUARDANDO',
    "entradaPrevistaEm" TIMESTAMP(3),
    "entradaEm" TIMESTAMP(3),
    "saidaPrevistaEm" TIMESTAMP(3),
    "saidaEm" TIMESTAMP(3),
    "crachaEmitidoEm" TIMESTAMP(3),
    "crachaValidoAte" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "arquivadoEm" TIMESTAMP(3),
    "arquivadoPorId" INTEGER,
    "motivoArquivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_acao_idx" ON "AjusteMarcacaoPontoRH"("acao" ASC);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_criadoEm_idx" ON "AjusteMarcacaoPontoRH"("criadoEm" ASC);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_criadoPorId_idx" ON "AjusteMarcacaoPontoRH"("criadoPorId" ASC);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_funcionarioId_idx" ON "AjusteMarcacaoPontoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_instituicaoId_funcionarioId_criadoEm_idx" ON "AjusteMarcacaoPontoRH"("instituicaoId" ASC, "funcionarioId" ASC, "criadoEm" ASC);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_instituicaoId_idx" ON "AjusteMarcacaoPontoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AjusteMarcacaoPontoRH_marcacaoId_idx" ON "AjusteMarcacaoPontoRH"("marcacaoId" ASC);

-- CreateIndex
CREATE INDEX "Alternativa_instituicaoId_idx" ON "Alternativa"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_idx" ON "Alternativa"("questaoId" ASC);

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_ordem_idx" ON "Alternativa"("questaoId" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "Aluno_cpf_idx" ON "Aluno"("cpf" ASC);

-- CreateIndex
CREATE INDEX "Aluno_instituicaoId_idx" ON "Aluno"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_instituicaoId_matricula_key" ON "Aluno"("instituicaoId" ASC, "matricula" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_instituicaoId_slug_key" ON "Aluno"("instituicaoId" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "Aluno_nome_idx" ON "Aluno"("nome" ASC);

-- CreateIndex
CREATE INDEX "Aluno_poloId_idx" ON "Aluno"("poloId" ASC);

-- CreateIndex
CREATE INDEX "Aluno_statusAluno_idx" ON "Aluno"("statusAluno" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_userId_key" ON "Aluno"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_contratoId_key" ON "Assinatura"("contratoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaPhanyx_adesaoInstituicaoId_key" ON "AssinaturaPhanyx"("adesaoInstituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AssinaturaPhanyx_asaasCustomerId_idx" ON "AssinaturaPhanyx"("asaasCustomerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaPhanyx_asaasSubscriptionId_key" ON "AssinaturaPhanyx"("asaasSubscriptionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaPhanyx_instituicaoId_key" ON "AssinaturaPhanyx"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AssinaturaPhanyx_plano_idx" ON "AssinaturaPhanyx"("plano" ASC);

-- CreateIndex
CREATE INDEX "AssinaturaPhanyx_primeiraCobrancaEm_idx" ON "AssinaturaPhanyx"("primeiraCobrancaEm" ASC);

-- CreateIndex
CREATE INDEX "AssinaturaPhanyx_status_idx" ON "AssinaturaPhanyx"("status" ASC);

-- CreateIndex
CREATE INDEX "AssinaturaPhanyx_testeGratisFimEm_idx" ON "AssinaturaPhanyx"("testeGratisFimEm" ASC);

-- CreateIndex
CREATE INDEX "AtestadoMedico_alunoId_idx" ON "AtestadoMedico"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "AtestadoMedico_instituicaoId_idx" ON "AtestadoMedico"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AtestadoMedico_status_idx" ON "AtestadoMedico"("status" ASC);

-- CreateIndex
CREATE INDEX "Atividade_criadoPorId_idx" ON "Atividade"("criadoPorId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_disciplinaId_idx" ON "Atividade"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_instituicaoId_idx" ON "Atividade"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_instituicaoId_professorResponsavelId_idx" ON "Atividade"("instituicaoId" ASC, "professorResponsavelId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_instituicaoId_status_idx" ON "Atividade"("instituicaoId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Atividade_instituicaoId_turmaId_disciplinaId_idx" ON "Atividade"("instituicaoId" ASC, "turmaId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_professorResponsavelId_idx" ON "Atividade"("professorResponsavelId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_publicadoPorId_idx" ON "Atividade"("publicadoPorId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_status_idx" ON "Atividade"("status" ASC);

-- CreateIndex
CREATE INDEX "Atividade_substituicaoDocenteId_idx" ON "Atividade"("substituicaoDocenteId" ASC);

-- CreateIndex
CREATE INDEX "Atividade_turmaId_idx" ON "Atividade"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "AtividadeAnexo_atividadeId_idx" ON "AtividadeAnexo"("atividadeId" ASC);

-- CreateIndex
CREATE INDEX "AtividadeAnexo_criadoPorId_idx" ON "AtividadeAnexo"("criadoPorId" ASC);

-- CreateIndex
CREATE INDEX "AtividadeAnexo_instituicaoId_idx" ON "AtividadeAnexo"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_codigoConsultado_idx" ON "AuditoriaValidacaoDocumento"("codigoConsultado" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_criadoEm_idx" ON "AuditoriaValidacaoDocumento"("criadoEm" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_documentoId_idx" ON "AuditoriaValidacaoDocumento"("documentoId" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_instituicaoId_idx" ON "AuditoriaValidacaoDocumento"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_ip_idx" ON "AuditoriaValidacaoDocumento"("ip" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaValidacaoDocumento_suspeito_idx" ON "AuditoriaValidacaoDocumento"("suspeito" ASC);

-- CreateIndex
CREATE INDEX "Aula_disciplinaId_idx" ON "Aula"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "Aula_instituicaoId_idx" ON "Aula"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Aula_moduloId_idx" ON "Aula"("moduloId" ASC);

-- CreateIndex
CREATE INDEX "Aula_substituicaoDocenteId_idx" ON "Aula"("substituicaoDocenteId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Aula_turmaId_disciplinaId_ordem_key" ON "Aula"("turmaId" ASC, "disciplinaId" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "Aula_turmaId_idx" ON "Aula"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_autorizadoPorId_idx" ON "AutorizacaoCorrecaoPontoRH"("autorizadoPorId" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_canceladoPorId_idx" ON "AutorizacaoCorrecaoPontoRH"("canceladoPorId" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_dataLocal_idx" ON "AutorizacaoCorrecaoPontoRH"("dataLocal" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_funcionarioId_idx" ON "AutorizacaoCorrecaoPontoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_instituicaoId_idx" ON "AutorizacaoCorrecaoPontoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_pontoFuncionarioRHId_idx" ON "AutorizacaoCorrecaoPontoRH"("pontoFuncionarioRHId" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_status_idx" ON "AutorizacaoCorrecaoPontoRH"("status" ASC);

-- CreateIndex
CREATE INDEX "AutorizacaoCorrecaoPontoRH_validoAte_idx" ON "AutorizacaoCorrecaoPontoRH"("validoAte" ASC);

-- CreateIndex
CREATE INDEX "idx_aut_correcao_inst_func_data" ON "AutorizacaoCorrecaoPontoRH"("instituicaoId" ASC, "funcionarioId" ASC, "dataLocal" ASC);

-- CreateIndex
CREATE INDEX "idx_aut_correcao_inst_status_validade" ON "AutorizacaoCorrecaoPontoRH"("instituicaoId" ASC, "status" ASC, "validoAte" ASC);

-- CreateIndex
CREATE INDEX "AvisoWhatsappCorrecaoPontoRH_agendadoEm_idx" ON "AvisoWhatsappCorrecaoPontoRH"("agendadoEm" ASC);

-- CreateIndex
CREATE INDEX "AvisoWhatsappCorrecaoPontoRH_autorizacaoId_idx" ON "AvisoWhatsappCorrecaoPontoRH"("autorizacaoId" ASC);

-- CreateIndex
CREATE INDEX "AvisoWhatsappCorrecaoPontoRH_destinatarioUsuarioId_idx" ON "AvisoWhatsappCorrecaoPontoRH"("destinatarioUsuarioId" ASC);

-- CreateIndex
CREATE INDEX "AvisoWhatsappCorrecaoPontoRH_instituicaoId_idx" ON "AvisoWhatsappCorrecaoPontoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "AvisoWhatsappCorrecaoPontoRH_solicitacaoId_idx" ON "AvisoWhatsappCorrecaoPontoRH"("solicitacaoId" ASC);

-- CreateIndex
CREATE INDEX "AvisoWhatsappCorrecaoPontoRH_status_idx" ON "AvisoWhatsappCorrecaoPontoRH"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_whats_correcao_inst_status_agenda" ON "AvisoWhatsappCorrecaoPontoRH"("instituicaoId" ASC, "status" ASC, "agendadoEm" ASC);

-- CreateIndex
CREATE INDEX "BancoHorasRH_data_idx" ON "BancoHorasRH"("data" ASC);

-- CreateIndex
CREATE INDEX "BancoHorasRH_funcionarioId_idx" ON "BancoHorasRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "BancoHorasRH_instituicaoId_idx" ON "BancoHorasRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "BancoHorasRH_pontoId_idx" ON "BancoHorasRH"("pontoId" ASC);

-- CreateIndex
CREATE INDEX "BancoHorasRH_tipo_idx" ON "BancoHorasRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "BeneficioRH_ativo_idx" ON "BeneficioRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "BeneficioRH_instituicaoId_idx" ON "BeneficioRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "BeneficioRH_tipo_idx" ON "BeneficioRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "BloqueioIP_ativo_idx" ON "BloqueioIP"("ativo" ASC);

-- CreateIndex
CREATE INDEX "BloqueioIP_bloqueadoAte_idx" ON "BloqueioIP"("bloqueadoAte" ASC);

-- CreateIndex
CREATE INDEX "BloqueioIP_ip_idx" ON "BloqueioIP"("ip" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CacheGeocodificacaoEndereco_chave_key" ON "CacheGeocodificacaoEndereco"("chave" ASC);

-- CreateIndex
CREATE INDEX "CacheGeocodificacaoEndereco_provedor_idx" ON "CacheGeocodificacaoEndereco"("provedor" ASC);

-- CreateIndex
CREATE INDEX "CacheGeocodificacaoEndereco_ultimoUsoEm_idx" ON "CacheGeocodificacaoEndereco"("ultimoUsoEm" ASC);

-- CreateIndex
CREATE INDEX "Caixa_instituicaoId_idx" ON "Caixa"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Caixa_status_idx" ON "Caixa"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_alunoId_disciplinaId_key" ON "Certificado"("alunoId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "Certificado_alunoId_idx" ON "Certificado"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "Certificado_certificadoModeloId_idx" ON "Certificado"("certificadoModeloId" ASC);

-- CreateIndex
CREATE INDEX "Certificado_certificadoModeloVersaoId_idx" ON "Certificado"("certificadoModeloVersaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_codigo_key" ON "Certificado"("codigo" ASC);

-- CreateIndex
CREATE INDEX "Certificado_disciplinaId_idx" ON "Certificado"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "Certificado_instituicaoId_idx" ON "Certificado"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CertificadoCampo_certificadoModeloVersaoId_idx" ON "CertificadoCampo"("certificadoModeloVersaoId" ASC);

-- CreateIndex
CREATE INDEX "CertificadoCampo_instituicaoId_idx" ON "CertificadoCampo"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CertificadoCampo_tipo_idx" ON "CertificadoCampo"("tipo" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModelo_criadoPorId_idx" ON "CertificadoModelo"("criadoPorId" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModelo_instituicaoId_ativo_arquivado_idx" ON "CertificadoModelo"("instituicaoId" ASC, "ativo" ASC, "arquivado" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModelo_instituicaoId_idx" ON "CertificadoModelo"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModelo_instituicaoId_modalidade_idx" ON "CertificadoModelo"("instituicaoId" ASC, "modalidade" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModelo_publicadoPorId_idx" ON "CertificadoModelo"("publicadoPorId" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModeloVersao_modeloId_idx" ON "CertificadoModeloVersao"("modeloId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CertificadoModeloVersao_modeloId_tipo_key" ON "CertificadoModeloVersao"("modeloId" ASC, "tipo" ASC);

-- CreateIndex
CREATE INDEX "CertificadoModeloVersao_tipo_idx" ON "CertificadoModeloVersao"("tipo" ASC);

-- CreateIndex
CREATE INDEX "ChatAnexo_mensagemId_idx" ON "ChatAnexo"("mensagemId" ASC);

-- CreateIndex
CREATE INDEX "ChatConversa_instituicaoId_idx" ON "ChatConversa"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ChatMensagem_autorId_idx" ON "ChatMensagem"("autorId" ASC);

-- CreateIndex
CREATE INDEX "ChatMensagem_conversaId_idx" ON "ChatMensagem"("conversaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipante_conversaId_usuarioId_key" ON "ChatParticipante"("conversaId" ASC, "usuarioId" ASC);

-- CreateIndex
CREATE INDEX "ChatParticipante_usuarioId_idx" ON "ChatParticipante"("usuarioId" ASC);

-- CreateIndex
CREATE INDEX "ChatPresenca_instituicaoId_idx" ON "ChatPresenca"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ChatPresenca_status_idx" ON "ChatPresenca"("status" ASC);

-- CreateIndex
CREATE INDEX "ChatPresenca_usuarioId_idx" ON "ChatPresenca"("usuarioId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChatPresenca_usuarioId_key" ON "ChatPresenca"("usuarioId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutPagamento_asaasPaymentId_key" ON "CheckoutPagamento"("asaasPaymentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoFinanceiraInstituicao_instituicaoId_key" ON "ConfiguracaoFinanceiraInstituicao"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoInstituicao_instituicaoId_key" ON "ConfiguracaoInstituicao"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ConfiguracaoPontoMobileRH_ativo_idx" ON "ConfiguracaoPontoMobileRH"("ativo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoPontoMobileRH_instituicaoId_key" ON "ConfiguracaoPontoMobileRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ConfiguracaoPortalInstituicao_chavePagina_idx" ON "ConfiguracaoPortalInstituicao"("chavePagina" ASC);

-- CreateIndex
CREATE INDEX "ConfiguracaoPortalInstituicao_instituicaoId_idx" ON "ConfiguracaoPortalInstituicao"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoPortalInstituicao_instituicaoId_portal_chavePag_key" ON "ConfiguracaoPortalInstituicao"("instituicaoId" ASC, "portal" ASC, "chavePagina" ASC);

-- CreateIndex
CREATE INDEX "ConfiguracaoPortalInstituicao_portal_idx" ON "ConfiguracaoPortalInstituicao"("portal" ASC);

-- CreateIndex
CREATE INDEX "Contrato_alunoId_idx" ON "Contrato"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "Contrato_instituicaoId_idx" ON "Contrato"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Contrato_matriculaId_idx" ON "Contrato"("matriculaId" ASC);

-- CreateIndex
CREATE INDEX "Contrato_status_idx" ON "Contrato"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_tokenAssinatura_key" ON "Contrato"("tokenAssinatura" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CrachaEmitido_codigoCracha_key" ON "CrachaEmitido"("codigoCracha" ASC);

-- CreateIndex
CREATE INDEX "CrachaEmitido_instituicaoId_idx" ON "CrachaEmitido"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CrachaEmitido_modeloId_idx" ON "CrachaEmitido"("modeloId" ASC);

-- CreateIndex
CREATE INDEX "CrachaEmitido_tipoPessoa_pessoaId_idx" ON "CrachaEmitido"("tipoPessoa" ASC, "pessoaId" ASC);

-- CreateIndex
CREATE INDEX "CrachaLoteEmissao_instituicaoId_idx" ON "CrachaLoteEmissao"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CrachaLoteEmissao_modeloId_idx" ON "CrachaLoteEmissao"("modeloId" ASC);

-- CreateIndex
CREATE INDEX "CrachaLoteEmissao_status_idx" ON "CrachaLoteEmissao"("status" ASC);

-- CreateIndex
CREATE INDEX "CrachaModelo_criadoPorId_idx" ON "CrachaModelo"("criadoPorId" ASC);

-- CreateIndex
CREATE INDEX "CrachaModelo_instituicaoId_ativo_idx" ON "CrachaModelo"("instituicaoId" ASC, "ativo" ASC);

-- CreateIndex
CREATE INDEX "CrachaModelo_instituicaoId_idx" ON "CrachaModelo"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CrachaModelo_instituicaoId_tipoPessoa_idx" ON "CrachaModelo"("instituicaoId" ASC, "tipoPessoa" ASC);

-- CreateIndex
CREATE INDEX "CrachaModelo_instituicaoId_tipoPessoa_padrao_idx" ON "CrachaModelo"("instituicaoId" ASC, "tipoPessoa" ASC, "padrao" ASC);

-- CreateIndex
CREATE INDEX "CreditoIA_userId_idx" ON "CreditoIA"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CreditoIA_userId_key" ON "CreditoIA"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CreditoIAPublico_email_key" ON "CreditoIAPublico"("email" ASC);

-- CreateIndex
CREATE INDEX "Curso_certificadoModeloId_idx" ON "Curso"("certificadoModeloId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Curso_instituicaoId_codigo_key" ON "Curso"("instituicaoId" ASC, "codigo" ASC);

-- CreateIndex
CREATE INDEX "Curso_instituicaoId_idx" ON "Curso"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Curso_instituicaoId_modalidadeCertificado_idx" ON "Curso"("instituicaoId" ASC, "modalidadeCertificado" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Curso_instituicaoId_nome_key" ON "Curso"("instituicaoId" ASC, "nome" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CursoDisciplinaExtraPermitida_cursoId_disciplinaId_key" ON "CursoDisciplinaExtraPermitida"("cursoId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_cursoId_idx" ON "CursoDisciplinaExtraPermitida"("cursoId" ASC);

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_disciplinaId_idx" ON "CursoDisciplinaExtraPermitida"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "CursoDisciplinaExtraPermitida_instituicaoId_idx" ON "CursoDisciplinaExtraPermitida"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CursoPolo_cursoId_idx" ON "CursoPolo"("cursoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CursoPolo_cursoId_poloId_key" ON "CursoPolo"("cursoId" ASC, "poloId" ASC);

-- CreateIndex
CREATE INDEX "CursoPolo_instituicaoId_idx" ON "CursoPolo"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "CursoPolo_poloId_idx" ON "CursoPolo"("poloId" ASC);

-- CreateIndex
CREATE INDEX "CursoSemestre_cursoId_idx" ON "CursoSemestre"("cursoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CursoSemestre_cursoId_numero_key" ON "CursoSemestre"("cursoId" ASC, "numero" ASC);

-- CreateIndex
CREATE INDEX "CursoSemestre_instituicaoId_idx" ON "CursoSemestre"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CursoSemestreDisciplina_cursoSemestreId_disciplinaId_key" ON "CursoSemestreDisciplina"("cursoSemestreId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "CursoSemestreDisciplina_cursoSemestreId_idx" ON "CursoSemestreDisciplina"("cursoSemestreId" ASC);

-- CreateIndex
CREATE INDEX "CursoSemestreDisciplina_disciplinaId_idx" ON "CursoSemestreDisciplina"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "CursoSemestreDisciplina_instituicaoId_idx" ON "CursoSemestreDisciplina"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Departamento_instituicaoId_idx" ON "Departamento"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_instituicaoId_nome_key" ON "Departamento"("instituicaoId" ASC, "nome" ASC);

-- CreateIndex
CREATE INDEX "DepartamentoPermissao_chave_idx" ON "DepartamentoPermissao"("chave" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DepartamentoPermissao_departamentoId_chave_key" ON "DepartamentoPermissao"("departamentoId" ASC, "chave" ASC);

-- CreateIndex
CREATE INDEX "DepartamentoPermissao_departamentoId_idx" ON "DepartamentoPermissao"("departamentoId" ASC);

-- CreateIndex
CREATE INDEX "Disciplina_cursoId_idx" ON "Disciplina"("cursoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_instituicaoId_codigo_key" ON "Disciplina"("instituicaoId" ASC, "codigo" ASC);

-- CreateIndex
CREATE INDEX "Disciplina_instituicaoId_idx" ON "Disciplina"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_instituicaoId_nome_key" ON "Disciplina"("instituicaoId" ASC, "nome" ASC);

-- CreateIndex
CREATE INDEX "Disciplina_professorId_idx" ON "Disciplina"("professorId" ASC);

-- CreateIndex
CREATE INDEX "DisciplinaPreRequisito_disciplinaId_idx" ON "DisciplinaPreRequisito"("disciplinaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaPreRequisito_disciplinaId_prerequisitoId_key" ON "DisciplinaPreRequisito"("disciplinaId" ASC, "prerequisitoId" ASC);

-- CreateIndex
CREATE INDEX "DisciplinaPreRequisito_instituicaoId_idx" ON "DisciplinaPreRequisito"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "DisciplinaPreRequisito_prerequisitoId_idx" ON "DisciplinaPreRequisito"("prerequisitoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoAluno_alunoId_idx" ON "DocumentoAluno"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoAluno_instituicaoId_idx" ON "DocumentoAluno"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoAluno_proprietario_idx" ON "DocumentoAluno"("proprietario" ASC);

-- CreateIndex
CREATE INDEX "DocumentoAluno_tipo_idx" ON "DocumentoAluno"("tipo" ASC);

-- CreateIndex
CREATE INDEX "DocumentoGerado_alunoId_idx" ON "DocumentoGerado"("alunoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoGerado_codigoValidacao_key" ON "DocumentoGerado"("codigoValidacao" ASC);

-- CreateIndex
CREATE INDEX "DocumentoGerado_instituicaoId_idx" ON "DocumentoGerado"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoGerado_matriculaId_idx" ON "DocumentoGerado"("matriculaId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoGerado_status_idx" ON "DocumentoGerado"("status" ASC);

-- CreateIndex
CREATE INDEX "DocumentoGerado_templateId_idx" ON "DocumentoGerado"("templateId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoGerado_tipo_idx" ON "DocumentoGerado"("tipo" ASC);

-- CreateIndex
CREATE INDEX "DocumentoProfessor_instituicaoId_idx" ON "DocumentoProfessor"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoProfessor_professorId_idx" ON "DocumentoProfessor"("professorId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoProfessor_status_idx" ON "DocumentoProfessor"("status" ASC);

-- CreateIndex
CREATE INDEX "DocumentoProfessor_tipo_idx" ON "DocumentoProfessor"("tipo" ASC);

-- CreateIndex
CREATE INDEX "DocumentoRH_funcionarioId_idx" ON "DocumentoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoRH_instituicaoId_idx" ON "DocumentoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoRH_status_idx" ON "DocumentoRH"("status" ASC);

-- CreateIndex
CREATE INDEX "DocumentoRH_templateId_idx" ON "DocumentoRH"("templateId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoRH_tipo_idx" ON "DocumentoRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "DocumentoTemplate_ativo_idx" ON "DocumentoTemplate"("ativo" ASC);

-- CreateIndex
CREATE INDEX "DocumentoTemplate_instituicaoId_idx" ON "DocumentoTemplate"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "DocumentoTemplate_tipo_idx" ON "DocumentoTemplate"("tipo" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividade_alunoId_idx" ON "EntregaAtividade"("alunoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EntregaAtividade_atividadeId_alunoId_key" ON "EntregaAtividade"("atividadeId" ASC, "alunoId" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividade_atividadeId_idx" ON "EntregaAtividade"("atividadeId" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividade_instituicaoId_idx" ON "EntregaAtividade"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividadeHistorico_alunoId_idx" ON "EntregaAtividadeHistorico"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividadeHistorico_atividadeId_idx" ON "EntregaAtividadeHistorico"("atividadeId" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividadeHistorico_entregaId_idx" ON "EntregaAtividadeHistorico"("entregaId" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividadeHistorico_entregaId_versao_idx" ON "EntregaAtividadeHistorico"("entregaId" ASC, "versao" ASC);

-- CreateIndex
CREATE INDEX "EntregaAtividadeHistorico_instituicaoId_idx" ON "EntregaAtividadeHistorico"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "EscalaTrabalhoRH_ativo_idx" ON "EscalaTrabalhoRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "EscalaTrabalhoRH_diaSemana_idx" ON "EscalaTrabalhoRH"("diaSemana" ASC);

-- CreateIndex
CREATE INDEX "EscalaTrabalhoRH_funcionarioId_idx" ON "EscalaTrabalhoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "EscalaTrabalhoRH_instituicaoId_idx" ON "EscalaTrabalhoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "EventoFolhaRH_ativo_idx" ON "EventoFolhaRH"("ativo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EventoFolhaRH_instituicaoId_codigo_key" ON "EventoFolhaRH"("instituicaoId" ASC, "codigo" ASC);

-- CreateIndex
CREATE INDEX "EventoFolhaRH_instituicaoId_idx" ON "EventoFolhaRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "EventoFolhaRH_natureza_idx" ON "EventoFolhaRH"("natureza" ASC);

-- CreateIndex
CREATE INDEX "EventoFolhaRH_tipo_idx" ON "EventoFolhaRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "ExameMedicoRH_funcionarioId_idx" ON "ExameMedicoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "ExameMedicoRH_instituicaoId_idx" ON "ExameMedicoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ExameMedicoRH_tipo_idx" ON "ExameMedicoRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "ExameMedicoRH_validade_idx" ON "ExameMedicoRH"("validade" ASC);

-- CreateIndex
CREATE INDEX "FeriasRH_funcionarioId_idx" ON "FeriasRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "FeriasRH_instituicaoId_idx" ON "FeriasRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "FeriasRH_status_idx" ON "FeriasRH"("status" ASC);

-- CreateIndex
CREATE INDEX "Funcionario_cpf_idx" ON "Funcionario"("cpf" ASC);

-- CreateIndex
CREATE INDEX "Funcionario_departamentoId_idx" ON "Funcionario"("departamentoId" ASC);

-- CreateIndex
CREATE INDEX "Funcionario_instituicaoId_idx" ON "Funcionario"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Funcionario_nome_idx" ON "Funcionario"("nome" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_pontoMobileConviteToken_key" ON "Funcionario"("pontoMobileConviteToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_userId_key" ON "Funcionario"("userId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioBeneficioRH_beneficioId_idx" ON "FuncionarioBeneficioRH"("beneficioId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FuncionarioBeneficioRH_funcionarioId_beneficioId_key" ON "FuncionarioBeneficioRH"("funcionarioId" ASC, "beneficioId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioBeneficioRH_funcionarioId_idx" ON "FuncionarioBeneficioRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioBeneficioRH_instituicaoId_idx" ON "FuncionarioBeneficioRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPermissao_chave_idx" ON "FuncionarioPermissao"("chave" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FuncionarioPermissao_funcionarioId_chave_key" ON "FuncionarioPermissao"("funcionarioId" ASC, "chave" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPermissao_funcionarioId_idx" ON "FuncionarioPermissao"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_ativo_idx" ON "FuncionarioPlanoComissaoRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_funcionarioId_idx" ON "FuncionarioPlanoComissaoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_inicioVigencia_fimVigencia_idx" ON "FuncionarioPlanoComissaoRH"("inicioVigencia" ASC, "fimVigencia" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_instituicaoId_idx" ON "FuncionarioPlanoComissaoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "FuncionarioPlanoComissaoRH_planoId_idx" ON "FuncionarioPlanoComissaoRH"("planoId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoCobranca_alunoId_idx" ON "HistoricoCobranca"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoCobranca_instituicaoId_idx" ON "HistoricoCobranca"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoCobranca_lancamentoFinanceiroId_idx" ON "HistoricoCobranca"("lancamentoFinanceiroId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRH_dataEvento_idx" ON "HistoricoRH"("dataEvento" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRH_funcionarioId_idx" ON "HistoricoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRH_instituicaoId_idx" ON "HistoricoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRH_tipo_idx" ON "HistoricoRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_alteradoEm_idx" ON "HistoricoRemuneracaoRH"("alteradoEm" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_alteradoPorId_idx" ON "HistoricoRemuneracaoRH"("alteradoPorId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_funcionarioId_alteradoEm_idx" ON "HistoricoRemuneracaoRH"("funcionarioId" ASC, "alteradoEm" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_funcionarioId_idx" ON "HistoricoRemuneracaoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_instituicaoId_alteradoEm_idx" ON "HistoricoRemuneracaoRH"("instituicaoId" ASC, "alteradoEm" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_instituicaoId_idx" ON "HistoricoRemuneracaoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_professorId_idx" ON "HistoricoRemuneracaoRH"("professorId" ASC);

-- CreateIndex
CREATE INDEX "HistoricoRemuneracaoRH_vigenciaInicio_idx" ON "HistoricoRemuneracaoRH"("vigenciaInicio" ASC);

-- CreateIndex
CREATE INDEX "HoleriteEventoRH_holeriteId_idx" ON "HoleriteEventoRH"("holeriteId" ASC);

-- CreateIndex
CREATE INDEX "HoleriteEventoRH_tipo_idx" ON "HoleriteEventoRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "HoleriteRH_competenciaMes_competenciaAno_idx" ON "HoleriteRH"("competenciaMes" ASC, "competenciaAno" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HoleriteRH_funcionarioId_competenciaMes_competenciaAno_key" ON "HoleriteRH"("funcionarioId" ASC, "competenciaMes" ASC, "competenciaAno" ASC);

-- CreateIndex
CREATE INDEX "HoleriteRH_funcionarioId_idx" ON "HoleriteRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "HoleriteRH_instituicaoId_idx" ON "HoleriteRH"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Instituicao_dominio_key" ON "Instituicao"("dominio" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Instituicao_slug_key" ON "Instituicao"("slug" ASC);

-- CreateIndex
CREATE INDEX "IntegracaoPontoRH_ativo_idx" ON "IntegracaoPontoRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "IntegracaoPontoRH_instituicaoId_idx" ON "IntegracaoPontoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "IntegracaoPontoRH_modo_idx" ON "IntegracaoPontoRH"("modo" ASC);

-- CreateIndex
CREATE INDEX "IntegracaoPontoRH_provedor_idx" ON "IntegracaoPontoRH"("provedor" ASC);

-- CreateIndex
CREATE INDEX "ItemMatricula_disciplinaId_idx" ON "ItemMatricula"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "ItemMatricula_instituicaoId_idx" ON "ItemMatricula"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ItemMatricula_matriculaId_idx" ON "ItemMatricula"("matriculaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ItemMatricula_matriculaId_turmaId_disciplinaId_key" ON "ItemMatricula"("matriculaId" ASC, "turmaId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "ItemMatricula_status_idx" ON "ItemMatricula"("status" ASC);

-- CreateIndex
CREATE INDEX "ItemMatricula_tipoItem_idx" ON "ItemMatricula"("tipoItem" ASC);

-- CreateIndex
CREATE INDEX "ItemMatricula_turmaId_idx" ON "ItemMatricula"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_competenciaMes_competenciaAno_idx" ON "LancamentoComissaoRH"("competenciaMes" ASC, "competenciaAno" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_funcionarioId_idx" ON "LancamentoComissaoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_holeriteEventoId_idx" ON "LancamentoComissaoRH"("holeriteEventoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LancamentoComissaoRH_instituicaoId_chaveCalculo_key" ON "LancamentoComissaoRH"("instituicaoId" ASC, "chaveCalculo" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_instituicaoId_idx" ON "LancamentoComissaoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_matriculaId_idx" ON "LancamentoComissaoRH"("matriculaId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_pagamentoId_idx" ON "LancamentoComissaoRH"("pagamentoId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_participanteComercialId_idx" ON "LancamentoComissaoRH"("participanteComercialId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_planoId_idx" ON "LancamentoComissaoRH"("planoId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_regraId_idx" ON "LancamentoComissaoRH"("regraId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoComissaoRH_status_idx" ON "LancamentoComissaoRH"("status" ASC);

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_alunoId_idx" ON "LancamentoFinanceiro"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_instituicaoId_idx" ON "LancamentoFinanceiro"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_matriculaId_idx" ON "LancamentoFinanceiro"("matriculaId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_status_idx" ON "LancamentoFinanceiro"("status" ASC);

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_tipo_idx" ON "LancamentoFinanceiro"("tipo" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_competenciaMes_competenciaA_idx" ON "LancamentoRemuneracaoVariavelRH"("competenciaMes" ASC, "competenciaAno" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_enviadoHoleritePorId_idx" ON "LancamentoRemuneracaoVariavelRH"("enviadoHoleritePorId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_funcionarioId_idx" ON "LancamentoRemuneracaoVariavelRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_holeriteEventoId_idx" ON "LancamentoRemuneracaoVariavelRH"("holeriteEventoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LancamentoRemuneracaoVariavelRH_instituicaoId_chaveLancamen_key" ON "LancamentoRemuneracaoVariavelRH"("instituicaoId" ASC, "chaveLancamento" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_instituicaoId_idx" ON "LancamentoRemuneracaoVariavelRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_participanteId_idx" ON "LancamentoRemuneracaoVariavelRH"("participanteId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_programaId_idx" ON "LancamentoRemuneracaoVariavelRH"("programaId" ASC);

-- CreateIndex
CREATE INDEX "LancamentoRemuneracaoVariavelRH_status_idx" ON "LancamentoRemuneracaoVariavelRH"("status" ASC);

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Lead_instituicaoId_idx" ON "Lead"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Lead_origem_idx" ON "Lead"("origem" ASC);

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status" ASC);

-- CreateIndex
CREATE INDEX "Lead_tipo_idx" ON "Lead"("tipo" ASC);

-- CreateIndex
CREATE INDEX "LeadInteracao_createdAt_idx" ON "LeadInteracao"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "LeadInteracao_leadId_idx" ON "LeadInteracao"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LocalPontoMobileRH_ativo_idx" ON "LocalPontoMobileRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "LocalPontoMobileRH_instituicaoId_ativo_idx" ON "LocalPontoMobileRH"("instituicaoId" ASC, "ativo" ASC);

-- CreateIndex
CREATE INDEX "LocalPontoMobileRH_instituicaoId_cep_idx" ON "LocalPontoMobileRH"("instituicaoId" ASC, "cep" ASC);

-- CreateIndex
CREATE INDEX "LocalPontoMobileRH_instituicaoId_cidade_estado_idx" ON "LocalPontoMobileRH"("instituicaoId" ASC, "cidade" ASC, "estado" ASC);

-- CreateIndex
CREATE INDEX "LocalPontoMobileRH_instituicaoId_idx" ON "LocalPontoMobileRH"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MarcacaoPontoMobileRH_comprovanteCodigo_key" ON "MarcacaoPontoMobileRH"("comprovanteCodigo" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_dataHora_idx" ON "MarcacaoPontoMobileRH"("dataHora" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MarcacaoPontoMobileRH_fotoPathname_key" ON "MarcacaoPontoMobileRH"("fotoPathname" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_funcionarioId_idx" ON "MarcacaoPontoMobileRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_instituicaoId_dataHora_idx" ON "MarcacaoPontoMobileRH"("instituicaoId" ASC, "dataHora" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_instituicaoId_funcionarioId_dataHora_idx" ON "MarcacaoPontoMobileRH"("instituicaoId" ASC, "funcionarioId" ASC, "dataHora" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MarcacaoPontoMobileRH_instituicaoId_idempotenciaChave_key" ON "MarcacaoPontoMobileRH"("instituicaoId" ASC, "idempotenciaChave" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_instituicaoId_idx" ON "MarcacaoPontoMobileRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_localId_idx" ON "MarcacaoPontoMobileRH"("localId" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_pontoFuncionarioRHId_idx" ON "MarcacaoPontoMobileRH"("pontoFuncionarioRHId" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_reconhecimentoStatus_idx" ON "MarcacaoPontoMobileRH"("reconhecimentoStatus" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_statusLocalizacao_idx" ON "MarcacaoPontoMobileRH"("statusLocalizacao" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_status_idx" ON "MarcacaoPontoMobileRH"("status" ASC);

-- CreateIndex
CREATE INDEX "MarcacaoPontoMobileRH_tipo_idx" ON "MarcacaoPontoMobileRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "idx_marcacao_mobile_func_data_status" ON "MarcacaoPontoMobileRH"("instituicaoId" ASC, "funcionarioId" ASC, "dataLocal" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "MaterialAula_aulaId_idx" ON "MaterialAula"("aulaId" ASC);

-- CreateIndex
CREATE INDEX "MaterialAula_instituicaoId_idx" ON "MaterialAula"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Matricula_alunoId_idx" ON "Matricula"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "Matricula_cursoId_idx" ON "Matricula"("cursoId" ASC);

-- CreateIndex
CREATE INDEX "Matricula_cursoSemestreId_idx" ON "Matricula"("cursoSemestreId" ASC);

-- CreateIndex
CREATE INDEX "Matricula_instituicaoId_idx" ON "Matricula"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_instituicaoId_numeroMatricula_key" ON "Matricula"("instituicaoId" ASC, "numeroMatricula" ASC);

-- CreateIndex
CREATE INDEX "Matricula_numeroMatriculaLegado_idx" ON "Matricula"("numeroMatriculaLegado" ASC);

-- CreateIndex
CREATE INDEX "Matricula_numeroMatricula_idx" ON "Matricula"("numeroMatricula" ASC);

-- CreateIndex
CREATE INDEX "Matricula_periodoLetivo_idx" ON "Matricula"("periodoLetivo" ASC);

-- CreateIndex
CREATE INDEX "Matricula_periodoMatriculaId_idx" ON "Matricula"("periodoMatriculaId" ASC);

-- CreateIndex
CREATE INDEX "Matricula_poloId_idx" ON "Matricula"("poloId" ASC);

-- CreateIndex
CREATE INDEX "Matricula_vendedorResponsavelId_idx" ON "Matricula"("vendedorResponsavelId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOnlineIbe_externalReference_key" ON "MatriculaOnlineIbe"("externalReference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOnlineIbePagamento_asaasCheckoutId_key" ON "MatriculaOnlineIbePagamento"("asaasCheckoutId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOnlineIbePagamento_asaasPaymentId_key" ON "MatriculaOnlineIbePagamento"("asaasPaymentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOnlineIbePagamento_externalReference_key" ON "MatriculaOnlineIbePagamento"("externalReference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaOnlineIbePagamento_matriculaOnlineIbeId_ordem_key" ON "MatriculaOnlineIbePagamento"("matriculaOnlineIbeId" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "MatriculaOnlineIbePagamento_matriculaOnlineIbeId_status_idx" ON "MatriculaOnlineIbePagamento"("matriculaOnlineIbeId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_funcionarioId_idx" ON "MatriculaParticipanteComercial"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_instituicaoId_idx" ON "MatriculaParticipanteComercial"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaParticipanteComercial_matriculaId_funcionarioId_key" ON "MatriculaParticipanteComercial"("matriculaId" ASC, "funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_matriculaId_idx" ON "MatriculaParticipanteComercial"("matriculaId" ASC);

-- CreateIndex
CREATE INDEX "MatriculaParticipanteComercial_papel_idx" ON "MatriculaParticipanteComercial"("papel" ASC);

-- CreateIndex
CREATE INDEX "Modulo_instituicaoId_idx" ON "Modulo"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Modulo_turmaId_idx" ON "Modulo"("turmaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_turmaId_ordem_key" ON "Modulo"("turmaId" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "MovimentoCaixa_alunoId_idx" ON "MovimentoCaixa"("alunoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoCaixa_asaasPaymentId_key" ON "MovimentoCaixa"("asaasPaymentId" ASC);

-- CreateIndex
CREATE INDEX "MovimentoCaixa_caixaId_idx" ON "MovimentoCaixa"("caixaId" ASC);

-- CreateIndex
CREATE INDEX "MovimentoCaixa_instituicaoId_idx" ON "MovimentoCaixa"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "MovimentoCaixa_lancamentoId_idx" ON "MovimentoCaixa"("lancamentoId" ASC);

-- CreateIndex
CREATE INDEX "MovimentoCaixa_tipo_idx" ON "MovimentoCaixa"("tipo" ASC);

-- CreateIndex
CREATE INDEX "Nota_alunoId_idx" ON "Nota"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "Nota_atividadeId_idx" ON "Nota"("atividadeId" ASC);

-- CreateIndex
CREATE INDEX "Nota_instituicaoId_alunoId_provaId_idx" ON "Nota"("instituicaoId" ASC, "alunoId" ASC, "provaId" ASC);

-- CreateIndex
CREATE INDEX "Nota_instituicaoId_alunoId_turmaId_idx" ON "Nota"("instituicaoId" ASC, "alunoId" ASC, "turmaId" ASC);

-- CreateIndex
CREATE INDEX "Nota_instituicaoId_idx" ON "Nota"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Nota_instituicaoId_turmaId_tipo_idx" ON "Nota"("instituicaoId" ASC, "turmaId" ASC, "tipo" ASC);

-- CreateIndex
CREATE INDEX "Nota_provaId_idx" ON "Nota"("provaId" ASC);

-- CreateIndex
CREATE INDEX "Nota_turmaId_idx" ON "Nota"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_categoria_idx" ON "Notificacao"("categoria" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_chaveAgrupada_idx" ON "Notificacao"("chaveAgrupada" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_criadoEm_idx" ON "Notificacao"("criadoEm" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_instituicaoId_idx" ON "Notificacao"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_lida_idx" ON "Notificacao"("lida" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_tipo_idx" ON "Notificacao"("tipo" ASC);

-- CreateIndex
CREATE INDEX "Notificacao_usuarioId_idx" ON "Notificacao"("usuarioId" ASC);

-- CreateIndex
CREATE INDEX "OcorrenciaRH_dataEvento_idx" ON "OcorrenciaRH"("dataEvento" ASC);

-- CreateIndex
CREATE INDEX "OcorrenciaRH_funcionarioId_idx" ON "OcorrenciaRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "OcorrenciaRH_instituicaoId_idx" ON "OcorrenciaRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "OcorrenciaRH_status_idx" ON "OcorrenciaRH"("status" ASC);

-- CreateIndex
CREATE INDEX "OcorrenciaRH_tipo_idx" ON "OcorrenciaRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "Ouvidoria_instituicaoId_idx" ON "Ouvidoria"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Ouvidoria_origem_idx" ON "Ouvidoria"("origem" ASC);

-- CreateIndex
CREATE INDEX "Ouvidoria_status_idx" ON "Ouvidoria"("status" ASC);

-- CreateIndex
CREATE INDEX "OuvidoriaPhanyx_instituicaoId_idx" ON "OuvidoriaPhanyx"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "OuvidoriaPhanyx_status_idx" ON "OuvidoriaPhanyx"("status" ASC);

-- CreateIndex
CREATE INDEX "Pagamento_alunoId_idx" ON "Pagamento"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "Pagamento_instituicaoId_idx" ON "Pagamento"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Pagamento_lancamentoId_idx" ON "Pagamento"("lancamentoId" ASC);

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_elegivel_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("elegivel" ASC);

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_funcionarioId_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_instituicaoId_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_programaId_funcio_key" ON "ParticipanteProgramaRemuneracaoVariavelRH"("programaId" ASC, "funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "ParticipanteProgramaRemuneracaoVariavelRH_programaId_idx" ON "ParticipanteProgramaRemuneracaoVariavelRH"("programaId" ASC);

-- CreateIndex
CREATE INDEX "PeriodoMatricula_ativo_idx" ON "PeriodoMatricula"("ativo" ASC);

-- CreateIndex
CREATE INDEX "PeriodoMatricula_cursoId_idx" ON "PeriodoMatricula"("cursoId" ASC);

-- CreateIndex
CREATE INDEX "PeriodoMatricula_dataInicio_dataFim_idx" ON "PeriodoMatricula"("dataInicio" ASC, "dataFim" ASC);

-- CreateIndex
CREATE INDEX "PeriodoMatricula_instituicaoId_idx" ON "PeriodoMatricula"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "PeriodoMatricula_periodoLetivo_idx" ON "PeriodoMatricula"("periodoLetivo" ASC);

-- CreateIndex
CREATE INDEX "PlanoComissaoRH_ativo_idx" ON "PlanoComissaoRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "PlanoComissaoRH_inicioVigencia_fimVigencia_idx" ON "PlanoComissaoRH"("inicioVigencia" ASC, "fimVigencia" ASC);

-- CreateIndex
CREATE INDEX "PlanoComissaoRH_instituicaoId_idx" ON "PlanoComissaoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Polo_cnpj_idx" ON "Polo"("cnpj" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Polo_instituicaoId_codigo_key" ON "Polo"("instituicaoId" ASC, "codigo" ASC);

-- CreateIndex
CREATE INDEX "Polo_instituicaoId_idx" ON "Polo"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Polo_instituicaoId_nome_key" ON "Polo"("instituicaoId" ASC, "nome" ASC);

-- CreateIndex
CREATE INDEX "PontoFuncionarioRH_data_idx" ON "PontoFuncionarioRH"("data" ASC);

-- CreateIndex
CREATE INDEX "PontoFuncionarioRH_funcionarioId_idx" ON "PontoFuncionarioRH"("funcionarioId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PontoFuncionarioRH_instituicaoId_funcionarioId_data_key" ON "PontoFuncionarioRH"("instituicaoId" ASC, "funcionarioId" ASC, "data" ASC);

-- CreateIndex
CREATE INDEX "PontoFuncionarioRH_instituicaoId_funcionarioId_status_idx" ON "PontoFuncionarioRH"("instituicaoId" ASC, "funcionarioId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "PontoFuncionarioRH_instituicaoId_idx" ON "PontoFuncionarioRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "PontoFuncionarioRH_status_idx" ON "PontoFuncionarioRH"("status" ASC);

-- CreateIndex
CREATE INDEX "PreferenciaAgendaOperacional_instituicaoId_idx" ON "PreferenciaAgendaOperacional"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciaAgendaOperacional_instituicaoId_userId_key" ON "PreferenciaAgendaOperacional"("instituicaoId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "PreferenciaAgendaOperacional_userId_idx" ON "PreferenciaAgendaOperacional"("userId" ASC);

-- CreateIndex
CREATE INDEX "PresencaAula_alunoId_idx" ON "PresencaAula"("alunoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PresencaAula_aulaId_alunoId_key" ON "PresencaAula"("aulaId" ASC, "alunoId" ASC);

-- CreateIndex
CREATE INDEX "PresencaAula_aulaId_idx" ON "PresencaAula"("aulaId" ASC);

-- CreateIndex
CREATE INDEX "PresencaAula_instituicaoId_idx" ON "PresencaAula"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "PresencaAula_status_idx" ON "PresencaAula"("status" ASC);

-- CreateIndex
CREATE INDEX "PresencaAula_substituicaoDocenteId_idx" ON "PresencaAula"("substituicaoDocenteId" ASC);

-- CreateIndex
CREATE INDEX "Professor_cpf_idx" ON "Professor"("cpf" ASC);

-- CreateIndex
CREATE INDEX "Professor_departamentoId_idx" ON "Professor"("departamentoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_funcionarioId_key" ON "Professor"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "Professor_instituicaoId_idx" ON "Professor"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_instituicaoId_slug_key" ON "Professor"("instituicaoId" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "Professor_nome_idx" ON "Professor"("nome" ASC);

-- CreateIndex
CREATE INDEX "Professor_poloId_idx" ON "Professor"("poloId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId" ASC);

-- CreateIndex
CREATE INDEX "ProfessorDisciplina_disciplinaId_idx" ON "ProfessorDisciplina"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "ProfessorDisciplina_instituicaoId_idx" ON "ProfessorDisciplina"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorDisciplina_professorId_disciplinaId_key" ON "ProfessorDisciplina"("professorId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "ProfessorDisciplina_professorId_idx" ON "ProfessorDisciplina"("professorId" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_abrangencia_idx" ON "ProgramaRemuneracaoVariavelRH"("abrangencia" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_competenciaMes_competenciaAno_idx" ON "ProgramaRemuneracaoVariavelRH"("competenciaMes" ASC, "competenciaAno" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_departamentoId_idx" ON "ProgramaRemuneracaoVariavelRH"("departamentoId" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_instituicaoId_idx" ON "ProgramaRemuneracaoVariavelRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_periodoInicio_periodoFim_idx" ON "ProgramaRemuneracaoVariavelRH"("periodoInicio" ASC, "periodoFim" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_status_idx" ON "ProgramaRemuneracaoVariavelRH"("status" ASC);

-- CreateIndex
CREATE INDEX "ProgramaRemuneracaoVariavelRH_tipo_idx" ON "ProgramaRemuneracaoVariavelRH"("tipo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressoAula_alunoId_aulaId_key" ON "ProgressoAula"("alunoId" ASC, "aulaId" ASC);

-- CreateIndex
CREATE INDEX "ProgressoAula_alunoId_idx" ON "ProgressoAula"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "ProgressoAula_aulaId_idx" ON "ProgressoAula"("aulaId" ASC);

-- CreateIndex
CREATE INDEX "ProgressoAula_instituicaoId_idx" ON "ProgressoAula"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_disponivelEm_idx" ON "Prova"("instituicaoId" ASC, "disponivelEm" ASC);

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_expiraEm_idx" ON "Prova"("instituicaoId" ASC, "expiraEm" ASC);

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_idx" ON "Prova"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_tipoPublico_idx" ON "Prova"("instituicaoId" ASC, "tipoPublico" ASC);

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_turmaId_status_ativa_idx" ON "Prova"("instituicaoId" ASC, "turmaId" ASC, "status" ASC, "ativa" ASC);

-- CreateIndex
CREATE INDEX "Prova_status_idx" ON "Prova"("status" ASC);

-- CreateIndex
CREATE INDEX "Prova_substituicaoDocenteId_idx" ON "Prova"("substituicaoDocenteId" ASC);

-- CreateIndex
CREATE INDEX "Prova_turmaId_idx" ON "Prova"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "ProvaAluno_alunoId_idx" ON "ProvaAluno"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "ProvaAluno_instituicaoId_idx" ON "ProvaAluno"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProvaAluno_provaId_alunoId_key" ON "ProvaAluno"("provaId" ASC, "alunoId" ASC);

-- CreateIndex
CREATE INDEX "ProvaAluno_provaId_idx" ON "ProvaAluno"("provaId" ASC);

-- CreateIndex
CREATE INDEX "Questao_instituicaoId_idx" ON "Questao"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Questao_provaId_idx" ON "Questao"("provaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Questao_provaId_ordem_key" ON "Questao"("provaId" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_ativo_idx" ON "RegraComissaoRH"("ativo" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_baseCalculo_idx" ON "RegraComissaoRH"("baseCalculo" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_cursoId_idx" ON "RegraComissaoRH"("cursoId" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_gatilho_idx" ON "RegraComissaoRH"("gatilho" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_instituicaoId_idx" ON "RegraComissaoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_planoId_idx" ON "RegraComissaoRH"("planoId" ASC);

-- CreateIndex
CREATE INDEX "RegraComissaoRH_tipo_idx" ON "RegraComissaoRH"("tipo" ASC);

-- CreateIndex
CREATE INDEX "RescisaoRH_funcionarioId_idx" ON "RescisaoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "RescisaoRH_instituicaoId_idx" ON "RescisaoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "RescisaoRH_status_idx" ON "RescisaoRH"("status" ASC);

-- CreateIndex
CREATE INDEX "RespostaProva_alternativaId_idx" ON "RespostaProva"("alternativaId" ASC);

-- CreateIndex
CREATE INDEX "RespostaProva_instituicaoId_alunoId_idx" ON "RespostaProva"("instituicaoId" ASC, "alunoId" ASC);

-- CreateIndex
CREATE INDEX "RespostaProva_instituicaoId_idx" ON "RespostaProva"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "RespostaProva_instituicaoId_tentativaId_questaoId_idx" ON "RespostaProva"("instituicaoId" ASC, "tentativaId" ASC, "questaoId" ASC);

-- CreateIndex
CREATE INDEX "RespostaProva_questaoId_idx" ON "RespostaProva"("questaoId" ASC);

-- CreateIndex
CREATE INDEX "RespostaProva_tentativaId_idx" ON "RespostaProva"("tentativaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RespostaProva_tentativaId_questaoId_key" ON "RespostaProva"("tentativaId" ASC, "questaoId" ASC);

-- CreateIndex
CREATE INDEX "ResultadoFinal_alunoId_idx" ON "ResultadoFinal"("alunoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoFinal_alunoId_turmaId_key" ON "ResultadoFinal"("alunoId" ASC, "turmaId" ASC);

-- CreateIndex
CREATE INDEX "ResultadoFinal_disciplinaId_idx" ON "ResultadoFinal"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "ResultadoFinal_instituicaoId_idx" ON "ResultadoFinal"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "ResultadoFinal_situacao_idx" ON "ResultadoFinal"("situacao" ASC);

-- CreateIndex
CREATE INDEX "ResultadoFinal_turmaId_idx" ON "ResultadoFinal"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_criadoPorId_idx" ON "Reuniao"("criadoPorId" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_cursoId_idx" ON "Reuniao"("cursoId" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_dataHora_idx" ON "Reuniao"("dataHora" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_instituicaoId_idx" ON "Reuniao"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_professorId_idx" ON "Reuniao"("professorId" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_publicoTipo_idx" ON "Reuniao"("publicoTipo" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_status_idx" ON "Reuniao"("status" ASC);

-- CreateIndex
CREATE INDEX "Reuniao_turmaId_idx" ON "Reuniao"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "ReuniaoParticipante_alunoId_idx" ON "ReuniaoParticipante"("alunoId" ASC);

-- CreateIndex
CREATE INDEX "ReuniaoParticipante_reuniaoId_idx" ON "ReuniaoParticipante"("reuniaoId" ASC);

-- CreateIndex
CREATE INDEX "ReuniaoParticipante_status_idx" ON "ReuniaoParticipante"("status" ASC);

-- CreateIndex
CREATE INDEX "ReuniaoParticipante_tipo_idx" ON "ReuniaoParticipante"("tipo" ASC);

-- CreateIndex
CREATE INDEX "ReuniaoParticipante_userId_idx" ON "ReuniaoParticipante"("userId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoItemRH_acao_idx" ON "SolicitacaoCorrecaoPontoItemRH"("acao" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoItemRH_instituicaoId_idx" ON "SolicitacaoCorrecaoPontoItemRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoItemRH_marcacaoGeradaId_idx" ON "SolicitacaoCorrecaoPontoItemRH"("marcacaoGeradaId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoItemRH_marcacaoOriginalId_idx" ON "SolicitacaoCorrecaoPontoItemRH"("marcacaoOriginalId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoItemRH_ordem_idx" ON "SolicitacaoCorrecaoPontoItemRH"("ordem" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoItemRH_solicitacaoId_idx" ON "SolicitacaoCorrecaoPontoItemRH"("solicitacaoId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_aplicadoPorId_idx" ON "SolicitacaoCorrecaoPontoRH"("aplicadoPorId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_autorizacaoId_idx" ON "SolicitacaoCorrecaoPontoRH"("autorizacaoId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_criadoEm_idx" ON "SolicitacaoCorrecaoPontoRH"("criadoEm" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_dataLocal_idx" ON "SolicitacaoCorrecaoPontoRH"("dataLocal" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_funcionarioId_idx" ON "SolicitacaoCorrecaoPontoRH"("funcionarioId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_instituicaoId_idx" ON "SolicitacaoCorrecaoPontoRH"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_pontoFuncionarioRHId_idx" ON "SolicitacaoCorrecaoPontoRH"("pontoFuncionarioRHId" ASC);

-- CreateIndex
CREATE INDEX "SolicitacaoCorrecaoPontoRH_status_idx" ON "SolicitacaoCorrecaoPontoRH"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_sol_correcao_inst_func_data" ON "SolicitacaoCorrecaoPontoRH"("instituicaoId" ASC, "funcionarioId" ASC, "dataLocal" ASC);

-- CreateIndex
CREATE INDEX "idx_sol_correcao_inst_status_criado" ON "SolicitacaoCorrecaoPontoRH"("instituicaoId" ASC, "status" ASC, "criadoEm" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_dataFim_idx" ON "SubstituicaoDocente"("dataFim" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_dataInicio_idx" ON "SubstituicaoDocente"("dataInicio" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_disciplinaId_idx" ON "SubstituicaoDocente"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_instituicaoId_idx" ON "SubstituicaoDocente"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_professorSubstitutoId_idx" ON "SubstituicaoDocente"("professorSubstitutoId" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_professorTitularId_idx" ON "SubstituicaoDocente"("professorTitularId" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_status_idx" ON "SubstituicaoDocente"("status" ASC);

-- CreateIndex
CREATE INDEX "SubstituicaoDocente_turmaId_idx" ON "SubstituicaoDocente"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "TaxaAvulsa_instituicaoId_idx" ON "TaxaAvulsa"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_alunoId_idx" ON "TentativaProva"("alunoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TentativaProva_alunoId_provaId_tentativaNumero_key" ON "TentativaProva"("alunoId" ASC, "provaId" ASC, "tentativaNumero" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_instituicaoId_alunoId_provaId_idx" ON "TentativaProva"("instituicaoId" ASC, "alunoId" ASC, "provaId" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_instituicaoId_alunoId_status_idx" ON "TentativaProva"("instituicaoId" ASC, "alunoId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_instituicaoId_idx" ON "TentativaProva"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_instituicaoId_provaId_status_idx" ON "TentativaProva"("instituicaoId" ASC, "provaId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_provaId_idx" ON "TentativaProva"("provaId" ASC);

-- CreateIndex
CREATE INDEX "TentativaProva_status_idx" ON "TentativaProva"("status" ASC);

-- CreateIndex
CREATE INDEX "Turma_instituicaoId_idx" ON "Turma"("instituicaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Turma_instituicaoId_nome_semestre_key" ON "Turma"("instituicaoId" ASC, "nome" ASC, "semestre" ASC);

-- CreateIndex
CREATE INDEX "Turma_poloId_idx" ON "Turma"("poloId" ASC);

-- CreateIndex
CREATE INDEX "Turma_professorId_idx" ON "Turma"("professorId" ASC);

-- CreateIndex
CREATE INDEX "Turma_statusTurma_idx" ON "Turma"("statusTurma" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplina_disciplinaId_idx" ON "TurmaDisciplina"("disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplina_instituicaoId_idx" ON "TurmaDisciplina"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplina_professorId_idx" ON "TurmaDisciplina"("professorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TurmaDisciplina_turmaId_disciplinaId_key" ON "TurmaDisciplina"("turmaId" ASC, "disciplinaId" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplina_turmaId_idx" ON "TurmaDisciplina"("turmaId" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplinaHorario_ativo_idx" ON "TurmaDisciplinaHorario"("ativo" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplinaHorario_diaSemana_idx" ON "TurmaDisciplinaHorario"("diaSemana" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplinaHorario_instituicaoId_idx" ON "TurmaDisciplinaHorario"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "TurmaDisciplinaHorario_turmaDisciplinaId_idx" ON "TurmaDisciplinaHorario"("turmaDisciplinaId" ASC);

-- CreateIndex
CREATE INDEX "TurmaSemestre_instituicaoId_idx" ON "TurmaSemestre"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "TurmaSemestre_turmaId_idx" ON "TurmaSemestre"("turmaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE INDEX "User_instituicaoId_idx" ON "User"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Visitante_codigoCracha_key" ON "Visitante"("codigoCracha" ASC);

-- CreateIndex
CREATE INDEX "Visitante_criadoPorId_idx" ON "Visitante"("criadoPorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Visitante_instituicaoId_codigoVisitante_key" ON "Visitante"("instituicaoId" ASC, "codigoVisitante" ASC);

-- CreateIndex
CREATE INDEX "Visitante_instituicaoId_documentoNumero_idx" ON "Visitante"("instituicaoId" ASC, "documentoNumero" ASC);

-- CreateIndex
CREATE INDEX "Visitante_instituicaoId_entradaPrevistaEm_idx" ON "Visitante"("instituicaoId" ASC, "entradaPrevistaEm" ASC);

-- CreateIndex
CREATE INDEX "Visitante_instituicaoId_evento_idx" ON "Visitante"("instituicaoId" ASC, "evento" ASC);

-- CreateIndex
CREATE INDEX "Visitante_instituicaoId_idx" ON "Visitante"("instituicaoId" ASC);

-- CreateIndex
CREATE INDEX "Visitante_instituicaoId_status_idx" ON "Visitante"("instituicaoId" ASC, "status" ASC);

-- AddForeignKey
ALTER TABLE "AdesaoInstituicao" ADD CONSTRAINT "AdesaoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteMarcacaoPontoRH" ADD CONSTRAINT "AjusteMarcacaoPontoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteMarcacaoPontoRH" ADD CONSTRAINT "AjusteMarcacaoPontoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteMarcacaoPontoRH" ADD CONSTRAINT "AjusteMarcacaoPontoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteMarcacaoPontoRH" ADD CONSTRAINT "AjusteMarcacaoPontoRH_marcacaoId_fkey" FOREIGN KEY ("marcacaoId") REFERENCES "MarcacaoPontoMobileRH"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPhanyx" ADD CONSTRAINT "AssinaturaPhanyx_adesaoInstituicaoId_fkey" FOREIGN KEY ("adesaoInstituicaoId") REFERENCES "AdesaoInstituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPhanyx" ADD CONSTRAINT "AssinaturaPhanyx_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtestadoMedico" ADD CONSTRAINT "AtestadoMedico_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtestadoMedico" ADD CONSTRAINT "AtestadoMedico_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_professorResponsavelId_fkey" FOREIGN KEY ("professorResponsavelId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_publicadoPorId_fkey" FOREIGN KEY ("publicadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_substituicaoDocenteId_fkey" FOREIGN KEY ("substituicaoDocenteId") REFERENCES "SubstituicaoDocente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeAnexo" ADD CONSTRAINT "AtividadeAnexo_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeAnexo" ADD CONSTRAINT "AtividadeAnexo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeAnexo" ADD CONSTRAINT "AtividadeAnexo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaValidacaoDocumento" ADD CONSTRAINT "AuditoriaValidacaoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoGerado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_substituicaoDocenteId_fkey" FOREIGN KEY ("substituicaoDocenteId") REFERENCES "SubstituicaoDocente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacaoCorrecaoPontoRH" ADD CONSTRAINT "AutorizacaoCorrecaoPontoRH_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacaoCorrecaoPontoRH" ADD CONSTRAINT "AutorizacaoCorrecaoPontoRH_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacaoCorrecaoPontoRH" ADD CONSTRAINT "AutorizacaoCorrecaoPontoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacaoCorrecaoPontoRH" ADD CONSTRAINT "AutorizacaoCorrecaoPontoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacaoCorrecaoPontoRH" ADD CONSTRAINT "AutorizacaoCorrecaoPontoRH_pontoFuncionarioRHId_fkey" FOREIGN KEY ("pontoFuncionarioRHId") REFERENCES "PontoFuncionarioRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoWhatsappCorrecaoPontoRH" ADD CONSTRAINT "AvisoWhatsappCorrecaoPontoRH_autorizacaoId_fkey" FOREIGN KEY ("autorizacaoId") REFERENCES "AutorizacaoCorrecaoPontoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoWhatsappCorrecaoPontoRH" ADD CONSTRAINT "AvisoWhatsappCorrecaoPontoRH_destinatarioUsuarioId_fkey" FOREIGN KEY ("destinatarioUsuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoWhatsappCorrecaoPontoRH" ADD CONSTRAINT "AvisoWhatsappCorrecaoPontoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoWhatsappCorrecaoPontoRH" ADD CONSTRAINT "AvisoWhatsappCorrecaoPontoRH_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoCorrecaoPontoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BancoHorasRH" ADD CONSTRAINT "BancoHorasRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BancoHorasRH" ADD CONSTRAINT "BancoHorasRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BancoHorasRH" ADD CONSTRAINT "BancoHorasRH_pontoId_fkey" FOREIGN KEY ("pontoId") REFERENCES "PontoFuncionarioRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficioRH" ADD CONSTRAINT "BeneficioRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_certificadoModeloId_fkey" FOREIGN KEY ("certificadoModeloId") REFERENCES "CertificadoModelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_certificadoModeloVersaoId_fkey" FOREIGN KEY ("certificadoModeloVersaoId") REFERENCES "CertificadoModeloVersao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoCampo" ADD CONSTRAINT "CertificadoCampo_certificadoModeloVersaoId_fkey" FOREIGN KEY ("certificadoModeloVersaoId") REFERENCES "CertificadoModeloVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoCampo" ADD CONSTRAINT "CertificadoCampo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoModelo" ADD CONSTRAINT "CertificadoModelo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoModelo" ADD CONSTRAINT "CertificadoModelo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoModelo" ADD CONSTRAINT "CertificadoModelo_publicadoPorId_fkey" FOREIGN KEY ("publicadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoModeloVersao" ADD CONSTRAINT "CertificadoModeloVersao_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "CertificadoModelo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnexo" ADD CONSTRAINT "ChatAnexo_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "ChatMensagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMensagem" ADD CONSTRAINT "ChatMensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ChatConversa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipante" ADD CONSTRAINT "ChatParticipante_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ChatConversa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoInstituicao" ADD CONSTRAINT "ConfiguracaoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoPontoMobileRH" ADD CONSTRAINT "ConfiguracaoPontoMobileRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoPortalInstituicao" ADD CONSTRAINT "ConfiguracaoPortalInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaEmitido" ADD CONSTRAINT "CrachaEmitido_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaEmitido" ADD CONSTRAINT "CrachaEmitido_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "CrachaModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteEmissao" ADD CONSTRAINT "CrachaLoteEmissao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaLoteEmissao" ADD CONSTRAINT "CrachaLoteEmissao_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "CrachaModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaModelo" ADD CONSTRAINT "CrachaModelo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrachaModelo" ADD CONSTRAINT "CrachaModelo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoIA" ADD CONSTRAINT "CreditoIA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_certificadoModeloId_fkey" FOREIGN KEY ("certificadoModeloId") REFERENCES "CertificadoModelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_excluidoPorId_fkey" FOREIGN KEY ("excluidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoDisciplinaExtraPermitida" ADD CONSTRAINT "CursoDisciplinaExtraPermitida_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoPolo" ADD CONSTRAINT "CursoPolo_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoPolo" ADD CONSTRAINT "CursoPolo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoPolo" ADD CONSTRAINT "CursoPolo_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestre" ADD CONSTRAINT "CursoSemestre_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestre" ADD CONSTRAINT "CursoSemestre_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestreDisciplina" ADD CONSTRAINT "CursoSemestreDisciplina_cursoSemestreId_fkey" FOREIGN KEY ("cursoSemestreId") REFERENCES "CursoSemestre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestreDisciplina" ADD CONSTRAINT "CursoSemestreDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoSemestreDisciplina" ADD CONSTRAINT "CursoSemestreDisciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaPreRequisito" ADD CONSTRAINT "DisciplinaPreRequisito_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaPreRequisito" ADD CONSTRAINT "DisciplinaPreRequisito_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaPreRequisito" ADD CONSTRAINT "DisciplinaPreRequisito_prerequisitoId_fkey" FOREIGN KEY ("prerequisitoId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "DocumentoProfessor" ADD CONSTRAINT "DocumentoProfessor_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoProfessor" ADD CONSTRAINT "DocumentoProfessor_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoProfessor" ADD CONSTRAINT "DocumentoProfessor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoProfessor" ADD CONSTRAINT "DocumentoProfessor_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoProfessor" ADD CONSTRAINT "DocumentoProfessor_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRH" ADD CONSTRAINT "DocumentoRH_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRH" ADD CONSTRAINT "DocumentoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRH" ADD CONSTRAINT "DocumentoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRH" ADD CONSTRAINT "DocumentoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRH" ADD CONSTRAINT "DocumentoRH_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRH" ADD CONSTRAINT "DocumentoRH_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTemplate" ADD CONSTRAINT "DocumentoTemplate_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividade" ADD CONSTRAINT "EntregaAtividade_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividade" ADD CONSTRAINT "EntregaAtividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividade" ADD CONSTRAINT "EntregaAtividade_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividadeHistorico" ADD CONSTRAINT "EntregaAtividadeHistorico_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividadeHistorico" ADD CONSTRAINT "EntregaAtividadeHistorico_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividadeHistorico" ADD CONSTRAINT "EntregaAtividadeHistorico_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "EntregaAtividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividadeHistorico" ADD CONSTRAINT "EntregaAtividadeHistorico_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalaTrabalhoRH" ADD CONSTRAINT "EscalaTrabalhoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalaTrabalhoRH" ADD CONSTRAINT "EscalaTrabalhoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoFolhaRH" ADD CONSTRAINT "EventoFolhaRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExameMedicoRH" ADD CONSTRAINT "ExameMedicoRH_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExameMedicoRH" ADD CONSTRAINT "ExameMedicoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExameMedicoRH" ADD CONSTRAINT "ExameMedicoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExameMedicoRH" ADD CONSTRAINT "ExameMedicoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExameMedicoRH" ADD CONSTRAINT "ExameMedicoRH_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriasRH" ADD CONSTRAINT "FeriasRH_arquivadaPorId_fkey" FOREIGN KEY ("arquivadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriasRH" ADD CONSTRAINT "FeriasRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriasRH" ADD CONSTRAINT "FeriasRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriasRH" ADD CONSTRAINT "FeriasRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriasRH" ADD CONSTRAINT "FeriasRH_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioBeneficioRH" ADD CONSTRAINT "FuncionarioBeneficioRH_beneficioId_fkey" FOREIGN KEY ("beneficioId") REFERENCES "BeneficioRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioBeneficioRH" ADD CONSTRAINT "FuncionarioBeneficioRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioBeneficioRH" ADD CONSTRAINT "FuncionarioBeneficioRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPermissao" ADD CONSTRAINT "FuncionarioPermissao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuncionarioPlanoComissaoRH" ADD CONSTRAINT "FuncionarioPlanoComissaoRH_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoComissaoRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRH" ADD CONSTRAINT "HistoricoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRH" ADD CONSTRAINT "HistoricoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_alteradoPorId_fkey" FOREIGN KEY ("alteradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoRemuneracaoRH" ADD CONSTRAINT "HistoricoRemuneracaoRH_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleriteEventoRH" ADD CONSTRAINT "HoleriteEventoRH_holeriteId_fkey" FOREIGN KEY ("holeriteId") REFERENCES "HoleriteRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleriteRH" ADD CONSTRAINT "HoleriteRH_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleriteRH" ADD CONSTRAINT "HoleriteRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleriteRH" ADD CONSTRAINT "HoleriteRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleriteRH" ADD CONSTRAINT "HoleriteRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoPontoRH" ADD CONSTRAINT "IntegracaoPontoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMatricula" ADD CONSTRAINT "ItemMatricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_estornadoPorId_fkey" FOREIGN KEY ("estornadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_holeriteEventoId_fkey" FOREIGN KEY ("holeriteEventoId") REFERENCES "HoleriteEventoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_participanteComercialId_fkey" FOREIGN KEY ("participanteComercialId") REFERENCES "MatriculaParticipanteComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoComissaoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "RegraComissaoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoComissaoRH" ADD CONSTRAINT "LancamentoComissaoRH_reprovadoPorId_fkey" FOREIGN KEY ("reprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_enviadoHoleritePorId_fkey" FOREIGN KEY ("enviadoHoleritePorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_estornadoPorId_fkey" FOREIGN KEY ("estornadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_holeriteEventoId_fkey" FOREIGN KEY ("holeriteEventoId") REFERENCES "HoleriteEventoRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteProgramaRemuneracaoVariavelRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "ProgramaRemuneracaoVariavelRH"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoRemuneracaoVariavelRH" ADD CONSTRAINT "LancamentoRemuneracaoVariavelRH_reprovadoPorId_fkey" FOREIGN KEY ("reprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadInteracao" ADD CONSTRAINT "LeadInteracao_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPontoMobileRH" ADD CONSTRAINT "LocalPontoMobileRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcacaoPontoMobileRH" ADD CONSTRAINT "MarcacaoPontoMobileRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcacaoPontoMobileRH" ADD CONSTRAINT "MarcacaoPontoMobileRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcacaoPontoMobileRH" ADD CONSTRAINT "MarcacaoPontoMobileRH_localId_fkey" FOREIGN KEY ("localId") REFERENCES "LocalPontoMobileRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcacaoPontoMobileRH" ADD CONSTRAINT "MarcacaoPontoMobileRH_pontoFuncionarioRHId_fkey" FOREIGN KEY ("pontoFuncionarioRHId") REFERENCES "PontoFuncionarioRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAula" ADD CONSTRAINT "MaterialAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAula" ADD CONSTRAINT "MaterialAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_cursoSemestreId_fkey" FOREIGN KEY ("cursoSemestreId") REFERENCES "CursoSemestre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_periodoMatriculaId_fkey" FOREIGN KEY ("periodoMatriculaId") REFERENCES "PeriodoMatricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_vendedorResponsavelId_fkey" FOREIGN KEY ("vendedorResponsavelId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaOnlineIbePagamento" ADD CONSTRAINT "MatriculaOnlineIbePagamento_matriculaOnlineIbeId_fkey" FOREIGN KEY ("matriculaOnlineIbeId") REFERENCES "MatriculaOnlineIbe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriculaParticipanteComercial" ADD CONSTRAINT "MatriculaParticipanteComercial_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaRH" ADD CONSTRAINT "OcorrenciaRH_arquivadaPorId_fkey" FOREIGN KEY ("arquivadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaRH" ADD CONSTRAINT "OcorrenciaRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaRH" ADD CONSTRAINT "OcorrenciaRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaRH" ADD CONSTRAINT "OcorrenciaRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ouvidoria" ADD CONSTRAINT "Ouvidoria_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OuvidoriaPhanyx" ADD CONSTRAINT "OuvidoriaPhanyx_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_incluidoPorId_fkey" FOREIGN KEY ("incluidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ParticipanteProgramaRemuneracaoVariavelRH_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "ProgramaRemuneracaoVariavelRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoMatricula" ADD CONSTRAINT "PeriodoMatricula_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoMatricula" ADD CONSTRAINT "PeriodoMatricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoComissaoRH" ADD CONSTRAINT "PlanoComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoComissaoRH" ADD CONSTRAINT "PlanoComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polo" ADD CONSTRAINT "Polo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PontoFuncionarioRH" ADD CONSTRAINT "PontoFuncionarioRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PontoFuncionarioRH" ADD CONSTRAINT "PontoFuncionarioRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciaAgendaOperacional" ADD CONSTRAINT "PreferenciaAgendaOperacional_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciaAgendaOperacional" ADD CONSTRAINT "PreferenciaAgendaOperacional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_substituicaoDocenteId_fkey" FOREIGN KEY ("substituicaoDocenteId") REFERENCES "SubstituicaoDocente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorDisciplina" ADD CONSTRAINT "ProfessorDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorDisciplina" ADD CONSTRAINT "ProfessorDisciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorDisciplina" ADD CONSTRAINT "ProfessorDisciplina_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRemuneracaoVariavelRH" ADD CONSTRAINT "ProgramaRemuneracaoVariavelRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_substituicaoDocenteId_fkey" FOREIGN KEY ("substituicaoDocenteId") REFERENCES "SubstituicaoDocente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvaAluno" ADD CONSTRAINT "ProvaAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvaAluno" ADD CONSTRAINT "ProvaAluno_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraComissaoRH" ADD CONSTRAINT "RegraComissaoRH_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoComissaoRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescisaoRH" ADD CONSTRAINT "RescisaoRH_arquivadaPorId_fkey" FOREIGN KEY ("arquivadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescisaoRH" ADD CONSTRAINT "RescisaoRH_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescisaoRH" ADD CONSTRAINT "RescisaoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescisaoRH" ADD CONSTRAINT "RescisaoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescisaoRH" ADD CONSTRAINT "RescisaoRH_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "Alternativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "TentativaProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReuniaoParticipante" ADD CONSTRAINT "ReuniaoParticipante_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReuniaoParticipante" ADD CONSTRAINT "ReuniaoParticipante_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "Reuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReuniaoParticipante" ADD CONSTRAINT "ReuniaoParticipante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoItemRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoItemRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoItemRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoItemRH_marcacaoGeradaId_fkey" FOREIGN KEY ("marcacaoGeradaId") REFERENCES "MarcacaoPontoMobileRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoItemRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoItemRH_marcacaoOriginalId_fkey" FOREIGN KEY ("marcacaoOriginalId") REFERENCES "MarcacaoPontoMobileRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoItemRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoItemRH_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoCorrecaoPontoRH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoRH_aplicadoPorId_fkey" FOREIGN KEY ("aplicadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoRH_autorizacaoId_fkey" FOREIGN KEY ("autorizacaoId") REFERENCES "AutorizacaoCorrecaoPontoRH"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoRH_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoRH_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCorrecaoPontoRH" ADD CONSTRAINT "SolicitacaoCorrecaoPontoRH_pontoFuncionarioRHId_fkey" FOREIGN KEY ("pontoFuncionarioRHId") REFERENCES "PontoFuncionarioRH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituicaoDocente" ADD CONSTRAINT "SubstituicaoDocente_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituicaoDocente" ADD CONSTRAINT "SubstituicaoDocente_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituicaoDocente" ADD CONSTRAINT "SubstituicaoDocente_professorSubstitutoId_fkey" FOREIGN KEY ("professorSubstitutoId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituicaoDocente" ADD CONSTRAINT "SubstituicaoDocente_professorTitularId_fkey" FOREIGN KEY ("professorTitularId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituicaoDocente" ADD CONSTRAINT "SubstituicaoDocente_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_turmaSemestreId_fkey" FOREIGN KEY ("turmaSemestreId") REFERENCES "TurmaSemestre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplinaHorario" ADD CONSTRAINT "TurmaDisciplinaHorario_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaDisciplinaHorario" ADD CONSTRAINT "TurmaDisciplinaHorario_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "TurmaDisciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSemestre" ADD CONSTRAINT "TurmaSemestre_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSemestre" ADD CONSTRAINT "TurmaSemestre_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitante" ADD CONSTRAINT "Visitante_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitante" ADD CONSTRAINT "Visitante_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
