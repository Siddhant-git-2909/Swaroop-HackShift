# PROJECT_STRUCTURE.md — SWAROOP repository layout (authoritative)

Repo: https://github.com/Siddhant-git-2909/Swaroop-HackShift | Team PRAHAAR
Tagline: "Apni kahaani se, apni pehchaan tak." | Core message: "Resume nahi, hunar hai."

This file defines FOLDERS, module boundaries, ownership, root commands and Git rules. On any conflict it wins over `ARCHITECTURE.md` and
`AGENTS.md`. Stack: FastAPI + PostgreSQL on the server, React + Vite + TypeScript + Tailwind on the client (see `ARCHITECTURE.md` section 2).

## 1. Before creating anything
Inspect the existing repository first: files, branches, remotes, `git status`, existing config and code (read-only Git). Preserve existing work and
never overwrite it. If a folder below already exists, extend it. If the repo already uses another stack, keep it only if there is a compelling reason,
record the decision in `docs/DECISIONS.md`, and adapt the module convention to it. Create only files that serve a concrete purpose; no empty placeholder
folders. After implementation, update `docs/architecture.md` with the ACTUAL final structure if it differs.

## 2. Folder tree
```text
Swaroop-HackShift/
├── client/                         # React + Vite + TypeScript + Tailwind (PWA)
│   ├── public/                     # manifest.webmanifest, icons
│   └── src/
│       ├── app/                    # app shell, providers, router, i18n (hi/en), route guards
│       ├── components/             # shared UI: Button, MicButton, Badge (SIMULATED), StatusChip, Card...
│       ├── features/               # each folder: components/, api.ts, types.ts, index.ts (public interface)
│       │   ├── auth/               # OTP login (SIMULATED badge), staff login, role guards
│       │   ├── worker-onboarding/  # consent, voice/text draft, review, confirm, read-back
│       │   ├── skill-passport/     # own passport, public passport /w/:slug, QR, privacy toggles
│       │   ├── evidence/           # gallery, camera upload, source labels, status chips
│       │   ├── trust/              # Trust Ladder card, claim statuses, match explanation parts, reviews display
│       │   ├── customer-discovery/ # search, filters, match breakdown, worker cards
│       │   ├── bookings/           # request, status timeline, completion
│       │   ├── quotations/         # calculator, itemised quote, approved changes
│       │   ├── facilitator/        # assisted onboarding, evidence queue, human assessment
│       │   ├── dashboard/          # worker, customer, organization/admin dashboards
│       │   └── (tier 2) safety-disputes/, payments/, mentors-ivr/
│       ├── services/               # API client, auth storage, media recorder (30 s cap), image compression
│       ├── hooks/
│       ├── types/                  # TypeScript types mirroring server schemas
│       └── utils/
├── server/                         # FastAPI backend (modular monolith)
│   ├── app/
│   │   ├── main.py                 # app factory, router registration (/api/v1)
│   │   ├── config/                 # settings, env loading, startup guard, platform_config defaults
│   │   ├── middleware/             # auth + role guards, error handler, rate limiting, upload validation
│   │   ├── shared/                 # ai/ (providers + mock), storage.py, privacy.py, audit.py, pagination.py, db.py
│   │   └── modules/                # one folder per feature module (section 3)
│   │       ├── auth/
│   │       ├── workers/            # profiles, voice/text draft, confirm, read-back, skills + areas reference
│   │       ├── passports/          # public Skill Passport, share link, privacy-controlled fields
│   │       ├── evidence/           # uploads, AI-assisted check, review queue
│   │       ├── trust/              # claims, Trust Ladder, human assessment, customer-confirm
│   │       ├── matching/           # explainable matching rules and breakdown
│   │       ├── customers/          # customer profiles, discovery search endpoint (calls matching)
│   │       ├── bookings/           # requests, lifecycle state machine
│   │       ├── quotations/         # calculator, itemised quotes, approved changes
│   │       ├── reviews/            # booking-linked reviews, eligibility
│   │       ├── organizations/      # facilitator + admin routes, dashboards, audit viewer
│   │       └── (tier 2) payments/, safety/, disputes/
│   ├── scripts/                    # init_db.py, demo_reset.py, smoke_test.py, health_check.py
│   ├── requirements.txt
│   ├── pytest.ini                  # registers markers, --strict-markers
│   └── Dockerfile                  # includes ffmpeg
├── db/
│   ├── migrations/                 # numbered .sql: schema, functions, triggers (never edit a merged one)
│   └── seed/                       # demo seed data (fictional, labelled)
├── tests/                          # cross-module integration + end-to-end tests
├── docs/
│   ├── architecture.md  module-ownership.md  api-contracts.md  database-schema.md
│   ├── github-workflow.md  teammate-prompts.md  local-setup.md  demo-guide.md
│   ├── testing-guide.md  security-and-privacy.md  integrations-and-limitations.md
│   └── STATUS.md  DECISIONS.md  progress.md
├── deploy/                         # AWS.md, nginx.conf
├── tools/py.mjs                    # runs the venv Python for the current OS (Windows/macOS/Linux)
├── .github/
│   ├── pull_request_template.md
│   └── workflows/ci.yml            # server tests (Postgres service) + client typecheck/test/build
├── AGENTS.md  ARCHITECTURE.md  PROJECT_STRUCTURE.md  README.md
├── docker-compose.yml              # PostgreSQL (+ optional api/web)
├── .env.example                    # placeholders only
├── .gitignore                      # node_modules, server/.venv, .env, uploads, dist, __pycache__
└── package.json                    # root scripts (Windows-safe)
```

## 3. Module convention
Server: every folder in `server/app/modules/` has the same shape.
```text
modules/<name>/
├── router.py       # HTTP endpoints only, no business logic
├── service.py      # business logic
├── repository.py   # the ONLY file in this module that touches the database
├── schemas.py      # Pydantic request/response models = the module's contract
├── __init__.py     # public interface: the only things other modules may import
└── tests/          # unit tests (use pytest markers from ARCHITECTURE.md section 17)
```
Rules: other modules import only from `__init__.py`; no direct DB access from unrelated modules; no circular imports; no duplicated business logic;
files under about 300 lines. Money logic lives in database functions/triggers and is called only through `payments`. Client: each feature has
`components/`, `api.ts`, `types.ts`, `index.ts`; features import each other only via `index.ts`.

## 4. Mapping the spec to modules
| Spec item (`ARCHITECTURE.md`) | Module |
|---|---|
| OTP and staff login, JWT, roles | `auth` |
| voice/text draft, confirm, read-back, skills and areas reference, facilitator assisted onboarding logic | `workers` |
| public passport, QR/share link, privacy fields | `passports` |
| evidence upload, AI-assisted check, review queue | `evidence` |
| claims, Trust Ladder, human assessment, customer-confirm, identity check (T2), guarantor (T2) | `trust` |
| matching score and breakdown | `matching` |
| customer profile, discovery search endpoint | `customers` |
| bookings and state machine, check-in (T2) | `bookings` |
| calculator, itemised quotes, approved changes | `quotations` |
| reviews | `reviews` |
| `/facilitator/*`, `/admin/*`, dashboards, audit viewer, mentors (T2), revenue (T2) | `organizations` |
| wallet, escrow, fees, ledger (T2) | `payments` |
| SOS, pings, masked call, reports (T2) | `safety` |
| disputes, AI arbitrator (T2) | `disputes` |

## 5. Ownership (fill GitHub handles in `docs/module-ownership.md`; no file has two default owners)
| Member | Area | Owns |
|---|---|---|
| 1 Worker experience | Hindi/Hinglish onboarding, editable profiles, Skill Passport UI, evidence upload UI, accessibility, mobile | `client/src/features/worker-onboarding, skill-passport, evidence`; `server/app/modules/workers, passports` |
| 2 Backend and data | module structure, models and migrations, validation, auth, booking lifecycle, quotations, payments (T2), shared backend utilities | `server/app/modules/auth, bookings, quotations, payments`; `db/`; `server/app/config, middleware`; `docs/api-contracts.md, database-schema.md` |
| 3 Trust and safety | Trust Ladder and claims, evidence provenance and AI check, verification, review eligibility, matching rules and explainability, disputes, safety | `server/app/modules/trust, evidence, matching, reviews, safety, disputes`; `client/src/features/trust, safety-disputes` |
| 4 Customer experience and integration | discovery and filters, dashboards, booking and quotation UI integration, facilitator UI, end-to-end tests, demo and docs | `client/src/features/customer-discovery, bookings, quotations, facilitator, dashboard`; `server/app/modules/customers, organizations`; `tests/`; `docs/demo-guide.md, local-setup.md` |

Cross-owner notes: Member 1's evidence UI consumes the `evidence` API owned by Member 3. Member 4's discovery UI consumes the `matching` and `trust`
APIs and reuses Member 3's Trust Ladder components through `client/src/features/trust/index.ts`.

Shared files (change only through a PR that the affected owner reviews): `server/app/main.py`, `server/app/shared/`, `server/app/config/`,
`server/app/middleware/`, `db/migrations/`, `client/src/app/`, `client/src/components/`, `client/src/services/`, `client/src/types/`,
`docs/api-contracts.md`, `docs/database-schema.md`, `AGENTS.md`, `.env.example`, `docker-compose.yml`, `package.json`, `.github/`.

Contract-change process: open a PR (or issue) titled `contract: <what>`, update `docs/api-contracts.md` and `docs/database-schema.md` in the SAME PR,
keep it backward compatible where practical, tag the owner of every affected module, and add a NEW numbered migration (never edit a merged one).

## 6. Root `package.json` scripts (PowerShell/cmd safe, no bash-only syntax, no `make`)
| Script | What it does |
|---|---|
| `npm run setup` | create `server/.venv`, install `server/requirements.txt`, run `npm install` in `client/` |
| `npm run db:up` | `docker compose up -d db` |
| `npm run db:init` | apply `db/migrations/*.sql` in order (`server/scripts/init_db.py`) |
| `npm run db:seed` | load `db/seed/` demo data (only if `DEMO_MODE=true`) |
| `npm run demo:reset` | drop and rebuild a known demo state in seconds |
| `npm run dev` | db up + FastAPI (`uvicorn --reload`) + Vite (`--host`, with `/api` proxy) together |
| `npm run dev:server`, `npm run dev:client` | each alone |
| `npm run api:health` | `server/scripts/health_check.py` (in-process app, checks `/api/v1/health` and the DB) |
| `npm test`, `npm run test:server`, `npm run test:client` | pytest (server modules + `tests/`) and Vitest; extra args after `--` go to pytest (e.g. `-m "auth or access"`) |
| `npm run typecheck`, `npm run lint` | client TypeScript check and ESLint; ruff for Python |
| `npm run build`, `npm run build:client` | production build |
| `npm run smoke` | in-process end-to-end journey (`server/scripts/smoke_test.py`) against the real database |

`tools/py.mjs` picks `server/.venv/Scripts/python.exe` on Windows and `server/.venv/bin/python` elsewhere. Run `pytest` from the repo root;
`server/pytest.ini` sets test paths and Python path.

## 7. Product and security additions from the team brief (apply everywhere)
- Claim-specific statuses (identity, skill, work history) with source, date and scope shown; identity is separate from skill.
- Customer-confirmed marker after a completed booking; the three deck levels stay L1/L2/L3.
- Honest copy: never "crime-free", "guaranteed safe" or "verified by AI". A photo alone does not prove competence. Seeded data is labelled demo data.
- Security: server-side validation, role-based authorisation on every route, JWT handling, rate limiting on OTP/login/uploads, safe upload validation,
  privacy-conscious evidence handling, no phone numbers or ID documents on public profiles or QR codes, audit logs for trust changes, access-control tests.
- API docs: FastAPI OpenAPI at `/docs` stays accurate; `docs/api-contracts.md` mirrors it. CI runs server tests against a Postgres service and builds the client.
- Simulations stay simulations (OTP, identity check, location/SOS, masked calling, wallet/escrow, insurance, TDS, IVR).

## 8. Git rules for any AI agent
Read-only Git is allowed (`status`, `diff`, `log`, `show`, `branch --list`, `remote -v`). Never run `add`, `commit`, `push`, `pull`, `fetch`, `checkout`,
`switch`, branch creation, `merge`, `rebase`, `reset`, `stash`, `clean` or force-push, and never change GitHub settings. The repository owner and each
teammate control Git with their own GitHub account. Never claim anything was pushed or deployed unless it actually happened.
