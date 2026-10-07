/*
  Warnings:

  - A unique constraint covering the columns `[inClientEventId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[outClientEventId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "inClientEventId" TEXT,
ADD COLUMN     "outClientEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_inClientEventId_key" ON "Attendance"("inClientEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_outClientEventId_key" ON "Attendance"("outClientEventId");
