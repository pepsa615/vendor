# ADR 0010: M5 dispatch lifecycle and integration boundaries

Governance version: `2026.10.14-m0`

**Status:** Accepted

Dispatch uses one tenant-owned aggregate for own-fleet and Pepsa general-pool assignments. Both modes accept riders asynchronously and follow Pending Match, Paired, Picked Up, Delivered, then Completed; Cancelled is terminal. Vendors may cancel only Pending Match. Provider events are signed, replay-safe, append-only, and concurrency checked.

An assignment contains one eligible order or one eligible batch. A batch has one pickup and one or more optimized delivery stops. Active membership is exclusive. Route, fee, revenue-share, and payout inputs are immutable snapshots.

Own-fleet payout is suggested from the dispatcher's approved revenue share and can be overridden as a bulk amount or per-stop amounts. M5 calls a finance reservation port but does not create wallet or settlement records; those remain M6. General-pool funding cannot be deferred. Optimization, provider dispatch, finance, and tracking remain provider-neutral ports with deterministic local adapters until production contracts are approved.

Vendor-created orders are created without a mobility method or price. General Pool creation and conversion from a still-unpaired Runway manifest require the operator to select mobility and request an Open Dispatch price. Publishing then requires explicit irreversible confirmation; the main wallet debit happens before provider submission and the UI does not offer a recall or conversion back to Runway.
