CREATE TABLE "EdicaoMatricula" (
    "id" SERIAL NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "funcionarioId" INTEGER,
    "usuarioNome" TEXT,
    "masterOriginalId" INTEGER,
    "acao" TEXT NOT NULL,
    "motivo" TEXT,
    "alteracoes" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdicaoMatricula_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EdicaoMatricula_historico_idx"
    ON "EdicaoMatricula"("matriculaId", "instituicaoId", "id");

ALTER TABLE "EdicaoMatricula" ADD CONSTRAINT "EdicaoMatricula_matriculaId_instituicaoId_fkey"
    FOREIGN KEY ("matriculaId", "instituicaoId") REFERENCES "Matricula"("id", "instituicaoId")
    ON DELETE CASCADE ON UPDATE CASCADE;
