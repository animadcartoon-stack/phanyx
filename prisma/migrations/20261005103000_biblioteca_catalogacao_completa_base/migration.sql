-- Base aditiva para catalogacao bibliografica completa.
-- Nenhum campo existente e removido ou alterado.

ALTER TABLE "BibliotecaItem"
ADD COLUMN "tituloUniforme" TEXT,
ADD COLUMN "mencaoResponsabilidade" TEXT,
ADD COLUMN "numeroControleBibliografico" TEXT,
ADD COLUMN "regraCatalogacao" TEXT,
ADD COLUMN "fonteCatalogacao" TEXT,
ADD COLUMN "idiomaCatalogacao" TEXT,
ADD COLUMN "idiomaOriginal" TEXT,
ADD COLUMN "localPublicacao" TEXT,
ADD COLUMN "serie" TEXT,
ADD COLUMN "numeroSerie" TEXT,
ADD COLUMN "detalhesFisicos" TEXT,
ADD COLUMN "dimensoes" TEXT,
ADD COLUMN "materialAcompanhante" TEXT,
ADD COLUMN "tiposConteudoRda" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "tiposMidiaRda" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "tiposSuporteRda" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "notaGeral" TEXT,
ADD COLUMN "notaBibliografia" TEXT,
ADD COLUMN "notaConteudo" TEXT;

CREATE INDEX
  "BibliotecaItem_tituloUniforme_idx"
ON
  "BibliotecaItem"("tituloUniforme");

CREATE UNIQUE INDEX
  "BibliotecaItem_instituicaoId_numeroControleBibliografico_key"
ON
  "BibliotecaItem"(
    "instituicaoId",
    "numeroControleBibliografico"
  );
