# AGENTS.md — Standing rules for AI coding agents (read first, every session)

Project: **SWAROOP** by Team PRAHAAR. Tagline: "Apni kahaani se, apni pehchaan tak." Core message: "Resume nahi, hunar hai."
A voice-first, assisted-access platform that helps informal workers (electrician, plumber, tailor, AC repair, home baker, etc.)
turn their skills and work evidence into a portable profile, earn customer trust, and find work.

Repository: https://github.com/Siddhant-git-2909/Swaroop-HackShift (owner `Siddhant-git-2909`; collaborators `shrajal01`,
`Shrey280602`, `utkarshGit635`).

Document precedence on any conflict: `PROJECT_STRUCTURE.md` (folders, ownership, root scripts, Git rules)
> `ARCHITECTURE.md` (product behaviour, data model, API, stages, gates) > this file.

## 1. Start of every session
1. Inspect the repository first: files, existing code, `git status`, branches, remotes, config. Read-only Git only.
2. Read `PROJECT_STRUCTURE.md`, `ARCHITECTURE.md`, and, once they exist, `docs/module-ownership.md`, `docs/api-contracts.md`,
   `docs/database-schema.md`, `docs/progress.md`.
3. Preserve existing useful work. Never overwrite or delete existing files blindly. Extend what is there.
4. Reuse existing modules, components, models and contracts. Never duplicate a module or create a parallel architecture.

## 2. Git rules (absolute)
- Allowed (read-only): `git status`, `diff`, `log`, `show`, `blame`, `ls-files`, `branch --list`, `remote -v`.
- Forbidden: `add`, `commit`, `push`, `pull`, `fetch`, `checkout`, `switch`, branch creation, `merge`, `rebase`, `reset`, `stash`,
  `clean`, force-push, changing remotes or GitHub settings. The repository owner and each teammate run Git themselves under their
  own GitHub account. Never fabricate authorship.
- Never claim anything was committed, pushed, merged or deployed unless it actually happened.
- Never write real secrets to any file. `.env` is never created by you with real values; `.env.example` has placeholders only.

## 3. How to work during the initial MVP build
1. Work autonomously. Do not stop after planning and do not ask permission between stages.
2. Follow `ARCHITECTURE.md` section 18 (Stages 0-8, then optional Tier 2 in Stage 9) strictly in order. Each stage has a GATE command.
   Implement everything the stage lists, run the gate, fix the real root cause until it passes, append a short entry to
   `docs/progress.md`, then start the next stage.
3. Ambiguity: choose the simplest option that satisfies the spec, add one line to `docs/DECISIONS.md` (what, why), continue.
4. Ask the user a question only if a REQUIRED secret is missing and no mock fallback exists (should never happen: every AI provider
   has a mock fallback).
5. Never mark a stage passed without running its gate. Never leave a stage half-done. Do not rewrite working code to fix a failure.
6. Keep files small and focused (aim under 300 lines). No dead code, no TODO stubs unless the spec says "stub".
7. If context or time runs short, finish the current stage cleanly, record exactly where you stopped in `docs/progress.md`, and
   report. Do not start Tier 2 (Stage 9) unless Stage 8 has fully passed.

## 4. Rules for later sessions (a teammate's own agent)
1. Inspect the repo and docs first (section 1).
2. Implement only the assigned feature/module unless a shared-contract change is truly necessary.
3. Never edit another member's module except through its public `__init__.py` / `index.ts` interface. Shared files change only
   through a pull request reviewed by the affected owner (list in `PROJECT_STRUCTURE.md` section 5).
4. Avoid touching unrelated files. Preserve backward compatibility. Never overwrite teammates' work.
5. Document every change to shared APIs, schemas and interfaces in the same change (`docs/api-contracts.md`,
   `docs/database-schema.md`). Add a NEW numbered migration; never edit a merged migration.
6. Run the relevant tests and report failures honestly, with exact commands and output summaries.
7. Update `docs/progress.md`. Never commit or push; the teammate does that on their own branch.

## 5. Non-negotiable product rules (never "improve" these away)
- **Reality labels.** Every feature is BUILT, SIMULATED or ROADMAP. Simulated features (OTP login, identity check, masked calling,
  wallet/escrow money, micro-insurance, TDS, IVR, GPS/location demo toggle, SOS) show a visible "SIMULATED" badge in the UI and are
  listed in `docs/STATUS.md` and `docs/integrations-and-limitations.md`. Never describe a simulated feature as real anywhere
  (code comments, UI copy, docs, seed data). Seeded data is labelled demo data.
- **Trust Ladder.** L1 Self-declared, L2 Evidence added, L3 Independently verified (a human facilitator/admin recorded an
  assessment). Customer-confirmed is an extra marker between L2 and L3 and does not change the three levels. AI output (profile
  extraction, photo check, arbitrator) can NEVER set or imply L3 and never uses the word "verified". Use "AI-assisted check" for AI
  output. L3 is set only through the database function in `ARCHITECTURE.md` section 6. Identity status is separate from skill and
  work-history status. Never call a worker crime-free, safe, guaranteed or "verified by AI". A photo alone does not prove competence.
- **AI never invents.** Voice/text-to-profile fills only what the worker actually said. Unstated fields are null. No unstated
  qualifications, certificates or years. The worker reviews and confirms every field before anything is saved. A failed or
  unavailable speech-to-text call must NEVER be replaced by a made-up transcript (see `ARCHITECTURE.md` section 8).
- **Privacy.** Phone numbers are never returned to anyone except their owner, never logged, never in public profiles, QR codes,
  search results or booking responses to the other party. No identity documents or ID numbers are collected. Raw voice recordings
  are not stored. Consent (including AI processing) is recorded before a profile is saved or any audio/photo is sent to an AI vendor.
  Private evidence is never public; the worker chooses which evidence is public.
- **Money (Tier 2 only).** All amounts are integer paise. All money movement happens inside database functions/triggers in one
  transaction. Wallet money is demo credit, never real money.
- **No promises.** No loan, income, insurance-payout or government-scheme-eligibility promises anywhere in UI text.
- **AI is advisory.** The dispute arbitrator and the vision check only suggest. A human makes the final decision.

## 6. Security requirements
Server-side validation on every endpoint; role-based authorisation on every route (worker, customer, facilitator, admin) and
ownership checks on every object; hashed passwords (argon2 or bcrypt) for staff logins; short-lived signed JWTs; rate limiting on
OTP, login and upload endpoints; safe upload validation (type allow-list, size limit, magic-byte sniffing, re-encode images to strip
EXIF/GPS); CORS limited to configured origins; environment-based configuration; no secrets in source control; audit log entries
for trust-related changes; access-control tests for every protected route group. In `APP_ENV=production` the app refuses to start
with the default `JWT_SECRET` or default staff password.

## 7. Engineering rules
- Server: Python 3.11, FastAPI, psycopg 3 (raw SQL, no ORM), Pydantic v2, pytest, ruff. PostgreSQL 16 with PL/pgSQL (NOT Oracle
  PL/SQL). Plain Postgres, no PostGIS: use the haversine SQL function from the spec.
- Client: React 18, Vite, TypeScript (strict), Tailwind, react-router, Vitest. Mobile-first: design at 360px width first.
- Every AI call goes through `server/app/shared/ai/` provider interfaces with `AI_MODE=mock|live`. Live failures degrade as defined
  in `ARCHITECTURE.md` section 8 and set `degraded=true`; the UI shows a small "demo fallback" note. The demo must never crash
  because an API timed out.
- Every endpoint: validated input, proper HTTP codes (400/401/403/404/409/422/429), JSON errors
  `{"error": {"code": "...", "message": "..."}}`. API prefix `/api/v1`. FastAPI OpenAPI at `/docs` stays accurate.
- Style: snake_case in Python, camelCase in TypeScript values, PascalCase for React components, kebab-case folder names. One
  responsibility per file. Type hints everywhere in Python. No `any` in TypeScript without a comment.
- Hindi/English: all UI strings live in the i18n dictionary (default Hindi, English toggle). Large touch targets (48px minimum).

## 8. Commands (root `package.json`, work on Windows PowerShell/cmd; no `make`, no bash-only syntax)
`npm run setup`, `db:up`, `db:init`, `db:seed`, `demo:reset`, `dev`, `dev:server`, `dev:client`, `api:health`, `test`,
`test:server`, `test:client`, `typecheck`, `lint`, `build`, `build:client`, `smoke`. Details: `PROJECT_STRUCTURE.md` section 6.

## 9. Honest reporting
Never claim a check passed unless it ran and passed. If a service (Docker, Postgres, network, API keys) is unavailable, say so and
explain exactly how the owner can finish that check.
