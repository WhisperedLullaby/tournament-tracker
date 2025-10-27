ALTER TABLE "pods" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_email_unique" UNIQUE("email");