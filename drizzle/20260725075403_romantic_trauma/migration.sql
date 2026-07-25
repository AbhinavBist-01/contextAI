CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"request_count" numeric(10,0) NOT NULL,
	"request_reset_at" timestamp DEFAULT now() NOT NULL,
	"source_count" numeric(10,0) NOT NULL
);
