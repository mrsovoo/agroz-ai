CREATE TABLE "specialist_medicines" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialist_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"photo_file_id" varchar(300),
	"status" varchar(20) DEFAULT 'bor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
