CREATE TABLE "specialist_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialist_id" integer NOT NULL,
	"rater_key" varchar(64) NOT NULL,
	"stars" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "specialist_ratings_uniq" ON "specialist_ratings" USING btree ("specialist_id","rater_key");