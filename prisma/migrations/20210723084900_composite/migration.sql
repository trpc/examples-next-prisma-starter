/*
  Warnings:

  - A unique constraint covering the columns `[sourceId,sourceKey]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Job.sourceId_sourceKey_index";

-- CreateIndex
CREATE UNIQUE INDEX "Job.sourceId_sourceKey_unique" ON "Job"("sourceId", "sourceKey");
