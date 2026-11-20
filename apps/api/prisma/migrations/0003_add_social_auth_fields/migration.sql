-- Add social auth fields to users table: provider, googleId; make passwordHash optional
-- AlterTable
ALTER TABLE "users"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "provider" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_provider_googleId_idx" ON "users"("provider", "googleId");

-- Create unique constraint on googleId (idempotent via DO block)
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_googleId_key" UNIQUE ("googleId");
EXCEPTION
  WHEN unique_violation THEN null;
END $$;
