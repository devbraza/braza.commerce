-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_clickId_fkey";

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Click_campaignId_createdAt_idx" ON "Click"("campaignId", "createdAt");

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "Click"("id") ON DELETE CASCADE ON UPDATE CASCADE;
