# Pepsa Vendor Web

Governance version: `2026.10.14-m0`

Accessible, route-split React application shell for the Pepsa Vendor Platform. Read `AGENTS.md` before contributing.

## Local setup

1. Install Node 24 and pnpm 12.
2. Copy `.env.example` to `.env.local` and point it at the Vendor API.
3. Run `pnpm dev`.

The reviewed backend contract snapshot lives in `contracts/openapi.json`; regenerate `src/api/generated/schema.ts` after approved API changes. Run `pnpm verify` and `pnpm test:e2e` before opening a change.
