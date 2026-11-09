-- Sample providers (migration 0007) get a spread of plans; server/directory/sample-rows.ts
-- sampleInsurance() gives new ones the same lists (tests/unit/sample-insurance.test.ts).
UPDATE "provider_profile" SET "insurance" = ARRAY['aetna','bcbs','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-01@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['humana','medicaid','molina']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-02@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['optum','tricare','aetna','bcbs','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-03@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['ambetter','carelon']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-04@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-05@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['oscar','uhc','ambetter','carelon']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-06@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['anthem','cigna','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-07@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['magellan','mhn','oscar']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-08@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['oxford','wellcare','anthem','cigna','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-09@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-10@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['medicaid','molina','oxford','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-11@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['tricare','aetna','bcbs','compsych']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-12@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['carelon','humana','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-13@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['medicare','optum','tricare']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-14@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-15@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['cigna','kaiser']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-16@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['mhn','oscar','uhc','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-17@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['wellcare','anthem','cigna','kaiser']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-18@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['compsych','magellan','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-19@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-20@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['aetna','bcbs','compsych','magellan','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-21@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['humana','medicaid']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-22@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['optum','tricare','aetna','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-23@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['ambetter','carelon','humana','medicaid']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-24@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-25@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['oscar','uhc','ambetter']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-26@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['anthem','cigna','kaiser','medicare','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-27@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['magellan','mhn']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-28@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['oxford','wellcare','anthem','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-29@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-30@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['medicaid','molina','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-31@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['tricare','aetna','bcbs']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-32@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['carelon','humana','medicaid','molina','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-33@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['medicare','optum']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-34@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-35@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['cigna','kaiser','medicare','optum']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-36@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['mhn','oscar','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-37@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['wellcare','anthem','cigna']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-38@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['compsych','magellan','mhn','oscar','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-39@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-40@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['aetna','bcbs','compsych','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-41@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['humana','medicaid','molina','oxford']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-42@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['optum','tricare','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-43@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['ambetter','carelon','humana']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-44@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-45@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['oscar','uhc']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-46@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['anthem','cigna','kaiser','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-47@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['magellan','mhn','oscar','uhc']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-48@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['oxford','wellcare','out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-49@samples.psychmind.test');
--> statement-breakpoint
UPDATE "provider_profile" SET "insurance" = ARRAY['out_of_network']::text[] WHERE "is_sample" = true AND "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'sample-50@samples.psychmind.test');
