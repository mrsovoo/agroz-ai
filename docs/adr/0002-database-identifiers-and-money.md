# ADR 0002: Identifiers, Monetary Representations, and Partitioning Readiness

- **Status**: Accepted
- **Date**: 2026-10-21
- **Deciders**: AgrozGO Engineering Team

## Context
High-scale B2B retail operations require:
1. Distributed identifiers safe from enumeration attacks and cross-system sync collisions.
2. Zero rounding/floating-point errors in sales, cost prices, debts, and taxes.
3. Long-term scalability for high-velocity transactional tables (`sales`, `audit_logs`).

## Decision
1. **Primary Keys**:
   - All database primary keys MUST be UUIDs (preferably UUIDv7 time-ordered, or UUIDv4 compatible), NEVER serial auto-incrementing integers.
   - UUIDv7 maintains index locality and B-tree write performance due to chronological time prefixes.
2. **Monetary Values**:
   - Financial amounts (prices, discounts, totals, debt balances) MUST be stored as integers representing the smallest currency unit (e.g., Uzbek Tiyin: 1 UZS = 100 tiyin).
   - Every monetary record MUST be accompanied by an ISO currency code (e.g., `UZS`, `KZT`, `USD`).
   - Floating-point representations (`FLOAT`, `REAL`, `DOUBLE PRECISION`) are strictly forbidden for currency.
3. **Partitioning Readiness**:
   - High-throughput tables (`sales`, `audit_logs`) are modeled with primary keys that include the creation timestamp or are structured so PostgreSQL declarative partitioning by range (`created_at`) can be introduced seamlessly when volume demands it without schema refactoring.
4. **Outbox Pattern**:
   - An `outbox_events` table is included from v0.0.0 to capture transactional state mutations atomically with relational commits, providing reliable asynchronous event publishing later.

## Consequences
- Guaranteed mathematical correctness for all accounting and debt reconciliation.
- Future-proof database sharding and time-based table partitioning capability.
