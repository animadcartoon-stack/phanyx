-- CreateEnum
CREATE TYPE "BibliotecaTipoEtiquetaFolha" AS ENUM (
  'LOMBADA',
  'CODIGO_BARRAS'
);

-- CreateEnum
CREATE TYPE "BibliotecaOrigemModeloEtiqueta" AS ENUM (
  'SISTEMA',
  'FABRICANTE',
  'PERSONALIZADO'
);

-- CreateEnum
CREATE TYPE "BibliotecaOrientacaoFolhaEtiqueta" AS ENUM (
  'RETRATO',
  'PAISAGEM'
);

-- CreateTable
CREATE TABLE "BibliotecaModeloEtiqueta" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,

  "nome" TEXT NOT NULL,
  "descricao" TEXT,

  "tipo" "BibliotecaTipoEtiquetaFolha" NOT NULL,
  "origem" "BibliotecaOrigemModeloEtiqueta" NOT NULL DEFAULT 'PERSONALIZADO',

  "marca" TEXT,
  "codigoFabricante" TEXT,

  "larguraFolhaMm" DECIMAL(8,3) NOT NULL,
  "alturaFolhaMm" DECIMAL(8,3) NOT NULL,

  "orientacao" "BibliotecaOrientacaoFolhaEtiqueta" NOT NULL DEFAULT 'RETRATO',

  "margemSuperiorMm" DECIMAL(8,3) NOT NULL,
  "margemDireitaMm" DECIMAL(8,3) NOT NULL,
  "margemInferiorMm" DECIMAL(8,3) NOT NULL,
  "margemEsquerdaMm" DECIMAL(8,3) NOT NULL,

  "larguraEtiquetaMm" DECIMAL(8,3) NOT NULL,
  "alturaEtiquetaMm" DECIMAL(8,3) NOT NULL,

  "espacoHorizontalMm" DECIMAL(8,3) NOT NULL DEFAULT 0,
  "espacoVerticalMm" DECIMAL(8,3) NOT NULL DEFAULT 0,

  "colunas" INTEGER NOT NULL,
  "linhas" INTEGER NOT NULL,

  "deslocamentoHorizontalMm" DECIMAL(8,3) NOT NULL DEFAULT 0,
  "deslocamentoVerticalMm" DECIMAL(8,3) NOT NULL DEFAULT 0,

  "padrao" BOOLEAN NOT NULL DEFAULT false,
  "ativo" BOOLEAN NOT NULL DEFAULT true,

  "criadoPorId" INTEGER,
  "atualizadoPorId" INTEGER,

  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BibliotecaModeloEtiqueta_pkey"
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX
  "BibliotecaModeloEtiqueta_instituicaoId_tipo_nome_key"
ON
  "BibliotecaModeloEtiqueta"(
    "instituicaoId",
    "tipo",
    "nome"
  );

-- CreateIndex
CREATE INDEX
  "BibliotecaModeloEtiqueta_instituicaoId_idx"
ON
  "BibliotecaModeloEtiqueta"(
    "instituicaoId"
  );

-- CreateIndex
CREATE INDEX
  "BibliotecaModeloEtiqueta_instituicaoId_tipo_ativo_idx"
ON
  "BibliotecaModeloEtiqueta"(
    "instituicaoId",
    "tipo",
    "ativo"
  );

-- CreateIndex
CREATE INDEX
  "BibliotecaModeloEtiqueta_instituicaoId_tipo_padrao_idx"
ON
  "BibliotecaModeloEtiqueta"(
    "instituicaoId",
    "tipo",
    "padrao"
  );

-- CreateIndex
CREATE INDEX
  "BibliotecaModeloEtiqueta_instituicaoId_origem_idx"
ON
  "BibliotecaModeloEtiqueta"(
    "instituicaoId",
    "origem"
  );

-- CreateIndex
CREATE INDEX
  "BibliotecaModeloEtiqueta_criadoPorId_idx"
ON
  "BibliotecaModeloEtiqueta"(
    "criadoPorId"
  );

-- CreateIndex
CREATE INDEX
  "BibliotecaModeloEtiqueta_atualizadoPorId_idx"
ON
  "BibliotecaModeloEtiqueta"(
    "atualizadoPorId"
  );

-- AddForeignKey
ALTER TABLE
  "BibliotecaModeloEtiqueta"
ADD CONSTRAINT
  "BibliotecaModeloEtiqueta_instituicaoId_fkey"
FOREIGN KEY
  ("instituicaoId")
REFERENCES
  "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
