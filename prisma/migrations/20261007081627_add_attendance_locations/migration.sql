-- CreateTable
CREATE TABLE "AttendanceLocation" (
    "id" SERIAL NOT NULL,
    "clientLocationId" TEXT NOT NULL,
    "sessionEventId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLocation_clientLocationId_key" ON "AttendanceLocation"("clientLocationId");

-- CreateIndex
CREATE INDEX "AttendanceLocation_sessionEventId_capturedAt_idx" ON "AttendanceLocation"("sessionEventId", "capturedAt");

-- CreateIndex
CREATE INDEX "AttendanceLocation_userId_capturedAt_idx" ON "AttendanceLocation"("userId", "capturedAt");

-- AddForeignKey
ALTER TABLE "AttendanceLocation" ADD CONSTRAINT "AttendanceLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
