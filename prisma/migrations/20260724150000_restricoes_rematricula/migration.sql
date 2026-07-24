DO $$
BEGIN
  CREATE TYPE "TipoRestricaoRematricula" AS ENUM (
    'NENHUMA',
    'SOMENTE_AVISO',
    'RESTRICAO_PARCIAL',
    'BLOQUEIO_PORTAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "OrigemRestricaoRematricula" AS ENUM (
    'MANUAL',
    'AUTOMATICA'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "AcaoHistoricoRestricaoRematricula" AS ENUM (
    'CRIADA',
    'ALTERADA',
    'REMOVIDA',
    'REATIVADA'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "PeriodoMatricula"
ADD COLUMN IF NOT EXISTS "tipoRestricaoPadrao"
  "TipoRestricaoRematricula"
  NOT NULL
  DEFAULT 'NENHUMA';

ALTER TABLE "PeriodoMatricula"
ADD COLUMN IF NOT EXISTS "aplicarRestricaoAutomaticamente"
  BOOLEAN
  NOT NULL
  DEFAULT false;

ALTER TABLE "PeriodoMatricula"
ADD COLUMN IF NOT EXISTS "carenciaRestricaoDias"
  INTEGER
  NOT NULL
  DEFAULT 0;

ALTER TABLE "PeriodoMatricula"
ADD COLUMN IF NOT EXISTS "mensagemRestricaoPadrao"
  TEXT;

CREATE TABLE IF NOT EXISTS "RestricaoRematriculaAluno" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "periodoMatriculaId" INTEGER NOT NULL,
  "alunoId" INTEGER NOT NULL,

  "tipo" "TipoRestricaoRematricula"
    NOT NULL
    DEFAULT 'NENHUMA',

  "origem" "OrigemRestricaoRematricula"
    NOT NULL
    DEFAULT 'MANUAL',

  "ativa" BOOLEAN NOT NULL DEFAULT true,

  "motivo" TEXT,
  "mensagemAluno" TEXT,

  "aplicadaEm" TIMESTAMP(3)
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  "aplicadaPorId" INTEGER,

  "removidaEm" TIMESTAMP(3),
  "removidaPorId" INTEGER,
  "motivoRemocao" TEXT,

  "criadaEm" TIMESTAMP(3)
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  "atualizadaEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RestricaoRematriculaAluno_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "RestricaoRematriculaAluno_instituicaoId_fkey"
    FOREIGN KEY ("instituicaoId")
    REFERENCES "Instituicao"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaAluno_periodoMatriculaId_fkey"
    FOREIGN KEY ("periodoMatriculaId")
    REFERENCES "PeriodoMatricula"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaAluno_alunoId_fkey"
    FOREIGN KEY ("alunoId")
    REFERENCES "Aluno"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaAluno_aplicadaPorId_fkey"
    FOREIGN KEY ("aplicadaPorId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaAluno_removidaPorId_fkey"
    FOREIGN KEY ("removidaPorId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_periodoMatriculaId_alunoId_key"
ON "RestricaoRematriculaAluno"(
  "periodoMatriculaId",
  "alunoId"
);

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_instituicaoId_idx"
ON "RestricaoRematriculaAluno"("instituicaoId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_periodoMatriculaId_idx"
ON "RestricaoRematriculaAluno"("periodoMatriculaId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_alunoId_idx"
ON "RestricaoRematriculaAluno"("alunoId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_tipo_idx"
ON "RestricaoRematriculaAluno"("tipo");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_ativa_idx"
ON "RestricaoRematriculaAluno"("ativa");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_aplicadaPorId_idx"
ON "RestricaoRematriculaAluno"("aplicadaPorId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaAluno_removidaPorId_idx"
ON "RestricaoRematriculaAluno"("removidaPorId");

CREATE TABLE IF NOT EXISTS "RestricaoRematriculaHistorico" (
  "id" SERIAL NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "restricaoId" INTEGER NOT NULL,
  "periodoMatriculaId" INTEGER NOT NULL,
  "alunoId" INTEGER NOT NULL,

  "acao" "AcaoHistoricoRestricaoRematricula"
    NOT NULL,

  "origem" "OrigemRestricaoRematricula"
    NOT NULL,

  "tipoAnterior" "TipoRestricaoRematricula",
  "tipoNovo" "TipoRestricaoRematricula",

  "motivo" TEXT,
  "mensagemAluno" TEXT,

  "realizadoPorId" INTEGER,

  "criadoEm" TIMESTAMP(3)
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RestricaoRematriculaHistorico_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "RestricaoRematriculaHistorico_instituicaoId_fkey"
    FOREIGN KEY ("instituicaoId")
    REFERENCES "Instituicao"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaHistorico_restricaoId_fkey"
    FOREIGN KEY ("restricaoId")
    REFERENCES "RestricaoRematriculaAluno"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaHistorico_periodoMatriculaId_fkey"
    FOREIGN KEY ("periodoMatriculaId")
    REFERENCES "PeriodoMatricula"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaHistorico_alunoId_fkey"
    FOREIGN KEY ("alunoId")
    REFERENCES "Aluno"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "RestricaoRematriculaHistorico_realizadoPorId_fkey"
    FOREIGN KEY ("realizadoPorId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_instituicaoId_idx"
ON "RestricaoRematriculaHistorico"("instituicaoId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_restricaoId_idx"
ON "RestricaoRematriculaHistorico"("restricaoId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_periodoMatriculaId_idx"
ON "RestricaoRematriculaHistorico"("periodoMatriculaId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_alunoId_idx"
ON "RestricaoRematriculaHistorico"("alunoId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_acao_idx"
ON "RestricaoRematriculaHistorico"("acao");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_realizadoPorId_idx"
ON "RestricaoRematriculaHistorico"("realizadoPorId");

CREATE INDEX IF NOT EXISTS
  "RestricaoRematriculaHistorico_criadoEm_idx"
ON "RestricaoRematriculaHistorico"("criadoEm");