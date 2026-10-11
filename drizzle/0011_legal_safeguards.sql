CREATE TABLE "email_preference" (
	"email" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"marketing_opt_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_preference_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "age_confirmed_at" timestamp with time zone;