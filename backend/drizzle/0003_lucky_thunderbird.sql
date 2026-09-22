CREATE TABLE "bot_states" (
	"telegram_id" bigint PRIMARY KEY NOT NULL,
	"flow" varchar(20) DEFAULT 'auth' NOT NULL,
	"step" varchar(40) NOT NULL,
	"data" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialists" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"role" varchar(20) DEFAULT 'specialist' NOT NULL,
	"specialty" varchar(160),
	"organization" varchar(200),
	"address" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"work_hours" varchar(60) DEFAULT '09:00 - 18:00',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "specialists_telegram_id_unique" UNIQUE("telegram_id")
);
