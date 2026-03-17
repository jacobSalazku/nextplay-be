/*
  Warnings:

  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_memberId_fkey";

-- DropTable
DROP TABLE "Attendance";

-- CreateTable
CREATE TABLE "PlayerActivityAttendance" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerActivityAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerActivityAttendance_activityId_idx" ON "PlayerActivityAttendance"("activityId");

-- CreateIndex
CREATE INDEX "PlayerActivityAttendance_memberId_idx" ON "PlayerActivityAttendance"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerActivityAttendance_activityId_memberId_key" ON "PlayerActivityAttendance"("activityId", "memberId");

-- AddForeignKey
ALTER TABLE "PlayerActivityAttendance" ADD CONSTRAINT "PlayerActivityAttendance_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerActivityAttendance" ADD CONSTRAINT "PlayerActivityAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
