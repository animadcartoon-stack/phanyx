-- Optional per-course prices for exact activity counts. Existing prices stay intact.
ALTER TABLE "Curso" ADD COLUMN "precosComboPorQuantidade" JSONB NOT NULL DEFAULT '[]';
