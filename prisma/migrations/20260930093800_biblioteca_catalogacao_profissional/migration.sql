-- Biblioteca PHANYX
-- Catalogação bibliográfica profissional:
-- CDD, CDU, Cutter, sistema de classificação e localização física.

CREATE TYPE "BibliotecaSistemaClassificacao"
AS ENUM ('CDD', 'CDU', 'OUTRO');

ALTER TABLE "BibliotecaConfiguracao"
ADD COLUMN "sistemaClassificacaoPadrao"
  "BibliotecaSistemaClassificacao"
  NOT NULL
  DEFAULT 'CDD',
ADD COLUMN "edicaoCDDPadrao"
  TEXT DEFAULT '23',
ADD COLUMN "edicaoCDUPadrao"
  TEXT,
ADD COLUMN "usarCutter"
  BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "gerarCodigoChamadaAutomaticamente"
  BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "BibliotecaItem"
ADD COLUMN "sistemaClassificacao"
  "BibliotecaSistemaClassificacao",
ADD COLUMN "edicaoClassificacao"
  TEXT,
ADD COLUMN "codigoCutter"
  TEXT;

ALTER TABLE "BibliotecaExemplar"
ADD COLUMN "corredor"
  TEXT;
