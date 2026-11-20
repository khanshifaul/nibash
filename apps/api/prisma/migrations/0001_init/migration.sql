-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'COMING_SOON');
CREATE TYPE "GasType" AS ENUM ('LINE', 'CYLINDER', 'LPG_CENTRAL', 'NONE');
CREATE TYPE "ParkingType" AS ENUM ('NONE', 'BIKE', 'CAR', 'CAR_AND_BIKE', 'PAID');
CREATE TYPE "RoomTag" AS ENUM ('COVER', 'MASTER_BEDROOM', 'BEDROOM', 'DINING', 'DRAWING', 'KITCHEN', 'WASHROOM', 'VERANDA', 'OTHER');
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'CONTACTED', 'SCHEDULED', 'CLOSED', 'SPAM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(32),
    "passwordHash" VARCHAR(255) NOT NULL,
    "avatarUrl" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" VARCHAR(255),
    "emailVerificationExpires" TIMESTAMP(3),
    "resetToken" VARCHAR(255),
    "resetTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "areaZone" VARCHAR(100) NOT NULL,
    "roadBlock" VARCHAR(100),
    "addressLine" TEXT,
    "contactPhone" VARCHAR(32),
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "elevatorCount" SMALLINT,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "parkingType" "ParkingType" NOT NULL DEFAULT 'NONE',
    "hasGenerator" BOOLEAN NOT NULL DEFAULT false,
    "generatorScope" VARCHAR(50),
    "hasSecurityGuard" BOOLEAN NOT NULL DEFAULT false,
    "hasCctv" BOOLEAN NOT NULL DEFAULT false,
    "hasIntercom" BOOLEAN NOT NULL DEFAULT false,
    "hasRooftop" BOOLEAN NOT NULL DEFAULT false,
    "hasSubmersiblePump" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "buildings_slug_key" ON "buildings"("slug");
CREATE INDEX "buildings_ownerId_idx" ON "buildings"("ownerId");
CREATE INDEX "buildings_moderationStatus_idx" ON "buildings"("moderationStatus");
CREATE INDEX "buildings_areaZone_idx" ON "buildings"("areaZone");

-- CreateTable (hierarchy: Building > Floor)
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "label" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "floors_buildingId_floorNumber_key" ON "floors"("buildingId", "floorNumber");
CREATE INDEX "floors_buildingId_idx" ON "floors"("buildingId");

-- CreateTable
CREATE TABLE "building_images" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" VARCHAR(200),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "building_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "building_images_buildingId_idx" ON "building_images"("buildingId");

-- CreateTable (hierarchy: Floor > Apartment)
CREATE TABLE "apartments" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "unitLabel" VARCHAR(50) NOT NULL,
    "facing" VARCHAR(20),
    "sizeSqft" INTEGER,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "attachedBathrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "highCommodeCount" SMALLINT,
    "diningRooms" INTEGER NOT NULL DEFAULT 0,
    "drawingRooms" INTEGER NOT NULL DEFAULT 0,
    "kitchens" INTEGER NOT NULL DEFAULT 0,
    "verandas" INTEGER NOT NULL DEFAULT 0,
    "gasType" "GasType" NOT NULL DEFAULT 'NONE',
    "utilityBillingType" VARCHAR(50),
    "preferredTenantTypes" TEXT[] NOT NULL DEFAULT '{}',
    "rentAmount" INTEGER NOT NULL,
    "serviceCharge" INTEGER NOT NULL DEFAULT 0,
    "securityDepositAmount" INTEGER NOT NULL DEFAULT 0,
    "depositMonths" INTEGER,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "availableFrom" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "apartments_floorId_unitLabel_key" ON "apartments"("floorId", "unitLabel");
CREATE INDEX "apartments_buildingId_idx" ON "apartments"("buildingId");
CREATE INDEX "apartments_floorId_idx" ON "apartments"("floorId");
CREATE INDEX "apartments_availabilityStatus_idx" ON "apartments"("availabilityStatus");
CREATE INDEX "apartments_rentAmount_idx" ON "apartments"("rentAmount");
CREATE INDEX "apartments_bedrooms_bathrooms_verandas_idx" ON "apartments"("bedrooms", "bathrooms", "verandas");

-- CreateTable
CREATE TABLE "apartment_images" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "roomTag" "RoomTag" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "apartment_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "apartment_images_apartmentId_idx" ON "apartment_images"("apartmentId");

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "message" TEXT,
    "requestedVisitAt" TIMESTAMP(3),
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inquiries_apartmentId_idx" ON "inquiries"("apartmentId");
CREATE INDEX "inquiries_buildingId_idx" ON "inquiries"("buildingId");
CREATE INDEX "inquiries_renterId_idx" ON "inquiries"("renterId");
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateTable
CREATE TABLE "favorites" (
    "userId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId", "apartmentId")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "floors" ADD CONSTRAINT "floors_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "building_images" ADD CONSTRAINT "building_images_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apartment_images" ADD CONSTRAINT "apartment_images_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
