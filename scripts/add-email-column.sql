-- Add email column with a default empty string temporarily
-- (so existing rows don't fail the NOT NULL constraint)
ALTER TABLE "pods" ADD COLUMN IF NOT EXISTS "email" text NOT NULL DEFAULT '';

-- Add unique constraint to email column
ALTER TABLE "pods" ADD CONSTRAINT "pods_email_unique" UNIQUE("email");

-- Note: If you have any existing pods with empty emails,
-- you'll need to update them before they can violate the unique constraint
