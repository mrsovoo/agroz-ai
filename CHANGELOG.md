# Changelog

All notable changes to the AgrozGO platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-10-21

### Added
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
- PostgreSQL Database Schema via Prisma (`agroz_b2b_dev` schema):
  - UUIDv7 primary keys.
  - All monetary fields stored strictly as integers (`BigInt` tiyin) with currency indicators.
  - Models for `users`, `shops`, `shop_users`, `catalog_products`, `shop_products`, `product_batches`, `sales`, `sale_items`, `customers`, `debt_transactions`, `audit_logs`, `outbox_events`, `idempotency_keys`, `otp_verifications`, `telegram_link_tokens`, `refresh_tokens`, and `admin_recovery_codes`.
  - Date partitioning readiness indices for `sales` and `audit_logs`.
  - Comprehensive database seed script.
- Complete unit test coverage (29/29 tests passing) across phone normalization, OTP channel & rate-limits, Telegram anti-spoofing binding, Refresh token rotation, and Super Admin 2FA.
- Architectural Decision Records:
  - ADR 0005: OTP Authentication, Channel Abstraction, and Telegram Account Binding.
  - ADR 0006: Authentication, Telegram Binding, Refresh Token Rotation, and Super Admin 2FA.

## [0.0.0] - 2026-10-21

### Added
- Complete architecture reset from legacy AI draft to clean scalable foundation.
- Git tag `archive-ai-first-draft` preserving entire previous code history in `archive/ai-first-draft/`.
- pnpm monorepo structure with strict workspace package boundary.
- Architectural Decision Records:
  - ADR 0001: pnpm Monorepo Architecture and Stack Selection.
  - ADR 0002: Identifiers (UUID), Monetary Integer Representation (Tiyin), and Partitioning Readiness.
  - ADR 0003: Phone-First Identity and Telegram WebApp HMAC Security Verification.
  - ADR 0004: Multi-Tenancy and Agricultural Sector Registry (Starting with `pharmacy`).
- Initial workspace layout:
  - `b2b/backend-b2b`: NestJS + Prisma + PostgreSQL B2B Core.
  - `b2b/biznesgo`: React + Vite + TypeScript Mobile-First Web & Mini App.
  - `super-adm`: React + Vite + TypeScript Super Admin Portal.
  - `packages/shared-types`: Canonical domain models and enums.
  - `packages/api-contracts`: OpenAPI schema definitions.
  - Placeholder modules: `b2c/`, `bridge/`, `ai-service/`.
- Local development orchestration via Docker Compose (PostgreSQL 16, Redis 7).

