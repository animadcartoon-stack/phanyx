CREATE TABLE "ContextoDocumentoPersonalizado" (
    "id" SERIAL NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "chave" VARCHAR(200) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContextoDocumentoPersonalizado_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContextoDocumentoPersonalizado_instituicaoId_chave_key" ON "ContextoDocumentoPersonalizado"("instituicaoId", "chave");
ALTER TABLE "ContextoDocumentoPersonalizado" ADD CONSTRAINT "ContextoDocumentoPersonalizado_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
