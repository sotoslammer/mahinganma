-- CreateEnum
CREATE TYPE "Program" AS ENUM ('BJJ', 'BOXING', 'YOUNG_WARRIORS', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "SignerRole" AS ENUM ('SELF', 'PARENT_GUARDIAN');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('NEW', 'CONTACTED', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "isMinor" BOOLEAN NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "program" "Program" NOT NULL DEFAULT 'UNDECIDED',
    "experience" TEXT,
    "guardianFirstName" TEXT,
    "guardianLastName" TEXT,
    "guardianRelationship" TEXT,
    "guardianEmail" TEXT,
    "guardianPhone" TEXT,
    "emergencyName" TEXT NOT NULL,
    "emergencyPhone" TEXT NOT NULL,
    "emergencyRelationship" TEXT,
    "medicalNotes" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waiver" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentText" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerRole" "SignerRole" NOT NULL,
    "signerRelationship" TEXT,
    "signerEmail" TEXT NOT NULL,
    "photoConsent" BOOLEAN NOT NULL DEFAULT false,
    "signatureImage" BYTEA NOT NULL,
    "signatureWidth" INTEGER NOT NULL,
    "signatureHeight" INTEGER NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "confirmationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waiver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");

-- CreateIndex
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Waiver_studentId_idx" ON "Waiver"("studentId");

-- CreateIndex
CREATE INDEX "Waiver_signedAt_idx" ON "Waiver"("signedAt");

-- AddForeignKey
ALTER TABLE "Waiver" ADD CONSTRAINT "Waiver_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
