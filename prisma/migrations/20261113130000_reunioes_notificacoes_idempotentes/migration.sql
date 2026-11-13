-- Garante aviso único por reunião, período e destinatário.
-- Índice parcial: não interfere nas chaves de outros tipos de notificação.
CREATE UNIQUE INDEX IF NOT EXISTS "Notificacao_reuniao_chave_unica"
  ON "Notificacao" ("chaveAgrupada")
  WHERE "chaveAgrupada" IS NOT NULL
    AND "tipo" IN ('REUNIAO', 'REUNIAO_LEMBRETE_HOJE', 'REUNIAO_LEMBRETE_AMANHA', 'REUNIAO_CANCELADA');
