ALTER TABLE "Matricula"
ADD COLUMN "bolsaPercentual" DECIMAL(5,2) NOT NULL DEFAULT 0;

ALTER TABLE "Matricula"
ADD CONSTRAINT "Matricula_bolsaPercentual_check"
CHECK (
  "bolsaPercentual" >= 0
  AND "bolsaPercentual" <= 100
);
