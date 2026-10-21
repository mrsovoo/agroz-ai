# ADR 0004: Multi-Tenancy and Agricultural Sector Registry Architecture

- **Status**: Accepted
- **Date**: 2026-10-21
- **Deciders**: AgrozGO Engineering Team

## Context
AgrozGO plans to support 5 distinct agricultural retail sectors across Central Asia:
1. `pharmacy` (Veterinary and agricultural agro-pharmacy / Vet & Agro dorixona) — **Active for v0.0.0 through v1.0.0**.
2. `feed` (Yem va ozuqa mahsulotlari) — Planned.
3. `greenhouse` (Issiqxona uskunalari va materiallari) — Planned.
4. `seeds` (Urug' va ko'chatlar) — Planned.
5. `machinery` (Qishloq xo'jaligi texnikasi va ehtiyot qismlari) — Planned.

The platform must avoid premature complexity while designing clean architectural seams that allow adding the other 4 sectors without refactoring the foundational domain models.

## Decision
1. **Initial Scope**:
   - Only `pharmacy` sector is enabled in v0.0.0.
   - No business logic, UI, or dedicated services will be implemented for the remaining 4 sectors until v1.0.0 is completed and hardened.
2. **Extensible Seams**:
   - `shops.sector` and `catalog_products.sector` columns store the normalized sector slug (e.g. `'pharmacy'`).
   - A `SectorConfigRegistry` design in the backend maps sector slugs to sector capability flags (e.g., dosage tracking, batch expiration enforcement, target species filtering).
   - Core catalog fields (`active_substance`, `target_species`, `manufacturer`, `unit`, `barcode`) provide rich pharmacy attributes without polluting generic inventory logic.
3. **Multi-Country Scaling**:
   - Every tenant shop and transaction has a `country_id` (e.g., `'UZ'`, `'KZ'`, `'KG'`) and localized currency (`'UZS'`, `'KZT'`, `'USD'`).

## Consequences
- Clean, focused delivery of the pharmacy sector with 0 dead code or premature bloat.
- Straightforward onboarding for upcoming sectors without data migration friction.
