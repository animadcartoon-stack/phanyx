ALTER TABLE "Funcionario"
DROP CONSTRAINT "Funcionario_userId_fkey";

ALTER TABLE "Funcionario"
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Funcionario"
ADD CONSTRAINT "Funcionario_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;