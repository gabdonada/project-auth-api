/*
  Warnings:

  - The primary key for the `Company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `Company` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `companyId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyUuid]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyKey,email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyName` to the `Company` table without a default value. This is not possible if the table is not empty.
  - The required column `companyUuid` was added to the `Company` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `companyKey` to the `User` table without a default value. This is not possible if the table is not empty.
  - The required column `userKey` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- DropIndex
DROP INDEX "Company_uuid_key";

-- DropIndex
DROP INDEX "User_companyId_email_key";

-- AlterTable
ALTER TABLE "Company" DROP CONSTRAINT "Company_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "status",
DROP COLUMN "uuid",
ADD COLUMN     "companyKey" SERIAL NOT NULL,
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "companyStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "companyUuid" TEXT NOT NULL,
ADD CONSTRAINT "Company_pkey" PRIMARY KEY ("companyKey");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "companyId",
DROP COLUMN "id",
DROP COLUMN "status",
ADD COLUMN     "companyKey" INTEGER NOT NULL,
ADD COLUMN     "userKey" TEXT NOT NULL,
ADD COLUMN     "userStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userKey");

-- CreateIndex
CREATE UNIQUE INDEX "Company_companyUuid_key" ON "Company"("companyUuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyKey_email_key" ON "User"("companyKey", "email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyKey_fkey" FOREIGN KEY ("companyKey") REFERENCES "Company"("companyKey") ON DELETE RESTRICT ON UPDATE CASCADE;
