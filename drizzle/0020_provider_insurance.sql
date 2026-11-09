ALTER TABLE "provider_profile" ADD COLUMN "insurance" text[] DEFAULT '{}'::text[] NOT NULL;
