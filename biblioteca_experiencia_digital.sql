-- CreateEnum
CREATE TYPE "TipoPrateleiraBiblioteca" AS ENUM ('INSTITUCIONAL', 'PESSOAL', 'DIDATICA', 'DESTAQUE', 'TEMATICA');

-- CreateEnum
CREATE TYPE "VisibilidadePrateleiraBiblioteca" AS ENUM ('PRIVADA', 'ALUNOS', 'PROFESSORES', 'FUNCIONARIOS', 'TODOS');

-- CreateTable
CREATE TABLE "BibliotecaPrateleira" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoPrateleiraBiblioteca" NOT NULL DEFAULT 'INSTITUCIONAL',
    "visibilidade" "VisibilidadePrateleiraBiblioteca" NOT NULL DEFAULT 'TODOS',
    "slug" TEXT NOT NULL,
    "capaUrl" TEXT,
    "cor" TEXT,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "proprietarioId" INTEGER,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaPrateleira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaPrateleiraItem" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "prateleiraId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adicionadoPorId" INTEGER,

    CONSTRAINT "BibliotecaPrateleiraItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaFavorito" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibliotecaFavorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaProgressoLeitura" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "arquivoId" INTEGER,
    "paginaAtual" INTEGER,
    "totalPaginas" INTEGER,
    "posicaoSegundos" INTEGER,
    "percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcessoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaProgressoLeitura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibliotecaPrateleira_instituicaoId_idx" ON "BibliotecaPrateleira"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleira_instituicaoId_ativa_idx" ON "BibliotecaPrateleira"("instituicaoId", "ativa");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleira_instituicaoId_tipo_idx" ON "BibliotecaPrateleira"("instituicaoId", "tipo");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleira_instituicaoId_visibilidade_idx" ON "BibliotecaPrateleira"("instituicaoId", "visibilidade");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleira_proprietarioId_idx" ON "BibliotecaPrateleira"("proprietarioId");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleira_destaque_idx" ON "BibliotecaPrateleira"("destaque");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaPrateleira_id_instituicaoId_key" ON "BibliotecaPrateleira"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaPrateleira_instituicaoId_slug_key" ON "BibliotecaPrateleira"("instituicaoId", "slug");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleiraItem_instituicaoId_idx" ON "BibliotecaPrateleiraItem"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleiraItem_prateleiraId_ordem_idx" ON "BibliotecaPrateleiraItem"("prateleiraId", "ordem");

-- CreateIndex
CREATE INDEX "BibliotecaPrateleiraItem_itemId_idx" ON "BibliotecaPrateleiraItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaPrateleiraItem_instituicaoId_prateleiraId_itemId_key" ON "BibliotecaPrateleiraItem"("instituicaoId", "prateleiraId", "itemId");

-- CreateIndex
CREATE INDEX "BibliotecaFavorito_instituicaoId_idx" ON "BibliotecaFavorito"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaFavorito_usuarioId_idx" ON "BibliotecaFavorito"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaFavorito_itemId_idx" ON "BibliotecaFavorito"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaFavorito_instituicaoId_usuarioId_itemId_key" ON "BibliotecaFavorito"("instituicaoId", "usuarioId", "itemId");

-- CreateIndex
CREATE INDEX "BibliotecaProgressoLeitura_instituicaoId_idx" ON "BibliotecaProgressoLeitura"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaProgressoLeitura_usuarioId_idx" ON "BibliotecaProgressoLeitura"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaProgressoLeitura_itemId_idx" ON "BibliotecaProgressoLeitura"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaProgressoLeitura_arquivoId_idx" ON "BibliotecaProgressoLeitura"("arquivoId");

-- CreateIndex
CREATE INDEX "BibliotecaProgressoLeitura_instituicaoId_ultimoAcessoEm_idx" ON "BibliotecaProgressoLeitura"("instituicaoId", "ultimoAcessoEm");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaProgressoLeitura_instituicaoId_usuarioId_itemId_key" ON "BibliotecaProgressoLeitura"("instituicaoId", "usuarioId", "itemId");

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleira" ADD CONSTRAINT "BibliotecaPrateleira_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleira" ADD CONSTRAINT "BibliotecaPrateleira_proprietarioId_instituicaoId_fkey" FOREIGN KEY ("proprietarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleira" ADD CONSTRAINT "BibliotecaPrateleira_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleira" ADD CONSTRAINT "BibliotecaPrateleira_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleiraItem" ADD CONSTRAINT "BibliotecaPrateleiraItem_prateleiraId_instituicaoId_fkey" FOREIGN KEY ("prateleiraId", "instituicaoId") REFERENCES "BibliotecaPrateleira"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleiraItem" ADD CONSTRAINT "BibliotecaPrateleiraItem_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaPrateleiraItem" ADD CONSTRAINT "BibliotecaPrateleiraItem_adicionadoPorId_fkey" FOREIGN KEY ("adicionadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaFavorito" ADD CONSTRAINT "BibliotecaFavorito_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaFavorito" ADD CONSTRAINT "BibliotecaFavorito_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaFavorito" ADD CONSTRAINT "BibliotecaFavorito_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaProgressoLeitura" ADD CONSTRAINT "BibliotecaProgressoLeitura_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaProgressoLeitura" ADD CONSTRAINT "BibliotecaProgressoLeitura_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaProgressoLeitura" ADD CONSTRAINT "BibliotecaProgressoLeitura_arquivoId_instituicaoId_fkey" FOREIGN KEY ("arquivoId", "instituicaoId") REFERENCES "BibliotecaArquivo"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaProgressoLeitura" ADD CONSTRAINT "BibliotecaProgressoLeitura_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
