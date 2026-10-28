CREATE TABLE "blog_subscriber" (
	"email" text PRIMARY KEY NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
