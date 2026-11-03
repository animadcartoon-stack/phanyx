-- Planos configuraveis: dados de curso e snapshot imutavel de futuras contratacoes.
-- Colunas opcionais nao alteram matriculas/cobrancas existentes.
ALTER TABLE "Curso" ADD COLUMN "planosPagamento" JSONB;
ALTER TABLE "Matricula" ADD COLUMN "planoPagamentoContratado" JSONB;
