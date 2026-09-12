CREATE TABLE "diagnoses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"category" varchar(20) NOT NULL,
	"input_text" text,
	"has_image" boolean DEFAULT false NOT NULL,
	"disease_name" text NOT NULL,
	"solution" text NOT NULL,
	"medicines" text NOT NULL,
	"severity" varchar(20) DEFAULT 'orta',
	"source" varchar(20) DEFAULT 'ai',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" varchar(20) DEFAULT 'agro' NOT NULL,
	"usage" text
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"tag" varchar(40) DEFAULT 'Umumiy',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(32) NOT NULL,
	"code" varchar(8) NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"kind" varchar(20) DEFAULT 'agro' NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"phone" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"specialist" varchar(120),
	"work_hours" varchar(60) DEFAULT '09:00 - 18:00',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"pharmacy_id" integer NOT NULL,
	"medicine_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'bor' NOT NULL,
	"price" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(32),
	"telegram_id" bigint,
	"name" varchar(120),
	"region" varchar(120),
	"district" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
