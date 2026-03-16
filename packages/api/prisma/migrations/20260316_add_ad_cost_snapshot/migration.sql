-- AlterTable: Add campaignMetaId to Campaign
ALTER TABLE "Campaign" ADD COLUMN "campaignMetaId" TEXT;

-- CreateTable: AdCostSnapshot
CREATE TABLE "AdCostSnapshot" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "campaignMetaId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AdCostSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint
CREATE UNIQUE INDEX "AdCostSnapshot_adAccountId_campaignMetaId_date_key" ON "AdCostSnapshot"("adAccountId", "campaignMetaId", "date");

-- CreateIndex: performance index
CREATE INDEX "AdCostSnapshot_userId_date_idx" ON "AdCostSnapshot"("userId", "date");

-- AddForeignKey: AdCostSnapshot -> AdAccount
ALTER TABLE "AdCostSnapshot" ADD CONSTRAINT "AdCostSnapshot_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: AdCostSnapshot -> User
ALTER TABLE "AdCostSnapshot" ADD CONSTRAINT "AdCostSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
