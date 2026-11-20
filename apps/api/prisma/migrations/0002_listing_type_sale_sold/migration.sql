-- Add listing type, sale price, sold status; default rentAmount for sale-only units
-- AlterEnum (AvailabilityStatus)
ALTER TYPE "AvailabilityStatus" ADD VALUE IF NOT EXISTS 'SOLD';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ListingType" AS ENUM ('RENT', 'SALE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "apartments"
  ADD COLUMN IF NOT EXISTS "listingType" "ListingType" NOT NULL DEFAULT 'RENT',
  ADD COLUMN IF NOT EXISTS "salePrice" INTEGER,
  ALTER COLUMN "rentAmount" SET DEFAULT 0;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "apartments_listingType_idx" ON "apartments"("listingType");
CREATE INDEX IF NOT EXISTS "apartments_salePrice_idx" ON "apartments"("salePrice");
