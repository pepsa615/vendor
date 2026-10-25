# Progress Log

Governance version: `2026.10.14-m0`

Append entries; never rewrite historical evidence.

## 2026-10-14 — M0 implementation started

- Status: In Progress
- Scope: governance pack, backend foundation, frontend shell, security baseline, automated quality gates.
- Product source: `Pepsa_Logistis_Platform_Documentation.pdf` treated as a working reference with open questions preserved as decision gates.
- Decisions: split repositories; duplicated revision-stamped governance; modular monolith; PostgreSQL/Prisma; Pepsa IAM; OpenAPI-generated frontend contract.
- Evidence: pending final verification run.

## 2026-10-14 — M0 completed

- Status: Complete
- Backend: governance, Prisma validation/generation, typecheck, lint, architecture boundaries (35 TypeScript files), 4 unit tests, 1 API e2e test, Nest production build, and formatting passed.
- Database: the baseline migration applied successfully to a clean temporary PostgreSQL database; the temporary database was then removed.
- Frontend: governance/contract checks, typecheck, lint without findings, 2 unit/component tests, production build, formatting, and 1 Chromium smoke test passed.
- Bundle: 11 JavaScript chunks; entry chunk 344.51 KiB raw / 108.29 KiB gzip, within the 500 KiB raw and 250 KiB gzip budgets; all lazy chunks remained below 150 KiB gzip.
- Security: production dependency audits reported no known vulnerabilities after patched transitive dependency overrides; no credentials were added to either repository.
- Governance: backend and frontend packs reported the same local checksum and governance version.

## 2026-10-16 — Shared UI kit expanded

- Added the Pepsa red semantic token system and reusable size/state variants.
- Added the governed UI catalog: accordion, switch, search, table, button, tabs, badge, pill, avatar, skeleton, icon/loader, button group, dropdown, list box, tags, chips, calendar, date field/picker, alert, checkbox, card, alert dialog, drawer, modal, popover, toast, tooltip, and select.
- Added the lazy `/ui-kit` visual integration route and required shared-component reuse in agent guidance.
- Evidence: typecheck and lint passed; 6 unit/component tests passed; the production build passed with 14 JavaScript chunks; the lazy UI-kit chunk measured 446.09 KiB raw / 137.52 KiB gzip; bundle budgets passed; and the Chromium catalog interaction test passed. Full-page visual review found no clipping, overlap, hierarchy, or legibility defects.

*

## 2026-10-17 — M1 IAM, onboarding, and vendor administration completed

- Status: Complete
- Identity: first-party Argon2id credentials, short-lived RS256 access tokens and JWKS, rotating hashed refresh sessions, revocation, throttling, email verification, invitations, SMTP outbox, and generic authentication failures.
- Tenant security: authenticated-session tenant derivation, explicit custom-role capabilities, immutable owner authority, server-side authorization, and append-only privileged audit evidence. The approved matrix is recorded in `docs/m1-permission-matrix.md`.
- Onboarding: individual and company paths, repeatable directors and ownership validation, encrypted identity fields, versioned submissions/corrections, approval gating, and approved/rejected/under-review experiences.
- Documents and review: private R2 quarantine, signature/MIME/size validation, ClamAV fail-closed scanning, clean-object promotion, short-lived access, and signed idempotent Admin review APIs.
- Contracts and UI: OpenAPI and frontend types regenerated; API-backed session bootstrap, single-flight refresh, permission-aware shell, staff/role/profile administration, and responsive M1 routes implemented from supplied screen references.
- Verification: backend Prisma validation/generation, typecheck, lint, architecture boundaries (76 TypeScript files), 13 unit/security tests, 1 API e2e test, production build, and dependency/format gates passed. Frontend governance/contract checks, typecheck, lint, 6 unit/component tests, production build, bundle budget, formatting, and 3 Chromium journeys passed.
- External design evidence: supplied PNG references were used. Direct enumeration/export of the Figma yellow-background section remains unavailable until the Figma connector is reauthenticated; no temporary Figma URL is stored in source.

## 2026-10-17 — M2 people completed

- Status: Complete
- Customers: tenant-scoped customer creation, search, list views, contact details, and order-count-ready records.
- Dispatchers: full profile registration, conditional motorized-vehicle validation, guarantor and revenue-share data, summary statistics, searchable table, availability controls, and detail/edit experiences.
- Review lifecycle: immutable dispatcher revisions, draft/submitted/approved/rejected states, correction-field feedback, approved-profile continuity during edits, replacement document uploads, and resubmission.
- Documents and administration: private quarantine uploads reuse the M1 signature/MIME/size, malware scan, clean-object promotion, and audit controls; signed internal Admin review queue/detail/document/decision endpoints are ready for the later Admin roadmap.
- Contracts and UI: Prisma migration, OpenAPI snapshot and generated frontend types updated; permission-aware routes use the reusable Pepsa UI component kit throughout.
- Verification: backend schema validation/generation, typecheck, lint, architecture boundaries (85 TypeScript files), 15 unit/security tests, API e2e, production build, and formatting passed. Frontend governance/contract checks, typecheck, lint, 7 unit/component tests, production build, bundle budgets, and formatting passed.
- Design evidence: the linked yellow Figma section was inventoried and stored under `vendor/design-references/figma`; its available frames do not include M2 People screens, so M2 follows the established vendor visual system. Figma export rate limits allowed the section overview and two exact screen exports; remaining nodes are recorded in the local manifest for later export.

## 2026-10-17 — M3 orders and pricing completed

- Status: Complete.
- Orders: tenant-scoped vendor-direct draft/ready/cancel workflows and paid customer-link pending-payment/pending-acceptance/accept/cancel workflows, with immutable public references, concurrency checks, idempotency, and audit evidence.
- Pricing: versioned price-per-kilometre settings, exactly four continuous metre-based discount tiers, Google server-side geocoding/road distance, same-city enforcement, immutable 15-minute quote snapshots, and exact minor-unit/basis-point calculations.
- Checkout: pre-provisioned Pepsa Payment user mapping through the signed Admin boundary, one-time DVA checkout sessions, public payment status, and timestamped HMAC callbacks with durable replay protection.
- Contracts and UI: Prisma migration, OpenAPI snapshot and generated frontend schema updated; Open Dispatch vendor/customer tabs, Payment Settings, and the public `/order/:slug` quote/checkout journey use the shared component kit.
- Verification: all five migrations applied to a clean temporary PostgreSQL 16 database, which was then removed. Backend governance, Prisma validation/generation, typecheck, lint, architecture boundaries (105 TypeScript files), 20 unit/security tests, API e2e, production build, and formatting passed. Frontend governance/contract checks, typecheck, lint, 7 unit/component tests, production build, bundle budgets, and formatting passed.
- Design evidence: every pending yellow-section export was retried using the authenticated Figma account. Figma returned the Starter-plan MCP call limit; the local manifest records the retry and all pending node IDs, and no substitute images were fabricated.

## 2026-10-18 — M4 batching and manifests completed

- Status: Complete.
- Decisions: ADR 0009 resolves unified manifest storage with separate inbound/outbound views, immutable preview-based finalization and revisioning, the receiving-vendor lifecycle, shared action history, eligibility, and on-demand versioned waybill PDFs.
- Backend: tenant-scoped tracking validation, exclusive immutable batches, manifest revisions, optimistic/idempotent response and transit actions, approved-vendor directory, append-only shared/audit history, PDF waybills, Prisma migration, and OpenAPI endpoints implemented.
- Frontend: responsive Batching and Travel Manifest workflows, Operations Assigned Manifest actions, preview/confirmation, filters and status summaries, revision resend, shared history, permission-aware navigation, and waybill downloads implemented from the supplied Pepsa screen references and shared UI kit.
- Verification: all six migrations applied successfully to a clean temporary PostgreSQL database, which was removed. Backend governance, Prisma validation/generation, typecheck, lint, architecture boundaries (117 TypeScript files), 22 unit/security tests, API e2e, production build, and formatting passed. Frontend governance/contract checks, typecheck, lint, 8 unit/component tests, production build, bundle budgets (32 JavaScript chunks; entry 358.69 KiB raw / 113.40 KiB gzip; UI 436.09 KiB raw / 134.35 KiB gzip), formatting, and the Chromium M4 batch-validation journey passed.

## 2026-10-18 — M5 dispatch implemented; final verification pending

- Status: In Progress.
- Decisions: ADR 0010 resolves asynchronous own-fleet/general-pool assignment, lifecycle, exclusive membership, optimized route snapshots, payout overrides, signed tracking events, and the M5/M6 finance boundary.
- Backend: tenant-scoped dispatch aggregates, preview/finalization, approved fleet eligibility, general-pool funding reservation, immutable payout/fee/route snapshots, optimistic transitions, provider event inbox, append-only history and location points, operational summaries, local provider-neutral adapters, Prisma migration, and OpenAPI endpoints implemented.
- Frontend: Runway Manifest, Customer Orders conversion, Open Dispatch general-pool flow, payout preview/override, Dispatch Activities, Delivery Report, live OpenStreetMap location fallback, status history, generated request types, and a mocked Chromium dispatch journey implemented.
- Evidence: all seven migrations applied to a clean temporary PostgreSQL database, which was removed. Backend `pnpm verify` passed with 130 boundary-checked TypeScript files, 24 unit/security tests, API e2e, build, and formatting. Frontend contract generation/check, typecheck, lint, production build, bundle budget (32 JavaScript chunks; M5 chunks 11.49 KiB and 11.83 KiB raw), and the M5 Chromium journey passed.
- Remaining gate: the standard frontend unit suite is not green on this macOS 12 host using fallback Node 22; unchanged pre-M5 jsdom tests intermittently exceed their existing five-second timeout or fail to start a worker. The repository requires Node 24, whose macOS binary cannot execute on this host. Tests were not weakened, and M5 remains In Progress until `pnpm verify` passes in the supported Node 24 environment.

## 2026-10-19 — M5 dispatch completed

- Status: Complete.
- Final gate: the frontend `pnpm verify` suite passed under Node 24.19.0 without weakening tests or quality controls.
- Frontend evidence: governance and OpenAPI contract checks passed; typecheck and lint reported no errors; all 5 test files and 8 unit/component tests passed; the production build and bundle budget passed for 32 JavaScript chunks; formatting passed. The M5 Open Dispatch and Operations lazy chunks measured 11.49 KiB raw / 4.74 KiB gzip and 11.83 KiB raw / 4.59 KiB gzip.
- Combined evidence: backend `pnpm verify`, seven clean-database migrations, and the Chromium M5 dispatch journey had already passed. The dispatch state-machine, concurrency, contract, migration, frontend, and supported-runtime verification gates are satisfied.

## 2026-10-19 — M6 settlement and wallet completed

- Status: Complete.
- Decisions: ADR 0011 fixes Pepsa Pay as the monetary source of truth, keeps Vendor records operational and append-only, defines rider-completion and customer-checkout settlement triggers, prevents wallet overdraft, collects deferred Runway fees oldest-first, and keeps transaction PINs inside Vendor identity.
- Backend: approved-vendor Pay provisioning, settlement projections and credits, partial/full cash-out, wallet/SVA and statement access, bank enquiry and two-stage transfers, live VAS catalogs/validation/purchases, outstanding fee receivables, reconciliation, purpose-bound single-use PIN challenges, audit evidence, permissions, migration, and OpenAPI contract implemented.
- Frontend: responsive Settlement Ledger and Wallet views, earnings and debt summaries, transaction history, cash-out, Add Funds details, internal/external transfer flows, live airtime/data/electricity/cable catalogs, PIN enrollment/reset/challenges, permission-aware navigation, and retry-safe status presentation implemented.
- Pepsa Pay: idempotent partner settlement credit by external user and immutable source reference added; conflicting replays fail while identical replays return the original result. Existing balance, withdrawal, transfer, deposit, and VAS authorities remain unchanged.
- Verification: all Vendor and Pepsa Pay migrations applied to clean temporary PostgreSQL databases and removed. Vendor backend and frontend verification suites passed, including 24 backend unit/security tests, API e2e, 8 frontend unit/component tests, production builds, bundle/format/contract gates, and the mocked Chromium Account journey. Pepsa Pay lint, 153 tests, and production build passed.

## 2026-10-19 — M7 dashboard, reporting, search, and notifications completed

- Status: Complete.
- Decisions: ADR 0012 defines the operational dashboard, 60-second aggregate freshness, permission-filtered global search, operations and settlement CSV reports, per-user notifications, 30-second polling, and transactional email boundaries.
- Backend: tenant-scoped dashboard aggregates, bounded reporting ranges, paginated JSON reports, formula-safe UTF-8 CSV exports, permission-filtered grouped search, persistent idempotent notifications, permission-derived recipients, and atomically claimed email jobs with bounded retries and terminal failure state implemented. Manifest, paid-order, dispatch, cash-out, and transfer events publish actionable or financial notifications.
- Frontend: responsive dashboard cards, status summary, recent deliveries, date controls, one-minute refresh, debounced global search, notification badge/popover/read actions, 30-second polling, and operations/settlement CSV controls implemented from the supplied Pepsa references and shared UI kit.
- Contracts and persistence: Prisma notification/outbox migration, OpenAPI snapshot, and generated frontend types updated. All nine Vendor migrations applied successfully to a clean disposable PostgreSQL database, which was then removed. Vitest now uses its recommended single-worker VM pool to avoid the documented macOS jsdom startup timeouts without changing test assertions or time limits.
- Verification: backend `pnpm verify` passed with Prisma validation/generation, typecheck, lint, architecture boundaries across 149 TypeScript files, 27 unit/security tests, API e2e, production build, and formatting. Frontend verification passed with governance/contract checks, typecheck, lint, 9 unit/component tests, production build, bundle budget across 29 JavaScript chunks, formatting, and the mocked Chromium M7 journey. The main entry measured 433.19 KiB raw / 137.76 KiB gzip and the dashboard chunk 6.13 KiB raw / 2.45 KiB gzip.

## 2026-10-19 — M7 supplied-screen alignment completed

- Dashboard: rebuilt to match the supplied red-header/left-navigation composition with the insurance banner, four current-activity cards, Dispatch/Order/Revenue views, six-period trend, online dispatchers, top performers, dispatch preview, and overall information.
- Operations: Dispatch Activities and Delivery Report now follow the supplied summary-card, status-radio, table-column, status-color, tracking-action, and report-export hierarchy.
- Backend: dashboard aggregates now expose activity, dispatch/order/revenue overview, trend, online-dispatcher, performer, and overall-information data. Dispatch listing accepts tenant-scoped lifecycle filters and summary supports active/history modes with status counts and earnings.
- Verification: backend `pnpm verify` passed with 27 tests and API e2e. Frontend contract generation/check, typecheck, lint, targeted dashboard test, production build, 30-chunk bundle budget, formatting, and the mocked Chromium M7 journey passed. Two unchanged M2/M4 jsdom tests intermittently exceeded their existing five-second timeouts in the combined suite on this host; assertions and time limits were not weakened.

## 2026-10-20 — Yellow-section UI and real-data alignment

- Reconciled the 43 usable yellow-section PNG references while continuing to exclude the section overview; refreshed the application shell, profile menu, logout confirmation, compact typography, responsive spacing, account review, thank-you, profile, dashboard, operations, account, onboarding, and authentication presentation.
- Added governed password/PIN, file upload, status filter, stat card, and empty-state primitives to the shared UI kit. Migrated touched password, PIN, upload, date, select, filter, menu, and confirmation interactions to shared components and documented them in the UI catalog.
- Removed the unsupported hardcoded dashboard promotion and non-functional time-period labels. Dashboard and operations content remains API-backed and now presents explicit empty states rather than fabricated production records.
- Backend/OpenAPI/Prisma review found no missing contract required by the implemented redesign, so no speculative endpoint or database change was introduced. Existing tenant-scoped reporting and financial contracts remain authoritative.
- Verification: the full frontend `pnpm verify` passed under Node 24.19.0, including governance and OpenAPI checks, typecheck, lint, 10 unit/component tests, production build, 35-chunk bundle budget, and formatting.

## 2026-10-20 — Order intake and Open Dispatch finalization

- Added one quote-first, on-behalf-of-customer order workflow shared by Customer Orders, Runway Manifest, and Open Dispatch. Saved customers can be linked, pricing snapshots are consumed tenant-safely, and created vendor orders are advanced to dispatch-ready state.
- Added price review and irreversible publication of an unpaired Runway manifest to General Pool. General-pool funding is non-deferred and debited before provider submission; the existing dispatch aggregate is converted once and audited.
- Dispatcher intake now records an 11-digit NIN instead of an arbitrary identity type, and create/edit state fields use the canonical Nigerian state selector.
- Fixed role creation and staff invitation form resets by retaining the form element before asynchronous requests.
- Refreshed OpenAPI and generated frontend types. Backend/frontend typecheck, lint, contract, formatting, 9 focused backend tests, and 10 frontend tests passed. The full backend unit run had 27 passing tests and one unrelated IAM signing-authority test timeout on this host.

## 2026-10-20 — Multi-step parcel intake aligned with BAS

- Replaced free-text parcel category with the six canonical BAS reference categories and their descriptions. Added compulsory persisted handling with the six BAS handling modes and server-side enum validation.
- Rebuilt the shared vendor order form as Contacts, Route, Parcel, and Review & Price steps. Runway, Open Dispatch, and Customer Orders inherit the same flow; the public order form also uses the governed category and handling selects.
- Added the order-handling Prisma migration, regenerated OpenAPI/frontend types, and passed Prisma validation, backend typecheck, 5 focused order/pricing tests, frontend typecheck/lint, and all 10 frontend tests.

## 2026-10-20 — Local address-pricing availability

- Added deterministic development/test geocoding and route estimates when `GOOGLE_MAPS_API_KEY` is absent, restoring local quote and order flows without external credentials.
- Production remains fail-closed and requires Google Maps. Local results are explicitly identified with `local:` place IDs and are not presented as production routing evidence.
- Backend typecheck/lint and five focused maps/pricing tests passed.

## 2026-10-20 — BAS last-mile order parity

- Google geocoding now accepts the first valid resolved candidate instead of rejecting otherwise valid addresses when multiple candidates are returned.
- Last-mile orders now require and persist the BAS fulfilment payload: mobility method, category, handling, declared value, dimensions, weight, quantity, description, and package-inspection consent.
- Applied both parcel migrations to the local `pepsa_vendor` database, refreshed OpenAPI/frontend types, and passed seven focused backend tests plus all ten frontend tests.

## 2026-10-20 — Order and Open Dispatch pricing boundary correction

- Removed mobility selection and quote requests from the shared vendor-assisted order form. The final step now reviews and creates the unpriced order directly.
- Added mobility selection to General Pool creation and Runway-to-Open conversion, where the Open Dispatch price is requested and confirmed.
- The conversion copy preserves the irreversible publication rule and identifies the main-wallet debit before submission.

## 2026-10-20 — Customer order table dispatch actions

- Added lifecycle-aware actions to the Customer Orders table. Paid customer-link orders must still be accepted first; dispatch-ready orders can then be assigned to a Runway manifest or sent to Open Dispatch.
- Both actions deep-link the selected order into the relevant assignment flow. Open Dispatch still requires mobility selection, pricing, and main-wallet debit before publication.

## 2026-10-22 — Runway manifest guided assignment flow

- Refined Runway creation into a visible shipment, rider, pickup-review, payment-confirmation, and success sequence based on the supplied Pepsa references while retaining ADR 0010 lifecycle rules.
- Reuses authoritative pickup, delivery, receiver, parcel category, and handling data from the chosen order instead of collecting duplicate fields. Batch routes continue to use the immutable optimized stop preview.
- Added rider search, vehicle details, clearer availability actions, selected-rider confirmation, main-wallet funding context, and a richer success summary. Existing general-pool pricing and irreversible Runway-to-Open conversion remain unchanged.

## 2026-10-22 — Compact customer-order action menus

- Replaced multiple Customer Orders row buttons with one compact, keyboard-accessible Actions dropdown.
- Paid orders awaiting acceptance expose color-coded Approve and Reject actions. Accepted or otherwise dispatch-ready orders expose the two-word actions Assign Runway, Add Batch, and Open Dispatch.
- Add Batch opens the governed batching workflow with the selected order reference prefilled; assignment actions continue to deep-link into their corresponding dispatch flows.

## 2026-10-22 — M7 documentation audit and responsive search completion

- Re-audited M7 against ADR 0012, the product reference PDF, and the saved dashboard, delivery-report, and notification treatments. The existing live dashboard, report exports, search grouping, notification popover, and polling intervals remain aligned.
- Replaced the inert mobile search glyph with an accessible mobile global-search control using the same debounced, permission-filtered results and deep links as desktop.
- Refreshed the OpenAPI snapshot/generated schema and updated the M7 browser fixture for the current date-range and growth contract. Frontend `pnpm verify` passed with governance, contract, typecheck, lint, 10 tests, production build, bundle budget, and formatting; the isolated Chromium M7 journey also passed.

## 2026-10-22 — Discoverable public customer-order link

- Added the vendor's public order URL to the dashboard and Settings → Profile through one responsive shared card.
- Added clipboard copy, native device sharing with clipboard fallback, WhatsApp sharing, a locally rendered QR code, and public-page preview actions.
- Sharing remains disabled with explicit remediation when vendor approval, the four-tier pricing configuration, or Pepsa Payment provisioning is incomplete.
- Regenerated the frontend OpenAPI contract and added component coverage for both ready and blocked states. Frontend `pnpm verify` passed with governance, contract, typecheck, lint, 12 tests, production build, 40-chunk bundle budget, and formatting.

## 2026-10-25 — Account visibility and BVN-free onboarding

- Replaced the conflicting dark wallet-card treatment with semantic panel, foreground and muted tokens so balances and SVA details remain visible.
- Removed BVN inputs from individual and director onboarding forms and refreshed the generated Vendor API contract.
- Replaced the under-review X-circle with a green check-circle while retaining the distinct correction-required state.
- Frontend typecheck and all 14 tests passed. The Admin Vendor review screens also passed typecheck and all 5 component tests.
