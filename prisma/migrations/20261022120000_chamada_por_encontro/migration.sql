ALTER TABLE "Aula"
  ADD COLUMN "dataEncontro" DATE,
  ADD COLUMN "horaEncontro" TEXT;

CREATE UNIQUE INDEX "Aula_chamada_encontro_key"
  ON "Aula"("turmaId", "disciplinaId", "dataEncontro", "horaEncontro");

CREATE TABLE "HistoricoPresencaAula" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "presencaAulaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "impersonacaoId" INTEGER,
  "statusAnterior" "StatusPresencaAula",
  "observacaoAnterior" TEXT,
  "status" "StatusPresencaAula" NOT NULL,
  "observacao" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HistoricoPresencaAula_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HistoricoPresencaAula_instituicaoId_presencaAulaId_createdAt_idx"
  ON "HistoricoPresencaAula"("instituicaoId", "presencaAulaId", "createdAt");

ALTER TABLE "HistoricoPresencaAula"
  ADD CONSTRAINT "HistoricoPresencaAula_presencaAulaId_fkey"
  FOREIGN KEY ("presencaAulaId") REFERENCES "PresencaAula"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
