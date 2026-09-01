-- CreateEnum
CREATE TYPE "CategoriaRiscoAtividadeExterna" AS ENUM ('TRANSPORTE', 'SAUDE', 'CLIMA', 'AMBIENTE', 'ATIVIDADE_FISICA', 'AQUATICO', 'SEGURANCA', 'ALIMENTACAO', 'ACESSIBILIDADE', 'COMPORTAMENTO', 'TECNOLOGIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ProbabilidadeRiscoAtividadeExterna" AS ENUM ('MUITO_BAIXA', 'BAIXA', 'MEDIA', 'ALTA', 'MUITO_ALTA');

-- CreateEnum
CREATE TYPE "GravidadeRiscoAtividadeExterna" AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'MUITO_GRAVE', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusRiscoAtividadeExterna" AS ENUM ('IDENTIFICADO', 'EM_TRATAMENTO', 'MITIGADO', 'ACEITO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "StatusPlanoEmergenciaAtividadeExterna" AS ENUM ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'ATIVO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoCheckpointAtividadeExterna" AS ENUM ('SAIDA_ORIGEM', 'CHEGADA_DESTINO', 'SAIDA_DESTINO', 'RETORNO_ORIGEM', 'EMBARQUE', 'DESEMBARQUE', 'PONTO_ENCONTRO', 'CONTAGEM', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "StatusCheckpointParticipante" AS ENUM ('NAO_VERIFICADO', 'PRESENTE', 'AUSENTE', 'DISPENSADO', 'ATRASADO', 'NAO_SE_APLICA');

-- CreateEnum
CREATE TYPE "OrigemRegistroCheckpoint" AS ENUM ('MANUAL', 'LISTA', 'QR_CODE', 'NFC', 'BIOMETRIA', 'INTEGRACAO', 'AUTOMATICO');

-- CreateEnum
CREATE TYPE "StatusPassageiroTrechoAtividadeExterna" AS ENUM ('PLANEJADO', 'AGUARDANDO_EMBARQUE', 'EMBARCADO', 'NAO_EMBARCOU', 'DESEMBARCADO', 'TRANSFERIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusVeiculoTrechoAtividadeExterna" AS ENUM ('PLANEJADO', 'CONFIRMADO', 'EM_EMBARQUE', 'EM_TRANSITO', 'CHEGOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PapelCondutorTrechoAtividadeExterna" AS ENUM ('PRINCIPAL', 'AUXILIAR', 'RESERVA', 'OPERADOR', 'OPERADOR_REMOTO', 'SUPERVISOR_AUTONOMO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoModalTransporte" AS ENUM ('ONIBUS', 'MICRO_ONIBUS', 'VAN', 'AUTOMOVEL', 'VEICULO_AUTONOMO', 'AVIAO', 'HELICOPTERO', 'TREM', 'METRO', 'BONDE', 'BARCO', 'FERRY', 'NAVIO', 'TRANSPORTE_PUBLICO', 'BICICLETA', 'CAMINHADA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusTrechoAtividadeExterna" AS ENUM ('PLANEJADO', 'CONFIRMADO', 'EM_EMBARQUE', 'EM_TRANSITO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCondutorTransporte" AS ENUM ('MOTORISTA', 'PILOTO', 'MAQUINISTA', 'COMANDANTE_EMBARCACAO', 'OPERADOR', 'OPERADOR_REMOTO', 'SUPERVISOR_AUTONOMO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoDocumentoAtividadeExterna" AS ENUM ('ROTEIRO', 'TERMO_AUTORIZACAO', 'AUTORIZACAO_ASSINADA', 'CONTRATO_TRANSPORTE', 'CONTRATO_HOSPEDAGEM', 'SEGURO_VIAGEM', 'APOLICE_TRANSPORTE', 'LICENCA_PRESTADOR', 'DOCUMENTO_VEICULO', 'DOCUMENTO_CONDUTOR', 'AVALIACAO_RISCO', 'PLANO_EMERGENCIA', 'COMPROVANTE_RESERVA', 'PASSAGEM', 'HOSPEDAGEM', 'PASSAPORTE', 'VISTO', 'DOCUMENTO_MEDICO', 'LISTA_PARTICIPANTES', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDocumentoAtividadeExterna" AS ENUM ('ATIVO', 'PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'VENCIDO', 'SUBSTITUIDO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoAtividadeExterna" AS ENUM ('EXCURSAO', 'VISITA_TECNICA', 'VIAGEM_PEDAGOGICA', 'ACAMPAMENTO', 'RETIRO', 'COMPETICAO', 'INTERCAMBIO', 'EVENTO_ESPORTIVO', 'ATIVIDADE_COMUNITARIA', 'VIAGEM_INTERNACIONAL', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusAtividadeExterna" AS ENUM ('RASCUNHO', 'PLANEJAMENTO', 'AGUARDANDO_AUTORIZACOES', 'CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "OrigemParticipanteAtividadeExterna" AS ENUM ('TURMA', 'MANUAL', 'IMPORTACAO');

-- CreateEnum
CREATE TYPE "StatusParticipacaoAtividadeExterna" AS ENUM ('CONVIDADO', 'AGUARDANDO_AUTORIZACAO', 'CONFIRMADO', 'RECUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusPresencaAtividadeExterna" AS ENUM ('NAO_REGISTRADA', 'PRESENTE', 'AUSENTE', 'SAIDA_ANTECIPADA');

-- CreateEnum
CREATE TYPE "StatusPagamentoAtividadeExterna" AS ENUM ('NAO_APLICAVEL', 'PENDENTE', 'PARCIAL', 'PAGO', 'ISENTO', 'REEMBOLSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMembroEquipeAtividadeExterna" AS ENUM ('PROFESSOR', 'FUNCIONARIO', 'ACOMPANHANTE_EXTERNO', 'RESPONSAVEL_VOLUNTARIO', 'GUIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "PapelEquipeAtividadeExterna" AS ENUM ('RESPONSAVEL_GERAL', 'COORDENADOR', 'SUPERVISOR', 'MONITOR', 'PRIMEIROS_SOCORROS', 'ACOMPANHANTE', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusAutorizacaoAtividadeExterna" AS ENUM ('PENDENTE', 'AUTORIZADO', 'NAO_AUTORIZADO', 'REVOGADO', 'DISPENSADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "MetodoAutorizacaoAtividadeExterna" AS ENUM ('PORTAL', 'LINK_SEGURO', 'PRESENCIAL', 'IMPORTADO', 'ADMINISTRATIVO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoPrestadorTransporte" AS ENUM ('RODOVIARIO', 'AEREO', 'FERROVIARIO', 'MARITIMO', 'MOBILIDADE_AUTONOMA', 'MULTIMODAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusVerificacaoTransporteEstudantil" AS ENUM ('NAO_VERIFICADO', 'VERIFICADO', 'NAO_AUTORIZADO', 'NAO_APLICAVEL');

-- CreateEnum
CREATE TYPE "TipoVeiculoTransporte" AS ENUM ('ONIBUS', 'MICRO_ONIBUS', 'VAN', 'AUTOMOVEL', 'SUV', 'MINIVAN', 'CAMINHAO_ADAPTADO', 'AERONAVE', 'TREM', 'METRO', 'BONDE', 'BARCO', 'FERRY', 'EMBARCACAO', 'BICICLETA', 'VEICULO_AUTONOMO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoConducaoVeiculo" AS ENUM ('HUMANA', 'ADAS', 'AUTOMATIZADA_SUPERVISIONADA', 'AUTONOMA', 'SUPERVISAO_REMOTA', 'MISTA', 'NAO_APLICAVEL');

-- CreateTable
CREATE TABLE "CondutorTransporte" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "prestadorTransporteId" INTEGER,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCondutorTransporte" NOT NULL DEFAULT 'MOTORISTA',
    "telefone" TEXT,
    "email" TEXT,
    "paisDocumento" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "numeroLicenca" TEXT,
    "categoriaLicenca" TEXT,
    "licencaValidaAte" TIMESTAMP(3),
    "autorizadoTransporteEstudantil" "StatusVerificacaoTransporteEstudantil" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "contatoEmergencia" TEXT,
    "telefoneEmergencia" TEXT,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CondutorTransporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaTrecho" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "titulo" TEXT,
    "modal" "TipoModalTransporte" NOT NULL,
    "prestadorTransporteId" INTEGER,
    "origemNome" TEXT NOT NULL,
    "origemEndereco" TEXT,
    "origemCidade" TEXT,
    "origemRegiao" TEXT,
    "origemPais" TEXT,
    "destinoNome" TEXT NOT NULL,
    "destinoEndereco" TEXT,
    "destinoCidade" TEXT,
    "destinoRegiao" TEXT,
    "destinoPais" TEXT,
    "partidaPrevista" TIMESTAMP(3),
    "chegadaPrevista" TIMESTAMP(3),
    "partidaReal" TIMESTAMP(3),
    "chegadaReal" TIMESTAMP(3),
    "numeroReferencia" TEXT,
    "observacao" TEXT,
    "status" "StatusTrechoAtividadeExterna" NOT NULL DEFAULT 'PLANEJADO',
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaTrecho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaTrechoVeiculo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaTrechoId" INTEGER NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "supervisorEquipeId" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "identificacaoOperacional" TEXT,
    "capacidadePlanejada" INTEGER,
    "pontoEmbarque" TEXT,
    "pontoDesembarque" TEXT,
    "embarquePrevisto" TIMESTAMP(3),
    "desembarquePrevisto" TIMESTAMP(3),
    "embarqueReal" TIMESTAMP(3),
    "desembarqueReal" TIMESTAMP(3),
    "status" "StatusVeiculoTrechoAtividadeExterna" NOT NULL DEFAULT 'PLANEJADO',
    "observacao" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaTrechoVeiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaTrechoVeiculoCondutor" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "trechoVeiculoId" INTEGER NOT NULL,
    "condutorId" INTEGER NOT NULL,
    "papel" "PapelCondutorTrechoAtividadeExterna" NOT NULL DEFAULT 'PRINCIPAL',
    "observacao" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaTrechoVeiculoCondutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaTrechoPassageiro" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaTrechoId" INTEGER NOT NULL,
    "trechoVeiculoId" INTEGER NOT NULL,
    "participanteId" INTEGER NOT NULL,
    "assento" TEXT,
    "status" "StatusPassageiroTrechoAtividadeExterna" NOT NULL DEFAULT 'PLANEJADO',
    "embarcadoEm" TIMESTAMP(3),
    "desembarcadoEm" TIMESTAMP(3),
    "embarqueConfirmadoPorId" INTEGER,
    "desembarqueConfirmadoPorId" INTEGER,
    "observacao" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaTrechoPassageiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaCheckpoint" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCheckpointAtividadeExterna" NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "localNome" TEXT,
    "localEndereco" TEXT,
    "previstoEm" TIMESTAMP(3),
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaCheckpointRegistro" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "checkpointId" INTEGER NOT NULL,
    "participanteId" INTEGER NOT NULL,
    "status" "StatusCheckpointParticipante" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "registradoEm" TIMESTAMP(3),
    "origemRegistro" "OrigemRegistroCheckpoint" NOT NULL DEFAULT 'MANUAL',
    "observacao" TEXT,
    "registradoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaCheckpointRegistro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaSaudeParticipante" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "participanteId" INTEGER NOT NULL,
    "possuiAlergia" BOOLEAN NOT NULL DEFAULT false,
    "alergias" TEXT,
    "possuiRestricaoAlimentar" BOOLEAN NOT NULL DEFAULT false,
    "restricoesAlimentares" TEXT,
    "utilizaMedicacao" BOOLEAN NOT NULL DEFAULT false,
    "medicacoes" TEXT,
    "necessitaMedicacaoDuranteAtividade" BOOLEAN NOT NULL DEFAULT false,
    "instrucoesMedicacao" TEXT,
    "possuiCondicaoSaudeRelevante" BOOLEAN NOT NULL DEFAULT false,
    "condicoesSaudeRelevantes" TEXT,
    "possuiNecessidadeEspecial" BOOLEAN NOT NULL DEFAULT false,
    "necessidadesEspeciais" TEXT,
    "necessitaAcessibilidade" BOOLEAN NOT NULL DEFAULT false,
    "orientacoesAcessibilidade" TEXT,
    "necessitaAcompanhamentoIndividual" BOOLEAN NOT NULL DEFAULT false,
    "orientacoesAcompanhamento" TEXT,
    "contatoEmergenciaNome" TEXT,
    "contatoEmergenciaTelefone" TEXT,
    "contatoEmergenciaParentesco" TEXT,
    "medicoOuServicoReferencia" TEXT,
    "telefoneMedicoOuServico" TEXT,
    "planoSaudeOuSeguro" TEXT,
    "numeroPlanoOuSeguro" TEXT,
    "observacoesEmergencia" TEXT,
    "informacaoConfirmadaPeloResponsavel" BOOLEAN NOT NULL DEFAULT false,
    "confirmadaEm" TIMESTAMP(3),
    "registradaPorId" INTEGER,
    "atualizadaPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaSaudeParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaRisco" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaRiscoAtividadeExterna" NOT NULL,
    "probabilidade" "ProbabilidadeRiscoAtividadeExterna" NOT NULL,
    "gravidade" "GravidadeRiscoAtividadeExterna" NOT NULL,
    "medidasPreventivas" TEXT,
    "planoResposta" TEXT,
    "responsavelEquipeId" INTEGER,
    "status" "StatusRiscoAtividadeExterna" NOT NULL DEFAULT 'IDENTIFICADO',
    "observacao" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaRisco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaPlanoEmergencia" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "status" "StatusPlanoEmergenciaAtividadeExterna" NOT NULL DEFAULT 'RASCUNHO',
    "contatoEmergenciaEscola" TEXT,
    "telefoneEmergenciaEscola" TEXT,
    "responsavelEmergenciaNome" TEXT,
    "responsavelEmergenciaTelefone" TEXT,
    "numeroEmergenciaLocal" TEXT,
    "hospitalReferencia" TEXT,
    "enderecoHospitalReferencia" TEXT,
    "telefoneHospitalReferencia" TEXT,
    "servicoAlternativoEmergencia" TEXT,
    "telefoneServicoAlternativo" TEXT,
    "pontoEncontroEmergencia" TEXT,
    "procedimentoEvacuacao" TEXT,
    "procedimentoAcidente" TEXT,
    "procedimentoPessoaDesaparecida" TEXT,
    "procedimentoEmergenciaMedica" TEXT,
    "procedimentoClimaSevero" TEXT,
    "instrucoesGerais" TEXT,
    "observacao" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaPlanoEmergencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExterna" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "poloId" INTEGER,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoAtividadeExterna" NOT NULL,
    "status" "StatusAtividadeExterna" NOT NULL DEFAULT 'RASCUNHO',
    "descricao" TEXT,
    "objetivoPedagogico" TEXT,
    "curricular" BOOLEAN NOT NULL DEFAULT false,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "internacional" BOOLEAN NOT NULL DEFAULT false,
    "destinoNome" TEXT,
    "enderecoDestino" TEXT,
    "cidadeDestino" TEXT,
    "regiaoDestino" TEXT,
    "paisDestino" TEXT,
    "fusoHorario" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "saidaEm" TIMESTAMP(3),
    "retornoPrevistoEm" TIMESTAMP(3),
    "retornoRealEm" TIMESTAMP(3),
    "capacidadeMaxima" INTEGER,
    "valorParticipante" DECIMAL(12,2),
    "moeda" TEXT,
    "exigeAutorizacaoResponsavel" BOOLEAN NOT NULL DEFAULT true,
    "exigePagamento" BOOLEAN NOT NULL DEFAULT false,
    "exigeCheckin" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "responsavelPrincipalUserId" INTEGER,
    "publicadoEm" TIMESTAMP(3),
    "encerradoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExterna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaTurma" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "adicionadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtividadeExternaTurma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaParticipante" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "origem" "OrigemParticipanteAtividadeExterna" NOT NULL DEFAULT 'MANUAL',
    "statusParticipacao" "StatusParticipacaoAtividadeExterna" NOT NULL DEFAULT 'CONVIDADO',
    "statusPresenca" "StatusPresencaAtividadeExterna" NOT NULL DEFAULT 'NAO_REGISTRADA',
    "statusPagamento" "StatusPagamentoAtividadeExterna" NOT NULL DEFAULT 'NAO_APLICAVEL',
    "grupoNome" TEXT,
    "observacao" TEXT,
    "convidadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmadoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaEquipe" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "tipoMembro" "TipoMembroEquipeAtividadeExterna" NOT NULL,
    "papel" "PapelEquipeAtividadeExterna" NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "professorId" INTEGER,
    "funcionarioId" INTEGER,
    "nomeSnapshot" TEXT NOT NULL,
    "emailSnapshot" TEXT,
    "telefoneSnapshot" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaAutorizacao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "participanteId" INTEGER NOT NULL,
    "status" "StatusAutorizacaoAtividadeExterna" NOT NULL DEFAULT 'PENDENTE',
    "metodo" "MetodoAutorizacaoAtividadeExterna",
    "responsavelNomeSnapshot" TEXT,
    "responsavelEmailSnapshot" TEXT,
    "responsavelTelefoneSnapshot" TEXT,
    "responsavelParentescoSnapshot" TEXT,
    "versaoTermo" TEXT,
    "textoTermoSnapshot" TEXT,
    "observacao" TEXT,
    "respondidaPorUserId" INTEGER,
    "registradaPorUserId" INTEGER,
    "respondidaEm" TIMESTAMP(3),
    "revogadaEm" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaAutorizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeExternaDocumento" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeExternaId" INTEGER NOT NULL,
    "prestadorTransporteId" INTEGER,
    "veiculoId" INTEGER,
    "participanteId" INTEGER,
    "tipo" "TipoDocumentoAtividadeExterna" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivoUrl" TEXT,
    "arquivoNome" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "numeroDocumento" TEXT,
    "emitidoEm" TIMESTAMP(3),
    "validoAte" TIMESTAMP(3),
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "confidencial" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusDocumentoAtividadeExterna" NOT NULL DEFAULT 'ATIVO',
    "observacao" TEXT,
    "enviadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtividadeExternaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestadorTransporte" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "tipo" "TipoPrestadorTransporte" NOT NULL,
    "pais" TEXT,
    "regiao" TEXT,
    "cidade" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "responsavelContato" TEXT,
    "telefoneResponsavelContato" TEXT,
    "emailResponsavelContato" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "numeroLicenca" TEXT,
    "licencaValidaAte" TIMESTAMP(3),
    "numeroApolice" TEXT,
    "seguroValidoAte" TIMESTAMP(3),
    "verificacaoTransporteEstudantil" "StatusVerificacaoTransporteEstudantil" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "permiteSubcontratacao" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrestadorTransporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VeiculoTransporte" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "prestadorTransporteId" INTEGER,
    "nomeIdentificacao" TEXT,
    "tipo" "TipoVeiculoTransporte" NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "ano" INTEGER,
    "placa" TEXT,
    "paisRegistro" TEXT,
    "identificadorExterno" TEXT,
    "capacidadePassageiros" INTEGER,
    "acessivelPcd" BOOLEAN NOT NULL DEFAULT false,
    "tipoConducao" "TipoConducaoVeiculo" NOT NULL DEFAULT 'HUMANA',
    "sistemaConducao" TEXT,
    "versaoSoftware" TEXT,
    "possuiRastreamento" BOOLEAN NOT NULL DEFAULT false,
    "possuiTelemetria" BOOLEAN NOT NULL DEFAULT false,
    "trackingProvider" TEXT,
    "externalVehicleId" TEXT,
    "autorizadoTransporteEstudantil" "StatusVerificacaoTransporteEstudantil" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeiculoTransporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CondutorTransporte_instituicaoId_idx" ON "CondutorTransporte"("instituicaoId");

-- CreateIndex
CREATE INDEX "CondutorTransporte_instituicaoId_ativo_idx" ON "CondutorTransporte"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "CondutorTransporte_prestadorTransporteId_idx" ON "CondutorTransporte"("prestadorTransporteId");

-- CreateIndex
CREATE INDEX "CondutorTransporte_tipo_idx" ON "CondutorTransporte"("tipo");

-- CreateIndex
CREATE INDEX "CondutorTransporte_numeroLicenca_idx" ON "CondutorTransporte"("numeroLicenca");

-- CreateIndex
CREATE INDEX "CondutorTransporte_criadoPorId_idx" ON "CondutorTransporte"("criadoPorId");

-- CreateIndex
CREATE INDEX "CondutorTransporte_atualizadoPorId_idx" ON "CondutorTransporte"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "CondutorTransporte_id_instituicaoId_key" ON "CondutorTransporte"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_instituicaoId_idx" ON "AtividadeExternaTrecho"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_atividadeExternaId_idx" ON "AtividadeExternaTrecho"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_prestadorTransporteId_idx" ON "AtividadeExternaTrecho"("prestadorTransporteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_modal_idx" ON "AtividadeExternaTrecho"("modal");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_status_idx" ON "AtividadeExternaTrecho"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_partidaPrevista_idx" ON "AtividadeExternaTrecho"("partidaPrevista");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_criadoPorId_idx" ON "AtividadeExternaTrecho"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrecho_atualizadoPorId_idx" ON "AtividadeExternaTrecho"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrecho_id_instituicaoId_key" ON "AtividadeExternaTrecho"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrecho_atividadeExternaId_ordem_key" ON "AtividadeExternaTrecho"("atividadeExternaId", "ordem");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_instituicaoId_idx" ON "AtividadeExternaTrechoVeiculo"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_atividadeExternaTrechoId_idx" ON "AtividadeExternaTrechoVeiculo"("atividadeExternaTrechoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_veiculoId_idx" ON "AtividadeExternaTrechoVeiculo"("veiculoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_supervisorEquipeId_idx" ON "AtividadeExternaTrechoVeiculo"("supervisorEquipeId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_status_idx" ON "AtividadeExternaTrechoVeiculo"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_criadoPorId_idx" ON "AtividadeExternaTrechoVeiculo"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculo_atualizadoPorId_idx" ON "AtividadeExternaTrechoVeiculo"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoVeiculo_id_instituicaoId_key" ON "AtividadeExternaTrechoVeiculo"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoVeiculo_atividadeExternaTrechoId_veic_key" ON "AtividadeExternaTrechoVeiculo"("atividadeExternaTrechoId", "veiculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoVeiculo_id_atividadeExternaTrechoId_i_key" ON "AtividadeExternaTrechoVeiculo"("id", "atividadeExternaTrechoId", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculoCondutor_instituicaoId_idx" ON "AtividadeExternaTrechoVeiculoCondutor"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculoCondutor_trechoVeiculoId_idx" ON "AtividadeExternaTrechoVeiculoCondutor"("trechoVeiculoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculoCondutor_condutorId_idx" ON "AtividadeExternaTrechoVeiculoCondutor"("condutorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculoCondutor_papel_idx" ON "AtividadeExternaTrechoVeiculoCondutor"("papel");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculoCondutor_criadoPorId_idx" ON "AtividadeExternaTrechoVeiculoCondutor"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoVeiculoCondutor_atualizadoPorId_idx" ON "AtividadeExternaTrechoVeiculoCondutor"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoVeiculoCondutor_id_instituicaoId_key" ON "AtividadeExternaTrechoVeiculoCondutor"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoVeiculoCondutor_trechoVeiculoId_condu_key" ON "AtividadeExternaTrechoVeiculoCondutor"("trechoVeiculoId", "condutorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_instituicaoId_idx" ON "AtividadeExternaTrechoPassageiro"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_atividadeExternaTrechoId_idx" ON "AtividadeExternaTrechoPassageiro"("atividadeExternaTrechoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_trechoVeiculoId_idx" ON "AtividadeExternaTrechoPassageiro"("trechoVeiculoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_participanteId_idx" ON "AtividadeExternaTrechoPassageiro"("participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_status_idx" ON "AtividadeExternaTrechoPassageiro"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_embarqueConfirmadoPorId_idx" ON "AtividadeExternaTrechoPassageiro"("embarqueConfirmadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_desembarqueConfirmadoPorId_idx" ON "AtividadeExternaTrechoPassageiro"("desembarqueConfirmadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_criadoPorId_idx" ON "AtividadeExternaTrechoPassageiro"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTrechoPassageiro_atualizadoPorId_idx" ON "AtividadeExternaTrechoPassageiro"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoPassageiro_id_instituicaoId_key" ON "AtividadeExternaTrechoPassageiro"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTrechoPassageiro_atividadeExternaTrechoId_p_key" ON "AtividadeExternaTrechoPassageiro"("atividadeExternaTrechoId", "participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_instituicaoId_idx" ON "AtividadeExternaCheckpoint"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_atividadeExternaId_idx" ON "AtividadeExternaCheckpoint"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_tipo_idx" ON "AtividadeExternaCheckpoint"("tipo");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_previstoEm_idx" ON "AtividadeExternaCheckpoint"("previstoEm");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_ativo_idx" ON "AtividadeExternaCheckpoint"("ativo");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_criadoPorId_idx" ON "AtividadeExternaCheckpoint"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpoint_atualizadoPorId_idx" ON "AtividadeExternaCheckpoint"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaCheckpoint_id_atividadeExternaId_instituica_key" ON "AtividadeExternaCheckpoint"("id", "atividadeExternaId", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaCheckpoint_atividadeExternaId_ordem_key" ON "AtividadeExternaCheckpoint"("atividadeExternaId", "ordem");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_instituicaoId_idx" ON "AtividadeExternaCheckpointRegistro"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_atividadeExternaId_idx" ON "AtividadeExternaCheckpointRegistro"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_checkpointId_idx" ON "AtividadeExternaCheckpointRegistro"("checkpointId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_participanteId_idx" ON "AtividadeExternaCheckpointRegistro"("participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_status_idx" ON "AtividadeExternaCheckpointRegistro"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_registradoEm_idx" ON "AtividadeExternaCheckpointRegistro"("registradoEm");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_registradoPorId_idx" ON "AtividadeExternaCheckpointRegistro"("registradoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaCheckpointRegistro_atualizadoPorId_idx" ON "AtividadeExternaCheckpointRegistro"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaCheckpointRegistro_checkpointId_participant_key" ON "AtividadeExternaCheckpointRegistro"("checkpointId", "participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_instituicaoId_idx" ON "AtividadeExternaSaudeParticipante"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_atividadeExternaId_idx" ON "AtividadeExternaSaudeParticipante"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_participanteId_idx" ON "AtividadeExternaSaudeParticipante"("participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_possuiAlergia_idx" ON "AtividadeExternaSaudeParticipante"("possuiAlergia");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_utilizaMedicacao_idx" ON "AtividadeExternaSaudeParticipante"("utilizaMedicacao");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_possuiCondicaoSaudeReleva_idx" ON "AtividadeExternaSaudeParticipante"("possuiCondicaoSaudeRelevante");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_necessitaAcessibilidade_idx" ON "AtividadeExternaSaudeParticipante"("necessitaAcessibilidade");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_necessitaAcompanhamentoIn_idx" ON "AtividadeExternaSaudeParticipante"("necessitaAcompanhamentoIndividual");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_registradaPorId_idx" ON "AtividadeExternaSaudeParticipante"("registradaPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaSaudeParticipante_atualizadaPorId_idx" ON "AtividadeExternaSaudeParticipante"("atualizadaPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaSaudeParticipante_id_instituicaoId_key" ON "AtividadeExternaSaudeParticipante"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaSaudeParticipante_participanteId_atividadeE_key" ON "AtividadeExternaSaudeParticipante"("participanteId", "atividadeExternaId", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_instituicaoId_idx" ON "AtividadeExternaRisco"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_atividadeExternaId_idx" ON "AtividadeExternaRisco"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_categoria_idx" ON "AtividadeExternaRisco"("categoria");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_probabilidade_idx" ON "AtividadeExternaRisco"("probabilidade");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_gravidade_idx" ON "AtividadeExternaRisco"("gravidade");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_status_idx" ON "AtividadeExternaRisco"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_responsavelEquipeId_idx" ON "AtividadeExternaRisco"("responsavelEquipeId");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_criadoPorId_idx" ON "AtividadeExternaRisco"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaRisco_atualizadoPorId_idx" ON "AtividadeExternaRisco"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaRisco_id_instituicaoId_key" ON "AtividadeExternaRisco"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaPlanoEmergencia_instituicaoId_idx" ON "AtividadeExternaPlanoEmergencia"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaPlanoEmergencia_atividadeExternaId_idx" ON "AtividadeExternaPlanoEmergencia"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaPlanoEmergencia_status_idx" ON "AtividadeExternaPlanoEmergencia"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaPlanoEmergencia_criadoPorId_idx" ON "AtividadeExternaPlanoEmergencia"("criadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaPlanoEmergencia_atualizadoPorId_idx" ON "AtividadeExternaPlanoEmergencia"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaPlanoEmergencia_id_instituicaoId_key" ON "AtividadeExternaPlanoEmergencia"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaPlanoEmergencia_atividadeExternaId_institui_key" ON "AtividadeExternaPlanoEmergencia"("atividadeExternaId", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExterna_instituicaoId_idx" ON "AtividadeExterna"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExterna_instituicaoId_status_idx" ON "AtividadeExterna"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "AtividadeExterna_instituicaoId_tipo_idx" ON "AtividadeExterna"("instituicaoId", "tipo");

-- CreateIndex
CREATE INDEX "AtividadeExterna_poloId_idx" ON "AtividadeExterna"("poloId");

-- CreateIndex
CREATE INDEX "AtividadeExterna_saidaEm_idx" ON "AtividadeExterna"("saidaEm");

-- CreateIndex
CREATE INDEX "AtividadeExterna_responsavelPrincipalUserId_idx" ON "AtividadeExterna"("responsavelPrincipalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExterna_id_instituicaoId_key" ON "AtividadeExterna"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTurma_instituicaoId_idx" ON "AtividadeExternaTurma"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTurma_atividadeExternaId_idx" ON "AtividadeExternaTurma"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaTurma_turmaId_idx" ON "AtividadeExternaTurma"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaTurma_atividadeExternaId_turmaId_key" ON "AtividadeExternaTurma"("atividadeExternaId", "turmaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaParticipante_instituicaoId_idx" ON "AtividadeExternaParticipante"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaParticipante_atividadeExternaId_idx" ON "AtividadeExternaParticipante"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaParticipante_alunoId_idx" ON "AtividadeExternaParticipante"("alunoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaParticipante_statusParticipacao_idx" ON "AtividadeExternaParticipante"("statusParticipacao");

-- CreateIndex
CREATE INDEX "AtividadeExternaParticipante_statusPresenca_idx" ON "AtividadeExternaParticipante"("statusPresenca");

-- CreateIndex
CREATE INDEX "AtividadeExternaParticipante_statusPagamento_idx" ON "AtividadeExternaParticipante"("statusPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaParticipante_atividadeExternaId_alunoId_key" ON "AtividadeExternaParticipante"("atividadeExternaId", "alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaParticipante_id_instituicaoId_key" ON "AtividadeExternaParticipante"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaParticipante_id_atividadeExternaId_institui_key" ON "AtividadeExternaParticipante"("id", "atividadeExternaId", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaEquipe_instituicaoId_idx" ON "AtividadeExternaEquipe"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaEquipe_atividadeExternaId_idx" ON "AtividadeExternaEquipe"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaEquipe_userId_idx" ON "AtividadeExternaEquipe"("userId");

-- CreateIndex
CREATE INDEX "AtividadeExternaEquipe_professorId_idx" ON "AtividadeExternaEquipe"("professorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaEquipe_funcionarioId_idx" ON "AtividadeExternaEquipe"("funcionarioId");

-- CreateIndex
CREATE INDEX "AtividadeExternaEquipe_papel_idx" ON "AtividadeExternaEquipe"("papel");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaEquipe_id_instituicaoId_key" ON "AtividadeExternaEquipe"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaAutorizacao_instituicaoId_idx" ON "AtividadeExternaAutorizacao"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaAutorizacao_atividadeExternaId_idx" ON "AtividadeExternaAutorizacao"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaAutorizacao_participanteId_idx" ON "AtividadeExternaAutorizacao"("participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaAutorizacao_status_idx" ON "AtividadeExternaAutorizacao"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaAutorizacao_respondidaPorUserId_idx" ON "AtividadeExternaAutorizacao"("respondidaPorUserId");

-- CreateIndex
CREATE INDEX "AtividadeExternaAutorizacao_registradaPorUserId_idx" ON "AtividadeExternaAutorizacao"("registradaPorUserId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_instituicaoId_idx" ON "AtividadeExternaDocumento"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_atividadeExternaId_idx" ON "AtividadeExternaDocumento"("atividadeExternaId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_prestadorTransporteId_idx" ON "AtividadeExternaDocumento"("prestadorTransporteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_veiculoId_idx" ON "AtividadeExternaDocumento"("veiculoId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_participanteId_idx" ON "AtividadeExternaDocumento"("participanteId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_tipo_idx" ON "AtividadeExternaDocumento"("tipo");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_status_idx" ON "AtividadeExternaDocumento"("status");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_validoAte_idx" ON "AtividadeExternaDocumento"("validoAte");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_obrigatorio_idx" ON "AtividadeExternaDocumento"("obrigatorio");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_confidencial_idx" ON "AtividadeExternaDocumento"("confidencial");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_enviadoPorId_idx" ON "AtividadeExternaDocumento"("enviadoPorId");

-- CreateIndex
CREATE INDEX "AtividadeExternaDocumento_atualizadoPorId_idx" ON "AtividadeExternaDocumento"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeExternaDocumento_id_instituicaoId_key" ON "AtividadeExternaDocumento"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "PrestadorTransporte_instituicaoId_idx" ON "PrestadorTransporte"("instituicaoId");

-- CreateIndex
CREATE INDEX "PrestadorTransporte_instituicaoId_ativo_idx" ON "PrestadorTransporte"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "PrestadorTransporte_tipo_idx" ON "PrestadorTransporte"("tipo");

-- CreateIndex
CREATE INDEX "PrestadorTransporte_verificacaoTransporteEstudantil_idx" ON "PrestadorTransporte"("verificacaoTransporteEstudantil");

-- CreateIndex
CREATE INDEX "PrestadorTransporte_criadoPorId_idx" ON "PrestadorTransporte"("criadoPorId");

-- CreateIndex
CREATE INDEX "PrestadorTransporte_atualizadoPorId_idx" ON "PrestadorTransporte"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "PrestadorTransporte_id_instituicaoId_key" ON "PrestadorTransporte"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_instituicaoId_idx" ON "VeiculoTransporte"("instituicaoId");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_instituicaoId_ativo_idx" ON "VeiculoTransporte"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_prestadorTransporteId_idx" ON "VeiculoTransporte"("prestadorTransporteId");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_tipo_idx" ON "VeiculoTransporte"("tipo");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_tipoConducao_idx" ON "VeiculoTransporte"("tipoConducao");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_placa_idx" ON "VeiculoTransporte"("placa");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_externalVehicleId_idx" ON "VeiculoTransporte"("externalVehicleId");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_criadoPorId_idx" ON "VeiculoTransporte"("criadoPorId");

-- CreateIndex
CREATE INDEX "VeiculoTransporte_atualizadoPorId_idx" ON "VeiculoTransporte"("atualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "VeiculoTransporte_id_instituicaoId_key" ON "VeiculoTransporte"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_id_instituicaoId_key" ON "Aluno"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "CondutorTransporte" ADD CONSTRAINT "CondutorTransporte_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondutorTransporte" ADD CONSTRAINT "CondutorTransporte_prestadorTransporteId_instituicaoId_fkey" FOREIGN KEY ("prestadorTransporteId", "instituicaoId") REFERENCES "PrestadorTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondutorTransporte" ADD CONSTRAINT "CondutorTransporte_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondutorTransporte" ADD CONSTRAINT "CondutorTransporte_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrecho" ADD CONSTRAINT "AtividadeExternaTrecho_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrecho" ADD CONSTRAINT "AtividadeExternaTrecho_atividadeExternaId_instituicaoId_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrecho" ADD CONSTRAINT "AtividadeExternaTrecho_prestadorTransporteId_instituicaoId_fkey" FOREIGN KEY ("prestadorTransporteId", "instituicaoId") REFERENCES "PrestadorTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrecho" ADD CONSTRAINT "AtividadeExternaTrecho_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrecho" ADD CONSTRAINT "AtividadeExternaTrecho_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculo" ADD CONSTRAINT "AtividadeExternaTrechoVeiculo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculo" ADD CONSTRAINT "AtividadeExternaTrechoVeiculo_atividadeExternaTrechoId_ins_fkey" FOREIGN KEY ("atividadeExternaTrechoId", "instituicaoId") REFERENCES "AtividadeExternaTrecho"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculo" ADD CONSTRAINT "AtividadeExternaTrechoVeiculo_veiculoId_instituicaoId_fkey" FOREIGN KEY ("veiculoId", "instituicaoId") REFERENCES "VeiculoTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculo" ADD CONSTRAINT "AtividadeExternaTrechoVeiculo_supervisorEquipeId_instituic_fkey" FOREIGN KEY ("supervisorEquipeId", "instituicaoId") REFERENCES "AtividadeExternaEquipe"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculo" ADD CONSTRAINT "AtividadeExternaTrechoVeiculo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculo" ADD CONSTRAINT "AtividadeExternaTrechoVeiculo_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculoCondutor" ADD CONSTRAINT "AtividadeExternaTrechoVeiculoCondutor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculoCondutor" ADD CONSTRAINT "AtividadeExternaTrechoVeiculoCondutor_trechoVeiculoId_inst_fkey" FOREIGN KEY ("trechoVeiculoId", "instituicaoId") REFERENCES "AtividadeExternaTrechoVeiculo"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculoCondutor" ADD CONSTRAINT "AtividadeExternaTrechoVeiculoCondutor_condutorId_instituic_fkey" FOREIGN KEY ("condutorId", "instituicaoId") REFERENCES "CondutorTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculoCondutor" ADD CONSTRAINT "AtividadeExternaTrechoVeiculoCondutor_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoVeiculoCondutor" ADD CONSTRAINT "AtividadeExternaTrechoVeiculoCondutor_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_atividadeExternaTrechoId__fkey" FOREIGN KEY ("atividadeExternaTrechoId", "instituicaoId") REFERENCES "AtividadeExternaTrecho"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_trechoVeiculoId_atividade_fkey" FOREIGN KEY ("trechoVeiculoId", "atividadeExternaTrechoId", "instituicaoId") REFERENCES "AtividadeExternaTrechoVeiculo"("id", "atividadeExternaTrechoId", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_participanteId_instituica_fkey" FOREIGN KEY ("participanteId", "instituicaoId") REFERENCES "AtividadeExternaParticipante"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_embarqueConfirmadoPorId_fkey" FOREIGN KEY ("embarqueConfirmadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_desembarqueConfirmadoPorI_fkey" FOREIGN KEY ("desembarqueConfirmadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTrechoPassageiro" ADD CONSTRAINT "AtividadeExternaTrechoPassageiro_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpoint" ADD CONSTRAINT "AtividadeExternaCheckpoint_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpoint" ADD CONSTRAINT "AtividadeExternaCheckpoint_atividadeExternaId_instituicaoI_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpoint" ADD CONSTRAINT "AtividadeExternaCheckpoint_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpoint" ADD CONSTRAINT "AtividadeExternaCheckpoint_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpointRegistro" ADD CONSTRAINT "AtividadeExternaCheckpointRegistro_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpointRegistro" ADD CONSTRAINT "AtividadeExternaCheckpointRegistro_checkpointId_atividadeE_fkey" FOREIGN KEY ("checkpointId", "atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExternaCheckpoint"("id", "atividadeExternaId", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpointRegistro" ADD CONSTRAINT "AtividadeExternaCheckpointRegistro_participanteId_atividad_fkey" FOREIGN KEY ("participanteId", "atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExternaParticipante"("id", "atividadeExternaId", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpointRegistro" ADD CONSTRAINT "AtividadeExternaCheckpointRegistro_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaCheckpointRegistro" ADD CONSTRAINT "AtividadeExternaCheckpointRegistro_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaSaudeParticipante" ADD CONSTRAINT "AtividadeExternaSaudeParticipante_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaSaudeParticipante" ADD CONSTRAINT "AtividadeExternaSaudeParticipante_atividadeExternaId_insti_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaSaudeParticipante" ADD CONSTRAINT "AtividadeExternaSaudeParticipante_participanteId_atividade_fkey" FOREIGN KEY ("participanteId", "atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExternaParticipante"("id", "atividadeExternaId", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaSaudeParticipante" ADD CONSTRAINT "AtividadeExternaSaudeParticipante_registradaPorId_fkey" FOREIGN KEY ("registradaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaSaudeParticipante" ADD CONSTRAINT "AtividadeExternaSaudeParticipante_atualizadaPorId_fkey" FOREIGN KEY ("atualizadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaRisco" ADD CONSTRAINT "AtividadeExternaRisco_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaRisco" ADD CONSTRAINT "AtividadeExternaRisco_atividadeExternaId_instituicaoId_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaRisco" ADD CONSTRAINT "AtividadeExternaRisco_responsavelEquipeId_instituicaoId_fkey" FOREIGN KEY ("responsavelEquipeId", "instituicaoId") REFERENCES "AtividadeExternaEquipe"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaRisco" ADD CONSTRAINT "AtividadeExternaRisco_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaRisco" ADD CONSTRAINT "AtividadeExternaRisco_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaPlanoEmergencia" ADD CONSTRAINT "AtividadeExternaPlanoEmergencia_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaPlanoEmergencia" ADD CONSTRAINT "AtividadeExternaPlanoEmergencia_atividadeExternaId_institu_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaPlanoEmergencia" ADD CONSTRAINT "AtividadeExternaPlanoEmergencia_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaPlanoEmergencia" ADD CONSTRAINT "AtividadeExternaPlanoEmergencia_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExterna" ADD CONSTRAINT "AtividadeExterna_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExterna" ADD CONSTRAINT "AtividadeExterna_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExterna" ADD CONSTRAINT "AtividadeExterna_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExterna" ADD CONSTRAINT "AtividadeExterna_responsavelPrincipalUserId_fkey" FOREIGN KEY ("responsavelPrincipalUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTurma" ADD CONSTRAINT "AtividadeExternaTurma_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTurma" ADD CONSTRAINT "AtividadeExternaTurma_atividadeExternaId_instituicaoId_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaTurma" ADD CONSTRAINT "AtividadeExternaTurma_turmaId_instituicaoId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaParticipante" ADD CONSTRAINT "AtividadeExternaParticipante_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaParticipante" ADD CONSTRAINT "AtividadeExternaParticipante_atividadeExternaId_instituica_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaParticipante" ADD CONSTRAINT "AtividadeExternaParticipante_alunoId_instituicaoId_fkey" FOREIGN KEY ("alunoId", "instituicaoId") REFERENCES "Aluno"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaEquipe" ADD CONSTRAINT "AtividadeExternaEquipe_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaEquipe" ADD CONSTRAINT "AtividadeExternaEquipe_atividadeExternaId_instituicaoId_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaEquipe" ADD CONSTRAINT "AtividadeExternaEquipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaEquipe" ADD CONSTRAINT "AtividadeExternaEquipe_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaEquipe" ADD CONSTRAINT "AtividadeExternaEquipe_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaAutorizacao" ADD CONSTRAINT "AtividadeExternaAutorizacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaAutorizacao" ADD CONSTRAINT "AtividadeExternaAutorizacao_atividadeExternaId_instituicao_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaAutorizacao" ADD CONSTRAINT "AtividadeExternaAutorizacao_participanteId_atividadeExtern_fkey" FOREIGN KEY ("participanteId", "atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExternaParticipante"("id", "atividadeExternaId", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaAutorizacao" ADD CONSTRAINT "AtividadeExternaAutorizacao_respondidaPorUserId_fkey" FOREIGN KEY ("respondidaPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaAutorizacao" ADD CONSTRAINT "AtividadeExternaAutorizacao_registradaPorUserId_fkey" FOREIGN KEY ("registradaPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_atividadeExternaId_instituicaoId_fkey" FOREIGN KEY ("atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExterna"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_prestadorTransporteId_instituica_fkey" FOREIGN KEY ("prestadorTransporteId", "instituicaoId") REFERENCES "PrestadorTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_veiculoId_instituicaoId_fkey" FOREIGN KEY ("veiculoId", "instituicaoId") REFERENCES "VeiculoTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_participanteId_atividadeExternaI_fkey" FOREIGN KEY ("participanteId", "atividadeExternaId", "instituicaoId") REFERENCES "AtividadeExternaParticipante"("id", "atividadeExternaId", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeExternaDocumento" ADD CONSTRAINT "AtividadeExternaDocumento_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestadorTransporte" ADD CONSTRAINT "PrestadorTransporte_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestadorTransporte" ADD CONSTRAINT "PrestadorTransporte_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestadorTransporte" ADD CONSTRAINT "PrestadorTransporte_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeiculoTransporte" ADD CONSTRAINT "VeiculoTransporte_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeiculoTransporte" ADD CONSTRAINT "VeiculoTransporte_prestadorTransporteId_instituicaoId_fkey" FOREIGN KEY ("prestadorTransporteId", "instituicaoId") REFERENCES "PrestadorTransporte"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeiculoTransporte" ADD CONSTRAINT "VeiculoTransporte_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeiculoTransporte" ADD CONSTRAINT "VeiculoTransporte_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
