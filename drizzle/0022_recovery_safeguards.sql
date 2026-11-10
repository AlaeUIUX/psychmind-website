ALTER TABLE "account_recovery_request" ADD COLUMN "contact_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account_recovery_request" ADD COLUMN "disputed_at" timestamp with time zone;--> statement-breakpoint
-- Requests made before this change already alerted everyone: treat their contact address as confirmed.
UPDATE "account_recovery_request" SET "contact_verified_at" = "created_at" WHERE "contact_verified_at" IS NULL;
