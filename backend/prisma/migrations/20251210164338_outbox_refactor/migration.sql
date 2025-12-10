/*
  Warnings:

  - You are about to drop the `EmailOutbox` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OutboxChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- DropForeignKey
ALTER TABLE "EmailOutbox" DROP CONSTRAINT "EmailOutbox_patientId_fkey";

-- DropTable
DROP TABLE "EmailOutbox";

-- DropEnum
DROP TYPE "EmailStatus";

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "channel" "OutboxChannel" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
