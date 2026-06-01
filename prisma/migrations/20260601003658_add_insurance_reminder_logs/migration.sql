-- CreateTable
CREATE TABLE "InsuranceReminderLog" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "insuranceRenewalDate" TIMESTAMP(3) NOT NULL,
    "reminderType" TEXT NOT NULL DEFAULT 'SMS_4_WEEKS_BEFORE',
    "sentTo" TEXT,
    "messageBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceReminderLog_unitId_insuranceRenewalDate_reminderTy_key" ON "InsuranceReminderLog"("unitId", "insuranceRenewalDate", "reminderType");

-- AddForeignKey
ALTER TABLE "InsuranceReminderLog" ADD CONSTRAINT "InsuranceReminderLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
