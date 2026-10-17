# TEAMMATE_PROMPTS.md — one prompt per member (use AFTER the reviewed baseline is on `main`)

Module boundaries come from `PROJECT_STRUCTURE.md` section 5 and the real `docs/module-ownership.md`. Workflow comes from `docs/github-workflow.md`.
Replace the `<TASK>` placeholder with what you want done. Each prompt carries the same common rules.

Common rules (already inside every prompt): inspect the repository and read-only Git status first; read `AGENTS.md`, `docs/module-ownership.md` and
`docs/api-contracts.md`; work only on the assigned module unless a coordinated interface change is necessary; preserve existing functionality and never
overwrite teammates' changes; add tests and update docs (including `docs/progress.md`); report files changed and exact verification results; never run
`git add`, `commit`, `push`, `pull`, `fetch`, `checkout`, `switch`, `merge`, `rebase`, `reset` or `stash`. The teammate does Git with their own GitHub account
on their own branch.

---

## Member 1 — Worker Experience (branch `feat/worker-passport`)
```
You are working on SWAROOP (Team PRAHAAR) in the existing repository. First inspect the repository and read-only Git status. Read AGENTS.md,
PROJECT_STRUCTURE.md, docs/module-ownership.md and docs/api-contracts.md before editing anything.

Assignment: WORKER EXPERIENCE. You own client/src/features/worker-onboarding, skill-passport and evidence, and server/app/modules/workers and passports.
You consume the evidence API owned by Member 3 and must not edit server/app/modules/evidence.
Task: <TASK, for example: make Hindi/Hinglish voice and text onboarding more robust (30 s recorder countdown, clear errors), improve the editable draft,
area picker and consent step, polish the Skill Passport with privacy-controlled fields and the QR/share link, improve the evidence upload UI, and raise
accessibility and mobile quality at 360px>.

Rules: work only in your owned paths unless a shared-contract change is truly needed; if so keep it small and backward compatible and update
docs/api-contracts.md and docs/database-schema.md in the same change (new numbered migration, never edit a merged one). Reuse existing components, models
and contracts; do not duplicate modules or build a parallel architecture. Product rules: AI only extracts what the worker said, the worker confirms before
saving, a failed speech call never produces an invented transcript, AI never sets or implies Level 3, no "verified" wording for AI output, no phone numbers
or private evidence on public profiles, SIMULATED features keep their badges. Add or update tests (server markers such as extraction, fallback, privacy;
Vitest for the client), run npm test, npm run typecheck and npm run build, update docs/progress.md, and report the files changed and the exact
verification results honestly. Never run git add, commit, push, pull, fetch, checkout, switch, merge, rebase, reset or stash.
```

## Member 2 — Backend and Data (branch `feat/backend-bookings`)
```
You are working on SWAROOP (Team PRAHAAR) in the existing repository. First inspect the repository and read-only Git status. Read AGENTS.md,
PROJECT_STRUCTURE.md, docs/module-ownership.md and docs/api-contracts.md before editing anything.

Assignment: BACKEND AND DATA. You own server/app/modules/auth, bookings, quotations and payments, plus db/, server/app/config, server/app/middleware,
docs/api-contracts.md and docs/database-schema.md.
Task: <TASK, for example: harden the booking state machine, itemised quotations and customer-approved changes, validation, rate limiting, migrations and
OpenAPI accuracy>.

Rules: shared backend files (server/app/main.py, shared/, middleware/, db/migrations) affect everyone, so keep changes small, backward compatible and
documented; add a NEW numbered migration instead of editing a merged one; update the contract docs in the same change. Booking amounts change only through
fn_accept_quotation; money (Tier 2) moves only inside database functions and stays labelled SIMULATED. Do not touch other members' modules except through
their public __init__.py interfaces. Reuse existing code; do not duplicate modules. Add tests (state, quotation, access, and money if payments are touched), run
npm test, npm run db:init, npm run demo:reset and npm run smoke, update docs/progress.md, and report the files changed and the exact verification results
honestly. Never run git add, commit, push, pull, fetch, checkout, switch, merge, rebase, reset or stash.
```

## Member 3 — Trust and Safety (branch `feat/trust-evidence`)
```
You are working on SWAROOP (Team PRAHAAR) in the existing repository. First inspect the repository and read-only Git status. Read AGENTS.md,
PROJECT_STRUCTURE.md, docs/module-ownership.md and docs/api-contracts.md before editing anything.

Assignment: TRUST AND SAFETY. You own server/app/modules/trust, evidence, matching, reviews, safety and disputes, and client/src/features/trust and
safety-disputes. Member 1 owns the evidence UI and Member 4 the discovery UI; both consume your APIs and your trust components via
client/src/features/trust/index.ts, so keep those interfaces stable.
Task: <TASK, for example: refine the Trust Ladder and claim-specific statuses (identity, skill, work history), evidence provenance (source, date, scope),
customer-confirmed markers, review eligibility, explainable matching criteria, and the dispute and safety workflows>.

Rules: AI is advisory only. AI never sets or implies Level 3, never says "verified", never decides guilt or a payment dispute. Level 3 is set only through
fn_human_assess_claim by a human facilitator/admin with a scope and note, enforced in the database. Never claim a worker is crime-free or safe; an identity
check proves who someone is, not skill or conduct; a photo alone does not prove competence. Identity check, masked calling, location/SOS and insurance remain
clearly SIMULATED. Keep changes backward compatible, update docs/api-contracts.md and docs/database-schema.md for any shared change (new numbered migration),
and do not edit other members' modules except through their public interfaces. Add tests (trust, review, matching, access, privacy, and safety if touched), run
npm test and npm run smoke, update docs/progress.md, and report the files changed and the exact verification results honestly. Never run git add, commit, push,
pull, fetch, checkout, switch, merge, rebase, reset or stash.
```

## Member 4 — Customer Experience and Integration (branch `feat/customer-discovery`)
```
You are working on SWAROOP (Team PRAHAAR) in the existing repository. First inspect the repository and read-only Git status. Read AGENTS.md,
PROJECT_STRUCTURE.md, docs/module-ownership.md and docs/api-contracts.md before editing anything.

Assignment: CUSTOMER EXPERIENCE AND INTEGRATION. You own client/src/features/customer-discovery, bookings, quotations, facilitator and dashboard,
server/app/modules/customers and organizations, tests/, docs/demo-guide.md and docs/local-setup.md.
Task: <TASK, for example: improve worker search and filtering, the explainable match breakdown, customer and organisation dashboards, booking and quotation UI
integration, facilitator screens, end-to-end tests, and the demo journey and documentation>.

Rules: consume other modules only through their documented APIs and public interfaces (the matching rules belong to Member 3; if you need a change, propose it
in the PR with the update to docs/api-contracts.md and tag the owner). Show honest, specific claim statuses with source, date and scope (never "AI verified"),
keep SIMULATED badges, keep seeded data clearly labelled demo data. Make sure the whole demo journey (worker onboarding -> passport -> evidence -> discovery ->
booking -> quotation -> approved change -> completion -> review) still works end to end. Add tests, run npm test, npm run typecheck, npm run build,
npm run demo:reset and npm run smoke, update docs/progress.md, and report the files changed and the exact verification results honestly. Never run git add,
commit, push, pull, fetch, checkout, switch, merge, rebase, reset or stash.
```
