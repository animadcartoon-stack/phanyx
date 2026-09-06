-- CreateEnum
CREATE TYPE "MobilidadeDirecao" AS ENUM ('SAIDA', 'ENTRADA', 'BIDIRECIONAL');

-- CreateEnum
CREATE TYPE "MobilidadeTipoPrograma" AS ENUM ('SEMESTRE_ACADEMICO', 'ANO_ACADEMICO', 'CURTA_DURACAO', 'PROGRAMA_IDIOMAS', 'ESTAGIO', 'PESQUISA', 'SUMMER_SCHOOL', 'WINTER_SCHOOL', 'DUPLA_TITULACAO', 'HIBRIDA', 'VIRTUAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "MobilidadeStatusConvenio" AS ENUM ('RASCUNHO', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "MobilidadeStatusPrograma" AS ENUM ('RASCUNHO', 'ATIVO', 'INATIVO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "MobilidadeStatusOferta" AS ENUM ('RASCUNHO', 'INSCRICOES_AGENDADAS', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'EM_SELECAO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MobilidadeVinculoCandidato" AS ENUM ('ALUNO_PHANYX', 'ALUNO_EXTERNO');

-- CreateEnum
CREATE TYPE "MobilidadeStatusCandidatura" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'DOCUMENTACAO_PENDENTE', 'ELEGIVEL', 'INELEGIVEL', 'EM_SELECAO', 'CLASSIFICADA', 'LISTA_ESPERA', 'APROVADA', 'REPROVADA', 'DESISTENTE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MobilidadeTipoDocumento" AS ENUM ('PASSAPORTE', 'IDENTIDADE', 'FOTO', 'HISTORICO_ACADEMICO', 'COMPROVANTE_MATRICULA', 'CURRICULO', 'CARTA_MOTIVACAO', 'CARTA_RECOMENDACAO', 'CERTIFICADO_IDIOMA', 'PORTFOLIO', 'PLANO_ESTUDOS', 'CARTA_ACEITE', 'VISTO', 'SEGURO', 'COMPROVANTE_FINANCEIRO', 'AUTORIZACAO_RESPONSAVEL', 'OUTRO');

-- CreateEnum
CREATE TYPE "MobilidadeStatusDocumento" AS ENUM ('NAO_ENVIADO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'CORRECAO_SOLICITADA', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "StatusFeriadoGlobal" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoFeriadoGlobal" AS ENUM ('NACIONAL', 'REGIONAL', 'LOCAL');

-- AlterTable
ALTER TABLE "ConfiguracaoInstituicao" ADD COLUMN     "paisCodigo" VARCHAR(2);

-- CreateTable
CREATE TABLE "MobilidadeInstituicaoParceira" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "codigo" TEXT,
    "paisCodigo" VARCHAR(2) NOT NULL,
    "paisNome" TEXT,
    "cidade" TEXT,
    "estadoProvincia" TEXT,
    "endereco" TEXT,
    "cep" TEXT,
    "site" TEXT,
    "emailGeral" TEXT,
    "telefone" TEXT,
    "nomeContato" TEXT,
    "cargoContato" TEXT,
    "emailContato" TEXT,
    "telefoneContato" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeInstituicaoParceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadeConvenio" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "instituicaoParceiraId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "direcao" "MobilidadeDirecao" NOT NULL DEFAULT 'BIDIRECIONAL',
    "status" "MobilidadeStatusConvenio" NOT NULL DEFAULT 'RASCUNHO',
    "vigenciaInicio" TIMESTAMP(3),
    "vigenciaFim" TIMESTAMP(3),
    "reciprocidade" BOOLEAN NOT NULL DEFAULT true,
    "vagasSaidaAno" INTEGER,
    "vagasEntradaAno" INTEGER,
    "isencaoTaxaAcademica" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeConvenio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadeConvenioCurso" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "convenioId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeConvenioCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadePrograma" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "convenioId" INTEGER,
    "instituicaoParceiraId" INTEGER,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "tipo" "MobilidadeTipoPrograma" NOT NULL,
    "direcao" "MobilidadeDirecao" NOT NULL DEFAULT 'SAIDA',
    "status" "MobilidadeStatusPrograma" NOT NULL DEFAULT 'RASCUNHO',
    "idiomaPrincipal" TEXT,
    "nivelIdiomaMinimo" TEXT,
    "duracaoMinimaDias" INTEGER,
    "duracaoMaximaDias" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadePrograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadeOferta" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "status" "MobilidadeStatusOferta" NOT NULL DEFAULT 'RASCUNHO',
    "ano" INTEGER,
    "periodo" TEXT,
    "inscricoesInicio" TIMESTAMP(3),
    "inscricoesFim" TIMESTAMP(3),
    "mobilidadeInicio" TIMESTAMP(3),
    "mobilidadeFim" TIMESTAMP(3),
    "vagas" INTEGER,
    "permiteListaEspera" BOOLEAN NOT NULL DEFAULT true,
    "criteriosElegibilidade" JSONB,
    "instrucoes" TEXT,
    "publicadoEm" TIMESTAMP(3),
    "criadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeOferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadeOfertaCurso" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeOfertaCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadeCandidatura" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "matriculaId" INTEGER,
    "vinculoCandidato" "MobilidadeVinculoCandidato" NOT NULL DEFAULT 'ALUNO_PHANYX',
    "nomeSnapshot" TEXT NOT NULL,
    "emailSnapshot" TEXT,
    "telefoneSnapshot" TEXT,
    "instituicaoOrigemNome" TEXT,
    "paisOrigemCodigo" VARCHAR(2),
    "status" "MobilidadeStatusCandidatura" NOT NULL DEFAULT 'RASCUNHO',
    "motivoStatus" TEXT,
    "enviadaEm" TIMESTAMP(3),
    "analisadaEm" TIMESTAMP(3),
    "notaFinal" DECIMAL(8,2),
    "classificacao" INTEGER,
    "criadoPorId" INTEGER,
    "analisadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeCandidatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilidadeCandidaturaDocumento" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "candidaturaId" INTEGER NOT NULL,
    "tipo" "MobilidadeTipoDocumento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "arquivoUrl" TEXT,
    "arquivoNome" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "validadeAte" TIMESTAMP(3),
    "status" "MobilidadeStatusDocumento" NOT NULL DEFAULT 'NAO_ENVIADO',
    "enviadoEm" TIMESTAMP(3),
    "analisadoEm" TIMESTAMP(3),
    "analisadoPorId" INTEGER,
    "motivoRejeicao" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilidadeCandidaturaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeriadoGlobal" (
    "id" SERIAL NOT NULL,
    "paisCodigo" VARCHAR(2) NOT NULL,
    "regiaoCodigo" VARCHAR(30),
    "cidade" TEXT,
    "dataFeriado" DATE NOT NULL,
    "inicioExibicao" DATE NOT NULL,
    "fimExibicao" DATE NOT NULL,
    "tipo" "TipoFeriadoGlobal" NOT NULL DEFAULT 'NACIONAL',
    "status" "StatusFeriadoGlobal" NOT NULL DEFAULT 'RASCUNHO',
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "emoji" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "publicadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "publicadoEm" TIMESTAMP(3),

    CONSTRAINT "FeriadoGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeriadoGlobalTraducao" (
    "id" SERIAL NOT NULL,
    "feriadoId" INTEGER NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "nome" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,

    CONSTRAINT "FeriadoGlobalTraducao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MobilidadeInstituicaoParceira_instituicaoId_idx" ON "MobilidadeInstituicaoParceira"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeInstituicaoParceira_paisCodigo_idx" ON "MobilidadeInstituicaoParceira"("paisCodigo");

-- CreateIndex
CREATE INDEX "MobilidadeInstituicaoParceira_ativo_idx" ON "MobilidadeInstituicaoParceira"("ativo");

-- CreateIndex
CREATE INDEX "MobilidadeInstituicaoParceira_criadoPorId_idx" ON "MobilidadeInstituicaoParceira"("criadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeInstituicaoParceira_instituicaoId_nome_paisCodigo_key" ON "MobilidadeInstituicaoParceira"("instituicaoId", "nome", "paisCodigo");

-- CreateIndex
CREATE INDEX "MobilidadeConvenio_instituicaoId_idx" ON "MobilidadeConvenio"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeConvenio_instituicaoParceiraId_idx" ON "MobilidadeConvenio"("instituicaoParceiraId");

-- CreateIndex
CREATE INDEX "MobilidadeConvenio_status_idx" ON "MobilidadeConvenio"("status");

-- CreateIndex
CREATE INDEX "MobilidadeConvenio_vigenciaFim_idx" ON "MobilidadeConvenio"("vigenciaFim");

-- CreateIndex
CREATE INDEX "MobilidadeConvenio_criadoPorId_idx" ON "MobilidadeConvenio"("criadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeConvenio_instituicaoId_codigo_key" ON "MobilidadeConvenio"("instituicaoId", "codigo");

-- CreateIndex
CREATE INDEX "MobilidadeConvenioCurso_instituicaoId_idx" ON "MobilidadeConvenioCurso"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeConvenioCurso_convenioId_idx" ON "MobilidadeConvenioCurso"("convenioId");

-- CreateIndex
CREATE INDEX "MobilidadeConvenioCurso_cursoId_idx" ON "MobilidadeConvenioCurso"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeConvenioCurso_convenioId_cursoId_key" ON "MobilidadeConvenioCurso"("convenioId", "cursoId");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_instituicaoId_idx" ON "MobilidadePrograma"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_convenioId_idx" ON "MobilidadePrograma"("convenioId");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_instituicaoParceiraId_idx" ON "MobilidadePrograma"("instituicaoParceiraId");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_tipo_idx" ON "MobilidadePrograma"("tipo");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_direcao_idx" ON "MobilidadePrograma"("direcao");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_status_idx" ON "MobilidadePrograma"("status");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_ativo_idx" ON "MobilidadePrograma"("ativo");

-- CreateIndex
CREATE INDEX "MobilidadePrograma_criadoPorId_idx" ON "MobilidadePrograma"("criadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadePrograma_instituicaoId_codigo_key" ON "MobilidadePrograma"("instituicaoId", "codigo");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_instituicaoId_idx" ON "MobilidadeOferta"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_programaId_idx" ON "MobilidadeOferta"("programaId");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_status_idx" ON "MobilidadeOferta"("status");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_inscricoesInicio_idx" ON "MobilidadeOferta"("inscricoesInicio");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_inscricoesFim_idx" ON "MobilidadeOferta"("inscricoesFim");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_mobilidadeInicio_idx" ON "MobilidadeOferta"("mobilidadeInicio");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_mobilidadeFim_idx" ON "MobilidadeOferta"("mobilidadeFim");

-- CreateIndex
CREATE INDEX "MobilidadeOferta_criadoPorId_idx" ON "MobilidadeOferta"("criadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeOferta_instituicaoId_codigo_key" ON "MobilidadeOferta"("instituicaoId", "codigo");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaCurso_instituicaoId_idx" ON "MobilidadeOfertaCurso"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaCurso_ofertaId_idx" ON "MobilidadeOfertaCurso"("ofertaId");

-- CreateIndex
CREATE INDEX "MobilidadeOfertaCurso_cursoId_idx" ON "MobilidadeOfertaCurso"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeOfertaCurso_ofertaId_cursoId_key" ON "MobilidadeOfertaCurso"("ofertaId", "cursoId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_instituicaoId_idx" ON "MobilidadeCandidatura"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_ofertaId_idx" ON "MobilidadeCandidatura"("ofertaId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_alunoId_idx" ON "MobilidadeCandidatura"("alunoId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_matriculaId_idx" ON "MobilidadeCandidatura"("matriculaId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_status_idx" ON "MobilidadeCandidatura"("status");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_vinculoCandidato_idx" ON "MobilidadeCandidatura"("vinculoCandidato");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_classificacao_idx" ON "MobilidadeCandidatura"("classificacao");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_criadoPorId_idx" ON "MobilidadeCandidatura"("criadoPorId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidatura_analisadoPorId_idx" ON "MobilidadeCandidatura"("analisadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "MobilidadeCandidatura_ofertaId_alunoId_key" ON "MobilidadeCandidatura"("ofertaId", "alunoId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_instituicaoId_idx" ON "MobilidadeCandidaturaDocumento"("instituicaoId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_candidaturaId_idx" ON "MobilidadeCandidaturaDocumento"("candidaturaId");

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_tipo_idx" ON "MobilidadeCandidaturaDocumento"("tipo");

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_status_idx" ON "MobilidadeCandidaturaDocumento"("status");

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_validadeAte_idx" ON "MobilidadeCandidaturaDocumento"("validadeAte");

-- CreateIndex
CREATE INDEX "MobilidadeCandidaturaDocumento_analisadoPorId_idx" ON "MobilidadeCandidaturaDocumento"("analisadoPorId");

-- CreateIndex
CREATE INDEX "FeriadoGlobal_paisCodigo_status_idx" ON "FeriadoGlobal"("paisCodigo", "status");

-- CreateIndex
CREATE INDEX "FeriadoGlobal_paisCodigo_dataFeriado_idx" ON "FeriadoGlobal"("paisCodigo", "dataFeriado");

-- CreateIndex
CREATE INDEX "FeriadoGlobal_inicioExibicao_fimExibicao_idx" ON "FeriadoGlobal"("inicioExibicao", "fimExibicao");

-- CreateIndex
CREATE INDEX "FeriadoGlobal_status_idx" ON "FeriadoGlobal"("status");

-- CreateIndex
CREATE INDEX "FeriadoGlobalTraducao_locale_idx" ON "FeriadoGlobalTraducao"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "FeriadoGlobalTraducao_feriadoId_locale_key" ON "FeriadoGlobalTraducao"("feriadoId", "locale");

-- AddForeignKey
ALTER TABLE "MobilidadeInstituicaoParceira" ADD CONSTRAINT "MobilidadeInstituicaoParceira_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeInstituicaoParceira" ADD CONSTRAINT "MobilidadeInstituicaoParceira_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeConvenio" ADD CONSTRAINT "MobilidadeConvenio_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeConvenio" ADD CONSTRAINT "MobilidadeConvenio_instituicaoParceiraId_fkey" FOREIGN KEY ("instituicaoParceiraId") REFERENCES "MobilidadeInstituicaoParceira"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeConvenio" ADD CONSTRAINT "MobilidadeConvenio_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeConvenioCurso" ADD CONSTRAINT "MobilidadeConvenioCurso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeConvenioCurso" ADD CONSTRAINT "MobilidadeConvenioCurso_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "MobilidadeConvenio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeConvenioCurso" ADD CONSTRAINT "MobilidadeConvenioCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadePrograma" ADD CONSTRAINT "MobilidadePrograma_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadePrograma" ADD CONSTRAINT "MobilidadePrograma_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "MobilidadeConvenio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadePrograma" ADD CONSTRAINT "MobilidadePrograma_instituicaoParceiraId_fkey" FOREIGN KEY ("instituicaoParceiraId") REFERENCES "MobilidadeInstituicaoParceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadePrograma" ADD CONSTRAINT "MobilidadePrograma_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOferta" ADD CONSTRAINT "MobilidadeOferta_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOferta" ADD CONSTRAINT "MobilidadeOferta_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "MobilidadePrograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOferta" ADD CONSTRAINT "MobilidadeOferta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOfertaCurso" ADD CONSTRAINT "MobilidadeOfertaCurso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOfertaCurso" ADD CONSTRAINT "MobilidadeOfertaCurso_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "MobilidadeOferta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeOfertaCurso" ADD CONSTRAINT "MobilidadeOfertaCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "MobilidadeOferta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidatura" ADD CONSTRAINT "MobilidadeCandidatura_analisadoPorId_fkey" FOREIGN KEY ("analisadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidaturaDocumento" ADD CONSTRAINT "MobilidadeCandidaturaDocumento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidaturaDocumento" ADD CONSTRAINT "MobilidadeCandidaturaDocumento_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "MobilidadeCandidatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilidadeCandidaturaDocumento" ADD CONSTRAINT "MobilidadeCandidaturaDocumento_analisadoPorId_fkey" FOREIGN KEY ("analisadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeriadoGlobalTraducao" ADD CONSTRAINT "FeriadoGlobalTraducao_feriadoId_fkey" FOREIGN KEY ("feriadoId") REFERENCES "FeriadoGlobal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "StudentSuccessAnaliseHistorico_instituicaoId_alunoId_analisadoE" RENAME TO "StudentSuccessAnaliseHistorico_instituicaoId_alunoId_analis_idx";

-- RenameIndex
ALTER INDEX "StudentSuccessAnaliseHistorico_instituicaoId_nivelRisco_analisa" RENAME TO "StudentSuccessAnaliseHistorico_instituicaoId_nivelRisco_ana_idx";
