-- Aplicar somente apos revisar e testar em homologacao.
CREATE TABLE "ProfessorPaginaPortal" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "professorId" INTEGER NOT NULL,
  "chavePagina" TEXT NOT NULL,
  "modo" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfessorPaginaPortal_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessorPaginaPortal_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessorPaginaPortal_professorId_chavePagina_key" UNIQUE ("professorId", "chavePagina")
);
CREATE INDEX "ProfessorPaginaPortal_instituicaoId_professorId_idx" ON "ProfessorPaginaPortal"("instituicaoId", "professorId");
CREATE TABLE "RegraPlanejamentoAula" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "cursoId" INTEGER NOT NULL DEFAULT 0,
  "periodicidade" TEXT NOT NULL DEFAULT 'SEMANAL',
  "exigeAprovacao" BOOLEAN NOT NULL DEFAULT TRUE,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegraPlanejamentoAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RegraPlanejamentoAula_instituicaoId_cursoId_key" UNIQUE ("instituicaoId", "cursoId")
);
CREATE TABLE "PlanoRelatorioAula" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "professorId" INTEGER NOT NULL,
  "turmaId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "periodicidade" TEXT NOT NULL,
  "inicioPeriodo" DATE NOT NULL,
  "fimPeriodo" DATE NOT NULL,
  "titulo" TEXT NOT NULL,
  "objetivos" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "metodologia" TEXT NOT NULL,
  "recursos" TEXT,
  "avaliacao" TEXT,
  "observacoes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "devolutiva" TEXT,
  "enviadoEm" TIMESTAMP(3),
  "revisadoEm" TIMESTAMP(3),
  "revisadoPorId" INTEGER,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanoRelatorioAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlanoRelatorioAula_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlanoRelatorioAula_turmaId_instituicaoId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PlanoRelatorioAula_instituicaoId_status_tipo_idx" ON "PlanoRelatorioAula"("instituicaoId", "status", "tipo");
CREATE INDEX "PlanoRelatorioAula_professorId_inicioPeriodo_idx" ON "PlanoRelatorioAula"("professorId", "inicioPeriodo");
CREATE TABLE "RegistroDesenvolvimento" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "professorId" INTEGER NOT NULL,
  "alunoId" INTEGER NOT NULL,
  "turmaId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "conceito" TEXT,
  "nota" DECIMAL(6,2),
  "prazoTarefa" DATE,
  "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "devolutiva" TEXT,
  "autorizacaoImagemConfirmada" BOOLEAN NOT NULL DEFAULT FALSE,
  "publicadoEm" TIMESTAMP(3),
  "publicadoPorId" INTEGER,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegistroDesenvolvimento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RegistroDesenvolvimento_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RegistroDesenvolvimento_alunoId_instituicaoId_fkey" FOREIGN KEY ("alunoId", "instituicaoId") REFERENCES "Aluno"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RegistroDesenvolvimento_turmaId_instituicaoId_fkey" FOREIGN KEY ("turmaId", "instituicaoId") REFERENCES "Turma"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RegistroDesenvolvimento_instituicaoId_status_idx" ON "RegistroDesenvolvimento"("instituicaoId", "status");
CREATE INDEX "RegistroDesenvolvimento_alunoId_publicadoEm_idx" ON "RegistroDesenvolvimento"("alunoId", "publicadoEm");
CREATE INDEX "RegistroDesenvolvimento_professorId_turmaId_idx" ON "RegistroDesenvolvimento"("professorId", "turmaId");
CREATE TABLE "ImagemDesenvolvimento" (
  "id" SERIAL PRIMARY KEY,
  "registroId" INTEGER NOT NULL,
  "instituicaoId" INTEGER NOT NULL,
  "chaveR2" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "tamanho" INTEGER NOT NULL,
  "nomeOriginal" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImagemDesenvolvimento_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "RegistroDesenvolvimento"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ImagemDesenvolvimento_chaveR2_key" UNIQUE ("chaveR2")
);
CREATE INDEX "ImagemDesenvolvimento_instituicaoId_registroId_idx" ON "ImagemDesenvolvimento"("instituicaoId", "registroId");

CREATE TABLE "HistoricoPermissaoProfessor" (
  "id" SERIAL PRIMARY KEY,
  "instituicaoId" INTEGER NOT NULL,
  "professorId" INTEGER NOT NULL,
  "chavePagina" TEXT NOT NULL,
  "modoAnterior" TEXT NOT NULL,
  "modoNovo" TEXT NOT NULL,
  "alteradoPorId" INTEGER NOT NULL,
  "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HistoricoPermissaoProfessor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HistoricoPermissaoProfessor_professorId_instituicaoId_fkey" FOREIGN KEY ("professorId", "instituicaoId") REFERENCES "Professor"("id", "instituicaoId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "HistPermProf_inst_prof_data_idx" ON "HistoricoPermissaoProfessor"("instituicaoId", "professorId", "alteradoEm");
