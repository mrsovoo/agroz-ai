ALTER TABLE "specialists" ADD COLUMN "education" varchar(300);--> statement-breakpoint
ALTER TABLE "specialists" ADD COLUMN "bio" varchar(500);--> statement-breakpoint
ALTER TABLE "specialists" ADD COLUMN "helps_with" varchar(20) DEFAULT 'both';--> statement-breakpoint
ALTER TABLE "specialists" ADD COLUMN "experience_years" integer;