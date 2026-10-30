ALTER TABLE "provider_license" ADD COLUMN "pending" jsonb;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "pending_changes" jsonb;