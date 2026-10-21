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
    - Extensible `SmsOtpChannel` stub prepared for Eskiz.uz without code modifications.
  - 6-digit one-time password (OTP):
    - 5-minute validity window.
    - Cryptographic HMAC-SHA256 hash storage (zero plaintext storage).
    - Single-use consumption flag (`is_used`).
    - Phone resend cooldown (60s).
    - Failed attempt tracking with 15-minute lockout after 5 consecutive failures.
    - IP-based rate limiting (5 req/min).
- Secure Telegram Account Linking:
  - Deep-link generation: `https://t.me/biznesgo_bot?start=TOKEN` (15-minute token).
  - Webhook update processor for `/start` and contact verification.
  - **Strict Anti-Spoofing Security Check**: enforces `message.contact.user_id === message.from.id` before binding `telegram_id` to prevent forwarded contact fraud.
- Super Administrator Mandatory Two-Factor Authentication (2FA):
  - Strictly prohibits OTP via messaging for Super Admins (ADR 0005).
  - Enforces RFC 6238 Time-based One-Time Password (TOTP) compatible with Google Authenticator.
- PostgreSQL Database Schema via Prisma (`agroz_b2b_dev` schema):
  - UUIDv7 primary keys.
  - All monetary fields stored strictly as integers (`BigInt` tiyin) with currency indicators.
  - Models for `users`, `shops`, `shop_users`, `catalog_products`, `shop_products`, `product_batches`, `sales`, `sale_items`, `customers`, `debt_transactions`, `audit_logs`, `outbox_events`, `idempotency_keys`, `otp_verifications`, and `telegram_link_tokens`.
  - Date partitioning readiness indices for `sales` and `audit_logs`.
  - Comprehensive database seed script.
- Complete unit test coverage for phone normalization, OTP channel & rate-limits, Telegram anti-spoofing binding, and Super Admin 2FA.
- Architectural Decision Record:
  - ADR 0005: OTP Authentication, Channel Abstraction, and Telegram Account Binding.

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

