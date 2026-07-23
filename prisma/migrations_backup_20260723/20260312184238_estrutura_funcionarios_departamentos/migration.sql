/*
  Warnings:

  - A unique constraint covering the columns `[instituicaoId,slug]` on the table `Aluno` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,slug]` on the table `Professor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SECRETARIA';
ALTER TYPE "Role" ADD VALUE 'COORDENADOR';
ALTER TYPE "Role" ADD VALUE 'FINANCEIRO';
ALTER TYPE "Role" ADD VALUE 'SUPORTE';

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "documentoUrl" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "telefone" TEXT;

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "codigoFuncionario" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "documentoUrl" TEXT,
ADD COLUMN     "especialidade" TEXT,
ADD COLUMN     "formacao" TEXT,
ADD COLUMN     "fotoPerfil" TEXT,
ADD COLUMN     "miniBio" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "titulacao" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ultimoLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "cargo" TEXT,
    "setor" TEXT,
    "fotoPerfil" TEXT,
    "documentoUrl" TEXT,
    "codigoFuncionario" TEXT,
    "instituicaoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "departamentoId" INTEGER,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_userId_key" ON "Funcionario"("userId");

-- CreateIndex
CREATE INDEX "Funcionario_instituicaoId_idx" ON "Funcionario"("instituicaoId");

-- CreateIndex
CREATE INDEX "Funcionario_departamentoId_idx" ON "Funcionario"("departamentoId");

-- CreateIndex
CREATE INDEX "Funcionario_nome_idx" ON "Funcionario"("nome");

-- CreateIndex
CREATE INDEX "Funcionario_cpf_idx" ON "Funcionario"("cpf");

-- CreateIndex
CREATE INDEX "Departamento_instituicaoId_idx" ON "Departamento"("instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_instituicaoId_nome_key" ON "Departamento"("instituicaoId", "nome");

-- CreateIndex
CREATE INDEX "Aluno_cpf_idx" ON "Aluno"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_instituicaoId_slug_key" ON "Aluno"("instituicaoId", "slug");

-- CreateIndex
CREATE INDEX "Professor_cpf_idx" ON "Professor"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_instituicaoId_slug_key" ON "Professor"("instituicaoId", "slug");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
