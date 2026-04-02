-- CreateEnum
CREATE TYPE "TipoDocumentoAluno" AS ENUM ('CONTRATO', 'DECLARACAO', 'HISTORICO', 'CERTIFICADO', 'DOCUMENTO_PESSOAL');

-- CreateTable
CREATE TABLE "DocumentoAluno" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoDocumentoAluno" NOT NULL,
    "arquivoUrl" TEXT,
    "conteudo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alunoId" INTEGER NOT NULL,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "DocumentoAluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoAluno_alunoId_idx" ON "DocumentoAluno"("alunoId");

-- CreateIndex
CREATE INDEX "DocumentoAluno_instituicaoId_idx" ON "DocumentoAluno"("instituicaoId");

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
