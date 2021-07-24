/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sourceSlug,sourceKey]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sourceSlug` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_sourceId_fkey";

-- DropIndex
DROP INDEX "Job.sourceId_sourceKey_unique";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "sourceId",
ADD COLUMN     "sourceSlug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Job.sourceSlug_sourceKey_unique" ON "Job"("sourceSlug", "sourceKey");

-- AddForeignKey
ALTER TABLE "Job" ADD FOREIGN KEY ("sourceSlug") REFERENCES "Source"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
