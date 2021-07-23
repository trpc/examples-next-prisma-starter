/*
  Warnings:

  - You are about to drop the column `slug` on the `Company` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Company.slug_unique";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "slug";
