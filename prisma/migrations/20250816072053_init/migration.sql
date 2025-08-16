/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Donor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExternalDonation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Family` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FamilyDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FamilyNeed` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FamilyUpdate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecureFamilyData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Donor" DROP CONSTRAINT "Donor_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExternalDonation" DROP CONSTRAINT "ExternalDonation_donorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExternalDonation" DROP CONSTRAINT "ExternalDonation_familyCode_fkey";

-- DropForeignKey
ALTER TABLE "public"."Family" DROP CONSTRAINT "Family_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Family" DROP CONSTRAINT "Family_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FamilyDocument" DROP CONSTRAINT "FamilyDocument_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FamilyDocument" DROP CONSTRAINT "FamilyDocument_familyCode_fkey";

-- DropForeignKey
ALTER TABLE "public"."FamilyNeed" DROP CONSTRAINT "FamilyNeed_donorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FamilyNeed" DROP CONSTRAINT "FamilyNeed_familyCode_fkey";

-- DropForeignKey
ALTER TABLE "public"."FamilyUpdate" DROP CONSTRAINT "FamilyUpdate_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SecureFamilyData" DROP CONSTRAINT "SecureFamilyData_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SecureFamilyData" DROP CONSTRAINT "SecureFamilyData_familyCode_fkey";

-- DropTable
DROP TABLE "public"."Admin";

-- DropTable
DROP TABLE "public"."Donor";

-- DropTable
DROP TABLE "public"."ExternalDonation";

-- DropTable
DROP TABLE "public"."Family";

-- DropTable
DROP TABLE "public"."FamilyDocument";

-- DropTable
DROP TABLE "public"."FamilyNeed";

-- DropTable
DROP TABLE "public"."FamilyUpdate";

-- DropTable
DROP TABLE "public"."SecureFamilyData";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."families" (
    "familyCode" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedByAdminId" TEXT,

    CONSTRAINT "families_pkey" PRIMARY KEY ("familyCode")
);

-- CreateTable
CREATE TABLE "public"."secure_family_data" (
    "id" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "exactLocation" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "encryptedData" TEXT NOT NULL,
    "familyCode" TEXT NOT NULL,
    "decryptedByAdminId" TEXT,

    CONSTRAINT "secure_family_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."donors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "preferredRegions" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favoriteFamilies" TEXT[],
    "userId" TEXT NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_needs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "priority" TEXT NOT NULL,
    "isFulfilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyCode" TEXT NOT NULL,
    "checkedByDonorId" TEXT,

    CONSTRAINT "family_needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_documents" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyCode" TEXT NOT NULL,
    "approvedByAdminId" TEXT,

    CONSTRAINT "family_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."external_donations" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalLink" TEXT,
    "donorName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "donationDate" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyCode" TEXT NOT NULL,
    "donorId" TEXT,

    CONSTRAINT "external_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_updates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "photos" TEXT[],
    "videos" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedByAdminId" TEXT NOT NULL,

    CONSTRAINT "family_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "secure_family_data_familyCode_key" ON "public"."secure_family_data"("familyCode");

-- AddForeignKey
ALTER TABLE "public"."families" ADD CONSTRAINT "families_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."families" ADD CONSTRAINT "families_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secure_family_data" ADD CONSTRAINT "secure_family_data_familyCode_fkey" FOREIGN KEY ("familyCode") REFERENCES "public"."families"("familyCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secure_family_data" ADD CONSTRAINT "secure_family_data_decryptedByAdminId_fkey" FOREIGN KEY ("decryptedByAdminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donors" ADD CONSTRAINT "donors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_needs" ADD CONSTRAINT "family_needs_familyCode_fkey" FOREIGN KEY ("familyCode") REFERENCES "public"."families"("familyCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_needs" ADD CONSTRAINT "family_needs_checkedByDonorId_fkey" FOREIGN KEY ("checkedByDonorId") REFERENCES "public"."donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_documents" ADD CONSTRAINT "family_documents_familyCode_fkey" FOREIGN KEY ("familyCode") REFERENCES "public"."families"("familyCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_documents" ADD CONSTRAINT "family_documents_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_donations" ADD CONSTRAINT "external_donations_familyCode_fkey" FOREIGN KEY ("familyCode") REFERENCES "public"."families"("familyCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_donations" ADD CONSTRAINT "external_donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "public"."donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_updates" ADD CONSTRAINT "family_updates_postedByAdminId_fkey" FOREIGN KEY ("postedByAdminId") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
