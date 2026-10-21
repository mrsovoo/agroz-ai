# Changelog

All notable changes to the AgrozGO platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
