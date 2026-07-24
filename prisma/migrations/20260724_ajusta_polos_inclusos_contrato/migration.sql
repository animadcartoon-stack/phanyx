-- Ajusta os contratos existentes conforme o plano atual
UPDATE "AssinaturaPhanyx"
SET "polosInclusosContrato" = CASE
  WHEN UPPER(TRIM("plano"::text)) = 'PROFISSIONAL' THEN 3
  WHEN UPPER(TRIM("plano"::text)) = 'ESSENCIAL' THEN 1
  ELSE 1
END;