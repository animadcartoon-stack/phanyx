-- CreateTable
CREATE TABLE "DominioEmailBloqueado" (
    "id" SERIAL NOT NULL,
    "dominio" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DominioEmailBloqueado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DominioEmailBloqueado_dominio_key"
ON "DominioEmailBloqueado"("dominio");

-- CreateIndex
CREATE INDEX "DominioEmailBloqueado_ativo_idx"
ON "DominioEmailBloqueado"("ativo");

-- Seed inicial
INSERT INTO "DominioEmailBloqueado"
("dominio", "ativo", "motivo", "atualizadoEm")
VALUES
('uorak.com', TRUE, 'Servico de e-mail temporario/descartavel', CURRENT_TIMESTAMP),
('gwshare.com', TRUE, 'Servico de e-mail temporario/descartavel', CURRENT_TIMESTAMP),
('dnsink.com', TRUE, 'Servico de e-mail temporario/descartavel', CURRENT_TIMESTAMP),
('suahi.com', TRUE, 'Servico de e-mail temporario/descartavel', CURRENT_TIMESTAMP),
('jobscai.com', TRUE, 'Servico de e-mail temporario/descartavel', CURRENT_TIMESTAMP),
('kierko.com', TRUE, 'Servico de e-mail temporario/descartavel', CURRENT_TIMESTAMP)
ON CONFLICT ("dominio") DO NOTHING;
