ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE "users_id_seq";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "request_count" SET DATA TYPE integer USING "request_count"::integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "request_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "source_count" SET DATA TYPE integer USING "source_count"::integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "source_count" SET DEFAULT 0;