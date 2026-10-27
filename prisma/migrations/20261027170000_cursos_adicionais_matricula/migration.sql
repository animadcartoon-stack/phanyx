ALTER TABLE "Curso"
ADD COLUMN "permiteCursosAdicionais" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "disponivelComoAdicional" BOOLEAN NOT NULL DEFAULT false;
