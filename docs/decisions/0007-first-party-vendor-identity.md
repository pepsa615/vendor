# ADR 0007: First-party Vendor identity

Governance version: `2026.10.14-m0`

**Status:** Accepted

The Vendor backend owns Vendor credentials, sessions, email verification, and staff invitations. Passwords use Argon2id. Access tokens are short-lived RS256 JWTs published through a local JWKS endpoint; rotating refresh credentials are stored hashed and delivered in secure HttpOnly cookies. Reuse revokes the session family.

The authenticated session determines the tenant and effective capabilities. Client-provided tenant identifiers are never authoritative. The immutable vendor owner has all capabilities; other users receive explicit custom-role grants.

Verification and invitation secrets are hashed, expiring, and attempt-limited. Delivery is driven by the transactional outbox. Security and privileged mutations are recorded in append-only audit events.

This decision supersedes ADR 0004 for the Vendor platform. The Admin control plane remains a separate trust domain and uses short-lived signed actor context for review operations.
