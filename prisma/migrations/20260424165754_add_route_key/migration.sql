/*
  Warnings:

  - A unique constraint covering the columns `[routeKey]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "routeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_routeKey_key" ON "Team"("routeKey");
