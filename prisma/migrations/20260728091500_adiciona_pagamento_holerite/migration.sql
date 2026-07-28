ALTER TABLE "HoleriteRH"
ADD COLUMN "pagoEm" TIMESTAMP(3),
ADD COLUMN "pagoPorId" INTEGER;

CREATE INDEX "HoleriteRH_pagoPorId_idx"
ON "HoleriteRH"("pagoPorId");

ALTER TABLE "HoleriteRH"
ADD CONSTRAINT "HoleriteRH_pagoPorId_fkey"
FOREIGN KEY ("pagoPorId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;