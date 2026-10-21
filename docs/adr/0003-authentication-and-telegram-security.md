# ADR 0003: Authentication Identity and Telegram WebApp Security Verification

- **Status**: Accepted
- **Date**: 2026-10-21
- **Deciders**: AgrozGO Engineering Team

## Context
Merchants access BiznesGO primarily through mobile web browsers on smartphones in rural/suburban areas, and also via Telegram Mini Apps inside `@biznesgo_bot`. Security must not rely exclusively on Telegram ID, nor compromise cryptographic verification.

## Decision
1. **Primary Identity**:
   - The primary identifier for users is their normalized E.164 phone number (e.g., `+998901234567`).
   - Telegram accounts (`telegram_user_id`) serve solely as a secondary linked credential or supplementary login mechanism.
2. **Password & Credential Security**:
   - Passwords for web login MUST be hashed with **Argon2id** (or Bcrypt with a minimum cost factor of 12).
   - JWT tokens use short-lived access tokens (15–60 minutes) paired with secure HTTP-only refresh tokens.
3. **Telegram Mini App Security (initData verification)**:
   - When a user opens BiznesGO within Telegram, the Telegram client provides an `initData` string containing query parameters signed with HMAC-SHA256 by Telegram's Bot token.
   - The backend MUST verify the signature before trusting any user payload:
     1. Parse `initData` into key-value pairs and extract the `hash` parameter.
     2. Sort the remaining parameters alphabetically and join them with `\n`.
     3. Generate a secret key: `HMAC_SHA256("WebAppData", bot_token)`.
     4. Calculate the verification signature: `HMAC_SHA256(secret_key, data_check_string)`.
     5. Perform constant-time string comparison between the calculated signature and the provided `hash`.
     6. Verify `auth_date` to prevent replay attacks (maximum tolerance: 24 hours).

## Consequences
- Independent, resilient user identity model not locked into any single messaging platform.
- Zero forged Telegram session vulnerabilities.

