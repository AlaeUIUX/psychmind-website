CREATE TABLE "saved_provider" (
	"user_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_provider_user_id_profile_id_pk" PRIMARY KEY("user_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "public_id" text;--> statement-breakpoint
UPDATE "provider_profile" SET "public_id" = substr(md5(random()::text || "id"), 1, 8) WHERE "public_id" IS NULL;--> statement-breakpoint
ALTER TABLE "provider_profile" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "external_photo_url" text;--> statement-breakpoint
ALTER TABLE "saved_provider" ADD CONSTRAINT "saved_provider_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_provider" ADD CONSTRAINT "saved_provider_profile_id_provider_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."provider_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_provider_profile_idx" ON "saved_provider" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_profile_public_id_idx" ON "provider_profile" USING btree ("public_id");