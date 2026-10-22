-- CreateEnum
CREATE TYPE "ModoPrecoCombo" AS ENUM ('FIXO', 'SOMA');

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "participaCombo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "valorMensalidadeCombo" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "chaveContratacaoModalidades" TEXT,
ADD COLUMN     "comboId" INTEGER,
ADD COLUMN     "contratacaoModalidades" JSONB;

-- CreateTable
CREATE TABLE "ComboModalidades" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "minimoModalidades" INTEGER NOT NULL DEFAULT 3,
    "maximoModalidades" INTEGER,
    "modoPreco" "ModoPrecoCombo" NOT NULL DEFAULT 'FIXO',
    "valorMatricula" DECIMAL(10,2) NOT NULL,
    "valorMensalidade" DECIMAL(10,2),
    "quantidadeParcelas" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComboModalidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboModalidadesCurso" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "comboId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,

    CONSTRAINT "ComboModalidadesCurso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComboModalidades_instituicaoId_ativo_idx" ON "ComboModalidades"("instituicaoId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ComboModalidades_id_instituicaoId_key" ON "ComboModalidades"("id", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ComboModalidades_instituicaoId_nome_key" ON "ComboModalidades"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "ComboModalidadesCurso_cursoId_instituicaoId_idx" ON "ComboModalidadesCurso"("cursoId", "instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ComboModalidadesCurso_comboId_cursoId_key" ON "ComboModalidadesCurso"("comboId", "cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_chaveContratacaoModalidades_key" ON "Matricula"("chaveContratacaoModalidades");

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_comboId_instituicaoId_fkey" FOREIGN KEY ("comboId", "instituicaoId") REFERENCES "ComboModalidades"("id", "instituicaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboModalidades" ADD CONSTRAINT "ComboModalidades_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboModalidadesCurso" ADD CONSTRAINT "ComboModalidadesCurso_comboId_instituicaoId_fkey" FOREIGN KEY ("comboId", "instituicaoId") REFERENCES "ComboModalidades"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboModalidadesCurso" ADD CONSTRAINT "ComboModalidadesCurso_cursoId_instituicaoId_fkey" FOREIGN KEY ("cursoId", "instituicaoId") REFERENCES "Curso"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE;
