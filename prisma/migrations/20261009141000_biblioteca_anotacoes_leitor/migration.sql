CREATE TABLE "BibliotecaAnotacao" (
    "id" TEXT NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "arquivoId" INTEGER NOT NULL,
    "tipo" VARCHAR(16) NOT NULL,
    "pagina" INTEGER NOT NULL,
    "trecho" TEXT,
    "conteudo" TEXT,
    "cor" VARCHAR(16) NOT NULL DEFAULT 'AMARELO',
    "areas" JSONB NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BibliotecaAnotacao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BibliotecaAnotacao_tipo_check" CHECK ("tipo" IN ('MARCADOR','DESTAQUE','NOTA')),
    CONSTRAINT "BibliotecaAnotacao_pagina_check" CHECK ("pagina" BETWEEN 1 AND 50000)
);
CREATE INDEX "BibliotecaAnotacao_instituicaoId_usuarioId_arquivoId_pagina_idx" ON "BibliotecaAnotacao"("instituicaoId", "usuarioId", "arquivoId", "pagina");
CREATE INDEX "BibliotecaAnotacao_itemId_instituicaoId_idx" ON "BibliotecaAnotacao"("itemId", "instituicaoId");
ALTER TABLE "BibliotecaAnotacao" ADD CONSTRAINT "BibliotecaAnotacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BibliotecaAnotacao" ADD CONSTRAINT "BibliotecaAnotacao_usuarioId_instituicaoId_fkey" FOREIGN KEY ("usuarioId", "instituicaoId") REFERENCES "User"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BibliotecaAnotacao" ADD CONSTRAINT "BibliotecaAnotacao_itemId_instituicaoId_fkey" FOREIGN KEY ("itemId", "instituicaoId") REFERENCES "BibliotecaItem"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BibliotecaAnotacao" ADD CONSTRAINT "BibliotecaAnotacao_arquivoId_instituicaoId_fkey" FOREIGN KEY ("arquivoId", "instituicaoId") REFERENCES "BibliotecaArquivo"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
