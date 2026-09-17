CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"medicine_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"price" integer,
	"qty" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"pharmacy_specialist_id" integer NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"customer_phone" varchar(32) NOT NULL,
	"note" text,
	"delivery_type" varchar(20) DEFAULT 'pickup' NOT NULL,
	"customer_address" text,
	"total_sum" integer,
	"status" varchar(20) DEFAULT 'yangi' NOT NULL,
	"rating_stars" integer,
	"rating_note" varchar(300),
	"rated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
