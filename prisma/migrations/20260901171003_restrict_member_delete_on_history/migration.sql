-- DropForeignKey
ALTER TABLE "PlayerActivityAttendance" DROP CONSTRAINT "PlayerActivityAttendance_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Statline" DROP CONSTRAINT "Statline_memberId_fkey";

-- AddForeignKey
ALTER TABLE "Statline" ADD CONSTRAINT "Statline_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerActivityAttendance" ADD CONSTRAINT "PlayerActivityAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
