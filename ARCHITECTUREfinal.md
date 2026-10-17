# ARCHITECTURE.md — SWAROOP (Team PRAHAAR) — requirements spec v3

Tagline: "Apni kahaani se, apni pehchaan tak." | Core message: "Resume nahi, hunar hai." | Pitch line: Speak once. Get a profile. Open trusted work.

Folder layout, module boundaries, ownership, root scripts and Git rules live in `PROJECT_STRUCTURE.md` and win on any conflict.
Standing agent rules live in `AGENTS.md`. This file defines product behaviour, data, API, AI, trust, tests and build stages.

## 1. Mission, tiers and reality status
Informal workers (e.g. an electrician with 8 years of experience, no CV, cannot fill long English forms) are invisible to customers.
SWAROOP lets a worker speak in Hindi/Hinglish (or type), review a generated profile, add work evidence, climb a Trust Ladder, be found
and matched by customers, and complete bookings with itemised quotations and reviews.

**Tier 1 (core, must be complete and passing before anything else):** auth, worker onboarding, Skill Passport, evidence, Trust Ladder,
facilitator tools, customer discovery + explainable matching, bookings, quotations, reviews, dashboards, demo data, docs, CI.
**Tier 2 (optional simulations, built only in Stage 9 after Stage 8 fully passes):** wallet/escrow, safety (check-in, SOS, masked call,
reports, guarantor), disputes + AI arbitrator, mentor requests, IVR simulator, revenue panel.

| Area | Tier | Status |
|---|---|---|
| Web app (PWA): worker, customer, facilitator, admin flows | 1 | BUILT |
| Voice/text to profile (Sarvam speech + LLM, worker confirms) | 1 | BUILT (live with keys, mock without) |
| Evidence upload, claims, Trust Ladder, explainable matching | 1 | BUILT |
| Bookings, itemised quotations, approved changes, reviews | 1 | BUILT |
| Hindi/English toggle, shareable profile link + QR, quote calculator | 1 | BUILT |
| OTP login (fixed demo OTP, no SMS) | 1 | SIMULATED |
| Identity check button (no ID number collected) | 1 | SIMULATED |
| Wallet and escrow ledger | 2 | BUILT logic, money is SIMULATED demo credit |
| Micro-insurance fee, TDS | 2 | SIMULATED line items, no real policy; TDS off by default |
| Geofence check-in, SOS, masked call | 2 | SIMULATED (demo location toggle, stub call) |
| Disputes with AI suggestion (human decides), reports, guarantor, mentor requests | 2 | BUILT workflow |
| IVR flow (keypad 1 Hindi, 2 English, pick category) | 2 | SIMULATED, not a live call |
| Real IVR + missed-call callback, WhatsApp voice notes, real payments/UPI, real KYC/DigiLocker, SMS OTP, scheme discovery, more languages, B2B squads | - | ROADMAP, do not build |

## 2. Stack
- Server: Python 3.11, FastAPI (modular monolith), psycopg 3 (raw SQL), Pydantic v2, pytest, ruff. OpenAPI at `/docs`.
- DB: PostgreSQL 16 (docker), PL/pgSQL functions and triggers. No PostGIS, no ORM.
- Client: React 18 + Vite + TypeScript + Tailwind + react-router, installable PWA, mobile-first, Vitest.
- AI: Sarvam AI (speech-to-text, text-to-speech, chat) and Gemini (vision) behind provider interfaces + mock.
- Storage: `STORAGE_BACKEND=local|s3` abstraction (local default).
- Deploy: Docker + docker-compose; AWS EC2 + RDS + S3 guide in `deploy/AWS.md`.
- No microservices. (If the team ever switches the stack, sections 2, 5-8 and 18 are the only places to change.)

## 3. Environment (`.env.example` lists all, placeholders and safe defaults only)
```
APP_ENV=local                # local | production
DEMO_MODE=true               # enables simulated OTP login (worker/customer) and demo seed data, labelled SIMULATED in the UI
DEMO_OTP=123456
DEMO_STAFF_PASSWORD=change-me-demo   # password for seeded facilitator/admin, hashed on seed
DATABASE_URL=postgresql://swaroop:swaroop@localhost:5432/swaroop
TEST_DATABASE_URL=postgresql://swaroop:swaroop@localhost:5432/swaroop_test
JWT_SECRET=change-me
JWT_TTL_MINUTES=120
CORS_ORIGINS=http://localhost:5173
AI_MODE=mock                 # mock | live
SARVAM_API_KEY=
SARVAM_STT_MODEL=saaras:v3   # verify against docs, see section 8
SARVAM_STT_MODE=transcribe
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_LLM_MODEL=            # verify current chat model name in docs
GEMINI_API_KEY=
VISION_MODEL=                # verify current model name in Gemini docs
STORAGE_BACKEND=local        # local | s3
UPLOAD_DIR=server/uploads
S3_BUCKET=
AWS_REGION=ap-south-1
VITE_API_BASE=/api/v1        # relative, served through the Vite dev proxy so phones on the LAN or a tunnel work
VITE_DEMO_TOOLS=true
```
Tunable values live in table `platform_config`, not env: `vision_threshold=0.85`, `max_audio_seconds=30`, `max_image_px=1280`,
`booking_auto_expire_hours=72`; Tier 2 adds `platform_fee_bps=200`, `safety_fee_paise=500`, `tds_bps=0`, `geofence_radius_m=500`,
`auto_release_hours=48`.
Startup guard: if `APP_ENV=production` and `JWT_SECRET` or `DEMO_STAFF_PASSWORD` still has its default, the server refuses to start.

## 4. Roles, auth and demo accounts
Roles: `worker`, `customer`, `facilitator`, `admin`.
- Worker/customer: phone + OTP. SMS is ROADMAP, so the OTP is the fixed `DEMO_OTP`, accepted only when `DEMO_MODE=true`, with a
  visible SIMULATED badge on the login screen. Rate limited.
- Facilitator/admin: phone + password (`POST /auth/staff/login`), password hashed (argon2/bcrypt). Never accepts the demo OTP.
- JWT in an `Authorization: Bearer` header; role and user id in claims; short TTL.
Seed (only when `DEMO_MODE=true`, labelled demo data): worker `9000000001` (Ramesh, electrician, L2), worker `9000000002` (L1), worker
`9000000003` (L3, human assessed), customer `9100000001`, facilitator `9200000001`, admin `9300000001` (staff use `DEMO_STAFF_PASSWORD`).
These phone numbers are fictional.

## 5. Data model (Tier 1)
All ids are UUIDs. All timestamps UTC. Money columns (Tier 1 quotations, Tier 2 ledger) are integer paise.
- `users(id, phone UNIQUE, role, name, language[hi|en], password_hash NULL, status[active|suspended|banned], created_at)`
- `areas(id, slug, name_en, name_hi, city, lat, lng)` seed 40+ Delhi NCR areas. Workers and customers pick an area from this list
  (fuzzy-matched from speech/text); coordinates come from here, so no geocoding service is needed.
- `skills_taxonomy(id, slug, name_en, name_hi, aliases text[])` about 25 trades with Hindi/Hinglish aliases (bijli wala, nal wala,
  darzi, AC mechanic, etc.).
- `worker_profiles(user_id PK, slug UNIQUE, headline, core_skills text[], secondary_skills text[], experience_years int NULL,
  area_id NULL, area_text, availability jsonb, source[voice|text|facilitator|ivr_sim], trust_level smallint DEFAULT 1,
  human_verified_by uuid NULL, human_verified_at NULL, identity_check_status[none|simulated_check], guarantor_id uuid NULL,
  public_fields jsonb)` — `trust_level` is a normal column maintained ONLY by `fn_recompute_trust` (never a GENERATED column).
  `public_fields` holds the worker's privacy choices (show experience, show area, show reviews). Phone is never a public field.
  `availability` example: `{"days":["mon","tue"],"from":"09:00","to":"18:00","today":true}`.
- `consents(id, user_id, kind[profile_save|ai_processing|location|facilitator_on_behalf], granted_at, text_version)`
- `claims(id, worker_id, type[identity|skill|work_history], subject, status[self_declared|evidence_added|customer_confirmed|
  independently_assessed|simulated_check], source_label, assessed_by NULL, assessed_at NULL, scope text, note text NULL, created_at)`
  `subject` is a skill slug, or a booking id for work_history. `independently_assessed` requires `assessed_by`, `scope` and non-empty `note`.
- `evidence(id, worker_id, claim_id NULL, kind[photo|note], file_key, caption, source_label, is_public bool DEFAULT false,
  ai_score numeric NULL, ai_note text NULL, status[pending_review|ai_consistent|human_accepted|rejected], reviewed_by NULL, created_at)`
- `customer_profiles(user_id PK, area_id, area_text)`
- `bookings(id, customer_id, worker_id, category, description, area_id, requested_for date NULL, status, amount_paise NULL,
  current_quotation_id NULL, started_at, work_done_at, completed_at, created_at)`
- `quotations(id, booking_id, version int, status[draft|sent|accepted|declined|superseded], total_paise, note, created_by, supersedes_id NULL,
  created_at)` and `quotation_items(id, quotation_id, label, qty numeric, unit_paise bigint)`; `total_paise` must equal the sum of items.
- `reviews(id, booking_id, reviewer_id, worker_id, rating 1-5, text, created_at, UNIQUE(booking_id, reviewer_id))`
- `audit_log(id bigserial, actor_id, action, entity, entity_id, payload jsonb, prev_hash, row_hash, at)` append-only: triggers raise on
  UPDATE/DELETE; `row_hash = sha256(prev_hash || payload || at)`.
- `platform_config(key PK, value)`

**Tier 2 tables:** `wallets(id, owner_user_id NULL, kind[user|escrow|platform_fee|insurance_pool|tds], balance_paise CHECK >= 0)`,
`escrow_holds(id, booking_id UNIQUE, amount_paise, state[held|released|refunded|split])`, `ledger_entries(id, booking_id, from_wallet NULL,
to_wallet, amount_paise CHECK > 0, kind[topup|hold|release_worker|platform_fee|insurance_fee|tds|refund|dispute_split], created_at)`
(`from_wallet` is NULL only for `topup`, enforced by a CHECK), `disputes(id, booking_id, opened_by, customer_text, worker_evidence_id NULL, ai_summary,
ai_suggested_worker_pct, status[open|resolved], resolved_by, resolved_worker_pct, resolved_at)`, `location_pings(id, booking_id, user_id,
lat, lng, at)`, `safety_alerts(id, booking_id, kind[sos|left_geofence|gps_lost], raised_by, created_at, handled_by, handled_at)`,
`reports(id, reporter_id, target_user_id, booking_id, category, description, status[open|actioned|dismissed], created_at)`,
`mentor_requests(id, worker_id, mentor_id, message, status[pending|accepted|declined])`, `ivr_sessions(id, language, category,
created_worker_id, at)`.

## 6. Database functions and triggers (migrations in `db/migrations/`, each tested)
Tier 1:
- `fn_haversine_m(lat1, lng1, lat2, lng2) -> numeric` metres.
- **Booking state machine** trigger on `bookings` BEFORE UPDATE OF status rejects illegal transitions:
  `requested -> worker_accepted | declined | cancelled`; `worker_accepted -> quoted | cancelled`; `quoted -> accepted | worker_accepted
  (quote declined) | cancelled`; `accepted -> in_progress | cancelled`; `in_progress -> work_done`; `work_done -> completed`.
  (Tier 2 adds `in_progress|work_done -> disputed -> resolved`.) Every transition writes an audit row.
- `bookings.amount_paise` and `current_quotation_id` may change only through `fn_accept_quotation`; a trigger rejects direct updates.
- `fn_accept_quotation(quotation_id, customer_id)`: customer must own the booking; marks the quote `accepted`, marks any earlier accepted
  quote `superseded`, sets booking amount/current quote; for the first accepted quote moves `quoted -> accepted`. A revision sent after
  acceptance (approved change) has no effect on the booking until the customer accepts it.
- `fn_recompute_trust(worker_id)`: L1 when the profile is confirmed; L2 when at least one skill claim has an evidence item with status
  `ai_consistent` or `human_accepted`; L3 only when `human_verified_by` is set (see next). Called by triggers on `claims`, `evidence`,
  `users.status`. A suspension or actioned report resets to L1 and clears `human_verified_by`.
- `fn_human_assess_claim(claim_id, actor_id, scope, note)`: SECURITY DEFINER style gate. Requires actor role `facilitator` or `admin`, a
  non-empty note (for example the in-person check) and a scope; sets the claim `independently_assessed`, sets the transaction-local setting
  `swaroop.human_verify = 'on'`, records `human_verified_by/at`, recomputes trust, writes audit. A guard trigger on `worker_profiles` rejects
  any write that sets `trust_level = 3` or changes `human_verified_by` unless `swaroop.human_verify = 'on'` and the actor is staff.
  The identity check is separate and is NOT required for L3.
- `fn_customer_confirm_claim(claim_id, customer_id, booking_id)`: booking must be `completed`, owned by the customer, same worker, category
  matches the claim's skill; sets the claim `customer_confirmed` (never overrides `independently_assessed`). Does not change the level.
- **Review guard** BEFORE INSERT on `reviews`: booking must be `completed`, reviewer must be the booking's customer, worker must match.
  (Tier 2 adds: a `release_worker` ledger entry must exist.)
- Quotation guard: `total_paise = sum(items)`, items editable only while `draft`.
- Audit triggers: booking status, trust changes, claim status, quotation acceptance, user status changes.
Tier 2:
- `fn_book_escrow(booking_id)`: on quote acceptance, lock the customer wallet row `FOR UPDATE`, require balance >= amount + safety_fee, move funds
  customer -> escrow, insert `escrow_holds` and `hold` ledger entries; raise on insufficient funds.
- Release trigger AFTER UPDATE when a booking becomes `completed`, in one transaction: pay worker `amount - fee - tds`, platform fee
  `amount*platform_fee_bps/10000` (computed by subtraction so the parts always sum to the total), insurance pool `safety_fee`, TDS wallet; mark hold
  `released`; ledger and audit rows. Idempotent (hold must be `held`).
- `fn_cancel_booking(booking_id)` refunds amount + safety fee before `in_progress`. `fn_resolve_dispute(dispute_id, worker_pct)` admin only; splits
  escrow, safety fee still goes to the insurance pool; hold `split`. `fn_auto_release_stale()` completes stale `work_done` bookings (admin button).
  `fn_purge_pings()` deletes pings 24 h after completion.
- Invariant: the sum of all `wallets.balance_paise` changes only through `topup` entries.

## 7. API (REST, JSON, prefix `/api/v1`, OpenAPI at `/docs`)
Every response containing a user passes through `shared/privacy.py`; phone numbers appear only in the owner's own responses.
Tier 1:
- Health: `GET /health` (also checks DB).
- Auth: `POST /auth/otp/request`, `POST /auth/otp/verify` (worker/customer, DEMO_MODE), `POST /auth/staff/login`, `GET /me`.
- Reference: `GET /areas`, `GET /skills`, `POST /consents`.
- Workers: `POST /workers/voice-draft` (audio), `POST /workers/text-draft`, `POST /workers/profile/confirm` (needs consent + the worker's edited fields),
  `GET /workers/me`, `PATCH /workers/me`, `PATCH /workers/me/privacy`, `POST /workers/me/readback` (TTS audio).
- Passport/public: `GET /public/workers/{slug}` (no phone, no private evidence), `GET /public/workers/{slug}/reviews`.
- Evidence: `POST /evidence` (multipart), `GET /evidence/me`, `PATCH /evidence/{id}/visibility`, `DELETE /evidence/{id}` (own, if not accepted).
- Trust: `GET /workers/me/trust` (level, claims, what is needed for the next level), `POST /claims/{id}/customer-confirm`.
- Customers: `POST /customers/me`, `GET /customers/me`.
- Matching: `POST /matching/search` (category, area, optional date; returns top 10 with breakdown).
- Quotes: `POST /quotes/calculate` (calculator, stateless), `POST /bookings/{id}/quotations`, `GET /bookings/{id}/quotations`,
  `POST /quotations/{id}/send`, `POST /quotations/{id}/respond` (customer: accept|decline).
- Bookings: `POST /bookings`, `GET /bookings`, `GET /bookings/{id}`, `POST /bookings/{id}/respond` (worker: accept|decline), `/start`, `/work-done`,
  `/complete` (customer confirms), `/cancel`.
- Reviews: `POST /reviews`.
- Dashboards: `GET /dashboard/worker`, `/dashboard/customer`, `/dashboard/organization`.
- Facilitator: `POST /facilitator/workers` (assisted onboarding with consent), `GET /facilitator/evidence-queue`,
  `POST /facilitator/evidence/{id}/decision`, `POST /facilitator/claims/{id}/assess` (human assessment, can lead to L3).
- Admin: `POST /admin/users/{id}/status` (active|suspended|banned), `GET /admin/audit`.
Tier 2 (added in Stage 9): `POST /wallet/topup-demo`, `GET /wallet`, `POST /bookings/{id}/checkin|location|sos|call`, `POST /reports`,
`POST /workers/{id}/guarantor`, `POST /workers/me/identity-check` (SIMULATED), `POST /bookings/{id}/dispute`, `GET /admin/disputes`,
`POST /admin/disputes/{id}/resolve`, `GET /admin/reports`, `POST /admin/reports/{id}/action` (warn|suspend|ban|dismiss),
`GET /admin/safety-alerts`, `GET /admin/revenue`, `POST /admin/run-auto-release`, `GET /admin/incidents/{report_id}/export`,
`POST /mentor-requests`, `GET /mentor-requests`, `POST /mentor-requests/{id}/respond`, `POST /ivr/session`.
Uploads: type allow-list (jpeg/png/webp for images; webm/ogg/wav/mp4/mp3 for audio), size caps, magic-byte sniffing, image re-encode
(strips EXIF/GPS), rate limited. Rate limiting also on OTP request/verify and staff login.

## 8. AI layer (`server/app/shared/ai/`)
Interfaces: `STT.transcribe(bytes, mime) -> (text, language)`, `Extractor.extract(text) -> dict`, `Vision.check(image, claimed_skill) ->
{score, consistent, note}`, `TTS.speak(text, lang) -> bytes`, `Arbitrator.summarize(...)` (Tier 2). Providers: `mock` (deterministic, no network)
and live. `factory.py` picks by `AI_MODE`. Any live exception or 10 s timeout sets `degraded=true` and degrades as below. Treat every non-2xx
(including Sarvam's 403 for a bad key, 422 for bad audio, 429) as a live failure.

**Consent gate.** Before any audio, text or photo is sent to an external AI vendor, the user must have an `ai_processing` consent on record,
otherwise return 403 `consent_required`. In mock mode nothing leaves the server, but the onboarding UI still asks for consent first.

**Degradation rules (important: never fabricate).**
- STT, mock mode: return a fixed Hindi/Hinglish sample transcript clearly labelled "DEMO SAMPLE". STT, live failure: return an EMPTY transcript with
  `degraded=true` and a reason; the UI says it could not understand and focuses the text box. A transcript is never invented for real audio.
- Extractor, live failure: run the rule-based extractor on the REAL transcript/text (taxonomy aliases + simple patterns such as "5 saal"), `degraded=true`.
- Vision, live failure or no consent: evidence becomes `pending_review` for a human; it never counts toward L2 until reviewed.
- TTS failure: skip read-back audio and show the text.

**Sarvam (verify before coding).** Model names change. Before writing `sarvam.py`, fetch `https://docs.sarvam.ai/llms.txt` (or the speech-to-text,
text-to-speech and chat-completion reference pages) and use the CURRENT request shapes. Current understanding, to be re-checked: `POST
https://api.sarvam.ai/speech-to-text` with header `api-subscription-key`, multipart `file`, `model=saaras:v3`, `mode=transcribe`, language `unknown`
(auto-detect) or `hi-IN`; `saarika:v2.5` is a legacy model; the real-time REST endpoint accepts at most 30 seconds of audio (longer needs the Batch
API, which this MVP does not use). TTS: `bulbul:v3` with a valid v3 speaker from the docs. Chat: OpenAI-compatible chat completions with the current
model name from the docs. Keep every model name in env.

**Audio handling.** The browser recorder auto-stops at `max_audio_seconds` (30) with a visible countdown and a hint to tell the work in one short
message. The server rejects longer audio with 422 `audio_too_long`. Browsers record webm (Chrome/Android) or mp4 (Safari); convert to 16 kHz mono wav
with ffmpeg server-side before calling Sarvam (ffmpeg in the Dockerfile; documented for local Windows setup). Audio is processed in memory or a temp
file that is deleted; raw audio is never stored.

**Vision.** Gemini via the official SDK. Prompt: "Does this photo plausibly show work related to <skill>? Return JSON {score 0-1, consistent bool,
note}." Never ask it to verify identity or skill; the output is labelled "AI-assisted check".

**Extraction rules (enforced in code, not just the prompt).** System prompt: extract only explicitly stated facts, null for anything unstated, never
infer certificates, qualifications or years, strict JSON `{core_skills[], secondary_skills[], experience_years|null, service_area|null, tools[],
availability_note|null}`. Then `grounding.py` drops any skill not found (fuzzy match with Hindi/Hinglish aliases) in the transcript, drops
`experience_years` unless a number appears in the transcript, maps `service_area` to an `areas` row or leaves it null for the worker to pick, and logs
what was dropped. Return `{draft, transcript, dropped, degraded}`; nothing is saved until the worker confirms.

## 9. Trust Ladder and claims (enforced in the database and `modules/trust`)
- L1 Self-declared: profile confirmed by the worker (consent recorded).
- L2 Evidence added: at least one skill claim has an evidence item `ai_consistent` or `human_accepted`. Items below `vision_threshold`, or checked
  without AI, are `pending_review` (facilitator queue) and do not count until reviewed. Source label shown on every item.
- Customer-confirmed marker: after a completed booking the customer can confirm that specific skill claim. It is shown on the claim; levels stay three.
- L3 Independently verified: ONLY through `fn_human_assess_claim` via `POST /facilitator/claims/{id}/assess` by a facilitator/admin with a scope and a
  note. Never set by AI or by an evidence upload.
- Identity is a separate claim (`type=identity`). Tier 2 offers a SIMULATED identity check button with no ID number. An identity claim proves who someone
  is, not skill or conduct.
- Show source, date and scope next to every claim status. UI copy: "AI-assisted check" for AI output, "Independently verified" only for L3. Never say
  "AI verified", crime-free, safe or guaranteed.

## 10. Trust and safety (Tier 2, Stage 9b)
Honest framing for docs and UI: SWAROOP reduces risk and provides traceability. It does not claim to prevent crime or replace the police.
1. Identity check (SIMULATED): button sets an identity claim to `simulated_check`; no ID number is collected, stored or logged.
2. Guarantor: a worker at L2+ can vouch for a new worker; an actioned misconduct report lowers both and flags the guarantor.
3. Geofence + SOS (SIMULATED location): `checkin` succeeds only within `geofence_radius_m` of the booking area (409 with distance otherwise); pings
   stored while `in_progress` and a `left_geofence` alert created when a ping is outside the radius before `work_done`; either party can raise `sos`.
   Pings purged 24 h after completion. A "Simulate GPS drift" button is visible only when `VITE_DEMO_TOOLS=true`, with a SIMULATED badge.
4. Masked calling (SIMULATED stub): `POST /bookings/{id}/call` returns `{session_id, status:"bridged_simulated"}`; no number appears anywhere. A test
   scans responses for phone-like values.
5. Reports and incidents: admin can warn, suspend or ban; `GET /admin/incidents/{id}/export` bundles booking record, status history, audit entries and pings
   as JSON for use through proper legal process. Documented in `docs/STATUS.md`.
6. Micro-insurance (SIMULATED): the safety fee is a line item routed to the insurance pool; UI says "demo, no real policy".
7. Disputes: AI arbitrator output is an advisory summary and suggested split, labelled "AI suggestion, a human decides"; funds stay frozen until an admin resolves.

## 11. Matching (explainable rules, no black box; module `matching`)
Score 0-100 = skill 40 (exact core skill 40, secondary 20, alias hit 25) + location 25 (same area 25, haversine within 5 km 20, within 15 km 10, no
coordinates 0) + availability 15 (available on the requested day/time 15, available another day this week 8, otherwise 0) + evidence level 20 (L3 20,
L2 12, L1 4). Exclude suspended/banned. Return the top 10 with `breakdown {skill, area, availability, evidence}`, a one-line reason in Hindi and
English ("Skill match, 2 km away, available today, Level 2") and the honest claim statuses with source/date/scope. Customer-confirmed claims show a
badge but add no points.

## 12. Booking, quotation and review flow
Customer creates a request -> worker accepts or declines -> worker builds an itemised quotation (calculator helper totals items) and sends it ->
customer accepts or declines (declined returns to `worker_accepted`, worker may send a new version) -> `accepted` -> worker starts -> worker marks work
done -> customer confirms completion -> customer reviews. Any change to an accepted quote is a new version that needs the customer's acceptance
(approved change). Customer may then confirm the matching skill claim.

## 13. Client (mobile-first, 360px first; feature folders in `PROJECT_STRUCTURE.md`)
- Default Hindi with an English toggle (i18n dictionary, all strings). 48px touch targets, icon + label buttons, minimal typing, voice first.
- Pages: Login (SIMULATED OTP badge); role-aware Home; Worker onboarding (consent first -> big mic button with 30 s countdown or text box -> draft
  review with editable fields, area picker and confirm -> optional read-back audio); My Skill Passport with Trust Ladder card (L1/L2/L3, claim
  statuses, what is needed next) and privacy toggles; Evidence gallery (camera input, client-side resize to 1280 px, source labels, status chips,
  public/private toggle); public passport `/w/:slug` with QR (`qrcode`); customer search + results with the match breakdown; request booking;
  quotation builder (worker) and quote review (customer); booking detail with status timeline; review; worker/customer/organization dashboards;
  facilitator screens (assisted onboarding, evidence queue, human assessment); minimal admin (user status, audit log).
  Tier 2 pages: wallet, safety panel, disputes, reports, mentor requests, revenue panel, IVR simulator (keypad UI, banner "SIMULATION, not a live call").
- Show `degraded=true` as a small "demo fallback" note; show SIMULATED badges where specified. No loan, income or eligibility promises in copy.
- Installable PWA: `manifest.webmanifest`, icons, minimal service worker (no offline logic). Loading, empty and error states on every screen.

## 14. Business model (visibility only)
Tier 2 admin revenue panel from the ledger: gross value, platform fee earned (default 2%, configurable), insurance pool (pass-through, not revenue),
completed bookings, average fee per booking. ROADMAP only (do not build): B2B contractor subscription, financial-partner referrals. List as labelled
roadmap items in `docs/STATUS.md`.

## 15. Seed data and demo reset
`db/seed/` + `server/scripts/demo_reset.py` (`npm run demo:reset`) rebuild a known demo state in under 5 seconds when `DEMO_MODE=true`: about 12 workers
across trades and Delhi NCR areas with levels spread across L1/L2/L3, 5 customers, evidence items, claims, bookings in every status (some completed
with reviews and quotations), and (Tier 2) demo wallets, one open dispute, one open report. Everything is labelled demo data.

## 16. Docs to generate (accurate to the code, never placeholders)
`README.md`, `docs/architecture.md`, `docs/module-ownership.md`, `docs/api-contracts.md`, `docs/database-schema.md`, `docs/github-workflow.md` and
`docs/teammate-prompts.md` (supplied by the owner; keep consistent), `docs/local-setup.md` (exact Windows commands, tunnel/HTTPS for phone tests,
ffmpeg), `docs/demo-guide.md` (5-minute demo path: onboarding by voice -> confirm -> evidence -> trust level -> customer search -> booking -> quotation
-> approved change -> completion -> review -> facilitator assessment; Tier 2: escrow, dispute, SOS), `docs/testing-guide.md`, `docs/security-and-privacy.md`,
`docs/integrations-and-limitations.md`, `docs/STATUS.md` (BUILT/SIMULATED/ROADMAP table + trust and safety statement), `docs/DECISIONS.md`,
`docs/progress.md`, `deploy/AWS.md`, `.github/pull_request_template.md`, `.github/workflows/ci.yml`.

## 17. Tests
pytest markers are registered in `server/pytest.ini` with `--strict-markers`; every test carries one or more of: `db`, `state`, `quotation`, `review`,
`auth`, `access`, `privacy`, `extraction`, `trust`, `fallback`, `matching`, and for Tier 2 `money`, `safety`. A gate that selects zero tests FAILS.
- State machine: illegal booking transitions rejected by the DB; `amount_paise` cannot change outside `fn_accept_quotation`; quote total equals items.
- Review: rejected unless a completed booking exists between that customer and worker; second review rejected.
- Trust: AI paths can never produce L3; L3 only via `fn_human_assess_claim` by staff with a note; direct SQL update to `trust_level=3` rejected;
  suspension resets to L1; customer-confirm requires a completed matching booking; identity claim never affects skill level.
- Access: every protected route group rejects missing/wrong-role tokens and other users' objects (workers, bookings, evidence, quotations).
- Privacy: recursive scan of every response model asserts no phone-like value (regex `(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)`, UUIDs and timestamps
  excluded) reaches a non-owner; no ID number fields exist; public passport hides private evidence.
- Extraction: grounding drops an invented skill; null stays null; years dropped when not spoken; mock mode needs no network; consent required before
  live AI.
- Fallback: forced live STT failure returns an empty transcript with `degraded=true` (no fabricated text); forced extractor failure uses the rule-based
  extractor on the real text.
- Matching: score breakdown sums to total; suspended workers hidden; workers without coordinates still match on skill.
- Tier 2: ledger sums unchanged except `topup`, balances never negative, double approve does not pay twice, cancel refunds fully, dispute split sums to
  total, insufficient funds rejected, geofence inside/outside and `left_geofence` alert.
- Client (Vitest): i18n toggle, onboarding review screen shows only edited fields, Trust Ladder card renders each level, SIMULATED badge present.

## 18. Build stages (gate = command that must pass, then log in `docs/progress.md`; never run Git write commands)
- **Stage 0 Scaffold:** layout from `PROJECT_STRUCTURE.md`, root `package.json` scripts, `tools/py.mjs`, docker-compose (Postgres), `.env.example`,
  `.gitignore`, FastAPI app factory with `/api/v1/health`, Vite app boots with the `/api` dev proxy, `server/scripts/health_check.py`.
  Gate: `npm run setup && npm run db:up && npm run api:health && npm run build:client`.
- **Stage 1 Database:** migrations (schema, functions, triggers), `init_db.py`, seed, `docs/database-schema.md`, `docs/module-ownership.md`,
  `docs/architecture.md`. Gate: `npm run db:init && npm run test:server -- -m "db or state or quotation or review or trust"`.
- **Stage 2 Server core:** config + startup guard, errors, auth (OTP sim + staff password), RBAC, privacy serializer, rate limiting, upload validation,
  reference/consent/customer routes, OpenAPI, `docs/api-contracts.md`. Gate: `npm run test:server -- -m "auth or access or privacy"`.
- **Stage 3 AI, onboarding, evidence, trust:** ai package (mock first, then Sarvam + Gemini), voice/text draft, grounding, confirm with consent,
  read-back, evidence + claims + Trust Ladder, facilitator routes. Gate: `npm run test:server -- -m "extraction or trust or fallback or access"`.
- **Stage 4 Discovery, bookings, quotations, reviews:** `matching`, bookings lifecycle, quotations + approved changes, reviews, customer-confirm,
  dashboards API, admin minimal. Gate: `npm run test:server -- -m "matching or state or quotation or review or access"`.
- **Stage 5 Client core:** i18n, auth, consent + onboarding (voice with countdown/text -> review -> confirm), passport + Trust Ladder, evidence,
  public passport + QR, PWA. Gate: `npm run typecheck && npm run test:client && npm run build:client`.
- **Stage 6 Client customer and ops:** discovery + match breakdown, bookings, quotations, reviews, dashboards, facilitator and admin screens.
  Gate: `npm run typecheck && npm run test:client && npm run build:client`.
- **Stage 7 Demo, CI, docs:** `demo_reset.py`, `smoke_test.py` (in-process ASGI client against the real database: onboarding draft -> confirm -> evidence ->
  facilitator decision -> search -> booking -> quotation -> approved change -> completion -> review), CI workflow, all docs in section 16.
  Gate: `npm run demo:reset && npm run smoke && npm test`.
- **Stage 8 Polish and full verification:** empty/error/loading states, accessibility pass (labels, contrast, focus), SIMULATED badge audit, copy audit for
  forbidden claims, run everything once. Gate: `npm test && npm run typecheck && npm run lint && npm run build && npm run smoke`.
- **Stage 9 Tier 2 (optional, only after Stage 8 fully passed; do 9a to 9d in order and stop cleanly if context runs short):**
  9a wallet/escrow/fees + revenue panel; 9b safety (identity check sim, guarantor, geofence/SOS, call stub, reports, incident export);
  9c disputes + arbitrator; 9d mentor requests + IVR simulator. After each part: the new tests for that part (markers `money`, `safety`, `access`) pass, then `npm test` and
  `npm run smoke` pass, and docs and STATUS are updated.

## 19. Out of scope (do not build)
Real telephony/IVR, WhatsApp, SMS OTP, real payments or UPI, real DigiLocker/Aadhaar or any ID-number collection, loan or scheme-eligibility features,
B2B squad matching, native mobile apps, anything needing paid accounts to run the default (mock) build.
