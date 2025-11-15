-- AlterTable
ALTER TABLE "UA" ADD COLUMN "botType" TEXT,
ADD COLUMN "botName" TEXT;

-- CreateIndex
CREATE INDEX "UA_botType_idx" ON "UA"("botType");

-- CreateIndex
CREATE INDEX "UA_botName_idx" ON "UA"("botName");
