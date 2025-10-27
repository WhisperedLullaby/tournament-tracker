-- Safe version that checks first
DO $$
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pods' AND column_name = 'email'
    ) THEN
        ALTER TABLE "pods" ADD COLUMN "email" text NOT NULL DEFAULT '';
    END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'pods_email_unique' AND table_name = 'pods'
    ) THEN
        ALTER TABLE "pods" ADD CONSTRAINT "pods_email_unique" UNIQUE("email");
    END IF;
END $$;
