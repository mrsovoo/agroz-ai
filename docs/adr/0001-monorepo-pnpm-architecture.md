# ADR 0001: pnpm Monorepo Architecture and Stack Selection

- **Status**: Accepted
- **Date**: 2026-10-21
- **Deciders**: AgrozGO Engineering Team

## Context
AgrozGO aims to serve 100K+ agricultural businesses across Central Asia. The solution requires a modern multi-app architecture containing:
1. `b2b/backend-b2b`: Core B2B API serving retail stores, inventory, and point-of-sale.
2. `b2b/biznesgo`: Store merchant frontend (mobile-first Web and Telegram Mini App).
3. `super-adm`: Central administrator portal for managing merchant licenses, catalogs, and platform health.
4. Future microservices: `b2c`, `bridge`, and `ai-service`.
5. Shared packages: `packages/shared-types` and `packages/api-contracts`.

## Decision
1. **Package Manager**: Use `pnpm` workspaces for strict dependency resolution, deterministic builds, and disk efficiency via symlinked store.
2. **Backend**: Adopt **NestJS** with **TypeScript** and **Prisma ORM** over PostgreSQL. This provides strong enterprise-grade architectural boundaries (modules, controllers, services, guards, interceptors, DTO validation via class-validator).
3. **Frontend**: Adopt **React 18 / 19** with **TypeScript** and **Vite** with Tailwind CSS for mobile-first responsive interfaces (360px+ viewport baseline).
4. **Tooling**: Standardize across all packages using **ESLint**, **Prettier**, and **TypeScript strict mode**.

## Consequences
- Fast local builds and clear workspace package dependency sharing (`workspace:*`).
- Consistent coding patterns and strict type validation between backend and frontend.

