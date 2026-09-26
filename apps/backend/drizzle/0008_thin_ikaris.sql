ALTER TABLE "specialist_medicines" ADD COLUMN "type" varchar(20) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "specialist_medicines" ADD COLUMN "usage" varchar(300);