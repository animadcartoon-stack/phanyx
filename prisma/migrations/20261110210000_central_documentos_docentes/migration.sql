-- Central de Documentos Docentes. Apenas novas tabelas e índices.
-- Nunca executar antes de testar a migração precedente 20261110150000.
CREATE TABLE "DocumentoDocente" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "professorId" INTEGER NOT NULL,
  "templateId" INTEGER,
  "turmaId" INTEGER,
  "origem" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "versaoAtual" INTEGER NOT NULL DEFAULT 1,
  "criadoPorId" INTEGER NOT NULL,
  "enviadoEm" TIMESTAMP(3),
  "concluidoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentoDocente_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DocumentoDocente_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DocumentoDocente_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "DocumentoDocente_instituicaoId_professorId_atualizadoEm_idx" ON "DocumentoDocente"("instituicaoId", "professorId", "atualizadoEm");
CREATE INDEX "DocumentoDocente_instituicaoId_status_atualizadoEm_idx" ON "DocumentoDocente"("instituicaoId", "status", "atualizadoEm");
CREATE INDEX "DocumentoDocente_templateId_idx" ON "DocumentoDocente"("templateId");

CREATE TABLE "DocumentoDocenteVersao" (
  "id" SERIAL PRIMARY KEY,
  "documentoId" INTEGER NOT NULL,
  "numero" INTEGER NOT NULL,
  "modeloSnapshot" TEXT NOT NULL,
  "campos" JSONB NOT NULL,
  "criadoPorId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoDocenteVersao_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoDocente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DocumentoDocenteVersao_documentoId_numero_key" UNIQUE ("documentoId", "numero")
);
CREATE INDEX "DocumentoDocenteVersao_documentoId_criadoEm_idx" ON "DocumentoDocenteVersao"("documentoId", "criadoEm");

CREATE TABLE "DocumentoDocenteMensagem" (
  "id" SERIAL PRIMARY KEY,
  "documentoId" INTEGER NOT NULL,
  "autorId" INTEGER NOT NULL,
  "papel" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoDocenteMensagem_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoDocente"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DocumentoDocenteMensagem_documentoId_criadoEm_idx" ON "DocumentoDocenteMensagem"("documentoId", "criadoEm");

CREATE TABLE "DocumentoDocenteAnexo" (
  "id" SERIAL PRIMARY KEY,
  "documentoId" INTEGER NOT NULL,
  "mensagemId" INTEGER,
  "enviadoPorId" INTEGER NOT NULL,
  "nomeOriginal" TEXT NOT NULL,
  "chaveR2" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "tamanho" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoDocenteAnexo_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoDocente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DocumentoDocenteAnexo_chaveR2_key" UNIQUE ("chaveR2")
);
CREATE INDEX "DocumentoDocenteAnexo_documentoId_criadoEm_idx" ON "DocumentoDocenteAnexo"("documentoId", "criadoEm");

CREATE TABLE "DocumentoDocenteAssinatura" (
  "id" SERIAL PRIMARY KEY,
  "documentoId" INTEGER NOT NULL,
  "versao" INTEGER NOT NULL,
  "papel" TEXT NOT NULL,
  "assinanteId" INTEGER NOT NULL,
  "nomeAssinante" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "imagem" TEXT NOT NULL,
  "hashConteudo" TEXT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "assinadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoDocenteAssinatura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoDocente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DocumentoDocenteAssinatura_documentoId_versao_papel_key" UNIQUE ("documentoId", "versao", "papel")
);
CREATE INDEX "DocumentoDocenteAssinatura_documentoId_assinadoEm_idx" ON "DocumentoDocenteAssinatura"("documentoId", "assinadoEm");

CREATE TABLE "DocumentoDocenteEvento" (
  "id" SERIAL PRIMARY KEY,
  "documentoId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT,
  "versao" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoDocenteEvento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoDocente"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DocumentoDocenteEvento_documentoId_criadoEm_idx" ON "DocumentoDocenteEvento"("documentoId", "criadoEm");
