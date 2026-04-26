-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Film" DROP CONSTRAINT "Film_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_activityId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlan" DROP CONSTRAINT "GamePlan_gameID_fkey";

-- DropForeignKey
ALTER TABLE "GamePlan" DROP CONSTRAINT "GamePlan_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Play" DROP CONSTRAINT "Play_teamId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerActivityAttendance" DROP CONSTRAINT "PlayerActivityAttendance_activityId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerActivityAttendance" DROP CONSTRAINT "PlayerActivityAttendance_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Practice" DROP CONSTRAINT "Practice_activityId_fkey";

-- DropForeignKey
ALTER TABLE "PracticePreparation" DROP CONSTRAINT "PracticePreparation_practiceId_fkey";

-- DropForeignKey
ALTER TABLE "PracticePreparation" DROP CONSTRAINT "PracticePreparation_teamId_fkey";

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice" ADD CONSTRAINT "Practice_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Film" ADD CONSTRAINT "Film_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerActivityAttendance" ADD CONSTRAINT "PlayerActivityAttendance_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerActivityAttendance" ADD CONSTRAINT "PlayerActivityAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlan" ADD CONSTRAINT "GamePlan_gameID_fkey" FOREIGN KEY ("gameID") REFERENCES "Game"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlan" ADD CONSTRAINT "GamePlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePreparation" ADD CONSTRAINT "PracticePreparation_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePreparation" ADD CONSTRAINT "PracticePreparation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
