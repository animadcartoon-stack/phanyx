

ALTER TABLE "Lead"
ADD COLUMN "instituicaoGestoraId" INTEGER,
ADD COLUMN "responsavelFuncionarioId" INTEGER,
ADD COLUMN "criadoPorId" INTEGER,
ADD COLUMN "atualizadoPorId" INTEGER;

ALTER TABLE "LeadInteracao"
ADD COLUMN "instituicaoGestoraId" INTEGER,
ADD COLUMN "criadoPorId" INTEGER;

UPDATE "Lead"
SET "tipo" = 'PHANYX'
WHERE UPPER(TRIM("tipo")) = 'FORMAX';

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_instituicaoGestoraId_fkey"
FOREIGN KEY ("instituicaoGestoraId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_instituicaoId_fkey"
FOREIGN KEY ("instituicaoId")
REFERENCES "Instituicao"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_responsavelFuncionarioId_fkey"
FOREIGN KEY ("responsavelFuncionarioId")
REFERENCES "Funcionario"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_criadoPorId_fkey"
FOREIGN KEY ("criadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_atualizadoPorId_fkey"
FOREIGN KEY ("atualizadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "LeadInteracao"
ADD CONSTRAINT "LeadInteracao_instituicaoGestoraId_fkey"
FOREIGN KEY ("instituicaoGestoraId")
REFERENCES "Instituicao"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LeadInteracao"
ADD CONSTRAINT "LeadInteracao_criadoPorId_fkey"
FOREIGN KEY ("criadoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Lead_instituicaoGestoraId_idx"
ON "Lead"("instituicaoGestoraId");

CREATE INDEX "Lead_instituicaoGestoraId_status_idx"
ON "Lead"("instituicaoGestoraId", "status");

CREATE INDEX "Lead_instituicaoGestoraId_tipo_idx"
ON "Lead"("instituicaoGestoraId", "tipo");

CREATE INDEX "Lead_instituicaoGestoraId_responsavelFuncionarioId_idx"
ON "Lead"("instituicaoGestoraId", "responsavelFuncionarioId");

CREATE INDEX "Lead_instituicaoGestoraId_email_idx"
ON "Lead"("instituicaoGestoraId", "email");

CREATE INDEX "Lead_responsavelFuncionarioId_idx"
ON "Lead"("responsavelFuncionarioId");

CREATE INDEX "Lead_criadoPorId_idx"
ON "Lead"("criadoPorId");

CREATE INDEX "Lead_atualizadoPorId_idx"
ON "Lead"("atualizadoPorId");

CREATE INDEX "LeadInteracao_instituicaoGestoraId_idx"
ON "LeadInteracao"("instituicaoGestoraId");

CREATE INDEX "LeadInteracao_instituicaoGestoraId_leadId_idx"
ON "LeadInteracao"("instituicaoGestoraId", "leadId");

CREATE INDEX "LeadInteracao_criadoPorId_idx"
ON "LeadInteracao"("criadoPorId");