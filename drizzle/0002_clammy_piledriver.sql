ALTER TABLE "otp_codes" ADD COLUMN "token" varchar(64);--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "telegram_id" bigint;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_token_unique" UNIQUE("token");