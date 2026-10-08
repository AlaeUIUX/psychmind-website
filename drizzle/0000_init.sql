CREATE TYPE "public"."license_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."provider_status" AS ENUM('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete',
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"seats" integer
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'patient' NOT NULL,
	"first_name" text,
	"last_name" text,
	"stripe_customer_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_license" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"state" text NOT NULL,
	"license_number" text NOT NULL,
	"issuing_body" text NOT NULL,
	"document_id" text,
	"status" "license_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_location" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"state" text NOT NULL,
	"city" text NOT NULL,
	"zip" text,
	"practice_name" text,
	"address" text,
	"formats" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "provider_status" DEFAULT 'draft' NOT NULL,
	"onboarding_step" text DEFAULT 'identity' NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"business_name" text,
	"display_as_business" boolean DEFAULT false NOT NULL,
	"title_credentials" text DEFAULT '' NOT NULL,
	"pronouns" text,
	"banner_style" text DEFAULT 'banner_04' NOT NULL,
	"photo_id" text,
	"who_you_work_with" text DEFAULT '' NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"session_participants" text[] DEFAULT '{}'::text[] NOT NULL,
	"age_groups" text[] DEFAULT '{}'::text[] NOT NULL,
	"specialties" text[] DEFAULT '{}'::text[] NOT NULL,
	"primary_specialty" text,
	"approaches" text[] DEFAULT '{}'::text[] NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"gender" text,
	"fee_individual" integer,
	"fee_couples" integer,
	"sliding_scale" boolean DEFAULT false NOT NULL,
	"accepting_new_clients" boolean DEFAULT true NOT NULL,
	"education" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"npi_number" text,
	"years_experience" integer,
	"extra_locations" integer DEFAULT 0 NOT NULL,
	"review_note" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"needs_review" boolean DEFAULT false NOT NULL,
	"past_due_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_license" ADD CONSTRAINT "provider_license_profile_id_provider_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."provider_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_location" ADD CONSTRAINT "provider_location_profile_id_provider_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."provider_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD CONSTRAINT "provider_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_license_state_idx" ON "provider_license" USING btree ("profile_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_location_state_idx" ON "provider_location" USING btree ("profile_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_profile_user_idx" ON "provider_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_profile_status_idx" ON "provider_profile" USING btree ("status");