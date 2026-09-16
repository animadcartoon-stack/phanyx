-- CreateEnum
CREATE TYPE "TipoDocumentoTransferenciaMatricula" AS ENUM ('REQUERIMENTO', 'AUTORIZACAO_RESPONSAVEL', 'HISTORICO_ESCOLAR', 'DECLARACAO_MATRICULA', 'EMENTAS', 'PARECER_EQUIVALENCIA', 'DOCUMENTO_DESTINO', 'DOCUMENTO_PESSOAL', 'TERMO_ASSINADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDocumentoTransferenciaMatricula" AS ENUM ('PENDENTE', 'VINCULADO', 'REMOVIDO');

-- CreateTable
CREATE TABLE "TransferenciaMatriculaDocumento" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "transferenciaId" INTEGER,
    "sessaoUpload" TEXT NOT NULL,
    "tipo" "TipoDocumentoTransferenciaMatricula" NOT NULL,
    "status" "StatusDocumentoTransferenciaMatricula" NOT NULL DEFAULT 'PENDENTE',
    "nomeOriginal" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "pathnameBlob" TEXT,
    "mimeType" TEXT,
    "tamanhoBytes" INTEGER,
    "descricao" TEXT,
    "numeroDocumento" TEXT,
    "emitidoEm" TIMESTAMP(3),
    "validadeEm" TIMESTAMP(3),
    "visivelAoAluno" BOOLEAN NOT NULL DEFAULT false,
    "enviadoPorId" INTEGER,
    "enviadoPorNomeSnapshot" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "vinculadoEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3),
    "removidoEm" TIMESTAMP(3),
    "removidoPorId" INTEGER,
    "removidoPorNomeSnapshot" TEXT,
    "motivoRemocao" TEXT,

    CONSTRAINT "TransferenciaMatriculaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_instituicaoId_idx" ON "TransferenciaMatriculaDocumento"("instituicaoId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_matriculaId_idx" ON "TransferenciaMatriculaDocumento"("matriculaId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_transferenciaId_idx" ON "TransferenciaMatriculaDocumento"("transferenciaId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_sessaoUpload_idx" ON "TransferenciaMatriculaDocumento"("sessaoUpload");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_tipo_idx" ON "TransferenciaMatriculaDocumento"("tipo");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_status_idx" ON "TransferenciaMatriculaDocumento"("status");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_enviadoPorId_idx" ON "TransferenciaMatriculaDocumento"("enviadoPorId");

-- CreateIndex
CREATE INDEX "TransferenciaMatriculaDocumento_expiraEm_idx" ON "TransferenciaMatriculaDocumento"("expiraEm");

-- AddForeignKey
ALTER TABLE "TransferenciaMatriculaDocumento" ADD CONSTRAINT "TransferenciaMatriculaDocumento_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "TransferenciaMatricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
