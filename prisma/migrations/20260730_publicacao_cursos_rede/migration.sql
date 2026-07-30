CREATE TYPE "StatusPublicacaoCursoRede" AS ENUM ('ATIVA', 'SUSPENSA', 'RETIRADA');

ALTER TABLE "Disciplina"
ADD COLUMN "disciplinaOrigemRedeId" INTEGER;

ALTER TABLE "CursoSemestre"
ADD COLUMN "cursoSemestreOrigemRedeId" INTEGER;

CREATE TABLE "CursoPublicacaoRede" (
    "id" SERIAL NOT NULL,
    "cursoOrigemId" INTEGER NOT NULL,
    "cursoDestinoId" INTEGER NOT NULL,
    "instituicaoOrigemId" INTEGER NOT NULL,
    "instituicaoDestinoId" INTEGER NOT NULL,
    "poloId" INTEGER,
    "status" "StatusPublicacaoCursoRede" NOT NULL DEFAULT 'ATIVA',
    "publicadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "retiradoPorId" INTEGER,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "sincronizadoEm" TIMESTAMP(3),
    "retiradoEm" TIMESTAMP(3),
    "motivoRetirada" TEXT,

    CONSTRAINT "CursoPublicacaoRede_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CursoPublicacaoRede_cursoDestinoId_key"
ON "CursoPublicacaoRede"("cursoDestinoId");

CREATE UNIQUE INDEX "CursoPublicacaoRede_cursoOrigemId_instituicaoDestinoId_key"
ON "CursoPublicacaoRede"("cursoOrigemId", "instituicaoDestinoId");

CREATE INDEX "CursoPublicacaoRede_cursoOrigemId_idx"
ON "CursoPublicacaoRede"("cursoOrigemId");

CREATE INDEX "CursoPublicacaoRede_cursoDestinoId_idx"
ON "CursoPublicacaoRede"("cursoDestinoId");

CREATE INDEX "CursoPublicacaoRede_instituicaoOrigemId_idx"
ON "CursoPublicacaoRede"("instituicaoOrigemId");

CREATE INDEX "CursoPublicacaoRede_instituicaoDestinoId_idx"
ON "CursoPublicacaoRede"("instituicaoDestinoId");

CREATE INDEX "CursoPublicacaoRede_poloId_idx"
ON "CursoPublicacaoRede"("poloId");

CREATE INDEX "CursoPublicacaoRede_status_idx"
ON "CursoPublicacaoRede"("status");

CREATE INDEX "CursoPublicacaoRede_publicadoPorId_idx"
ON "CursoPublicacaoRede"("publicadoPorId");

CREATE INDEX "CursoPublicacaoRede_retiradoPorId_idx"
ON "CursoPublicacaoRede"("retiradoPorId");

CREATE UNIQUE INDEX "Disciplina_instituicaoId_disciplinaOrigemRedeId_key"
ON "Disciplina"("instituicaoId", "disciplinaOrigemRedeId");

CREATE INDEX "Disciplina_disciplinaOrigemRedeId_idx"
ON "Disciplina"("disciplinaOrigemRedeId");

CREATE UNIQUE INDEX "CursoSemestre_instituicaoId_cursoSemestreOrigemRedeId_key"
ON "CursoSemestre"("instituicaoId", "cursoSemestreOrigemRedeId");

CREATE INDEX "CursoSemestre_cursoSemestreOrigemRedeId_idx"
ON "CursoSemestre"("cursoSemestreOrigemRedeId");

ALTER TABLE "Disciplina"
ADD CONSTRAINT "Disciplina_disciplinaOrigemRedeId_fkey"
FOREIGN KEY ("disciplinaOrigemRedeId")
REFERENCES "Disciplina"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CursoSemestre"
ADD CONSTRAINT "CursoSemestre_cursoSemestreOrigemRedeId_fkey"
FOREIGN KEY ("cursoSemestreOrigemRedeId")
REFERENCES "CursoSemestre"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_cursoOrigemId_fkey"
FOREIGN KEY ("cursoOrigemId")
REFERENCES "Curso"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_cursoDestinoId_fkey"
FOREIGN KEY ("cursoDestinoId")
REFERENCES "Curso"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_instituicaoOrigemId_fkey"
FOREIGN KEY ("instituicaoOrigemId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_instituicaoDestinoId_fkey"
FOREIGN KEY ("instituicaoDestinoId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_poloId_fkey"
FOREIGN KEY ("poloId")
REFERENCES "Polo"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_publicadoPorId_fkey"
FOREIGN KEY ("publicadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_atualizadoPorId_fkey"
FOREIGN KEY ("atualizadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CursoPublicacaoRede"
ADD CONSTRAINT "CursoPublicacaoRede_retiradoPorId_fkey"
FOREIGN KEY ("retiradoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;