CREATE TABLE "specialist_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialist_id" integer NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"customer_phone" varchar(32) NOT NULL,
	"problem" text NOT NULL,
	"address" text,
	"status" varchar(20) DEFAULT 'yangi' NOT NULL,
	"assigned_order_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "specialist_medicines" ADD COLUMN "stock" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "specialist_medicines" ADD COLUMN "stock_unit" varchar(20) DEFAULT 'dona' NOT NULL;--> statement-breakpoint
ALTER TABLE "specialists" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "specialists" ADD COLUMN "is_busy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "specialists" ADD COLUMN "current_call_id" integer;