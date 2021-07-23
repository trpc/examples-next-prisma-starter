/*
  Warnings:

  - Added the required column `sourceKey` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "sourceKey" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Job.sourceId_sourceKey_index" ON "Job"("sourceId", "sourceKey");
