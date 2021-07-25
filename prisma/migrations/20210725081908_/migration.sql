-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('UNKNOWN', 'FULL_TIME', 'CONTRACT');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "category" TEXT,
ADD COLUMN     "jobType" "JobType" NOT NULL DEFAULT E'UNKNOWN';
