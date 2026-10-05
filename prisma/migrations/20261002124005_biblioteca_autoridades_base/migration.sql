-- CreateEnum
CREATE TYPE "TipoVarianteAutorBiblioteca" AS ENUM ('VARIANTE', 'PSEUDONIMO', 'NOME_ANTERIOR', 'TRANSLITERACAO', 'OUTRO');

-- AlterTable
ALTER TABLE "BibliotecaAutor" ADD COLUMN     "isni" TEXT,
ADD COLUMN     "lccn" TEXT,
ADD COLUMN     "notaAutoridade" TEXT,
ADD COLUMN     "viaf" TEXT,
ADD COLUMN     "wikidataId" TEXT;

-- CreateTable
CREATE TABLE "BibliotecaAutorVariante" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeNormalizado" TEXT NOT NULL,
    "tipo" "TipoVarianteAutorBiblioteca" NOT NULL DEFAULT 'VARIANTE',
    "idioma" TEXT,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaAutorVariante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibliotecaAutorVariante_instituicaoId_idx" ON "BibliotecaAutorVariante"("instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaAutorVariante_instituicaoId_ativo_idx" ON "BibliotecaAutorVariante"("instituicaoId", "ativo");

-- CreateIndex
CREATE INDEX "BibliotecaAutorVariante_autorId_idx" ON "BibliotecaAutorVariante"("autorId");

-- CreateIndex
CREATE INDEX "BibliotecaAutorVariante_nome_idx" ON "BibliotecaAutorVariante"("nome");

-- CreateIndex
CREATE INDEX "BibliotecaAutorVariante_nomeNormalizado_idx" ON "BibliotecaAutorVariante"("nomeNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaAutorVariante_id_instituicaoId_key" ON "BibliotecaAutorVariante"("id", "instituicaoId");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_viaf_idx" ON "BibliotecaAutor"("viaf");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_isni_idx" ON "BibliotecaAutor"("isni");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_wikidataId_idx" ON "BibliotecaAutor"("wikidataId");

-- CreateIndex
CREATE INDEX "BibliotecaAutor_lccn_idx" ON "BibliotecaAutor"("lccn");

-- AddForeignKey
ALTER TABLE "BibliotecaAutorVariante" ADD CONSTRAINT "BibliotecaAutorVariante_autorId_instituicaoId_fkey" FOREIGN KEY ("autorId", "instituicaoId") REFERENCES "BibliotecaAutor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
