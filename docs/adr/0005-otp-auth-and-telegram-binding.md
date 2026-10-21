# ADR 0005: OTP Authentication, Channel Abstraction, and Telegram Account Binding

- **Status**: Accepted
- **Date**: 2026-10-21
- **Deciders**: AgrozGO Engineering Team

## Context
AgrozGO merchant accounts require frictionless, mobile-first login using phone numbers in rural Central Asia. While SMS has recurring cost, Telegram is ubiquitous and free. A flexible OTP architecture must allow sending verification codes through Telegram initially and easily adding SMS gateways (e.g. Eskiz.uz) later without altering domain logic.

Furthermore, Telegram account binding must prevent impersonation vulnerabilities (e.g., someone forwarding a different user's contact card).

Super Administrators hold system-wide privileges across all tenants; hence OTP via messaging is prohibited for Super Admins in favor of mandatory RFC 6238 TOTP (Authenticator app).

## Decision
1. **Primary Identifier**:
   - Phone numbers are stored strictly in international E.164 format (e.g., `+998901234567`).
2. **Channel Abstraction (`OtpChannel`)**:
   - An extensible `OtpChannel` interface is introduced:
     ```typescript
     export interface OtpChannel {
       readonly name: string;
       sendOtp(destination: string, code: string, metadata?: Record<string, unknown>): Promise<boolean>;
     }
     ```
   - Current implementation: `TelegramOtpChannel`.
   - Planned implementation: `SmsOtpChannel` (Eskiz.uz).
   - `OtpService` selects or falls back between registered channels via configuration.
3. **One-Time Password (OTP) Specifications**:
   - **Length**: 6 digits (`crypto.randomInt(100000, 999999)`).
   - **Lifetime**: 5 minutes (`expires_at = now + 300s`).
   - **Single Use**: Once consumed, `is_used` becomes `true`.
   - **Storage**: Plaintext OTP is NEVER stored in the database. Only `code_hash` (computed via SHA-256 with an HMAC server salt) is persisted.
   - **Rate Limiting**:
     - Phone cooldown: 60 seconds between resend requests.
     - Maximum failed attempts: 5 attempts per challenge. After 5 failures, the record is locked for 15 minutes (`locked_until`).
     - IP-based rate limit: maximum 5 OTP requests per minute per IP.
4. **Secure Telegram Account Binding**:
   - To link a Telegram account, the web app issues a cryptographically random, short-lived token (`telegram_link_tokens`, 15-minute validity).
   - Web provides a deep link: `https://t.me/biznesgo_bot?start=LINK_TOKEN`.
   - When the user opens the bot:
     1. Bot receives `/start <token>` and validates the token.
     2. Bot prompts the user for contact verification using Telegram's `Keyboard.request_contact`.
     3. **Strict Validation**: The bot validates that `message.contact.user_id === message.from.id`. If a forwarded or third-party contact is submitted, it is rejected immediately.
     4. Once confirmed, the verified phone is matched or updated with `user.telegram_id = from.id`, and the link token is marked as consumed.
5. **Super Admin Two-Factor Authentication (TOTP 2FA)**:
   - Super Administrator accounts (`role = 'super_admin'`) are forbidden from using messaging OTP.
   - They authenticate with phone/email + password, followed by mandatory RFC 6238 Time-based One-Time Password (TOTP) from an authenticator app (Google Authenticator, 1Password, etc.).
6. **Audit Logging**:
   - All authentication attempts, OTP generation, verification successes/failures, and account linking events are logged into `audit_logs`.

## Consequences
- Highly secure, cost-effective authentication adaptable to both Telegram and future SMS providers.
- Elimination of identity fraud and contact spoofing via Telegram.
- Enterprise-level compliance for Super Admin operations.

