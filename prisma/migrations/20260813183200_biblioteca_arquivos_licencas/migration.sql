-- CreateEnum
CREATE TYPE "TipoArquivoBiblioteca" AS ENUM ('PDF', 'EPUB', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'IMAGEM', 'AUDIO', 'VIDEO', 'LEGENDA', 'CAPA', 'MINIATURA', 'COMPROVANTE_LICENCA', 'LINK_EXTERNO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusArquivoBiblioteca" AS ENUM ('AGUARDANDO_UPLOAD', 'ENVIADO', 'PROCESSANDO', 'DISPONIVEL', 'ERRO', 'QUARENTENA', 'BLOQUEADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoDireitoBiblioteca" AS ENUM ('DOMINIO_PUBLICO', 'AUTORIA_INSTITUICAO', 'CREATIVE_COMMONS', 'LICENCA_ABERTA', 'LICENCA_ADQUIRIDA', 'AUTORIZACAO_AUTOR', 'AUTORIZACAO_EDITORA', 'MATERIAL_ACADEMICO_INTERNO', 'ACESSO_EXTERNO_AUTORIZADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoExemplarBiblioteca" AS ENUM ('FISICO', 'DIGITAL');

-- CreateEnum
CREATE TYPE "StatusExemplarBiblioteca" AS ENUM ('DISPONIVEL', 'EMPRESTADO', 'RESERVADO', 'MANUTENCAO', 'DANIFICADO', 'EXTRAVIADO', 'INDISPONIVEL', 'BAIXADO');

-- CreateTable
CREATE TABLE "BibliotecaArquivo" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tipo" "TipoArquivoBiblioteca" NOT NULL,
    "status" "StatusArquivoBiblioteca" NOT NULL DEFAULT 'AGUARDANDO_UPLOAD',
    "nomeOriginal" TEXT NOT NULL,
    "nomeInterno" TEXT,
    "extensao" TEXT,
    "mimeType" TEXT,
    "tamanhoBytes" BIGINT NOT NULL DEFAULT 0,
    "provedorArmazenamento" TEXT,
    "bucket" TEXT,
    "storageKey" TEXT,
    "urlExterna" TEXT,
    "checksumSha256" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "protegido" BOOLEAN NOT NULL DEFAULT true,
    "permitirDownload" BOOLEAN NOT NULL DEFAULT false,
    "larguraPixels" INTEGER,
    "alturaPixels" INTEGER,
    "duracaoSegundos" INTEGER,
    "quantidadePaginas" INTEGER,
    "processadoEm" TIMESTAMP(3),
    "erroProcessamento" TEXT,
    "verificadoAntivirusEm" TIMESTAMP(3),
    "resultadoAntivirus" TEXT,
    "enviadoPorId" INTEGER,
    "arquivadoPorId" INTEGER,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "arquivadoEm" TIMESTAMP(3),
    "motivoArquivamento" TEXT,

    CONSTRAINT "BibliotecaArquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaLicenca" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tipoDireito" "TipoDireitoBiblioteca" NOT NULL,
    "titulo" TEXT,
    "titularDireitos" TEXT,
    "descricao" TEXT,
    "numeroLicenca" TEXT,
    "origem" TEXT,
    "urlLicenca" TEXT,
    "comprovanteUrl" TEXT,
    "inicioVigencia" TIMESTAMP(3),
    "fimVigencia" TIMESTAMP(3),
    "permitirVisualizacao" BOOLEAN NOT NULL DEFAULT true,
    "permitirDownload" BOOLEAN NOT NULL DEFAULT false,
    "permitirImpressao" BOOLEAN NOT NULL DEFAULT false,
    "permitirCopia" BOOLEAN NOT NULL DEFAULT false,
    "permitirEmprestimo" BOOLEAN NOT NULL DEFAULT true,
    "acessosSimultaneos" INTEGER,
    "quantidadeLicencas" INTEGER,
    "territorio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaLicenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaExemplar" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "licencaId" INTEGER,
    "tipo" "TipoExemplarBiblioteca" NOT NULL,
    "status" "StatusExemplarBiblioteca" NOT NULL DEFAULT 'DISPONIVEL',
    "codigoInterno" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "numeroTombo" TEXT,
    "patrimonio" TEXT,
    "poloIdSnapshot" INTEGER,
    "unidadeSnapshot" TEXT,
    "setor" TEXT,
    "sala" TEXT,
    "estante" TEXT,
    "prateleira" TEXT,
    "localizacaoCompleta" TEXT,
    "dataAquisicao" TIMESTAMP(3),
    "formaAquisicao" TEXT,
    "fornecedor" TEXT,
    "valorAquisicao" DECIMAL(12,2),
    "permiteEmprestimo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "baixadoEm" TIMESTAMP(3),
    "motivoBaixa" TEXT,

    CONSTRAINT "BibliotecaExemplar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaArquivo_storageKey_key" ON "BibliotecaArquivo"("storageKey");

-- CreateIndex
CREATE INDEX "BibliotecaArquivo_instituicaoId_idx" ON "BibliotecaArquivo"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaArquivo_instituicaoId_status_idx" ON "BibliotecaArquivo"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaArquivo_itemId_idx" ON "BibliotecaArquivo"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaArquivo_tipo_idx" ON "BibliotecaArquivo"("tipo");

-- CreateIndex
CREATE INDEX "BibliotecaArquivo_checksumSha256_idx" ON "BibliotecaArquivo"("checksumSha256");

-- CreateIndex
CREATE INDEX "BibliotecaArquivo_enviadoEm_idx" ON "BibliotecaArquivo"("enviadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaArquivo_id_instituicaoId_key" ON "BibliotecaArquivo"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaArquivo_instituicaoId_itemId_versao_key" ON "BibliotecaArquivo"("instituicaoId", "itemId", "versao");

-- CreateIndex
CREATE INDEX "BibliotecaLicenca_instituicaoId_idx" ON "BibliotecaLicenca"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaLicenca_instituicaoId_ativo_idx" ON "BibliotecaLicenca"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "BibliotecaLicenca_itemId_idx" ON "BibliotecaLicenca"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaLicenca_tipoDireito_idx" ON "BibliotecaLicenca"("tipoDireito");

-- CreateIndex
CREATE INDEX "BibliotecaLicenca_fimVigencia_idx" ON "BibliotecaLicenca"("fimVigencia");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaLicenca_id_instituicaoId_key" ON "BibliotecaLicenca"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaExemplar_instituicaoId_idx" ON "BibliotecaExemplar"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaExemplar_instituicaoId_status_idx" ON "BibliotecaExemplar"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaExemplar_itemId_idx" ON "BibliotecaExemplar"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaExemplar_licencaId_idx" ON "BibliotecaExemplar"("licencaId");

-- CreateIndex
CREATE INDEX "BibliotecaExemplar_tipo_idx" ON "BibliotecaExemplar"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaExemplar_id_instituicaoId_key" ON "BibliotecaExemplar"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaExemplar_instituicaoId_codigoInterno_key" ON "BibliotecaExemplar"("instituicaoId", "codigoInterno");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaExemplar_instituicaoId_codigoBarras_key" ON "BibliotecaExemplar"("instituicaoId", "codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaExemplar_instituicaoId_numeroTombo_key" ON "BibliotecaExemplar"("instituicaoId", "numeroTombo");

-- AddForeignKey
ALTER TABLE "BibliotecaArquivo" ADD CONSTRAINT "BibliotecaArquivo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaArquivo" ADD CONSTRAINT "BibliotecaArquivo_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaArquivo" ADD CONSTRAINT "BibliotecaArquivo_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaArquivo" ADD CONSTRAINT "BibliotecaArquivo_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaLicenca" ADD CONSTRAINT "BibliotecaLicenca_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaLicenca" ADD CONSTRAINT "BibliotecaLicenca_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaLicenca" ADD CONSTRAINT "BibliotecaLicenca_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaLicenca" ADD CONSTRAINT "BibliotecaLicenca_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaExemplar" ADD CONSTRAINT "BibliotecaExemplar_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaExemplar" ADD CONSTRAINT "BibliotecaExemplar_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaExemplar" ADD CONSTRAINT "BibliotecaExemplar_licencaId_instituicaoId_fkey" FOREIGN KEY ("licencaId", "instituicaoId") REFERENCES "BibliotecaLicenca"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaExemplar" ADD CONSTRAINT "BibliotecaExemplar_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaExemplar" ADD CONSTRAINT "BibliotecaExemplar_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
