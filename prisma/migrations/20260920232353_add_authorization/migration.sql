-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyKey_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "companyKey" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Role" (
    "roleKey" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "companyKey" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleKey")
);

-- CreateTable
CREATE TABLE "Permission" (
    "permissionKey" SERIAL NOT NULL,
    "permissionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("permissionKey")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userKey" TEXT NOT NULL,
    "roleKey" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userKey","roleKey")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleKey" INTEGER NOT NULL,
    "permissionKey" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleKey","permissionKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_companyKey_roleName_key" ON "Role"("companyKey", "roleName");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_permissionName_key" ON "Permission"("permissionName");

-- CreateIndex
CREATE INDEX "UserRole_roleKey_idx" ON "UserRole"("roleKey");

-- CreateIndex
CREATE INDEX "RolePermission_permissionKey_idx" ON "RolePermission"("permissionKey");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyKey_fkey" FOREIGN KEY ("companyKey") REFERENCES "Company"("companyKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyKey_fkey" FOREIGN KEY ("companyKey") REFERENCES "Company"("companyKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userKey_fkey" FOREIGN KEY ("userKey") REFERENCES "User"("userKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "Role"("roleKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "Role"("roleKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("permissionKey") ON DELETE CASCADE ON UPDATE CASCADE;
