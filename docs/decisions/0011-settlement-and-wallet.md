# ADR 0011: Settlement, wallet, deferred fees, and transaction authorization

Governance version: `2026.10.21-m6`

**Status:** Accepted

Pepsa Pay is authoritative for balances and money movement. Vendor exposes permission-separated settlement and wallet views from its OpenAPI contract, stores only operational projections and opaque payment identifiers, represents money exactly, uses append-only fee debt instead of overdrawing Pay, and requires a short-lived single-use transaction-PIN challenge for cash-out, transfers, and utility purchases. See the matching backend ADR for settlement triggers, reconciliation, and security invariants.
