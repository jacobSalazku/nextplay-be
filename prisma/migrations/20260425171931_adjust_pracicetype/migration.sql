/*
  Warnings:

  - The values [TECHNICAL,TACTICAL,MENTAL] on the enum `PracticeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PracticeType_new" AS ENUM ('TEAM', 'SPECIALISATION', 'PHYSICAL', 'SHOOTING');
ALTER TABLE "Practice" ALTER COLUMN "practicetype" TYPE "PracticeType_new" USING ("practicetype"::text::"PracticeType_new");
ALTER TYPE "PracticeType" RENAME TO "PracticeType_old";
ALTER TYPE "PracticeType_new" RENAME TO "PracticeType";
DROP TYPE "public"."PracticeType_old";
COMMIT;
