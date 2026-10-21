# Changelog

All notable changes to the AgrozGO platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.0] - 2026-10-21

### Added
- Complete architecture reset from legacy AI draft to clean scalable foundation (`archive-ai-first-draft`).
- pnpm monorepo structure with strict workspace package boundary.
- Phone-first authentication service (`b2b/backend-b2b`):
  - Normalized E.164 phone identity standard.
  - Pluggable `OtpChannel` abstraction:
    - `TelegramOtpChannel` via `@biznesgo_bot` Bot API.
    - `ConsoleOtpChannel` for local dev/testing without external bot dependencies.
    - Extensible `SmsOtpChannel` stub prepared for Eskiz.uz without code modifications.
  - 6-digit one-time password (OTP):
    - 5-minute validity window.
    - Cryptographic HMAC-SHA256 hash storage (zero plaintext storage).
    - Single-use consumption flag (`is_used`).
    - Phone resend cooldown (60s).
    - Failed attempt tracking with 15-minute lockout after 5 consecutive failures.
    - Phone-based hourly rate limiting (5 req/hour) and IP rate limiting.
    - Anti-enumeration uniform responses; explicit `TELEGRAM_NOT_LINKED` error code for unlinked accounts.
- Secure Telegram Account Linking:
  - Deep-link generation endpoint `POST /v1/auth/telegram/link-token` returning `https://t.me/biznesgo_bot?start=TOKEN` with SHA-256 hashed token storage in database.
  - Webhook update processor for `/start` and contact verification.
  - **Strict Anti-Spoofing Security Check**: enforces `message.contact.user_id === message.from.id` and verifies contact phone matches the token phone before binding `telegram_id`.
- Session Management & Refresh Token Rotation:
  - Short-lived Access Token (JWT, 15 minutes) and DB-persisted SHA-256 hashed Refresh Token (30 days).
  - `POST /v1/auth/refresh`: automatic single-use rotation issuing new token pair.
  - **Token Reuse Detection**: revoking all sessions for a user if an already rotated refresh token is submitted.
  - `POST /v1/auth/logout`: invalidates the active session.
- Super Administrator Mandatory Two-Factor Authentication (2FA):
  - Strictly prohibits OTP via messaging for Super Admins (ADR 0005).
  - Dedicated endpoints: `/v1/admin/auth/login`, `/v1/admin/auth/setup-2fa`, `/v1/admin/auth/verify-2fa`.
  - Enforces RFC 6238 Time-based One-Time Password (TOTP) compatible with Google Authenticator.
  - 8 single-use hashed recovery codes (`admin_recovery_codes`) with instant invalidation upon use.
- Sector Registry Architecture:
  - Centralized sector registry in `packages/shared-types` and `backend-b2b`.
  - Defined 6 sectors: `pharmacy`, `feed`, `greenhouse`, `seeds`, `machinery`, `specialist`.
  - Configured with ONLY `pharmacy` enabled (`enabled: true`); all other sectors are dormant/disabled.
- Database Schema via Prisma (`agroz_b2b_dev` schema on PostgreSQL):
  - UUIDv7 primary keys.
  - All monetary fields stored strictly as integers (`BigInt` tiyin) with currency indicators.
  - Models for `users`, `businesses`, `business_users`, `catalog_products`, `business_products`, `product_batches`, `sales`, `sale_items`, `contacts`, `debt_transactions`, `audit_logs`, `outbox_events`, `idempotency_keys`, `otp_verifications`, `telegram_link_tokens`, `refresh_tokens`, and `admin_recovery_codes`.
  - Date partitioning readiness indices for `sales` and `audit_logs`.
  - Comprehensive clean database seed script.
- Complete unit test coverage (33/33 tests passing) across phone normalization, OTP channel & rate-limits, Telegram anti-spoofing binding, Refresh token rotation, Super Admin 2FA, and Sector Registry.
- Architectural Decision Records:
  - ADR 0001: pnpm Monorepo Architecture and Stack Selection.
  - ADR 0002: Identifiers (UUID), Monetary Integer Representation (Tiyin), and Partitioning Readiness.
  - ADR 0003: Phone-First Identity and Telegram WebApp HMAC Security Verification.
  - ADR 0004: Multi-Tenancy and Agricultural Sector Registry.
  - ADR 0005: OTP Authentication, Channel Abstraction, and Telegram Account Binding.
  - ADR 0006: Authentication, Telegram Binding, Refresh Token Rotation, and Super Admin 2FA.
  - ADR 0007: `businesses` Nomi, `contacts` Modeli va Sektorlar Ro‘yxati Qarori.

### Changed
- Replaced `Shop` model and `shops` table with `Business` / `businesses` to accommodate non-retail entities (e.g. specialists, services).
- Renamed all related fields from `shop_id` to `business_id` (`business_users`, `business_products`, `sales`, `debt_transactions`, `audit_logs`).
- Replaced `Customer` model and `customers` table with `Contact` / `contacts` with `type` field (`customer`, `debtor`, `service_recipient`) and `contact_id` foreign keys.
- Renamed `ShopProduct` to `BusinessProduct` and `product_batches.business_product_id`.
- Expanded sector enum to include `specialist`.
