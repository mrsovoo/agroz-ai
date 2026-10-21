# AgrozGO Platform (v0.0.0)

AgrozGO is an agricultural ecosystem engineered for Central Asian agribusinesses (100K+ potential merchants).
The platform begins with pure B2B operations for the **Veterinary and Agro Pharmacy** sector (`pharmacy`), with progressive capability to scale across other sectors (Feed, Greenhouse, Seeds, Machinery) and future B2C consumer marketplace expansion.

## Monorepo Layout

```
agrozgo/
├── b2b/
│   ├── backend-b2b/          NestJS + TypeScript + Prisma + PostgreSQL (api.biznesgo.uz /v1)
│   └── biznesgo/             React + TS + Vite Mobile-First Web & TMA (biznesgo.uz)
├── super-adm/                React + TS + Vite Super Administrator Portal (admin.biznesgo.uz)
├── b2c/                      Consumer Marketplace (Planned for v1.x+)
├── bridge/                   B2B-B2C Catalog & Order Bridge (Planned)
├── ai-service/               Veterinary & Agronomic Diagnostic Microservice (Planned)
├── packages/
│   ├── shared-types/         Core domain entities, enums, and DTO contracts
│   └── api-contracts/       OpenAPI specifications and API contracts
├── docs/
│   └── adr/                  Architectural Decision Records (ADR 0001 - ADR 0004)
├── archive/
│   └── ai-first-draft/       Archived initial prototype (Tagged: archive-ai-first-draft)
├── docker-compose.yml        Local infrastructure (PostgreSQL 16, Redis 7)
├── CHANGELOG.md              Version history starting at v0.0.0
└── pnpm-workspace.yaml       Monorepo workspace configuration
```

## Domains & Routing

| Component | Production Domain | Purpose |
| :--- | :--- | :--- |
| **B2B Merchant Portal** | `https://biznesgo.uz` | Mobile-first web inventory & POS; TMA ready |
| **B2B Backend API** | `https://api.biznesgo.uz/v1` | Core transactional API & Auth |
| **Super Admin** | `https://admin.biznesgo.uz` | Global merchant licenses, catalogs, platform metrics |
| **Telegram Bot** | `@biznesgo_bot` | Store management and Mini App entry (Next phases) |

## Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL and Redis
docker compose up -d

# 3. Run development services
pnpm dev:backend
pnpm dev:biznesgo
pnpm dev:super-adm
```

