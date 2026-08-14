-- CreateEnum
CREATE TYPE "StatusAvaliacaoBiblioteca" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'OCULTA');

-- CreateEnum
CREATE TYPE "TipoAcessoBiblioteca" AS ENUM ('VISUALIZACAO', 'LEITURA', 'DOWNLOAD', 'REPRODUCAO', 'RETOMADA', 'CONCLUSAO');

-- CreateEnum
CREATE TYPE "StatusRecomendacaoBiblioteca" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDestinoRecomendacaoBiblioteca" AS ENUM ('TODA_INSTITUICAO', 'CURSO', 'TURMA', 'DISCIPLINA');

-- CreateTable
CREATE TABLE "BibliotecaAvaliacao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "titulo" TEXT,
    "comentario" TEXT,
    "status" "StatusAvaliacaoBiblioteca" NOT NULL DEFAULT 'PENDENTE',
    "moderadaPorId" INTEGER,
    "moderadaEm" TIMESTAMP(3),
    "motivoModeracao" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaAvaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaHistoricoAcesso" (
    "id" BIGSERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "arquivoId" INTEGER,
    "tipo" "TipoAcessoBiblioteca" NOT NULL,
    "sessaoId" TEXT,
    "paginaInicial" INTEGER,
    "paginaFinal" INTEGER,
    "posicaoInicialSegundos" INTEGER,
    "posicaoFinalSegundos" INTEGER,
    "duracaoSegundos" INTEGER,
    "percentualInicial" DECIMAL(5,2),
    "percentualFinal" DECIMAL(5,2),
    "ip" TEXT,
    "userAgent" TEXT,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "BibliotecaHistoricoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaRecomendacao" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,
    "titulo" TEXT,
    "mensagem" TEXT,
    "status" "StatusRecomendacaoBiblioteca" NOT NULL DEFAULT 'RASCUNHO',
    "obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "disponivelInicioEm" TIMESTAMP(3),
    "disponivelFimEm" TIMESTAMP(3),
    "publicadaEm" TIMESTAMP(3),
    "encerradaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaRecomendacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaRecomendacaoDestino" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "recomendacaoId" INTEGER NOT NULL,
    "tipo" "TipoDestinoRecomendacaoBiblioteca" NOT NULL,
    "cursoId" INTEGER,
    "turmaId" INTEGER,
    "disciplinaId" INTEGER,
    "chaveDestino" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibliotecaRecomendacaoDestino_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_instituicaoId_idx" ON "BibliotecaAvaliacao"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_instituicaoId_status_idx" ON "BibliotecaAvaliacao"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_itemId_idx" ON "BibliotecaAvaliacao"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_itemId_status_idx" ON "BibliotecaAvaliacao"("itemId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_usuarioId_idx" ON "BibliotecaAvaliacao"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_nota_idx" ON "BibliotecaAvaliacao"("nota");

-- CreateIndex
CREATE INDEX "BibliotecaAvaliacao_criadaEm_idx" ON "BibliotecaAvaliacao"("criadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaAvaliacao_instituicaoId_usuarioId_itemId_key" ON "BibliotecaAvaliacao"("instituicaoId", "usuarioId", "itemId");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_instituicaoId_idx" ON "BibliotecaHistoricoAcesso"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_instituicaoId_iniciadoEm_idx" ON "BibliotecaHistoricoAcesso"("instituicaoId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_instituicaoId_tipo_idx" ON "BibliotecaHistoricoAcesso"("instituicaoId", "tipo");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_usuarioId_idx" ON "BibliotecaHistoricoAcesso"("usuarioId");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_usuarioId_iniciadoEm_idx" ON "BibliotecaHistoricoAcesso"("usuarioId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_itemId_idx" ON "BibliotecaHistoricoAcesso"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_itemId_iniciadoEm_idx" ON "BibliotecaHistoricoAcesso"("itemId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_arquivoId_idx" ON "BibliotecaHistoricoAcesso"("arquivoId");

-- CreateIndex
CREATE INDEX "BibliotecaHistoricoAcesso_sessaoId_idx" ON "BibliotecaHistoricoAcesso"("sessaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacao_instituicaoId_idx" ON "BibliotecaRecomendacao"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacao_instituicaoId_status_idx" ON "BibliotecaRecomendacao"("instituicaoId", "status");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacao_instituicaoId_disponivelInicioEm_dis_idx" ON "BibliotecaRecomendacao"("instituicaoId", "disponivelInicioEm", "disponivelFimEm");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacao_itemId_idx" ON "BibliotecaRecomendacao"("itemId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacao_professorId_idx" ON "BibliotecaRecomendacao"("professorId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacao_publicadaEm_idx" ON "BibliotecaRecomendacao"("publicadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaRecomendacao_id_instituicaoId_key" ON "BibliotecaRecomendacao"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacaoDestino_instituicaoId_idx" ON "BibliotecaRecomendacaoDestino"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacaoDestino_recomendacaoId_idx" ON "BibliotecaRecomendacaoDestino"("recomendacaoId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacaoDestino_tipo_idx" ON "BibliotecaRecomendacaoDestino"("tipo");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacaoDestino_cursoId_idx" ON "BibliotecaRecomendacaoDestino"("cursoId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacaoDestino_turmaId_idx" ON "BibliotecaRecomendacaoDestino"("turmaId");

-- CreateIndex
CREATE INDEX "BibliotecaRecomendacaoDestino_disciplinaId_idx" ON "BibliotecaRecomendacaoDestino"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaRecomendacaoDestino_instituicaoId_recomendacaoId__key" ON "BibliotecaRecomendacaoDestino"("instituicaoId", "recomendacaoId", "chaveDestino");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_id_instituicaoId_key" ON "Curso"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_id_instituicaoId_key" ON "Disciplina"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_id_instituicaoId_key" ON "Professor"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Turma_id_instituicaoId_key" ON "Turma"("id", "instituicaoId");

-- AddForeignKey
ALTER TABLE "BibliotecaAvaliacao" ADD CONSTRAINT "BibliotecaAvaliacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaAvaliacao" ADD CONSTRAINT "BibliotecaAvaliacao_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaAvaliacao" ADD CONSTRAINT "BibliotecaAvaliacao_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaAvaliacao" ADD CONSTRAINT "BibliotecaAvaliacao_moderadaPorId_fkey" FOREIGN KEY ("moderadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaHistoricoAcesso" ADD CONSTRAINT "BibliotecaHistoricoAcesso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaHistoricoAcesso" ADD CONSTRAINT "BibliotecaHistoricoAcesso_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaHistoricoAcesso" ADD CONSTRAINT "BibliotecaHistoricoAcesso_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaHistoricoAcesso" ADD CONSTRAINT "BibliotecaHistoricoAcesso_arquivoId_instituicaoId_fkey" FOREIGN KEY ("arquivoId", "instituicaoId") REFERENCES "BibliotecaArquivo"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacao" ADD CONSTRAINT "BibliotecaRecomendacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacao" ADD CONSTRAINT "BibliotecaRecomendacao_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacao" ADD CONSTRAINT "BibliotecaRecomendacao_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacaoDestino" ADD CONSTRAINT "BibliotecaRecomendacaoDestino_recomendacaoId_instituicaoId_fkey" FOREIGN KEY ("recomendacaoId", "instituicaoId") REFERENCES "BibliotecaRecomendacao"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacaoDestino" ADD CONSTRAINT "BibliotecaRecomendacaoDestino_cursoId_instituicaoId_fkey" FOREIGN KEY ("cursoId", "instituicaoId") REFERENCES "Curso"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacaoDestino" ADD CONSTRAINT "BibliotecaRecomendacaoDestino_turmaId_instituicaoId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliotecaRecomendacaoDestino" ADD CONSTRAINT "BibliotecaRecomendacaoDestino_disciplinaId_instituicaoId_fkey" FOREIGN KEY ("disciplinaId", "instituicaoId") REFERENCES "Disciplina"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nota permitida somente entre 1 e 5
ALTER TABLE "BibliotecaAvaliacao"
ADD CONSTRAINT "BibliotecaAvaliacao_nota_check"
CHECK ("nota" >= 1 AND "nota" <= 5);

-- Cada destino deve possuir somente o vínculo correspondente ao seu tipo
ALTER TABLE "BibliotecaRecomendacaoDestino"
ADD CONSTRAINT "BibliotecaRecomendacaoDestino_tipo_check"
CHECK (
    (
        "tipo" = 'TODA_INSTITUICAO'
        AND "cursoId" IS NULL
        AND "turmaId" IS NULL
        AND "disciplinaId" IS NULL
    )
    OR
    (
        "tipo" = 'CURSO'
        AND "cursoId" IS NOT NULL
        AND "turmaId" IS NULL
        AND "disciplinaId" IS NULL
    )
    OR
    (
        "tipo" = 'TURMA'
        AND "cursoId" IS NULL
        AND "turmaId" IS NOT NULL
        AND "disciplinaId" IS NULL
    )
    OR
    (
        "tipo" = 'DISCIPLINA'
        AND "cursoId" IS NULL
        AND "turmaId" IS NULL
        AND "disciplinaId" IS NOT NULL
    )
);