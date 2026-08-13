-- CreateEnum
CREATE TYPE "TipoItemBiblioteca" AS ENUM ('LIVRO', 'EBOOK', 'ARTIGO_CIENTIFICO', 'REVISTA', 'PERIODICO', 'APOSTILA', 'TCC', 'MONOGRAFIA', 'DISSERTACAO', 'TESE', 'PESQUISA', 'DOCUMENTO', 'VIDEO', 'DOCUMENTARIO', 'AUDIO', 'AUDIOLIVRO', 'PODCAST', 'LINK_EXTERNO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusItemBiblioteca" AS ENUM ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'RESTRITO', 'INDISPONIVEL', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "ModalidadeAcessoBiblioteca" AS ENUM ('LEITURA_INTERNA', 'ACESSO_LIVRE', 'DOWNLOAD_AUTORIZADO', 'EMPRESTIMO_DIGITAL', 'EMPRESTIMO_FISICO', 'STREAMING', 'LINK_EXTERNO');

-- CreateEnum
CREATE TYPE "BibliotecariaFuncaoAutor" AS ENUM ('AUTOR', 'COAUTOR', 'ORGANIZADOR', 'EDITOR', 'TRADUTOR', 'ORIENTADOR', 'COLABORADOR');

-- CreateTable
CREATE TABLE "BibliotecaItem" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tipo" "TipoItemBiblioteca" NOT NULL,
    "status" "StatusItemBiblioteca" NOT NULL DEFAULT 'RASCUNHO',
    "modalidade" "ModalidadeAcessoBiblioteca" NOT NULL DEFAULT 'LEITURA_INTERNA',
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "tituloAlternativo" TEXT,
    "slug" TEXT NOT NULL,
    "sinopse" TEXT,
    "descricao" TEXT,
    "palavrasChave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isbn10" TEXT,
    "isbn13" TEXT,
    "issn" TEXT,
    "doi" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "paisPublicacao" TEXT,
    "anoPublicacao" INTEGER,
    "dataPublicacao" TIMESTAMP(3),
    "edicao" TEXT,
    "volume" TEXT,
    "numero" TEXT,
    "numeroPaginas" INTEGER,
    "duracaoSegundos" INTEGER,
    "classificacaoBibliografica" TEXT,
    "codigoChamada" TEXT,
    "cdd" TEXT,
    "cdu" TEXT,
    "capaUrl" TEXT,
    "miniaturaUrl" TEXT,
    "classificacaoIndicativa" TEXT,
    "observacoesInternas" TEXT,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "permitirDownload" BOOLEAN NOT NULL DEFAULT false,
    "permitirAvaliacao" BOOLEAN NOT NULL DEFAULT true,
    "acessoLivre" BOOLEAN NOT NULL DEFAULT false,
    "editoraId" INTEGER,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "publicadoPorId" INTEGER,
    "arquivadoPorId" INTEGER,
    "publicadoEm" TIMESTAMP(3),
    "arquivadoEm" TIMESTAMP(3),
    "motivoArquivamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaAutor" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeOrdenacao" TEXT,
    "biografia" TEXT,
    "nacionalidade" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "dataFalecimento" TIMESTAMP(3),
    "fotoUrl" TEXT,
    "siteUrl" TEXT,
    "orcid" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaAutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaEditora" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "siteUrl" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "pais" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaEditora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaCategoria" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaPaiId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaItemAutor" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "funcao" "BibliotecariaFuncaoAutor" NOT NULL DEFAULT 'AUTOR',
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BibliotecaItemAutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaItemCategoria" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BibliotecaItemCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibliotecaItem_instituicaoId_idx" ON "BibliotecaItem"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaItem_instituicaoId_status_idx" ON "BibliotecaItem"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaItem_instituicaoId_tipo_idx" ON "BibliotecaItem"("instituicaoId", "tipo");

-- CreateIndex
CREATE INDEX "BibliotecaItem_instituicaoId_destaque_idx" ON "BibliotecaItem"("instituicaoId", "destaque");

-- CreateIndex
CREATE INDEX "BibliotecaItem_editoraId_idx" ON "BibliotecaItem"("editoraId");

-- CreateIndex
CREATE INDEX "BibliotecaItem_isbn10_idx" ON "BibliotecaItem"("isbn10");

-- CreateIndex
CREATE INDEX "BibliotecaItem_isbn13_idx" ON "BibliotecaItem"("isbn13");

-- CreateIndex
CREATE INDEX "BibliotecaItem_issn_idx" ON "BibliotecaItem"("issn");

-- CreateIndex
CREATE INDEX "BibliotecaItem_doi_idx" ON "BibliotecaItem"("doi");

-- CreateIndex
CREATE INDEX "BibliotecaItem_titulo_idx" ON "BibliotecaItem"("titulo");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaItem_instituicaoId_slug_key" ON "BibliotecaItem"("instituicaoId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaItem_id_instituicaoId_key" ON "BibliotecaItem"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_instituicaoId_idx" ON "BibliotecaAutor"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_instituicaoId_ativo_idx" ON "BibliotecaAutor"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_nome_idx" ON "BibliotecaAutor"("nome");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_orcid_idx" ON "BibliotecaAutor"("orcid");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaAutor_id_instituicaoId_key" ON "BibliotecaAutor"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaEditora_instituicaoId_idx" ON "BibliotecaEditora"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaEditora_instituicaoId_ativo_idx" ON "BibliotecaEditora"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "BibliotecaEditora_nome_idx" ON "BibliotecaEditora"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaEditora_id_instituicaoId_key" ON "BibliotecaEditora"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaEditora_instituicaoId_nome_key" ON "BibliotecaEditora"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "BibliotecaCategoria_instituicaoId_idx" ON "BibliotecaCategoria"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaCategoria_instituicaoId_ativo_idx" ON "BibliotecaCategoria"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "BibliotecaCategoria_categoriaPaiId_idx" ON "BibliotecaCategoria"("categoriaPaiId");

-- CreateIndex
CREATE INDEX "BibliotecaCategoria_nome_idx" ON "BibliotecaCategoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaCategoria_id_instituicaoId_key" ON "BibliotecaCategoria"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaCategoria_instituicaoId_slug_key" ON "BibliotecaCategoria"("instituicaoId", "slug");

-- CreateIndex
CREATE INDEX "BibliotecaItemAutor_instituicaoId_idx" ON "BibliotecaItemAutor"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaItemAutor_itemId_idx" ON "BibliotecaItemAutor"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaItemAutor_autorId_idx" ON "BibliotecaItemAutor"("autorId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaItemAutor_instituicaoId_itemId_autorId_funcao_key" ON "BibliotecaItemAutor"("instituicaoId", "itemId", "autorId", "funcao");

-- CreateIndex
CREATE INDEX "BibliotecaItemCategoria_instituicaoId_idx" ON "BibliotecaItemCategoria"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaItemCategoria_itemId_idx" ON "BibliotecaItemCategoria"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaItemCategoria_categoriaId_idx" ON "BibliotecaItemCategoria"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaItemCategoria_instituicaoId_itemId_categoriaId_key" ON "BibliotecaItemCategoria"("instituicaoId", "itemId", "categoriaId");

-- AddForeignKey
ALTER TABLE "BibliotecaItem" ADD CONSTRAINT "BibliotecaItem_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItem" ADD CONSTRAINT "BibliotecaItem_editoraId_instituicaoId_fkey" FOREIGN KEY ("editoraId", "instituicaoId") REFERENCES "BibliotecaEditora"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItem" ADD CONSTRAINT "BibliotecaItem_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItem" ADD CONSTRAINT "BibliotecaItem_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItem" ADD CONSTRAINT "BibliotecaItem_publicadoPorId_fkey" FOREIGN KEY ("publicadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItem" ADD CONSTRAINT "BibliotecaItem_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaAutor" ADD CONSTRAINT "BibliotecaAutor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaEditora" ADD CONSTRAINT "BibliotecaEditora_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaCategoria" ADD CONSTRAINT "BibliotecaCategoria_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaCategoria" ADD CONSTRAINT "BibliotecaCategoria_categoriaPaiId_instituicaoId_fkey" FOREIGN KEY ("categoriaPaiId", "instituicaoId") REFERENCES "BibliotecaCategoria"("id", "instituicaoId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItemAutor" ADD CONSTRAINT "BibliotecaItemAutor_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItemAutor" ADD CONSTRAINT "BibliotecaItemAutor_autorId_instituicaoId_fkey" FOREIGN KEY ("autorId", "instituicaoId") REFERENCES "BibliotecaAutor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItemCategoria" ADD CONSTRAINT "BibliotecaItemCategoria_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaItemCategoria" ADD CONSTRAINT "BibliotecaItemCategoria_categoriaId_instituicaoId_fkey" FOREIGN KEY ("categoriaId", "instituicaoId") REFERENCES "BibliotecaCategoria"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
