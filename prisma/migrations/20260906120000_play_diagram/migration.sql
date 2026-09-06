-- AlterTable
ALTER TABLE "Play" ALTER COLUMN "canvas" DROP NOT NULL,
ADD COLUMN     "diagram" JSONB;
