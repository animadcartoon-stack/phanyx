/*
  Warnings:

  - You are about to drop the column `email` on the `Professor` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Professor_email_key";

-- AlterTable
ALTER TABLE "Professor" DROP COLUMN "email";
