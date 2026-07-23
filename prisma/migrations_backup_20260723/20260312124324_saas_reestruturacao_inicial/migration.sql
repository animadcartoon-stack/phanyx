/*
  Warnings:

  - You are about to drop the column `disciplinaId` on the `Aula` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Certificado` table. All the data in the column will be lost.
  - You are about to drop the column `professorId` on the `Disciplina` table. All the data in the column will be lost.
  - You are about to drop the column `disciplinaId` on the `Matricula` table. All the data in the column will be lost.
  - You are about to drop the column `disciplinaId` on the `Modulo` table. All the data in the column will be lost.
  - You are about to drop the column `disciplinaId` on the `Nota` table. All the data in the column will be lost.
  - You are about to drop the column `disciplinaId` on the `Prova` table. All the data in the column will be lost.
  - You are about to drop the column `pergunta` on the `Questao` table. All the data in the column will be lost.
  - You are about to drop the column `nota` on the `TentativaProva` table. All the data in the column will be lost.
  - You are about to drop the `Resposta` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[instituicaoId,matricula]` on the table `Aluno` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[turmaId,ordem]` on the table `Aula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo]` on the table `Certificado` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoId,disciplinaId]` on the table `Certificado` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,nome]` on the table `Curso` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,codigo]` on the table `Curso` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,nome]` on the table `Disciplina` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,codigo]` on the table `Disciplina` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Instituicao` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dominio]` on the table `Instituicao` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoId,turmaId]` on the table `Matricula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[turmaId,ordem]` on the table `Modulo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provaId,ordem]` on the table `Questao` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoId,provaId,tentativaNumero]` on the table `TentativaProva` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instituicaoId,nome,semestre,disciplinaId]` on the table `Turma` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `instituicaoId` to the `Alternativa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Aluno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Aula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ordem` to the `Aula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turmaId` to the `Aula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Aula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo` to the `Certificado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Certificado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Curso` table without a default value. This is not possible if the table is not empty.
  - Made the column `instituicaoId` on table `Curso` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Disciplina` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Instituicao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Instituicao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Matricula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Matricula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Modulo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turmaId` to the `Modulo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Modulo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Nota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Nota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Nota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Professor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Prova` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turmaId` to the `Prova` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Prova` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enunciado` to the `Questao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituicaoId` to the `Questao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Questao` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipo` on the `Questao` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `instituicaoId` to the `TentativaProva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TentativaProva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Turma` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROFESSOR', 'ALUNO');

-- CreateEnum
CREATE TYPE "StatusAtividade" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "QuestaoTipo" AS ENUM ('multipla_escolha', 'discursiva');

-- CreateEnum
CREATE TYPE "MaterialTipo" AS ENUM ('arquivo', 'pdf', 'doc', 'ppt', 'link', 'video');

-- CreateEnum
CREATE TYPE "NotaTipo" AS ENUM ('PROVA', 'ATIVIDADE', 'AJUSTE', 'RECUPERACAO');

-- CreateEnum
CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "StatusTentativa" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'CORRIGIDA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('ATIVA', 'TRANCADA', 'CANCELADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "SituacaoFinal" AS ENUM ('CURSANDO', 'APROVADO', 'REPROVADO', 'RECUPERACAO', 'TRANCADO');

-- DropForeignKey
ALTER TABLE "Alternativa" DROP CONSTRAINT "Alternativa_questaoId_fkey";

-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_instituicaoId_fkey";

-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_userId_fkey";

-- DropForeignKey
ALTER TABLE "Aula" DROP CONSTRAINT "Aula_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Curso" DROP CONSTRAINT "Curso_instituicaoId_fkey";

-- DropForeignKey
ALTER TABLE "Disciplina" DROP CONSTRAINT "Disciplina_instituicaoId_fkey";

-- DropForeignKey
ALTER TABLE "Disciplina" DROP CONSTRAINT "Disciplina_professorId_fkey";

-- DropForeignKey
ALTER TABLE "Matricula" DROP CONSTRAINT "Matricula_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Matricula" DROP CONSTRAINT "Matricula_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Matricula" DROP CONSTRAINT "Matricula_turmaId_fkey";

-- DropForeignKey
ALTER TABLE "Modulo" DROP CONSTRAINT "Modulo_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_turmaId_fkey";

-- DropForeignKey
ALTER TABLE "Professor" DROP CONSTRAINT "Professor_instituicaoId_fkey";

-- DropForeignKey
ALTER TABLE "Professor" DROP CONSTRAINT "Professor_userId_fkey";

-- DropForeignKey
ALTER TABLE "Prova" DROP CONSTRAINT "Prova_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Questao" DROP CONSTRAINT "Questao_provaId_fkey";

-- DropForeignKey
ALTER TABLE "Resposta" DROP CONSTRAINT "Resposta_alternativaId_fkey";

-- DropForeignKey
ALTER TABLE "Resposta" DROP CONSTRAINT "Resposta_questaoId_fkey";

-- DropForeignKey
ALTER TABLE "Resposta" DROP CONSTRAINT "Resposta_tentativaId_fkey";

-- DropForeignKey
ALTER TABLE "TentativaProva" DROP CONSTRAINT "TentativaProva_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "TentativaProva" DROP CONSTRAINT "TentativaProva_provaId_fkey";

-- DropForeignKey
ALTER TABLE "Turma" DROP CONSTRAINT "Turma_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "Turma" DROP CONSTRAINT "Turma_instituicaoId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_instituicaoId_fkey";

-- DropIndex
DROP INDEX "Nota_alunoId_turmaId_key";

-- AlterTable
ALTER TABLE "Alternativa" ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "matricula" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Aula" DROP COLUMN "disciplinaId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "duracaoMin" INTEGER,
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "ordem" INTEGER NOT NULL,
ADD COLUMN     "publicada" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "turmaId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "Certificado" DROP COLUMN "data",
ADD COLUMN     "arquivoUrl" TEXT,
ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "instituicaoId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "instituicaoId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Disciplina" DROP COLUMN "professorId",
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Instituicao" ADD COLUMN     "dominio" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Matricula" DROP COLUMN "disciplinaId",
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "status" "StatusMatricula" NOT NULL DEFAULT 'ATIVA',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Modulo" DROP COLUMN "disciplinaId",
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "turmaId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Nota" DROP COLUMN "disciplinaId",
ADD COLUMN     "atividadeId" INTEGER,
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "peso" DOUBLE PRECISION,
ADD COLUMN     "provaId" INTEGER,
ADD COLUMN     "tipo" "NotaTipo" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Prova" DROP COLUMN "disciplinaId",
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "disponivelEm" TIMESTAMP(3),
ADD COLUMN     "encerradaAt" TIMESTAMP(3),
ADD COLUMN     "expiraEm" TIMESTAMP(3),
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "publicadaAt" TIMESTAMP(3),
ADD COLUMN     "status" "StatusProva" NOT NULL DEFAULT 'RASCUNHO',
ADD COLUMN     "tempoMin" INTEGER,
ADD COLUMN     "tentativasMax" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "turmaId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "notaMaxima" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "Questao" DROP COLUMN "pergunta",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "enunciado" TEXT NOT NULL,
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "respostaModelo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "QuestaoTipo" NOT NULL,
ALTER COLUMN "valor" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "TentativaProva" DROP COLUMN "nota",
ADD COLUMN     "corrigidaEm" TIMESTAMP(3),
ADD COLUMN     "expiraEm" TIMESTAMP(3),
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "instituicaoId" INTEGER NOT NULL,
ADD COLUMN     "notaFinal" DOUBLE PRECISION,
ADD COLUMN     "notaObjetiva" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "StatusTentativa" NOT NULL DEFAULT 'EM_ANDAMENTO',
ADD COLUMN     "tentativaNumero" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Turma" ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "periodoLetivo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- DropTable
DROP TABLE "Resposta";

-- CreateTable
CREATE TABLE "MaterialAula" (
    "id" SERIAL NOT NULL,
    "tipo" "MaterialTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT,
    "arquivoNome" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,

    CONSTRAINT "MaterialAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressoAula" (
    "id" SERIAL NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "aulaId" INTEGER NOT NULL,

    CONSTRAINT "ProgressoAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" TIMESTAMP(3),
    "notaMaxima" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "status" "StatusAtividade" NOT NULL DEFAULT 'RASCUNHO',
    "publicadaAt" TIMESTAMP(3),
    "encerradaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeAnexo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "arquivoNome" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,

    CONSTRAINT "AtividadeAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaAtividade" (
    "id" SERIAL NOT NULL,
    "texto" TEXT,
    "link" TEXT,
    "arquivoUrl" TEXT,
    "nota" DOUBLE PRECISION,
    "feedback" TEXT,
    "entregueEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corrigidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,

    CONSTRAINT "EntregaAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaProva" (
    "id" SERIAL NOT NULL,
    "respostaTexto" TEXT,
    "correta" BOOLEAN,
    "nota" DOUBLE PRECISION,
    "feedback" TEXT,
    "corrigidaManual" BOOLEAN NOT NULL DEFAULT false,
    "corrigidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "tentativaId" INTEGER NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "alternativaId" INTEGER,
    "alunoId" INTEGER,

    CONSTRAINT "RespostaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoFinal" (
    "id" SERIAL NOT NULL,
    "media" DOUBLE PRECISION,
    "frequencia" DOUBLE PRECISION,
    "situacao" "SituacaoFinal" NOT NULL DEFAULT 'CURSANDO',
    "observacao" TEXT,
    "fechadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,

    CONSTRAINT "ResultadoFinal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialAula_instituicaoId_idx" ON "MaterialAula"("instituicaoId");

-- CreateIndex
CREATE INDEX "MaterialAula_aulaId_idx" ON "MaterialAula"("aulaId");

-- CreateIndex
CREATE INDEX "ProgressoAula_instituicaoId_idx" ON "ProgressoAula"("instituicaoId");

-- CreateIndex
CREATE INDEX "ProgressoAula_alunoId_idx" ON "ProgressoAula"("alunoId");

-- CreateIndex
CREATE INDEX "ProgressoAula_aulaId_idx" ON "ProgressoAula"("aulaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressoAula_alunoId_aulaId_key" ON "ProgressoAula"("alunoId", "aulaId");

-- CreateIndex
CREATE INDEX "Atividade_instituicaoId_idx" ON "Atividade"("instituicaoId");

-- CreateIndex
CREATE INDEX "Atividade_turmaId_idx" ON "Atividade"("turmaId");

-- CreateIndex
CREATE INDEX "AtividadeAnexo_instituicaoId_idx" ON "AtividadeAnexo"("instituicaoId");

-- CreateIndex
CREATE INDEX "AtividadeAnexo_atividadeId_idx" ON "AtividadeAnexo"("atividadeId");

-- CreateIndex
CREATE INDEX "EntregaAtividade_instituicaoId_idx" ON "EntregaAtividade"("instituicaoId");

-- CreateIndex
CREATE INDEX "EntregaAtividade_atividadeId_idx" ON "EntregaAtividade"("atividadeId");

-- CreateIndex
CREATE INDEX "EntregaAtividade_alunoId_idx" ON "EntregaAtividade"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaAtividade_atividadeId_alunoId_key" ON "EntregaAtividade"("atividadeId", "alunoId");

-- CreateIndex
CREATE INDEX "RespostaProva_instituicaoId_idx" ON "RespostaProva"("instituicaoId");

-- CreateIndex
CREATE INDEX "RespostaProva_tentativaId_idx" ON "RespostaProva"("tentativaId");

-- CreateIndex
CREATE INDEX "RespostaProva_questaoId_idx" ON "RespostaProva"("questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaProva_tentativaId_questaoId_key" ON "RespostaProva"("tentativaId", "questaoId");

-- CreateIndex
CREATE INDEX "ResultadoFinal_instituicaoId_idx" ON "ResultadoFinal"("instituicaoId");

-- CreateIndex
CREATE INDEX "ResultadoFinal_alunoId_idx" ON "ResultadoFinal"("alunoId");

-- CreateIndex
CREATE INDEX "ResultadoFinal_turmaId_idx" ON "ResultadoFinal"("turmaId");

-- CreateIndex
CREATE INDEX "ResultadoFinal_disciplinaId_idx" ON "ResultadoFinal"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoFinal_alunoId_turmaId_key" ON "ResultadoFinal"("alunoId", "turmaId");

-- CreateIndex
CREATE INDEX "Alternativa_instituicaoId_idx" ON "Alternativa"("instituicaoId");

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_idx" ON "Alternativa"("questaoId");

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_ordem_idx" ON "Alternativa"("questaoId", "ordem");

-- CreateIndex
CREATE INDEX "Aluno_instituicaoId_idx" ON "Aluno"("instituicaoId");

-- CreateIndex
CREATE INDEX "Aluno_nome_idx" ON "Aluno"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_instituicaoId_matricula_key" ON "Aluno"("instituicaoId", "matricula");

-- CreateIndex
CREATE INDEX "Aula_instituicaoId_idx" ON "Aula"("instituicaoId");

-- CreateIndex
CREATE INDEX "Aula_turmaId_idx" ON "Aula"("turmaId");

-- CreateIndex
CREATE INDEX "Aula_moduloId_idx" ON "Aula"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "Aula_turmaId_ordem_key" ON "Aula"("turmaId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_codigo_key" ON "Certificado"("codigo");

-- CreateIndex
CREATE INDEX "Certificado_instituicaoId_idx" ON "Certificado"("instituicaoId");

-- CreateIndex
CREATE INDEX "Certificado_alunoId_idx" ON "Certificado"("alunoId");

-- CreateIndex
CREATE INDEX "Certificado_disciplinaId_idx" ON "Certificado"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_alunoId_disciplinaId_key" ON "Certificado"("alunoId", "disciplinaId");

-- CreateIndex
CREATE INDEX "Curso_instituicaoId_idx" ON "Curso"("instituicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_instituicaoId_nome_key" ON "Curso"("instituicaoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_instituicaoId_codigo_key" ON "Curso"("instituicaoId", "codigo");

-- CreateIndex
CREATE INDEX "Disciplina_instituicaoId_idx" ON "Disciplina"("instituicaoId");

-- CreateIndex
CREATE INDEX "Disciplina_cursoId_idx" ON "Disciplina"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_instituicaoId_nome_key" ON "Disciplina"("instituicaoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_instituicaoId_codigo_key" ON "Disciplina"("instituicaoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Instituicao_slug_key" ON "Instituicao"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Instituicao_dominio_key" ON "Instituicao"("dominio");

-- CreateIndex
CREATE INDEX "Matricula_instituicaoId_idx" ON "Matricula"("instituicaoId");

-- CreateIndex
CREATE INDEX "Matricula_alunoId_idx" ON "Matricula"("alunoId");

-- CreateIndex
CREATE INDEX "Matricula_turmaId_idx" ON "Matricula"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_alunoId_turmaId_key" ON "Matricula"("alunoId", "turmaId");

-- CreateIndex
CREATE INDEX "Modulo_instituicaoId_idx" ON "Modulo"("instituicaoId");

-- CreateIndex
CREATE INDEX "Modulo_turmaId_idx" ON "Modulo"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_turmaId_ordem_key" ON "Modulo"("turmaId", "ordem");

-- CreateIndex
CREATE INDEX "Nota_instituicaoId_idx" ON "Nota"("instituicaoId");

-- CreateIndex
CREATE INDEX "Nota_alunoId_idx" ON "Nota"("alunoId");

-- CreateIndex
CREATE INDEX "Nota_turmaId_idx" ON "Nota"("turmaId");

-- CreateIndex
CREATE INDEX "Nota_atividadeId_idx" ON "Nota"("atividadeId");

-- CreateIndex
CREATE INDEX "Nota_provaId_idx" ON "Nota"("provaId");

-- CreateIndex
CREATE INDEX "Professor_instituicaoId_idx" ON "Professor"("instituicaoId");

-- CreateIndex
CREATE INDEX "Professor_nome_idx" ON "Professor"("nome");

-- CreateIndex
CREATE INDEX "Prova_instituicaoId_idx" ON "Prova"("instituicaoId");

-- CreateIndex
CREATE INDEX "Prova_turmaId_idx" ON "Prova"("turmaId");

-- CreateIndex
CREATE INDEX "Prova_status_idx" ON "Prova"("status");

-- CreateIndex
CREATE INDEX "Questao_instituicaoId_idx" ON "Questao"("instituicaoId");

-- CreateIndex
CREATE INDEX "Questao_provaId_idx" ON "Questao"("provaId");

-- CreateIndex
CREATE UNIQUE INDEX "Questao_provaId_ordem_key" ON "Questao"("provaId", "ordem");

-- CreateIndex
CREATE INDEX "TentativaProva_instituicaoId_idx" ON "TentativaProva"("instituicaoId");

-- CreateIndex
CREATE INDEX "TentativaProva_alunoId_idx" ON "TentativaProva"("alunoId");

-- CreateIndex
CREATE INDEX "TentativaProva_provaId_idx" ON "TentativaProva"("provaId");

-- CreateIndex
CREATE INDEX "TentativaProva_status_idx" ON "TentativaProva"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TentativaProva_alunoId_provaId_tentativaNumero_key" ON "TentativaProva"("alunoId", "provaId", "tentativaNumero");

-- CreateIndex
CREATE INDEX "Turma_instituicaoId_idx" ON "Turma"("instituicaoId");

-- CreateIndex
CREATE INDEX "Turma_disciplinaId_idx" ON "Turma"("disciplinaId");

-- CreateIndex
CREATE INDEX "Turma_professorId_idx" ON "Turma"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "Turma_instituicaoId_nome_semestre_disciplinaId_key" ON "Turma"("instituicaoId", "nome", "semestre", "disciplinaId");

-- CreateIndex
CREATE INDEX "User_instituicaoId_idx" ON "User"("instituicaoId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAula" ADD CONSTRAINT "MaterialAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAula" ADD CONSTRAINT "MaterialAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeAnexo" ADD CONSTRAINT "AtividadeAnexo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeAnexo" ADD CONSTRAINT "AtividadeAnexo_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividade" ADD CONSTRAINT "EntregaAtividade_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividade" ADD CONSTRAINT "EntregaAtividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaAtividade" ADD CONSTRAINT "EntregaAtividade_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "TentativaProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "Alternativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoFinal" ADD CONSTRAINT "ResultadoFinal_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
