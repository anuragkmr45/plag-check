# IMPLEMENTATION_TRACKER.md — Anti-Plagiarism SaaS Implementation Tracker

## How to use this tracker

This tracker prevents hallucination and uncontrolled scope creep.

Before every coding step, the agent must:

1. Read `AGENTS.md`.
2. Read this file.
3. Find the first task whose status is not `VERIFIED` and whose dependencies are satisfied.
4. Implement only that task.
5. Run the task verification prompt.
6. Update task evidence.
7. Continue only if the task is `VERIFIED` or `SKIPPED_APPROVED`.

---

## Current MVP Status

| Field | Value |
|---|---|
| MVP implementation status | VERIFIED |
| Current phase | MVP complete + local demo-ready overlay |
| Current task | Report visual analysis and PDF export polish VERIFIED; certified P9 provider work remains locked until human approval |
| Last verified task | P8-T3 |
| Last phase verified | Phase 8 |
| Demo Real status | VERIFIED for local product demonstration with fallbacks |
| Next human decision needed | MVP/demo sign-off and production gates: hosting, SSL, production secrets, backup destination, certified provider decision if required, legal/privacy review, and UAT sign-off. |

---

## Demo Real Live Demo Overlay

Status: VERIFIED

Verification date: 2026-04-28 10:55:07 IST

Scope:
- Added a local demo provider path selected by `SCAN_PROVIDER=demo-real`.
- Integrated Tavily, Gemini, OpenAlex, and LanguageTool public API clients with fallback behavior.
- Kept mock provider fallback available.
- Added demo entry pages and a demo seed script.
- This is not certified plagiarism detection, paid academic database coverage, or production sign-off.

Changed files:
- `.env`
- `.env.example`
- `.env.demo.example`
- `env.demo-ready.example`
- `AGENTS.md`
- `IMPLEMENTATION_TRACKER.md`
- `package.json`
- `scripts/seed-demo.ts`
- `src/app/(dashboard)/ai-detector/page.tsx`
- `src/app/(dashboard)/grammar-checker/page.tsx`
- `src/app/(dashboard)/plagiarism-checker/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/(dashboard)/scan/new/page.tsx`
- `src/components/scanning/quick-text-scan-form.tsx`
- `src/features/reports/report-page-content.tsx`
- `src/features/reports/report.service.ts`
- `src/features/scanning/providers/demo-real.provider.ts`
- `src/features/scanning/providers/index.ts`
- `src/lib/env.ts`
- `src/lib/rbac/navigation.ts`
- `src/server/services/demo-seed.service.ts`
- `src/server/services/scanning.service.ts`
- `src/server/workers/scan-worker.ts`
- `tests/dashboard-navigation.test.ts`
- `tests/demo-real-provider.test.ts`
- `tests/env.test.ts`
- `docs/demo-real-provider.md`
- `docs/demo-ui-flow.md`
- `docs/uat-results.md`
- `docs/mvp-release-notes.md`

Database migrations:
- None; existing scan/report tables were reused and academic metadata is stored in `scan_results.provider_metadata`.

Commands run:
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 30 files and 121 tests passed
- `npm run build` — PASS
- `npm run db:migrate` — FAIL initially because `.env` pointed `DATABASE_URL` to `localhost:55432` while Docker Compose exposed PostgreSQL on `localhost:5432`; fixed local `.env` port and reran
- `npm run db:migrate` — PASS
- `npm run db:seed:demo` — PASS, created three demo submissions/reports and one reviewer case
- `npm run worker` — PASS, no queued scan jobs after demo seed
- `PORT=3100 npm run start` — PASS
- Direct provider smoke with `npx tsx --env-file-if-exists=.env` — FAIL initially because top-level await is not supported by the default CJS eval output; reran inside an async IIFE
- Direct provider smoke with `npx tsx --env-file-if-exists=.env` — PASS, returned `providerFallback=false`, 5 Tavily web matches, Gemini AI assessment output, OpenAlex status, and 2 LanguageTool findings with current `.env`

Smoke verification:
- `/api/health` — PASS 200
- First page smoke shell loop — FAIL due using `path` as a zsh variable, which shadowed command lookup; reran with `ROUTE` and all page checks passed
- `/dashboard` — PASS 200 authenticated
- `/scan/new` — PASS 200 authenticated
- `/plagiarism-checker` — PASS 200 authenticated
- `/ai-detector` — PASS 200 authenticated
- `/grammar-checker` — PASS 200 authenticated
- `/submissions` — PASS 200 authenticated
- `/reports` — PASS 200 authenticated
- `/reviewer/queue` — PASS 200 authenticated
- `/submissions/22fb95d3-38b8-4513-b03a-eb07b0d0906c` — PASS 200 authenticated
- `/submissions/22fb95d3-38b8-4513-b03a-eb07b0d0906c/report` — PASS 200 authenticated
- `/api/submissions/22fb95d3-38b8-4513-b03a-eb07b0d0906c/report/pdf` — PASS 200 `application/pdf`
- `/reviewer/cases/cd7f1dbe-e048-48b1-857a-0105dd8d6350` — PASS 200 authenticated

Manual verification:
- Confirmed provider metadata includes fallback flags.
- Confirmed report UI shows provider badge, similarity, AI probability, grammar findings, web matches, academic metadata, highlighted chunks, exclusions, PDF export, reviewer notes, and demo disclaimer.
- Confirmed missing `CODEX_RUN_COMPLETE_DEMO_TASK_PROMPT.md`; implementation used `CODEX_COMPLETE_DEMO_REAL_BUILD_PROMPT.md` and the user's explicit request as the executable demo spec.
- Confirmed Brave Search, Google CSE, and Semantic Scholar were not added.
- Confirmed no hard-coded secrets were added.

Remaining issues:
- None for local live demo.
- Demo Real is suitable for product demonstration but is not certified plagiarism detection or full academic database coverage.

Human intervention required:
- None for local demo execution.
- Production deployment and certified provider decisions remain human-owned.

### Demo overlay bugfix: super-admin submission tenant selection

Status: VERIFIED

Verification date: 2026-04-28 11:09:06 IST

Issue:
- A logged-in `SUPER_ADMIN` received `{"error":"Forbidden"}` when posting `{"title":"demo"}` to `/api/submissions`.
- Root cause: `SUPER_ADMIN` is global and must provide a tenant for new submissions; the upload and quick-scan forms did not expose a tenant selector.

Changed files:
- `src/app/(dashboard)/ai-detector/page.tsx`
- `src/app/(dashboard)/grammar-checker/page.tsx`
- `src/app/(dashboard)/plagiarism-checker/page.tsx`
- `src/app/(dashboard)/scan/new/page.tsx`
- `src/app/(dashboard)/submissions/new/page.tsx`
- `src/app/api/submissions/route.ts`
- `src/components/scanning/quick-text-scan-form.tsx`
- `src/components/submissions/submission-create-upload-form.tsx`
- `src/features/tenants/tenant-options.service.ts`
- `docs/demo-ui-flow.md`
- `IMPLEMENTATION_TRACKER.md`

Commands run:
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run test` — PASS, 30 files and 121 tests passed
- `npm run build` — PASS
- `PORT=3100 npm run start` — PASS for API smoke

Manual/API verification:
- Logged in as `SEED_SUPER_ADMIN_EMAIL`.
- `POST /api/submissions` with `{"title":"demo without tenant"}` returned `400 {"error":"Tenant is required"}`.
- `POST /api/submissions` with `{"title":"demo with tenant","tenantId":"73c04faa-8e91-4704-b0a9-7411ee095275"}` returned `201` and the correct tenant id.
- Removed the smoke-created draft submission afterward.

Remaining issues:
- None.

Human intervention required:
- None.

### Demo overlay bugfix: Tavily query length and rescan

Status: VERIFIED

Verification date: 2026-04-28 11:16:11 IST

Issue:
- Submission `ff8c72a5-e5d7-4564-996e-2d93ee89821c` initially completed with `similarity_score=0` because Tavily returned `400 Query is too long. Max query length is 400 characters.`
- This made the plagiarism result a fallback/no-match result even though Gemini and LanguageTool ran live.

Changed files:
- `src/features/scanning/providers/demo-real.provider.ts`
- `tests/demo-real-provider.test.ts`
- `IMPLEMENTATION_TRACKER.md`

Commands run:
- Direct Tavily diagnostic request — PASS, confirmed the 400 reason without exposing API keys.
- `npm run typecheck` — PASS
- `npm run test -- tests/demo-real-provider.test.ts` — PASS, 2 tests passed
- `npm run worker` — PASS, rescanned the target submission after requeue
- `npm run lint` — PASS
- `npm run test` — PASS, 30 files and 122 tests passed

Verification evidence:
- Provider now truncates/normalizes Tavily query strings below the provider limit.
- New test confirms Tavily request bodies keep `query.length <= 400`.
- Rescanned `ff8c72a5-e5d7-4564-996e-2d93ee89821c`.
- Latest result: `SCAN_COMPLETE`, `similarity_score=70.94`, `source_match_count=8`, `provider_metadata.fallback=false`.
- Latest subproviders: Tavily `fallback=false`, Gemini `fallback=false`, LanguageTool `fallback=false`, OpenAlex `fallback=false` with zero academic matches.

Remaining issues:
- None for the demo scan path.

Human intervention required:
- None.

### Demo overlay enhancement: visual report analysis and PDF export polish

Status: VERIFIED

Verification date: 2026-04-28 11:24:19 IST

Scope:
- Added reusable report visual-summary calculations for similarity/originality split, AI/human-like split, preprocessing/exclusion split, grammar density, and top source scores.
- Added an at-a-glance Visual analysis section to the report page with bars and source-score charts.
- Upgraded PDF export with a branded header, metric cards, visual bars, top-source chart, and page numbering while keeping the disclaimer and human-review framing.

Changed files:
- `src/features/reports/report-view.ts`
- `src/features/reports/report-page-content.tsx`
- `src/features/reports/report-pdf.ts`
- `tests/report-view.test.ts`
- `tests/report-pdf.test.ts`
- `IMPLEMENTATION_TRACKER.md`
- `AGENTS.md`

Database migrations:
- None.

Commands run:
- `npm run typecheck` — PASS
- `npm run test -- tests/report-view.test.ts tests/report-pdf.test.ts` — PASS, 2 files and 7 tests passed
- `npm run lint` — PASS
- `npm run test` — PASS, 30 files and 123 tests passed
- `npm run build` — PASS
- `PORT=3100 npm run start` — PASS for local smoke
- Authenticated curl smoke against `ff8c72a5-e5d7-4564-996e-2d93ee89821c` — PASS: `/submissions/[id]/report` returned 200, `/api/submissions/[id]/report/pdf` returned 200 `application/pdf`, report HTML contained `Visual analysis`, generated PDF was 11,690 bytes

Manual verification:
- Confirmed report page now shows visual bars for copied/original estimate, AI-like/human-like indicator, scanned/excluded text, grammar density, and top source match scores.
- Confirmed PDF text extraction includes `Visual summary`, `Original estimate`, `Top source match scores`, existing similarity/AI sections, reviewer notes, and disclaimer.
- Confirmed no scan provider behavior, tenant-scoped service queries, RBAC policy, or future P9 provider scope was changed.
- Confirmed no hard-coded secrets were added.

Remaining issues:
- None.

Human intervention required:
- None.

---

## Status Legend

| Status | Meaning |
|---|---|
| NOT_STARTED | No work has been done. |
| IN_PROGRESS | Work has started but is not complete. |
| IMPLEMENTED | Code/docs were added, but verification is not complete. |
| NEEDS_FIX | Verification found issues. Fix before moving forward. |
| BLOCKED_HUMAN | Human input or external credentials are required. |
| VERIFIED | Task is implemented and verified. |
| SKIPPED_APPROVED | Human explicitly approved skipping the task. |

---

## Phase Gates

| Phase | Status | Phase verification evidence | Human intervention status |
|---|---|---|---|
| P0 Foundation | PHASE VERIFIED | P0-T1 through P0-T4 verified. Docker Compose, env validation, Drizzle migration apply, and health route verification passed on 2026-04-28 00:43:59 IST. | Resolved for Phase 0 |
| P1 Auth/RBAC/Tenancy | PHASE VERIFIED | P1-T1 through P1-T6 verified. Phase 1 verification passed on 2026-04-28 01:25:42 IST with schema, auth, sessions, login/logout/me, RBAC, seed users, protected shell, smoke tests, and command evidence. | Local-development choices delegated to agent; production credentials remain human-owned |
| P2 Submissions/Storage | PHASE VERIFIED | P2-T1 through P2-T5 verified. Phase 2 verification passed on 2026-04-28 01:48:36 IST with schema, storage service, submission API, upload API, submission UI, unit tests, browser UI smoke, route smoke, audit evidence, DB evidence, and MinIO evidence. | Defaults approved for local development; sample files can be generated if needed |
| P3 Extraction/Preprocessing | PHASE VERIFIED | P3-T1 through P3-T5 verified. Phase 3 verification passed on 2026-04-28 02:05:48 IST with extraction/preprocessing schemas, services, APIs, UI summary, tests, DB evidence, route smoke, audit evidence, and no scan implementation. | Defaults used for local MVP; golden corpus remains a later validation input |
| P4 Scan Orchestration | VERIFIED | P4-T1 through P4-T5 verified with tenant-aware scan schemas, deterministic mock provider, PostgreSQL queue, start scan API, worker persistence, status UI, tests, browser smoke, DB smoke, and command evidence. | Mock scan provider approved for MVP; real provider keys deferred |
| P5 Review/Reports | PHASE VERIFIED | P5-T1 through P5-T5 verified. Report schema, report assembly, report UI, reviewer workflow, PDF export, immutable report snapshot row, MinIO storage, event/audit writes, and access-control smoke passed. | Report template/disclaimer approval before pilot |
| P6 Admin/Support/Customization | PHASE VERIFIED | P6-T1 through P6-T5 verified. Admin analytics, dashboard UI, tenant settings/customization, user management, and support ticket module passed lint/typecheck/test/build plus browser/DB smoke checks by 2026-04-28 03:50:48 IST. | Safe defaults used; branding/SLA/support workflow choices can be refined before pilot |
| P7 Security/QA/Compliance | PHASE VERIFIED | P7-T1 through P7-T5 verified. Security hardening, tenant isolation tests, admin audit page, retention/consent metadata, and UAT/admin/reviewer/user/security docs passed lint/typecheck/test/build and phase verification on 2026-04-28 04:20:20 IST. | Privacy/security/retention approval remains a production gate |
| P8 Deployment Readiness | PHASE VERIFIED | P8-T1 through P8-T3 verified. Production Dockerfile, same-image web/worker commands, production compose example, clean Docker build, deployment docs, production readiness checklist, phase verification, and full MVP verification passed on 2026-04-28 04:37:10 IST. | Hosting, domain, production secrets, backup destination, legal/privacy/UAT sign-off, provider keys if replacing mock provider |
| P9 Advanced Optional | LOCKED_UNTIL_MVP_SIGNOFF | Pending | OAuth/LMS/provider credentials |

---

# Phase 0 — Project Foundation

## Phase 0 Acceptance Criteria

- Next.js App Router + TypeScript + TailwindCSS project exists.
- Docker Compose starts PostgreSQL and MinIO.
- Drizzle ORM is configured.
- Environment variables are validated through Zod.
- `/api/health` confirms app, database, and storage/config status.
- No auth, upload, scan, report, or dashboard feature is implemented yet.

## Phase 0 Human Intervention

Human may need to provide:

- Preferred repo/project name.
- Local `.env` values.
- Confirmation that Docker is available.
- Confirmation that local PostgreSQL/MinIO ports are free.

---

## P0-T1 — Bootstrap project structure

Status: VERIFIED

Dependencies: None

Task prompt:

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Implement P0-T1 only: Bootstrap the project foundation.

Create or verify a Next.js App Router project using TypeScript and TailwindCSS.
Create this structure:
- src/app
- src/components
- src/features
- src/lib
- src/server
- drizzle
- docs
- tests

Add scripts in package.json:
- dev
- build
- start
- lint
- typecheck
- test
- db:generate
- db:migrate
- db:studio
- worker

Create docs/implementation-plan.md with the phase list P0 through P9.
Do not implement auth, uploads, dashboards, scans, or reports.
```

Verification prompt:

```txt
Verify P0-T1 only.

Check that:
1. The project uses Next.js App Router, TypeScript, and TailwindCSS.
2. TypeScript strict mode is enabled.
3. Required folder structure exists.
4. package.json contains all required scripts.
5. docs/implementation-plan.md exists and lists phases P0–P9.
6. No future phase features were implemented.
7. npm run lint and npm run typecheck pass or failures are documented.

Update P0-T1 status to VERIFIED only if all checks pass.
```

Implementation evidence: Next.js App Router, TypeScript strict mode, TailwindCSS, required folder structure, package scripts, and implementation plan were added.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Manual checks confirmed required scripts, directories, P0-P9 plan entries, and no feature implementation beyond the foundation.

Remaining/blockers: None for P0-T1.

---

## P0-T2 — Docker Compose for PostgreSQL and MinIO

Status: VERIFIED

Dependencies: P0-T1

Task prompt:

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Implement P0-T2 only: Add local Docker Compose infrastructure.

Create docker-compose.yml with:
1. PostgreSQL service.
2. MinIO service.
3. MinIO bucket initialization service.

Create .env.example with:
- DATABASE_URL
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- MINIO_ROOT_USER
- MINIO_ROOT_PASSWORD
- MINIO_ENDPOINT
- MINIO_REGION
- MINIO_BUCKET
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- APP_URL
- SESSION_SECRET

Create docs/local-development.md explaining:
- how to start Docker
- how to run migrations
- how to access MinIO console
- how to start the app

Do not add real secrets.
```

Verification prompt:

```txt
Verify P0-T2 only.

Check that:
1. docker-compose.yml defines PostgreSQL and MinIO.
2. MinIO bucket initialization is present.
3. .env.example contains all required keys without real secrets.
4. docs/local-development.md is actionable.
5. docker compose config passes if Docker is available.
6. No future phase features were implemented.

Update P0-T2 status to VERIFIED only if all checks pass.
```

Implementation evidence: Docker Compose infrastructure, `.env.example`, and local development documentation were added for PostgreSQL, MinIO, and MinIO bucket initialization.

Verification evidence: `docker compose config`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Manual checks confirmed required Compose services, required env keys, MinIO bucket initialization, actionable local docs, placeholder-only secrets, and no future-phase feature implementation.

Remaining/blockers: None for P0-T2.

---

## P0-T3 — Environment validation

Status: VERIFIED

Dependencies: P0-T2

Task prompt:

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Implement P0-T3 only: Add environment validation.

Create src/lib/env.ts using Zod to validate:
- DATABASE_URL
- APP_URL
- SESSION_SECRET
- MINIO_ENDPOINT
- MINIO_REGION
- MINIO_BUCKET
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY

Export a typed env object.
Use this env object instead of direct process.env access where practical.
Add a unit test for validation if practical.
Do not implement DB schema, auth, or uploads.
```

Verification prompt:

```txt
Verify P0-T3 only.

Check that:
1. src/lib/env.ts exists.
2. Required env vars are validated with Zod.
3. The exported env object is typed.
4. Invalid env fails clearly.
5. No unnecessary process.env usage exists outside env module/framework-required areas.
6. Tests/typecheck pass or failures are documented.

Update P0-T3 status to VERIFIED only if all checks pass.
```

Implementation evidence: `src/lib/env.ts` was added with Zod validation for all required P0-T3 variables, a typed `Env` export, a typed `env` object, and `parseEnv` for clear validation failures. Unit tests were added for valid input, invalid values, and missing variables.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Manual checks confirmed only `src/lib/env.ts` reads `process.env`, all required variables are validated, invalid env failures include field names, and no DB schema, auth, or upload feature was implemented.

Remaining/blockers: None for P0-T3.

---

## P0-T4 — Drizzle baseline and health route

Status: VERIFIED

Dependencies: P0-T3

Task prompt:

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Implement P0-T4 only: Add Drizzle ORM baseline and health check.

Set up:
- src/lib/db/schema.ts
- src/lib/db/index.ts
- drizzle.config.ts
- migrations folder
- database connection helper

Create a minimal initial table if required, such as app_metadata.
Create /api/health route that checks:
- app status
- database connection
- MinIO/storage config status or simple connectivity if available

Do not implement auth or business tables yet.
```

Verification prompt:

```txt
Verify P0-T4 only.

Check that:
1. Drizzle config exists and uses env validation.
2. DB helper exists and is typed.
3. A migration can be generated and applied.
4. /api/health returns JSON with app, DB, and storage/config status.
5. No auth/business tables were implemented.
6. lint/typecheck/test pass or failures are documented.

If all P0 tasks are verified, run the Phase 0 verification prompt.
```

Implementation evidence: Drizzle config, typed DB helper, minimal global `app_metadata` schema, generated migration, and `/api/health` route were added. The health route reports app, config, database, and storage status without exposing secrets.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run db:generate`, `npm run db:migrate`, `docker compose config`, Docker Compose service checks, MinIO bucket initialization logs, and direct health route handler execution passed. `/api/health` returned HTTP 200 JSON with app, config, database, and storage statuses after PostgreSQL was reachable.

Remaining/blockers: None for P0-T4. Local port 5432 was already occupied, so Docker Compose was verified with `POSTGRES_PORT=55432`; `.env.example` and local docs now document the configurable port.

---

## Phase 0 Verification Prompt

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Verify Phase 0 completely.

Check:
1. P0-T1, P0-T2, P0-T3, and P0-T4 are VERIFIED.
2. Evidence is present for every task.
3. The app foundation, Docker Compose, env validation, Drizzle baseline, and health route work.
4. No future-phase features were implemented.
5. Human inputs needed before Phase 1 are listed.

If complete, mark Phase 0 as PHASE VERIFIED and unlock P1-T1.
If not, keep Phase 1 locked and list missing items.
```

Phase verification evidence: Phase 0 marked PHASE VERIFIED on 2026-04-28 00:43:59 IST. P0-T1, P0-T2, P0-T3, and P0-T4 are VERIFIED with implementation and verification evidence. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `docker compose config`, `npm run db:migrate`, Docker Compose service checks, MinIO bucket initialization logs, and health route handler execution passed. Scope checks found no future-phase implementation or incomplete TODO/FIXME markers. Phase 1 human inputs are listed in the Human Intervention Log.

---

# Phase 1 — Auth, RBAC, and Tenancy

## Phase 1 Acceptance Criteria

- Tenants, tenant settings, users, sessions, and audit events exist.
- Roles exist: SUPER_ADMIN, INSTITUTION_ADMIN, REVIEWER, USER.
- Secure password hashing and session auth work.
- Login/logout/me APIs work.
- RBAC guards are tested.
- Seed script creates demo users.
- Protected dashboard shell exists.
- User management itself is deferred to Phase 6.

## Phase 1 Human Intervention

Human may need to provide:

- Seed super admin email/password.
- Confirmation of final role names.
- Whether password reset is required in MVP or can wait.

---

## P1-T1 — Database schema for tenants, users, sessions, audit

Status: VERIFIED

Dependencies: Phase 0 verified

Task prompt:

```txt
Implement P1-T1 only.

Add Drizzle schema and migration for:
- tenants
- tenant_settings
- users
- sessions
- audit_events

Add enum user_role:
- SUPER_ADMIN
- INSTITUTION_ADMIN
- REVIEWER
- USER

Rules:
- Users belong to a tenant except SUPER_ADMIN may have null tenant_id.
- Email is unique.
- password_hash is required for login users.
- users have is_active.
- sessions store token_hash, user_id, expires_at.
- audit_events store actor_user_id, tenant_id, action, entity_type, entity_id, metadata JSON, ip, user_agent.
- Add useful indexes.

Do not implement login UI or auth routes yet.
```

Verification prompt:

```txt
Verify P1-T1 only.

Check that schema and migration exist for tenants, tenant_settings, users, sessions, and audit_events.
Confirm role enum values are exact.
Confirm indexes exist for email, tenant_id, session token hash, and audit lookup.
Confirm no login UI/routes were added.
Run typecheck and migration generation checks.
```

Implementation evidence: Added the P1-T1 Drizzle schema for `tenants`, `tenant_settings`, `users`, `sessions`, and `audit_events`, plus the exact `user_role` enum. Generated and applied migration `drizzle/0001_glossy_tomorrow_man.sql`. The schema includes tenant-aware references, required password/session hash columns, active user flag, audit metadata fields, and useful indexes.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run db:generate`, and `npm run db:migrate` passed. Database introspection confirmed all five tables, exact role enum values, and indexes for user email, tenant IDs, session token hash, and audit lookups. Search confirmed no login UI or auth routes were added.

Remaining/blockers: None for P1-T1.

---

## P1-T2 — Password hashing and auth service

Status: VERIFIED

Dependencies: P1-T1

Task prompt:

```txt
Implement P1-T2 only.

Create:
- src/lib/auth/password.ts
- src/lib/auth/session.ts
- src/server/services/auth.service.ts

Use Argon2id password hashing.
Implement:
- hashPassword(password)
- verifyPassword(password, hash)
- createSession(userId)
- validateSession(sessionToken)
- destroySession(sessionToken)
- getCurrentUserFromRequest()

Use secure httpOnly cookies:
- sameSite=lax
- secure in production
- reasonable expiration

Session token must be stored as a hash, not raw token.
Add unit tests for password and session token handling.
Do not create pages yet.
```

Verification prompt:

```txt
Verify P1-T2 only.

Check password hashing uses Argon2id.
Check raw session tokens are not stored.
Check cookies are httpOnly and secure in production.
Check tests exist for password/session logic.
Run lint, typecheck, and tests.
```

Implementation evidence: Added Argon2id password hashing helpers, session token generation/hash/cookie helpers, and a DB-backed auth service implementing `createSession`, `validateSession`, `destroySession`, and `getCurrentUserFromRequest`. Session persistence writes only `token_hash`; raw tokens are returned only for caller-side cookie setting. Session cookies are httpOnly, `sameSite=lax`, and secure in production.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests confirm Argon2id hashes, password verification, non-raw deterministic session token hashes, production-secure httpOnly lax cookies, and cookie-header parsing. Manual search confirmed no login UI/routes were added.

Remaining/blockers: None for P1-T2.

---

## P1-T3 — Login/logout/me API routes

Status: VERIFIED

Dependencies: P1-T2

Task prompt:

```txt
Implement P1-T3 only.

Create:
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

Rules:
- Login requires email and password.
- Inactive users cannot log in.
- Wrong credentials return generic error.
- Successful login writes audit event.
- Logout deletes session and writes audit event.
- Do not implement registration.
```

Verification prompt:

```txt
Verify P1-T3 only.

Check login/logout/me routes exist and use auth service.
Check errors do not leak whether email exists.
Check audit events are written for login/logout.
Check no registration route exists.
Run lint/typecheck/tests.
```

Implementation evidence: Added `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` App Router route handlers. Routes validate login input with Zod, use the auth service, set/clear secure httpOnly session cookies, return safe user JSON without password data, and do not add registration or password reset.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Route tests verify normalized login input, generic credential errors, session cookie setting, logout cookie clearing, `/me` safe user responses, and service calls. Manual checks confirmed explicit `auth.login` and `auth.logout` audit writes in the auth service and no registration/password-reset route exists.

Remaining/blockers: None for P1-T3.

---

## P1-T4 — RBAC guards

Status: VERIFIED

Dependencies: P1-T3

Task prompt:

```txt
Implement P1-T4 only.

Create:
- src/lib/rbac/roles.ts
- src/lib/rbac/guards.ts

Implement:
- hasRole(user, roles)
- requireAuth()
- requireRole(roles)
- requireTenantAccess(tenantId)
- assertSameTenant(user, tenantId)

Rules:
- SUPER_ADMIN can access global admin features.
- INSTITUTION_ADMIN can manage own tenant.
- REVIEWER can review allowed tenant submissions.
- USER can manage own submissions.

Add tests for all role decisions.
```

Verification prompt:

```txt
Verify P1-T4 only.

Check RBAC helpers exist and are typed.
Check all roles are covered by tests.
Check tenant access rules are explicit.
Run tests and typecheck.
```

Implementation evidence: Added typed RBAC role constants and guard helpers in `src/lib/rbac/roles.ts` and `src/lib/rbac/guards.ts`, including `hasRole`, `requireAuth`, `requireRole`, `requireTenantAccess`, and `assertSameTenant`.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. RBAC tests cover canonical roles, global admin access, tenant admin access, reviewer access, user submission-role access, authentication guard behavior, role guard behavior, and tenant isolation decisions.

Remaining/blockers: None for P1-T4.

---

## P1-T5 — Seed script

Status: VERIFIED

Dependencies: P1-T4

Task prompt:

```txt
Implement P1-T5 only.

Add a seed script that creates:
- one SUPER_ADMIN
- one demo tenant
- one INSTITUTION_ADMIN
- one REVIEWER
- one USER

Use env vars:
- SEED_SUPER_ADMIN_EMAIL
- SEED_SUPER_ADMIN_PASSWORD

Add package script: npm run db:seed
Ensure passwords are hashed.
Script must be idempotent.
```

Verification prompt:

```txt
Verify P1-T5 only.

Check seed script exists and is idempotent.
Check demo users and tenant are created.
Check passwords are hashed.
Check db:seed script exists.
Run seed if environment is available; otherwise document blocker.
```

Implementation evidence: Added seed env validation, `.env.example` seed placeholders, `npm run db:seed`, `scripts/seed.ts`, and a typed idempotent seed service that creates one super admin, one demo tenant, and demo institution admin/reviewer/user accounts with hashed passwords.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. `npm run db:seed` was run twice with local env credentials and returned the same tenant/user IDs, demonstrating idempotency. PostgreSQL introspection confirmed one demo tenant, four seeded users with exact roles, super admin with null tenant, tenant users with tenant IDs, and all seeded `password_hash` values using Argon2id.

Remaining/blockers: None for P1-T5.

---

## P1-T6 — Dashboard shell and protected pages

Status: VERIFIED

Dependencies: P1-T5

Task prompt:

```txt
Implement P1-T6 only.

Create:
- login page
- dashboard layout
- navigation by role
- /dashboard page
- /admin/users placeholder page
- /admin/settings placeholder page
- /reviewer/queue placeholder page
- /submissions placeholder page

Use TailwindCSS.
Unauthenticated users must redirect to login.
Navigation must show only allowed links by role.
Do not implement user management or submissions yet.
```

Verification prompt:

```txt
Verify P1-T6 only.

Check protected dashboard shell works.
Check unauthenticated redirect.
Check role-based navigation.
Check pages are placeholders only for future features.
Run lint, typecheck, and build if possible.

If all P1 tasks are verified, run the Phase 1 verification prompt.
```

Implementation evidence: Added `/login`, a protected dashboard route group layout, role-filtered dashboard navigation, `/dashboard`, `/admin/users`, `/admin/settings`, `/reviewer/queue`, and `/submissions` placeholder pages. Added client login/logout controls and server auth helpers for protected layouts and role layouts.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Navigation tests cover role-based link visibility. Live server smoke tests confirmed unauthenticated `/dashboard` redirects to `/login`, seeded super admin login succeeds, protected dashboard and admin placeholders render with allowed navigation, and logout clears the session cookie.

Remaining/blockers: None for P1-T6.

---

## Phase 1 Verification Prompt

```txt
Verify Phase 1 completely.

Check that P1-T1 through P1-T6 are VERIFIED.
Check auth, RBAC, sessions, seed users, audit basics, and protected shell.
Check no Phase 2 submissions/storage feature was implemented early.
List human interventions needed before Phase 2.
If complete, mark Phase 1 as PHASE VERIFIED and unlock P2-T1.
```

---

# Phase 2 — File Storage and Submission Intake

## Phase 2 Acceptance Criteria

- Submission and submission file tables exist.
- MinIO/S3-compatible storage service exists.
- Users can create submissions.
- Supported uploads: PDF, DOC, DOCX, TXT.
- Upload validates file type, size, ownership, and tenant access.
- Files are stored under tenant-scoped paths.
- Submission upload UI works.

## Phase 2 Human Intervention

Human may need to provide:

- Maximum file size.
- Maximum word limit.
- Sample PDF/DOCX/TXT files.
- Whether DOC binary support is mandatory in MVP or DOCX-only extraction is acceptable with DOC upload stored.

---

## P2-T1 — Submission and file database schema

Status: VERIFIED

Dependencies: Phase 1 verified

Task prompt:

```txt
Implement P2-T1 only.

Add Drizzle schema/migration for:
- submissions
- submission_files

Add enum submission_status:
DRAFT, UPLOADED, EXTRACTING, READY_FOR_SCAN, SCAN_QUEUED, SCANNING, SCAN_COMPLETE, UNDER_REVIEW, HOLD, CLEARED, ESCALATED, FAILED

submissions fields:
- tenant_id
- title
- status
- created_by_user_id
- assigned_reviewer_id nullable
- word_count nullable
- metadata JSON
- created_at/updated_at

submission_files fields:
- tenant_id
- submission_id
- original_filename
- storage_bucket
- storage_key
- mime_type
- file_size_bytes
- checksum_sha256
- uploaded_by_user_id
- created_at

Add indexes.
```

Verification prompt:

```txt
Verify P2-T1 only.

Check submissions and submission_files schema/migration.
Check all status enum values are exact.
Check tables are tenant-aware and indexed.
Run typecheck/migration generation.
```

Implementation evidence: Added `submission_status` enum, `submissions` table, `submission_files` table, tenant-aware foreign keys, file/submission metadata fields, nonnegative count/size checks, and useful indexes. Generated and applied migration `drizzle/0002_lively_rictor.sql`.

Verification evidence: `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. PostgreSQL introspection confirmed `submissions` and `submission_files` exist, all 12 status enum values are exact and ordered, and tenant/status/user/file lookup indexes exist.

Remaining/blockers: None for P2-T1.

---

## P2-T2 — MinIO storage service

Status: VERIFIED

Dependencies: P2-T1

Task prompt:

```txt
Implement P2-T2 only.

Create src/lib/storage/object-storage.ts.

Implement:
- putObject
- getObject
- deleteObject
- getPresignedUploadUrl if useful
- getPresignedDownloadUrl if useful
- buildTenantStorageKey(tenantId, submissionId, filename)

Rules:
- Storage keys must include tenant_id.
- Validate storage config from env.
- Never expose raw storage credentials to client.
```

Verification prompt:

```txt
Verify P2-T2 only.

Check storage service exists and is typed.
Check tenant-scoped storage key generation.
Check no credentials are exposed to client code.
Run tests or document manual MinIO verification.
```

Implementation evidence: Added `src/lib/storage/object-storage.ts` with typed MinIO/S3-compatible client creation, storage config access, tenant-scoped key generation, `putObject`, `getObject`, `deleteObject`, and presigned upload/download URL helpers.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Unit tests verify tenant-scoped key generation, filename sanitization, typed S3 commands, bucket usage, and no secret leakage through command payloads. Real MinIO smoke test successfully put, read, and deleted an object under a tenant-scoped key.

Remaining/blockers: None for P2-T2.

---

## P2-T3 — Create submission API

Status: VERIFIED

Dependencies: P2-T2

Task prompt:

```txt
Implement P2-T3 only.

Create:
- GET /api/submissions
- POST /api/submissions
- GET /api/submissions/:id

Rules:
- USER sees own submissions.
- REVIEWER sees allowed tenant submissions.
- INSTITUTION_ADMIN sees all tenant submissions.
- SUPER_ADMIN can use tenant filter or see global view.
- Every query must be tenant-scoped.
- Submission creation writes audit event.

Do not implement upload yet.
```

Verification prompt:

```txt
Verify P2-T3 only.

Check submission APIs exist and enforce RBAC/tenant scope.
Check audit event on creation.
Check upload is not implemented in this task.
Run tests/typecheck.
```

Implementation evidence: Added typed submission service helpers and `GET /api/submissions`, `POST /api/submissions`, and `GET /api/submissions/:id` routes. APIs enforce role-aware tenant scope, owner-only user listing, tenant staff listing, super-admin global or tenant-filtered listing, and write `submission.create` audit events on creation.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Unit tests verified role/tenant scope helpers. Live API smoke with seeded user created a submission, read it by ID, listed it, and confirmed the audit event in PostgreSQL. Search confirmed no upload route or upload implementation was added during P2-T3.

Remaining/blockers: None for P2-T3.

---

## P2-T4 — Upload API

Status: VERIFIED

Dependencies: P2-T3

Task prompt:

```txt
Implement P2-T4 only.

Create POST /api/submissions/:id/upload.

Support file types:
- PDF
- DOC
- DOCX
- TXT

Validation:
- allowed MIME types
- max size from tenant_settings
- submission must belong to current tenant
- only owner/admin can upload before scan starts

Store file in MinIO.
Store metadata in submission_files.
Update submission status to UPLOADED.
Write audit event.
```

Verification prompt:

```txt
Verify P2-T4 only.

Check upload route validates file type/size/tenant/ownership.
Check file metadata and checksum are stored.
Check storage key is tenant-scoped.
Check status updates to UPLOADED.
Check audit event is written.
Run tests/typecheck.
```

Implementation evidence: Added `POST /api/submissions/:id/upload` and a typed submission upload service. The service validates supported MIME types, reads tenant upload size settings with a 25 MB default, enforces tenant-scoped submission lookup and owner/admin-before-scan upload rules, stores files in MinIO with tenant-scoped keys, records metadata and SHA-256 checksums in `submission_files`, updates submission status to `UPLOADED`, and writes `submission.file.upload` audit events.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Unit tests cover supported MIME validation, tenant max-size settings, oversize rejection, and owner/admin/reviewer/tenant/status upload permissions. Live API smoke created a submission, uploaded a TXT file, rejected an unsupported image MIME type, denied reviewer upload, confirmed metadata/status/audit rows in PostgreSQL, and retrieved the stored object from MinIO.

Remaining/blockers: None for P2-T4.

---

## P2-T5 — Upload UI

Status: VERIFIED

Dependencies: P2-T4

Task prompt:

```txt
Implement P2-T5 only.

Create:
- /submissions page with list
- /submissions/new page
- upload component with drag/drop and file picker
- submission detail page showing file and status

Use TailwindCSS.
Use accessible labels and error messages.
Do not implement extraction yet.
```

Verification prompt:

```txt
Verify P2-T5 only.

Check user can create a submission and upload a file through UI.
Check submission detail shows UPLOADED status.
Check accessibility basics for forms.
Check extraction/preprocessing/scan are not implemented yet.
Run lint/typecheck/build if possible.

If all P2 tasks are verified, run Phase 2 verification prompt.
```

Implementation evidence: Replaced the placeholder submissions page with a tenant-scoped submission list, added `/submissions/new` with a drag/drop and file-picker upload form, added `/submissions/:id` detail page showing submission status and uploaded file metadata, and added a typed submission detail service helper for file summaries.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Browser smoke logged in as the seeded user, opened `/submissions/new`, created a submission, uploaded a TXT file, landed on `/submissions/1f69777d-cb07-42ae-947e-5fcb4d1c46b1`, and confirmed the detail page showed `UPLOADED`, the uploaded filename, checksum, file count, tenant ID, and submission ID. Searches confirmed no extraction, preprocessing, scan, provider, worker, or report feature was implemented.

Remaining/blockers: None for P2-T5.

---

## Phase 2 Verification Prompt

```txt
Verify Phase 2 completely.

Check P2-T1 through P2-T5 are VERIFIED.
Check secure tenant-scoped file upload and submission intake works.
Check files are in MinIO and metadata is in PostgreSQL.
Check no Phase 3 extraction was implemented early.
List human interventions needed before Phase 3.
If complete, mark Phase 2 as PHASE VERIFIED and unlock P3-T1.
```

---

# Phase 3 — Text Extraction and Preprocessing

## Phase 3 Acceptance Criteria

- Extracted text, preprocessing, and text chunk tables exist.
- TXT, DOCX, and PDF extraction work.
- Raw text and sanitized scan text are stored separately.
- Bibliography, quotes, small-match threshold, and whitespace normalization are implemented.
- Preprocessing summary is visible in UI.

## Phase 3 Human Intervention

Human may need to provide:

- Sample documents for golden corpus.
- Small-match word threshold.
- Whether bibliography/reference detection should be aggressive or conservative.
- Whether binary DOC extraction is mandatory or can be converted externally.

---

## P3-T1 — Extracted text and preprocessing schema

Status: VERIFIED

Dependencies: Phase 2 verified

Task prompt:

```txt
Implement P3-T1 only.

Add schema/migration for:
- extracted_texts
- preprocessing_runs
- text_chunks

extracted_texts:
- tenant_id
- submission_id
- raw_text
- word_count
- char_count
- extraction_method
- created_at

preprocessing_runs:
- tenant_id
- submission_id
- original_word_count
- sanitized_word_count
- removed_word_count
- rules_applied JSON
- sanitized_text
- created_at

text_chunks:
- tenant_id
- submission_id
- chunk_index
- text
- start_char
- end_char
- word_count
```

Verification prompt:

```txt
Verify P3-T1 only.

Check schema/migration exists for extracted_texts, preprocessing_runs, text_chunks.
Check all tables are tenant-aware.
Run typecheck/migration checks.
```

Implementation evidence: Added tenant-aware Drizzle schemas and migration for `extracted_texts`, `preprocessing_runs`, and `text_chunks` with required columns, foreign keys, indexes, JSON rules metadata, nonnegative count checks, and chunk range checks.

Verification evidence: `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. PostgreSQL introspection confirmed all three tables, required columns, tenant IDs, submission IDs, non-null fields, and indexes exist. Searches confirmed no extraction service, preprocessing logic, scan, provider, worker, or report implementation was added.

Remaining/blockers: None for P3-T1.

---

## P3-T2 — Text extraction service

Status: VERIFIED

Dependencies: P3-T1

Task prompt:

```txt
Implement P3-T2 only.

Create src/features/extraction/extract-text.ts.

Support:
- TXT extraction
- DOCX extraction
- PDF extraction

Expose:
- extractTextFromTxt(buffer)
- extractTextFromDocx(buffer)
- extractTextFromPdf(buffer)
- extractTextFromFile({ buffer, mimeType, filename })

Return:
- rawText
- wordCount
- charCount
- extractionMethod

Add tests with small fixtures.
Do not implement preprocessing yet.
```

Verification prompt:

```txt
Verify P3-T2 only.

Check extraction functions exist and are tested.
Check TXT/DOCX/PDF paths are supported.
Check preprocessing was not added in this task.
Run tests/typecheck.
```

Implementation evidence: Added `src/features/extraction/extract-text.ts` with typed TXT, DOCX, PDF, and dispatch extraction functions returning `rawText`, `wordCount`, `charCount`, and `extractionMethod`. DOCX extraction uses `mammoth`; PDF extraction uses `pdf-parse`; unsupported types throw a typed error.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests cover TXT extraction, DOCX extraction with an in-memory DOCX fixture, PDF extraction with an in-memory PDF fixture, dispatch by MIME/filename, and explicit rejection of legacy `.doc`. Searches confirmed no preprocessing, scan, provider, worker, or report feature was added.

Remaining/blockers: None for P3-T2. Binary `.doc` extraction remains unsupported in this task because the tracker only required TXT, DOCX, and PDF extraction paths.

---

## P3-T3 — Extraction API and worker step

Status: VERIFIED

Dependencies: P3-T2

Task prompt:

```txt
Implement P3-T3 only.

Create POST /api/submissions/:id/extract.

Rules:
- Submission must be UPLOADED.
- Load file from MinIO.
- Extract text.
- Store extracted_texts row.
- Update submission.word_count.
- Update status to READY_FOR_SCAN.
- Write audit event.

Do not implement scan yet.
```

Verification prompt:

```txt
Verify P3-T3 only.

Check extraction route enforces status and tenant access.
Check extracted_texts row is stored.
Check submission status becomes READY_FOR_SCAN.
Check audit event is written.
Run tests/typecheck.
```

Implementation evidence: Added `POST /api/submissions/:id/extract` and a typed extraction service that enforces scoped submission access, requires `UPLOADED` status, loads the latest submission file from MinIO, runs the P3-T2 extraction service, stores an `extracted_texts` row, updates `submissions.word_count`, changes status to `READY_FOR_SCAN`, and writes a `submission.extract` audit event.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Live API smoke created and uploaded a TXT submission, called the extract route, confirmed `READY_FOR_SCAN`, word count `8`, method `txt`, extracted text row in PostgreSQL, and `submission.extract` audit event. Guard smoke confirmed extraction returns HTTP 409 for `DRAFT` and already `READY_FOR_SCAN` submissions. Searches confirmed no preprocessing or scan implementation was added.

Remaining/blockers: None for P3-T3.

---

## P3-T4 — Preprocessing engine

Status: VERIFIED

Dependencies: P3-T3

Task prompt:

```txt
Implement P3-T4 only.

Create src/features/preprocessing/preprocess-text.ts.

Implement:
- normalizeWhitespace
- removeBibliographySection
- removeQuotedText
- removeSmallMatchesByWordThreshold
- splitIntoChunks

Input:
- rawText
- options: removeBibliography, removeQuotes, smallMatchWordThreshold

Output:
- sanitizedText
- originalWordCount
- sanitizedWordCount
- removedWordCount
- rulesApplied
- chunks

Add tests for bibliography/removal, references removal, quoted text removal, small match threshold, and whitespace normalization.
```

Verification prompt:

```txt
Verify P3-T4 only.

Check preprocessing engine functions and tests.
Check original text and sanitized text are conceptually separate.
Check tests cover each rule.
Run tests/typecheck.
```

Implementation evidence: Added `src/features/preprocessing/preprocess-text.ts` with `normalizeWhitespace`, `removeBibliographySection`, `removeQuotedText`, `removeSmallMatchesByWordThreshold`, `splitIntoChunks`, and `preprocessText`. The engine returns separate sanitized text, original/sanitized/removed word counts, applied rules, and chunks with character ranges.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests cover whitespace normalization, bibliography section removal, references removal, quoted text removal, small-match threshold filtering, chunk splitting, and separate original/sanitized counts with rules applied. Searches confirmed no API, scan, provider, worker, report, AI, or grammar implementation was added.

Remaining/blockers: None for P3-T4.

---

## P3-T5 — Preprocessing API and preview UI

Status: VERIFIED

Dependencies: P3-T4

Task prompt:

```txt
Implement P3-T5 only.

Create POST /api/submissions/:id/preprocess.

Rules:
- Submission must be READY_FOR_SCAN.
- Use latest extracted_texts.
- Apply tenant settings.
- Store preprocessing_runs and text_chunks.
- Return summary.

Update submission detail UI to show:
- extracted word count
- sanitized word count
- removed word count
- rules applied

Write audit event.
```

Verification prompt:

```txt
Verify P3-T5 only.

Check preprocessing route stores preprocessing_runs and text_chunks.
Check UI shows preprocessing summary.
Check audit event is written.
Check scan is not implemented yet.
Run lint/typecheck/tests/build if possible.

If all P3 tasks are verified, run Phase 3 verification prompt.
```

Implementation evidence: Added `POST /api/submissions/:id/preprocess`, typed preprocessing service, tenant settings option resolution, preprocessing persistence for `preprocessing_runs` and `text_chunks`, `submission.preprocess` audit events, a detail-page preprocessing summary, and a detail-page preprocessing action button.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Live smoke created, uploaded, extracted, and preprocessed a TXT submission; confirmed `preprocessing_runs`, `text_chunks`, sanitized text, counts, rules, and `submission.preprocess` audit row in PostgreSQL; and verified the detail UI shows extracted word count, sanitized word count, removed word count, chunk count, and rules applied. Searches confirmed no scan orchestration, provider, worker, report, AI, or grammar implementation was added.

Remaining/blockers: None for P3-T5.

---

## Phase 3 Verification Prompt

```txt
Verify Phase 3 completely.

Check P3-T1 through P3-T5 are VERIFIED.
Check extraction and preprocessing work and are tenant-scoped.
Check raw text and sanitized scan text are separate.
Check no Phase 4 scan orchestration was implemented early.
List human interventions needed before Phase 4.
If complete, mark Phase 3 as PHASE VERIFIED and unlock P4-T1.
```

---

# Phase 4 — Scan Job Orchestration and Provider Adapter

## Phase 4 Acceptance Criteria

- Scan job/result/source/AI/grammar tables exist.
- Scan provider interface exists.
- Mock provider works deterministically.
- PostgreSQL-backed job queue and worker exist.
- User can queue scan and worker completes it.
- Scan status UI works.
- No real paid provider is required for MVP unless human provides keys and approves.

## Phase 4 Human Intervention

Human may need to provide:

- Whether mock provider is acceptable for MVP demo.
- Real provider selection.
- API keys/contracts if real integration is required.
- Scan timeout/SLA expectations.

---

## P4-T1 — Scan schema

Status: VERIFIED

Dependencies: Phase 3 verified

Task prompt:

```txt
Implement P4-T1 only.

Add schema/migration for:
- scan_jobs
- scan_results
- source_matches
- ai_assessments
- grammar_findings

scan_jobs:
- tenant_id, submission_id, provider, status, attempts, error_message, started_at, finished_at, created_at

scan_results:
- tenant_id, submission_id, scan_job_id, similarity_score, ai_probability, original_word_count, scanned_word_count, provider_metadata JSON, created_at

source_matches:
- tenant_id, scan_result_id, source_title, source_url, matched_text, start_char, end_char, similarity_score

ai_assessments:
- tenant_id, scan_result_id, label, probability, sentence_start_char, sentence_end_char, explanation nullable

grammar_findings:
- tenant_id, scan_result_id, message, offset, length, replacement_suggestions JSON
```

Verification prompt:

```txt
Verify P4-T1 only.

Check scan-related schema/migration exists and is tenant-aware.
Check indexes support lookup by tenant/submission/job.
Run typecheck/migration checks.
```

Implementation evidence: Added tenant-aware Drizzle schemas and migration for `scan_jobs`, `scan_results`, `source_matches`, `ai_assessments`, and `grammar_findings`, including foreign keys, indexes for tenant/submission/job/result lookup, JSON metadata/suggestions, and range/count checks.

Verification evidence: `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. PostgreSQL introspection confirmed all five scan-related tables, required columns, tenant IDs, submission/job/result references, and lookup indexes exist. Searches confirmed no provider interface, mock provider, queue, worker, scan API, or report feature was implemented.

Remaining/blockers: None for P4-T1.

---

## P4-T2 — Scan provider interface and mock provider

Status: VERIFIED

Dependencies: P4-T1

Task prompt:

```txt
Implement P4-T2 only.

Create:
- src/features/scanning/providers/types.ts
- src/features/scanning/providers/mock.provider.ts
- src/features/scanning/providers/index.ts

Interface ScanProvider.scan(input) returns:
- similarityScore
- aiProbability
- sourceMatches
- aiAssessments
- grammarFindings
- providerMetadata

Mock provider must be deterministic based on text length and sample phrases.
Add tests.
Do not call external APIs.
```

Verification prompt:

```txt
Verify P4-T2 only.

Check provider interface and mock provider exist.
Check mock results are deterministic.
Check no external API call or secret is used.
Run tests/typecheck.
```

Implementation evidence: Added typed scan provider interfaces, deterministic `mockScanProvider`, and provider index exports under `src/features/scanning/providers/*`. The mock provider returns similarity score, AI probability, source matches, AI assessments, grammar findings, and provider metadata based only on local text length and sample phrases.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests confirm deterministic output for repeated input, source match generation, AI assessment generation, grammar findings, provider metadata, and score/probability bounds. Searches confirmed no external API calls, secrets, job queue, worker, scan API route, or real provider integration was added.

Remaining/blockers: None for P4-T2.

---

## P4-T3 — PostgreSQL-backed job queue

Status: VERIFIED

Dependencies: P4-T2

Task prompt:

```txt
Implement P4-T3 only.

Create:
- src/lib/jobs/scan-queue.ts
- src/server/workers/scan-worker.ts

Implement:
- enqueueScanJob(submissionId)
- claimNextScanJob()
- markJobRunning()
- markJobSucceeded()
- markJobFailed()
- retry with max attempts

Use row locking / SKIP LOCKED if appropriate.
Add npm script: npm run worker.
Do not add scan API route yet.
```

Verification prompt:

```txt
Verify P4-T3 only.

Check job queue and worker exist.
Check worker can claim jobs safely.
Check retry behavior exists.
Check npm run worker exists.
Run tests/typecheck.
```

Implementation evidence: Added typed PostgreSQL-backed scan queue helpers in `src/lib/jobs/scan-queue.ts`, a worker iteration module in `src/server/workers/scan-worker.ts`, updated the worker entrypoint and `npm run worker` script, and added scan queue/worker tests. The queue derives tenant ID from the submission, inserts `QUEUED` jobs, atomically claims jobs with `FOR UPDATE SKIP LOCKED`, supports running/succeeded/failed updates, and requeues failed jobs until max attempts is reached.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run worker`, and a live PostgreSQL queue smoke test passed. The smoke test enqueued a scan job, claimed it, requeued it after first failure, marked it `FAILED` at max attempts, and confirmed cleanup left zero smoke tenants. Scope searches confirmed no scan API route, result persistence, report feature, real provider call, hard-coded secret, or future-phase implementation was added.

Remaining/blockers: None for P4-T3.

---

## P4-T4 — Start scan API

Status: VERIFIED

Dependencies: P4-T3

Task prompt:

```txt
Implement P4-T4 only.

Create POST /api/submissions/:id/scan.

Rules:
- Submission must have preprocessing run.
- Status must be READY_FOR_SCAN.
- Enqueue scan job.
- Update status to SCAN_QUEUED.
- Write audit event.

Worker must:
- set status SCANNING
- call mock provider
- store scan_results, source_matches, ai_assessments, grammar_findings
- set status SCAN_COMPLETE
- write audit event
```

Verification prompt:

```txt
Verify P4-T4 only.

Check scan API enqueues only eligible submissions.
Check worker stores normalized scan results.
Check status lifecycle moves correctly.
Check audit events are written.
Check duplicate running scans are prevented.
Run tests/typecheck.
```

Implementation evidence: Added `POST /api/submissions/[id]/scan`, a typed scanning service, worker mock-provider execution, normalized scan result persistence, scan lifecycle status updates, duplicate active scan prevention, audit events, and focused tests. The start scan path requires an authenticated, tenant-scoped accessible submission with status `READY_FOR_SCAN` and a latest preprocessing run before queueing a scan job.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run worker`, and a live PostgreSQL scan lifecycle smoke test passed. The smoke test created a temporary preprocessed submission, started a scan, confirmed duplicate start was blocked, ran the worker, verified `SCAN_COMPLETE`, job `SUCCEEDED`, normalized source/AI/grammar result rows, scan audit events, and cleanup left zero smoke tenants.

Remaining/blockers: None for P4-T4.

---

## P4-T5 — Scan status UI

Status: VERIFIED

Dependencies: P4-T4

Task prompt:

```txt
Implement P4-T5 only.

Update submission detail page:
- show status timeline
- show scan button when READY_FOR_SCAN
- show queued/running/completed state
- show latest similarity and AI score summary when complete

Do not build full report UI yet.
```

Verification prompt:

```txt
Verify P4-T5 only.

Check UI reflects scan lifecycle.
Check user cannot start duplicate scan while queued/running.
Check only summary is shown, not full report page.
Run lint/typecheck/build.

If all P4 tasks are verified, run Phase 4 verification prompt.
```

Implementation evidence: Added scan lifecycle UI to the submission detail page, a guarded client start-scan button, latest scan summary loading, and scan status helper tests. The UI shows a status timeline, start button only for preprocessed `READY_FOR_SCAN` submissions, queued/running/completed states, and completed similarity/AI summary counts without full report details.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run worker`, and Playwright browser smoke passed. Browser smoke confirmed `READY_FOR_SCAN` displayed a start button, clicking it moved the page to `SCAN_QUEUED` and removed the button, and a `SCAN_COMPLETE` submission displayed similarity `42%`, AI probability `74%`, source/grammar counts, and no report/PDF/reviewer UI.

Remaining/blockers: None for P4-T5.

---

## Phase 4 Verification Prompt

```txt
Verify Phase 4 completely.

Check P4-T1 through P4-T5 are VERIFIED.
Check mock scan pipeline works end-to-end.
Check provider abstraction prevents vendor lock-in.
Check no paid provider integration was attempted without approval.
List human interventions needed before Phase 5.
If complete, mark Phase 4 as PHASE VERIFIED and unlock P5-T1.
```

---

# Phase 5 — Reviewer Workflow, Report UI, and PDF Export

## Phase 5 Acceptance Criteria

- Review cases/events and report snapshots exist.
- Report JSON assembly exists.
- Report UI separates similarity, AI, grammar, exclusions, and provider metadata.
- Reviewer queue and case workflow work.
- Immutable report snapshot exists.
- PDF report is generated and stored.

## Phase 5 Human Intervention

Human may need to approve:

- Report disclaimer wording.
- Institutional report template.
- Reviewer status workflow.
- Whether users can see full reports or redacted reports.

---

## P5-T1 — Review schema

Status: VERIFIED

Dependencies: Phase 4 verified

Task prompt:

```txt
Implement P5-T1 only.

Add schema/migration for:
- review_cases
- review_events
- report_snapshots

review_cases:
- tenant_id, submission_id, assigned_reviewer_id, status, final_decision nullable, created_at, updated_at

review_events:
- tenant_id, review_case_id, actor_user_id, event_type, comment, metadata JSON, created_at

report_snapshots:
- tenant_id, submission_id, scan_result_id, snapshot_version, report_json JSON, pdf_storage_key nullable, created_by_user_id, created_at
```

Verification prompt:

```txt
Verify P5-T1 only.

Check review and report snapshot schema/migration exists.
Check tables are tenant-aware.
Run typecheck/migration checks.
```

Implementation evidence: Added tenant-aware `review_cases`, `review_events`, and `report_snapshots` schema definitions plus Drizzle migration `drizzle/0005_easy_red_skull.sql`. The schema includes the required columns, foreign keys, JSON fields, report snapshot versioning, and tenant/submission/review lookup indexes.

Verification evidence: `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. PostgreSQL introspection confirmed all three tables, required columns, tenant IDs, foreign keys, indexes, and snapshot version check exist. Scope search confirmed no report service, review workflow, PDF generation, or UI behavior was implemented.

Remaining/blockers: None for P5-T1.

---

## P5-T2 — Report service

Status: VERIFIED

Dependencies: P5-T1

Task prompt:

```txt
Implement P5-T2 only.

Create src/features/reports/report.service.ts.

Given a submission ID, assemble typed ReportJson:
- submission metadata
- file metadata
- extraction/preprocessing summary
- scan result
- source matches
- AI assessments
- grammar findings
- reviewer notes if any
- provider metadata
- timestamps
- tenant branding

Add tests using seeded/mock data.
Do not implement PDF yet.
```

Verification prompt:

```txt
Verify P5-T2 only.

Check report service returns complete typed ReportJson.
Check tenant isolation is enforced.
Check tests cover assembly.
Run tests/typecheck.
```

Implementation evidence: Added `src/features/reports/report.service.ts` with typed `ReportJson`, standard report disclaimer, tenant branding resolution, read-only DB assembly through tenant-scoped queries, reviewer note inclusion, and tests using mock report data. The service assembles submission metadata, file metadata, extraction/preprocessing summaries, scan result, source matches, AI assessments, grammar findings, provider metadata, review notes, timestamps, and tenant branding.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. A live PostgreSQL smoke created tenant-scoped report data, verified complete report assembly, verified another tenant user receives `null`, and confirmed cleanup left zero smoke tenants. Scope searches confirmed no report route, PDF generation, snapshot insertion, reviewer workflow, or UI was implemented.

Remaining/blockers: None for P5-T2.

---

## P5-T3 — Report UI

Status: VERIFIED

Dependencies: P5-T2

Task prompt:

```txt
Implement P5-T3 only.

Create /submissions/[id]/report.

Show:
- overall similarity score
- AI probability
- source-wise matches
- highlighted matched text
- AI-assessed sections
- grammar findings
- exclusions summary
- provider metadata
- scan timestamp

Keep AI and similarity visually separate.
Do not combine them into one misconduct score.
```

Verification prompt:

```txt
Verify P5-T3 only.

Check report page renders from DB data.
Check AI and similarity are separated.
Check empty states and access control.
Run lint/typecheck/build.
```

Implementation evidence: Added `/submissions/[id]/report` as a protected App Router page backed by `getReportJsonForSubmission`. Added report presentation components and helpers for separated similarity and AI sections, source-wise matches with highlighted excerpts, AI-assessed sections, grammar findings, exclusions summary, provider metadata, scan timestamp, file/extraction summary, empty states, and a completed-scan link from the submission scan panel. Added unit tests for report UI formatting helpers.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Playwright browser smoke against live PostgreSQL-backed data confirmed the report page renders DB source/AI/grammar data, matched text is highlighted with `mark`, similarity and AI are visually separate with no combined misconduct score, empty source/AI/grammar states render, and cross-tenant access returns 404. Scope searches confirmed no incomplete TODO/FIXME markers and no PDF generation, immutable snapshot creation, MinIO report writes, or reviewer workflow implementation was added in P5-T3.

Remaining/blockers: None for P5-T3.

---

## P5-T4 — Reviewer queue and status workflow

Status: VERIFIED

Dependencies: P5-T3

Task prompt:

```txt
Implement P5-T4 only.

Create:
- /reviewer/queue
- /reviewer/cases/[id]

Reviewer can:
- assign self if unassigned
- add note
- set status HOLD, CLEARED, ESCALATED
- view report
- view event timeline

Institution admin can view all tenant review cases.
Write review_events and audit_events for each action.
```

Verification prompt:

```txt
Verify P5-T4 only.

Check reviewer queue and case pages work.
Check status transitions are validated.
Check review_events and audit_events are written.
Check tenant/RBAC access is enforced.
Run tests/typecheck/build.
```

Implementation evidence: Added a tenant-aware review service, `/reviewer/queue`, `/reviewer/cases/[id]`, and server actions for reviewer self-assignment, notes, and status changes. The workflow supports reviewer self-assignment on unassigned open cases, note creation, status changes to `HOLD`, `CLEARED`, and `ESCALATED`, event timeline display, report links, institution-admin tenant-wide queue visibility, and review/audit event writes for each state-changing action. Added unit tests for permissions and status-transition validation.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests passed with 20 test files and 80 tests. Browser smoke with live PostgreSQL-backed data verified reviewer queue visibility, reviewer case page/timeline, view-report link, institution-admin visibility of all tenant review cases, and cross-tenant reviewer 404. DB smoke verified `ASSIGNED_SELF`, `NOTE_ADDED`, and `STATUS_CHANGED` `review_events`; matching `review_case.assign_self`, `review_case.note_added`, and `review_case.status_changed` `audit_events`; reviewer/submission assignment updates; submission status synchronization; and invalid final-status transition blocking.

Remaining/blockers: None for P5-T4.

---

## P5-T5 — PDF report generation

Status: VERIFIED

Dependencies: P5-T4

Task prompt:

```txt
Implement P5-T5 only.

Create GET /api/submissions/:id/report/pdf.

Generate PDF containing:
- tenant logo/name
- submission details
- file details
- similarity score
- AI probability
- source matches
- exclusions summary
- reviewer notes
- audit/report timestamp
- disclaimer: scores are indicators and require human review

Store generated PDF in MinIO.
Save pdf_storage_key in report_snapshots.
Ensure access control.
```

Verification prompt:

```txt
Verify P5-T5 only.

Check PDF downloads successfully.
Check snapshot is stored.
Check pdf_storage_key is saved.
Check PDF includes required sections and disclaimer.
Check access control.
Run tests/typecheck/build.

If all P5 tasks are verified, run Phase 5 verification prompt.
```

Implementation evidence: Added `GET /api/submissions/[id]/report/pdf`, PDF rendering from the existing typed report JSON, tenant-scoped report PDF storage keys, MinIO/S3-compatible upload, immutable `report_snapshots` insertion with `pdf_storage_key`, and a `report.pdf.generated` audit event. Added `pdfkit` and `@types/pdfkit`, a standalone PDFKit type declaration for bundled Next.js server routes, object-storage report key helper tests, and PDF content tests that extract generated PDF text.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests passed with 21 test files and 81 tests. Live route smoke against PostgreSQL and MinIO returned HTTP 200 with `application/pdf`, a `%PDF` response, downloadable content disposition, required PDF text sections, a stored MinIO object, a `report_snapshots` row containing `report_json`, `snapshot_version`, and `pdf_storage_key`, a `report.pdf.generated` audit event, and HTTP 404 for a cross-tenant user. The initial live smoke exposed a bundled PDFKit font-data path issue; switching to the standalone PDFKit bundle fixed it and the checks were rerun.

Remaining/blockers: None for P5-T5.

---

## Phase 5 Verification Prompt

```txt
Verify Phase 5 completely.

Check P5-T1 through P5-T5 are VERIFIED.
Check report, reviewer workflow, immutable snapshot, and PDF export work.
Check human-reviewed disclaimer/report policy is recorded.
List human interventions needed before Phase 6.
If complete, mark Phase 5 as PHASE VERIFIED and unlock P6-T1.
```

---

# Phase 6 — Admin Dashboard, Analytics, Customization, and Support

## Phase 6 Acceptance Criteria

- Admin analytics service/API exists.
- Admin dashboard shows real tenant-scoped metrics.
- Tenant settings/customization work.
- Institution user management works.
- Support ticket module works.

## Phase 6 Human Intervention

Human may need to provide:

- Logo and theme colors.
- Usage limits.
- SLA categories.
- Support workflow ownership.
- Whether users can self-register or only admins can create accounts.

---

## P6-T1 — Admin analytics service

Status: VERIFIED

Dependencies: Phase 5 verified

Task prompt:

```txt
Implement P6-T1 only.

Create src/features/analytics/analytics.service.ts.

Metrics:
- total submissions
- submissions by status
- scans completed this month
- words processed this month
- high similarity count
- high AI probability count
- users by role
- usage against tenant limits

Add GET /api/admin/analytics.
Institution admin sees own tenant.
Super admin can pass tenant_id or see global summary.
```

Verification prompt:

```txt
Verify P6-T1 only.

Check analytics service and API exist.
Check metrics are tenant-scoped.
Check super admin behavior is correct.
Run tests/typecheck.
```

Implementation evidence: Added `src/features/analytics/analytics.service.ts` and `GET /api/admin/analytics`. The service returns total submissions, submissions by status, scans completed this month, words processed this month, high similarity count, high AI probability count, users by role, and usage against tenant limits. Institution admins are scoped to their tenant; super admins can query globally or pass `tenant_id`. Added helper tests for scope resolution, default/custom usage limits, status/role maps, usage percentages, and UTC month start calculation.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests passed with 22 test files and 85 tests. Live API smoke with two temporary tenants verified institution-admin tenant metrics, tenant settings limits, users by role, status counts, scan/word/high-risk metrics, super-admin global summary, super-admin `tenant_id` filtering, reviewer HTTP 403, and cleanup.

Remaining/blockers: None for P6-T1.

---

## P6-T2 — Admin dashboard UI

Status: VERIFIED

Dependencies: P6-T1

Task prompt:

```txt
Implement P6-T2 only.

Build admin dashboard cards/charts for:
- submissions
- words processed
- scans completed
- high-risk submissions
- users by role
- monthly usage

Use accessible cards/charts. Avoid heavy chart libraries unless necessary.
```

Verification prompt:

```txt
Verify P6-T2 only.

Check dashboard shows real metrics.
Check institution admin and super admin views are correct.
Check UI is accessible and responsive enough for MVP.
Run lint/typecheck/build.
```

Implementation evidence: Added the admin analytics dashboard to the protected `/dashboard` route for `SUPER_ADMIN` and `INSTITUTION_ADMIN` users. The dashboard uses the P6-T1 typed analytics service and renders submissions, words processed, scans completed, high-risk submissions, submissions by status, users by role, monthly usage meters, and risk threshold details with simple accessible HTML/CSS charts and no chart library. Non-admin users retain the existing dashboard shell. Added tested view helpers for number/percentage formatting and chart row generation.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed. Tests passed with 23 files and 87 tests. Playwright smoke against the production build verified institution-admin login renders tenant-scoped real metrics only for the temporary tenant, including 3 submissions, 2,800 words processed this month, 2 scans completed, high-risk submissions, status rows, role rows, and usage meters. Super-admin login rendered the global dashboard summary. Mobile viewport smoke confirmed the dashboard remains vertically readable at 390px width. Scope searches found no incomplete TODO/FIXME markers, hard-coded secrets, or future tenant settings/user management/support/retention/integration features in P6-T2 files.

Remaining/blockers: None for P6-T2.

---

## P6-T3 — Tenant settings and customization

Status: VERIFIED

Dependencies: P6-T2

Task prompt:

```txt
Implement P6-T3 only.

Implement tenant settings:
- logo URL/storage key
- primary color
- report footer text
- max file size
- monthly word limit
- submission limit
- small match word threshold
- allow repository reuse default false

Create /admin/settings.
Institution admin can update own tenant settings.
Write audit event.
Branding affects dashboard header and report.
```

Verification prompt:

```txt
Verify P6-T3 only.

Check settings save/load.
Check branding appears in dashboard/report.
Check limits are used where applicable.
Check audit event is written.
Run tests/typecheck/build.
```

Implementation evidence: Added typed tenant settings service and `/admin/settings` form with Zod validation for logo URL/storage key, primary color, report footer, max file size, monthly word limit, submission limit, small match threshold, and repository reuse default. Institution admins can load and update their own tenant settings; updates are saved in `tenant_settings.settings` and write `tenant.settings.update` audit events. Dashboard shell branding now uses tenant name/logo/color. Report UI/PDF branding now accepts nullable saved branding values and uses saved color/footer/logo storage key. Existing upload, preprocessing, and analytics limit resolvers now read canonical nested settings while retaining prior flat-key compatibility.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed after fixes. Tests passed with 24 files and 91 tests. Playwright smoke against a production build verified institution admin settings load/save, saved form values, dashboard header branding color and tenant name, report header branding color and footer text, mobile readability, analytics API usage limits from saved settings, and `tenant.settings.update` audit row. PostgreSQL smoke confirmed settings JSON persisted all P6-T3 fields and temporary tenants/users were cleaned up. Scope searches found no incomplete TODO/FIXME markers, hard-coded secrets, or support/user-management/provider/OAuth/LMS/PWA/retention features added in P6-T3 files.

Remaining/blockers: None for P6-T3.

---

## P6-T4 — User management UI

Status: VERIFIED

Dependencies: P6-T3

Task prompt:

```txt
Implement P6-T4 only.

Create /admin/users.

Institution admin can:
- list tenant users
- create user
- update role
- activate/deactivate user
- reset password manually or generate reset token

Rules:
- Institution admin cannot create SUPER_ADMIN.
- Institution admin cannot move user to another tenant.
- Super admin can manage tenant admins.
- Write audit events.
```

Verification prompt:

```txt
Verify P6-T4 only.

Check user management works.
Check RBAC restrictions are enforced.
Check audit events exist.
Run tests/typecheck/build.
```

Implementation evidence: Added tenant-scoped user management service, `/admin/users` server actions, and `/admin/users` UI. Institution admins can list own-tenant users, create non-super-admin users, update roles, activate/deactivate users, and manually reset passwords. Super admins can list tenant users globally and create/manage tenant admins by selecting a tenant. User actions write audit events, password reset and deactivation invalidate sessions, and the service has no tenant-move operation.

Verification evidence: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed after the test assertion fix. Tests passed with 25 files and 95 tests. Playwright smoke verified institution-admin tenant scoping, hidden `SUPER_ADMIN` create option, no tenant selector for institution admins, create user, role update, deactivate/activate, manual password reset, reset-password login, and super-admin creation of a tenant admin for another tenant. PostgreSQL smoke verified final role/active/password state and audit rows for user create, role update, deactivate, activate, and password reset. Scope searches found no incomplete TODO/FIXME markers, hard-coded secrets in production P6-T4 files, or support/settings/retention/provider/OAuth/LMS/PWA features added.

Remaining/blockers: None for P6-T4.

---

## P6-T5 — Support ticket module

Status: VERIFIED

Dependencies: P6-T4

Task prompt:

```txt
Implement P6-T5 only.

Create support ticket module.
Add tables if not already present:
- support_tickets
- support_ticket_comments

Users can create tickets.
Institution admins can view tenant tickets.
Super admin/support can view all.
Ticket statuses:
- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

Create UI:
- /support
- /support/[id]

Audit status changes.
```

Verification prompt:

```txt
Verify P6-T5 only.

Check ticket lifecycle works.
Check tenant/RBAC access.
Check comments and status changes work.
Check audit events are written.
Run tests/typecheck/build.

If all P6 tasks are verified, run Phase 6 verification prompt.
```

Implementation evidence: Added the P6-T5 support ticket module with tenant-aware `support_tickets` and `support_ticket_comments` tables, `support_ticket_status` enum, Drizzle migration `drizzle/0006_peaceful_newton_destine.sql`, typed support service helpers, `/support` and `/support/[id]` App Router UI, server actions for ticket creation/comments/status updates, support navigation, and unit tests for support RBAC/status rules. Tenant users can create and comment on own tickets, institution admins can view/update tenant tickets, and super admins can view all tickets. Status-change audit events are written as `support_ticket.status_changed`; ticket create/comment events are also audited as critical support state changes.

Verification evidence: VERIFIED on 2026-04-28 03:50:48 IST. `npm run db:generate` created `drizzle/0006_peaceful_newton_destine.sql`; `npm run db:migrate` applied successfully. `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; tests passed with 26 files and 101 tests. Playwright smoke against the production build verified a tenant user could create a ticket and add a comment, an institution admin could view the tenant ticket and update status from `OPEN` to `IN_PROGRESS`, a cross-tenant user received 404 for the ticket detail, and a super admin could view all tickets without a tenant-scoped create form. PostgreSQL smoke verified the ticket row, one comment, and audit actions `support_ticket.create`, `support_ticket.comment_added`, and `support_ticket.status_changed` with metadata `{ from: "OPEN", to: "IN_PROGRESS" }`; temporary smoke data was cleaned up. Scope searches found no incomplete TODO/FIXME markers, no hard-coded production secrets in P6-T5 production files, and no future provider/OAuth/LMS/PWA/retention features added.

Remaining/blockers: None for P6-T5. The canonical roles do not include a separate `SUPPORT` role, so `SUPER_ADMIN` is the global support operator for MVP.

---

## Phase 6 Verification Prompt

```txt
Verify Phase 6 completely.

Check P6-T1 through P6-T5 are VERIFIED.
Check analytics, customization, user management, and support work.
Check human branding/SLA/usage decisions are recorded.
List human interventions needed before Phase 7.
If complete, mark Phase 6 as PHASE VERIFIED and unlock P7-T1.
```

---

# Phase 7 — Security, Compliance, QA, and Hardening

## Phase 7 Acceptance Criteria

- Secure headers, rate limiting, CSRF strategy, file validation, and error handling are hardened.
- Tenant isolation tests exist.
- Audit coverage is complete.
- Retention and repository consent controls exist.
- UAT and user/admin/reviewer/security docs exist.

## Phase 7 Human Intervention

Human may need to approve:

- Privacy policy basis.
- Retention periods.
- Repository reuse consent policy.
- Security review findings.
- Whether external pentest is required before production.

---

## P7-T1 — Security hardening

Status: VERIFIED

Dependencies: Phase 6 verified

Task prompt:

```txt
Implement P7-T1 only.

Add security hardening:
- secure headers
- rate limiting for login
- rate limiting for upload
- CSRF protection strategy for state-changing routes
- strict file validation
- safe error responses
- centralized error handling helpers

Do not add product features.
```

Verification prompt:

```txt
Verify P7-T1 only.

Check security headers exist.
Check auth/upload abuse is rate-limited.
Check CSRF strategy is implemented or documented.
Check unsafe error leakage is avoided.
Run tests/typecheck/build.
```

Implementation evidence: Added P7-T1 security hardening without adding product features. Global security headers are configured in `next.config.ts` through `src/lib/security/headers.ts`. Added centralized helpers in `src/lib/security/api-responses.ts`, same-origin CSRF checks in `src/lib/security/csrf.ts`, and an MVP in-memory rate limiter in `src/lib/security/rate-limit.ts`. Login is rate-limited, upload is rate-limited before multipart parsing, state-changing API routes use same-origin CSRF checks, and the PDF report route forces the CSRF check because it writes report snapshots. Upload validation now checks MIME type, safe filename, expected extension, positive byte size, byte-size consistency, and basic file signatures. Added `docs/security-hardening.md` and tests in `tests/security-hardening.test.ts`; extended upload tests for strict validation.

Verification evidence: VERIFIED on 2026-04-28 03:59:53 IST. `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; tests passed with 27 files and 108 tests. Live production-build smoke verified global headers (`Content-Security-Policy`, `Permissions-Policy`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`), cross-origin POST rejection with `CSRF_CHECK_FAILED`, login rate limiting returning 429 with `Retry-After` and rate-limit headers after 5 attempts, and upload rate limiting returning 429 before multipart parsing after 20 attempts. Scope searches found no incomplete TODO/FIXME markers, no hard-coded production secrets in P7-T1 production files, and no provider/OAuth/LMS/PWA/repository matching/fact-check features added.

Remaining/blockers: None for P7-T1. The rate limiter is an in-memory MVP control and is documented for replacement before horizontally scaled production.

---

## P7-T2 — Tenant isolation tests

Status: VERIFIED

Dependencies: P7-T1

Task prompt:

```txt
Implement P7-T2 only.

Add tests proving:
- tenant A user cannot list tenant B submissions
- tenant A reviewer cannot open tenant B report
- tenant A admin cannot manage tenant B users
- storage keys are tenant-scoped
- analytics are tenant-scoped

Use seeded test data.
Fix any uncovered access path.
```

Verification prompt:

```txt
Verify P7-T2 only.

Run tenant isolation tests.
Check all listed scenarios pass.
Check any discovered access bug was fixed.
Run full test suite if possible.
```

Implementation evidence: Added `tests/tenant-isolation.test.ts` with seeded tenant A/tenant B fixtures proving the listed tenant isolation paths. The tests assert tenant A user submission scope does not allow tenant B submissions, tenant A reviewer report access path does not allow tenant B submissions, tenant A admin cannot manage tenant B users, tenant storage keys include the exact tenant/submission prefix, and tenant A admin analytics scope rejects tenant B. No service access leak was found, so no production code change was needed for P7-T2.

Verification evidence: VERIFIED on 2026-04-28 04:03:00 IST. `npm run test -- tests/tenant-isolation.test.ts` passed with 1 file and 5 tests. Full `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; full tests passed with 28 files and 113 tests. Scope searches found no incomplete TODO/FIXME markers, no hard-coded secrets, and no future provider/OAuth/LMS/PWA/repository matching/fact-check features in the P7-T2 test file.

Remaining/blockers: None for P7-T2.

---

## P7-T3 — Audit coverage

Status: VERIFIED

Dependencies: P7-T2

Task prompt:

```txt
Implement P7-T3 only.

Ensure audit events for:
- login
- logout
- user create/update/deactivate
- submission create
- file upload
- extraction
- preprocessing
- scan queued
- scan completed
- report generated
- reviewer note added
- review status changed
- tenant settings changed
- support ticket status changed

Create /admin/audit page for institution admin and super admin.
Add filters by action/entity/user/date.
```

Verification prompt:

```txt
Verify P7-T3 only.

Check audit events exist for all listed actions.
Check audit page is tenant-scoped.
Check filters work.
Run tests/typecheck/build.
```

Implementation evidence: Added `src/features/audit/audit.service.ts` with the required audit action registry, super-admin global scope, institution-admin tenant scope, and filters for action/entity/user/date. Added `/admin/audit` with filter controls and audit table, and added the Audit navigation item for tenant admin roles. Added `tests/audit-service.test.ts` for required action coverage, scope enforcement, and filter parsing; updated navigation tests. Existing audit writes already covered the required events: `auth.login`, `auth.logout`, `user.create`, `user.role.update`, `user.deactivate`, `submission.create`, `submission.file.upload`, `submission.extract`, `submission.preprocess`, `submission.scan.queued`, `submission.scan.completed`, `report.pdf.generated`, `review_case.note_added`, `review_case.status_changed`, `tenant.settings.update`, and `support_ticket.status_changed`.

Verification evidence: VERIFIED on 2026-04-28 04:09:15 IST. `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; full tests passed with 29 files and 117 tests. Targeted `npm run test -- tests/audit-service.test.ts tests/dashboard-navigation.test.ts` passed. Playwright smoke against the production build with temporary audit rows verified institution admin saw only own-tenant audit rows, action filtering removed non-matching tenant rows, super admin saw audit rows from both tenants, and temporary smoke data was cleaned up. Scope searches found no incomplete TODO/FIXME markers, no hard-coded secrets, and no future provider/OAuth/LMS/PWA/repository matching/fact-check features in P7-T3 files.

Remaining/blockers: None for P7-T3.

---

## P7-T4 — Data retention and consent

Status: VERIFIED

Dependencies: P7-T3

Task prompt:

```txt
Implement P7-T4 only.

Add settings and logic:
- retain_original_files_days
- retain_reports_days
- allow_repository_reuse
- require_user_consent_for_repository

Add submission-level consent fields:
- repository_reuse_consent_at nullable
- repository_reuse_consent_by nullable

Do not build repository matching yet.
Only build consent and retention metadata.
No submission can be marked repository-reusable without consent.
```

Verification prompt:

```txt
Verify P7-T4 only.

Check retention settings exist.
Check repository consent fields exist.
Check no repository reuse can happen without consent.
Check repository matching itself was not implemented.
Run tests/typecheck/build.
```

Implementation evidence: Added tenant settings metadata for `retain_original_files_days`, `retain_reports_days`, `allow_repository_reuse`, and `require_user_consent_for_repository` with 365-day safe defaults and backward-compatible normalized keys. Added nullable submission consent columns `repository_reuse_consent_at` and `repository_reuse_consent_by` with a Drizzle migration. Added typed repository reuse guard logic that returns false unless repository reuse is enabled, consent is required, and submission-level consent metadata is present. Updated `/admin/settings` to edit retention and consent metadata only. Added tests for tenant settings serialization/normalization, consent guard behavior, and updated tenant-isolation fixtures for the new submission shape.

Verification evidence: VERIFIED on 2026-04-28 04:16:37 IST. `npm run db:generate` created `drizzle/0007_famous_valkyrie.sql`; `npm run db:migrate` applied successfully. `npm run test -- tests/tenant-settings.test.ts tests/submissions-service.test.ts`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; full tests passed with 29 files and 118 tests. Initial `npm run typecheck` found one stale `SubmissionSummary` fixture in `tests/tenant-isolation.test.ts`; the fixture was updated with nullable consent metadata and typecheck then passed. PostgreSQL introspection confirmed both new consent columns are nullable. Scope searches found no incomplete TODO/FIXME markers, no hard-coded secrets in P7-T4 files, and no repository matching/fingerprinting implementation.

Remaining/blockers: None for P7-T4. Formal retention and consent policy approval remains a production gate, not a current implementation blocker.

---

## P7-T5 — UAT and documentation pack

Status: VERIFIED

Dependencies: P7-T4

Task prompt:

```txt
Implement P7-T5 only.

Create docs:
- docs/uat-checklist.md
- docs/admin-guide.md
- docs/reviewer-guide.md
- docs/user-guide.md
- docs/security-notes.md

UAT checklist must cover:
- login
- role access
- user creation
- upload
- extraction
- preprocessing
- scan
- report
- PDF download
- reviewer workflow
- analytics
- audit logs
- tenant isolation
```

Verification prompt:

```txt
Verify P7-T5 only.

Check all required docs exist.
Check UAT checklist covers all required flows.
Check docs match implemented system and do not claim unavailable features.
Run markdown/doc lint if available.

If all P7 tasks are verified, run Phase 7 verification prompt.
```

Implementation evidence: Added `docs/uat-checklist.md`, `docs/admin-guide.md`, `docs/reviewer-guide.md`, `docs/user-guide.md`, and `docs/security-notes.md`. The UAT checklist covers login, role access, user creation, upload, extraction, preprocessing, scan, report, PDF download, reviewer workflow, analytics, audit logs, tenant isolation, consent, and retention. The docs describe the implemented MVP accurately, including mock scan provider usage, tenant-scoped flows, audit logs, support, settings, security controls, and production approval gates.

Verification evidence: VERIFIED on 2026-04-28 04:20:20 IST. Required docs exist. UAT checklist coverage was verified with `rg -in` for all required flows. Scope searches found no incomplete TODO/FIXME markers and no claims that unavailable real-provider, repository matching, Google Docs, LMS, PWA, fact-check, or paid-provider features are available. No markdown/doc lint script is configured in `package.json`. `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; full tests passed with 29 files and 118 tests. Phase 7 verification also passed and Phase 7 is marked PHASE VERIFIED.

Remaining/blockers: None for P7-T5. Privacy, retention, and consent approval remains required before production sign-off.

---

## Phase 7 Verification Prompt

```txt
Verify Phase 7 completely.

Check P7-T1 through P7-T5 are VERIFIED.
Check security, tenant isolation, audit coverage, retention/consent, and docs are complete.
Check privacy/security human signoff is recorded or marked pending.
List human interventions needed before Phase 8.
If complete, mark Phase 7 as PHASE VERIFIED and unlock P8-T1.
```

---

# Phase 8 — Deployment Preparation

## Phase 8 Acceptance Criteria

- Production Dockerfile exists.
- Web and worker can run separately.
- Production compose example exists.
- Deployment documentation exists.
- Production readiness checklist exists.
- No production secrets are committed.

## Phase 8 Human Intervention

Human must provide:

- Hosting target.
- Production PostgreSQL URL.
- Production S3/MinIO credentials.
- Domain/SSL decision.
- Backup location.
- Email/helpdesk provider details if needed.

---

## P8-T1 — Production Docker setup

Status: VERIFIED

Dependencies: Phase 7 verified

Task prompt:

```txt
Implement P8-T1 only.

Create:
- Dockerfile for Next.js app
- optional Dockerfile.worker or same image with worker command
- docker-compose.prod.example.yml

Services:
- web
- worker

Do not include production secrets.
```

Verification prompt:

```txt
Verify P8-T1 only.

Check Dockerfile builds app image.
Check worker can run from same image or separate worker image.
Check docker-compose.prod.example.yml has web and worker services.
Check no secrets are committed.
Run docker build if available or document blocker.
```

Implementation evidence: Added `.dockerignore`, `Dockerfile`, and `docker-compose.prod.example.yml`. The Dockerfile builds a Next.js production image and the same image can run the web command (`npm run start`) or worker command (`npm run worker`). The production compose example defines `web` and `worker` services using environment-variable placeholders only. `package-lock.json` was updated so clean installs work under the Docker build.

Verification evidence: VERIFIED on 2026-04-28 04:29:34 IST. Initial `docker build -t plagcheck-app:p8-t1 .` failed because `package-lock.json` was not accepted by clean install inside Docker and BuildKit warned about secret-named ARG/ENV instructions; fixed by syncing the lockfile and using a temporary build-only placeholder env file. A second build still failed with npm 10 lockfile handling; fixed by pinning npm 11.6.2 in the dependency install stage. Final `docker build -t plagcheck-app:p8-t1 .` passed. `docker compose -f docker-compose.prod.example.yml config --no-interpolate` passed and showed `web` and `worker` services. A built-image check confirmed `start`, `worker`, and `tsx` exist, and `.env`/`.env.production.local` are not present in the final image. `npm ci --dry-run`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; full tests passed with 29 files and 118 tests. Scope searches found no incomplete TODO/FIXME markers and no committed production secrets.

Remaining/blockers: None for P8-T1. The image intentionally retains dependencies required by the current TypeScript worker command; production hosting, SSL, production secrets, and backup destination remain P8 deployment gates.

---

## P8-T2 — Deployment docs

Status: VERIFIED

Dependencies: P8-T1

Task prompt:

```txt
Implement P8-T2 only.

Create docs/deployment.md covering:
- required env vars
- managed PostgreSQL setup
- S3-compatible object storage setup
- migration command
- web service command
- worker service command
- health check URL
- backup strategy
- rollback strategy
- secret rotation
- common troubleshooting
```

Verification prompt:

```txt
Verify P8-T2 only.

Check deployment.md exists and is actionable.
Check it covers env vars, DB, storage, migration, web/worker, health, backup, rollback, secrets, troubleshooting.
Check it does not include real secrets.
```

Implementation evidence: Added `docs/deployment.md` covering required environment variables, managed PostgreSQL setup, S3-compatible object storage setup, migration command, web service command, worker service command, health check URL, backup strategy, rollback strategy, secret rotation, common troubleshooting, and production gates. The doc references the P8 Docker image and production compose example without choosing a hosting provider or including production secrets.

Verification evidence: VERIFIED on 2026-04-28 04:32:26 IST. `docs/deployment.md` exists and topic coverage was verified with `rg -in` for all required deployment sections. Secret scans found no real credentials, private keys, or provider tokens in the deployment doc. No markdown/doc lint script is configured in `package.json`. `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed; full tests passed with 29 files and 118 tests.

Remaining/blockers: None for P8-T2. Hosting provider, domain/SSL, production database URL, production S3-compatible credentials, backup destination, and provider API keys remain production gates.

---

## P8-T3 — Production readiness checklist

Status: VERIFIED

Dependencies: P8-T2

Task prompt:

```txt
Implement P8-T3 only.

Create docs/production-readiness.md with checklist:
- auth
- RBAC
- tenant isolation
- audit logs
- backups
- restore test
- file storage
- rate limits
- scan worker
- PDF generation
- support tickets
- monitoring hooks
- UAT sign-off
- legal/privacy review
- provider API keys
- SSL/HTTPS

No code changes unless required.
```

Verification prompt:

```txt
Verify P8-T3 only.

Check production-readiness.md exists and covers all listed items.
Check production blockers are explicitly listed.
Run full MVP verification prompt after this task if P8-T1 to P8-T3 are VERIFIED.
```

Implementation evidence: Added `docs/production-readiness.md` with checklist items for auth, RBAC, tenant isolation, audit logs, backups, restore test, file storage, rate limits, scan worker, PDF generation, support tickets, monitoring hooks, UAT sign-off, legal/privacy review, provider API keys, and SSL/HTTPS. The checklist explicitly lists production blockers that require human decisions or credentials.

Verification evidence: VERIFIED on 2026-04-28 04:37:10 IST. `docs/production-readiness.md` exists and checklist coverage was verified with `rg -in` for every required item. Production blockers were verified for hosting, domain/SSL, production PostgreSQL, production S3-compatible storage, backup destination, legal/privacy approval, UAT sign-off, security review, and provider API keys if replacing the mock provider. Secret scans found no real credentials in the checklist. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run db:migrate`, `docker compose config`, `docker compose -f docker-compose.prod.example.yml config --no-interpolate`, `npm run worker`, `docker build -t plagcheck-app:p8-final .`, built-image checks, and live `/api/health` smoke passed. Full tests passed with 29 files and 118 tests. Phase 8 and the full MVP implementation were verified.

Remaining/blockers: None for P8-T3 implementation. Production launch remains blocked on human-owned hosting, SSL, production secrets, backup, legal/privacy, UAT, and provider decisions.

---

## Phase 8 Verification Prompt

```txt
Verify Phase 8 completely.

Check P8-T1 through P8-T3 are VERIFIED.
Check deployment artifacts and docs are complete.
Check no production secret is committed.
Check human deployment decisions are listed.
If complete, mark Phase 8 as PHASE VERIFIED and run Entire Implementation Verification Prompt from AGENTS.md.
```

---

# Phase 9 — Optional Advanced Features

Phase 9 is locked until MVP sign-off. Do not start Phase 9 unless the human explicitly approves.

## Optional P9 Tasks

| Task | Status | Human input required |
|---|---|---|
| P9-T1 Real scan provider adapter | LOCKED | Provider contract/API keys |
| P9-T2 Google Docs import | LOCKED | Google OAuth credentials |
| P9-T3 LMS/API integration | LOCKED | LMS/API requirements and credentials |
| P9-T4 Client-side quick scan | LOCKED | Approval that this is non-authoritative preview only |
| P9-T5 PWA offline queue | LOCKED | Offline workflow requirements |
| P9-T6 Fact-checking assistance | LOCKED | Provider/model/search API decision |
| P9-T7 Institutional repository matching | LOCKED | Repository consent/legal approval |

---

# Evidence Log

Use this section after each task.

## P0-T1 Evidence

Status: VERIFIED

Changed files:
- .gitignore
- IMPLEMENTATION_TRACKER.md
- docs/implementation-plan.md
- drizzle/.gitkeep
- eslint.config.mjs
- next-env.d.ts
- next.config.ts
- package-lock.json
- package.json
- postcss.config.mjs
- src/app/globals.css
- src/app/layout.tsx
- src/app/page.tsx
- src/components/.gitkeep
- src/features/.gitkeep
- src/lib/.gitkeep
- src/server/worker.ts
- tests/.gitkeep
- tsconfig.json
- vitest.config.ts

Database migrations: None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions read before implementation
- `sed -n '80,145p' IMPLEMENTATION_TRACKER.md` — PASS, exact P0-T1 task read before implementation
- `mkdir -p src/app src/components src/features src/lib src/server drizzle docs tests` — PASS
- `npm install next react react-dom` — FAIL, sandboxed network DNS resolution failed
- `npm install next react react-dom drizzle-orm` — PASS after approved network escalation
- `npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next @eslint/eslintrc tailwindcss @tailwindcss/postcss vitest drizzle-kit tsx` — STOPPED after no progress; replaced with approved no-audit install
- `npm install --save-dev typescript @types/node @types/react @types/react-dom eslint eslint-config-next @eslint/eslintrc tailwindcss @tailwindcss/postcss vitest drizzle-kit tsx --no-audit --no-fund` — PASS after approved network escalation
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, no test files found and `--passWithNoTests` used
- `npm run build` — PASS
- `find src drizzle docs tests -maxdepth 2 -type f | sort` — PASS
- `node -e "...required scripts..."` — PASS
- `rg -n "P0|P1|P2|P3|P4|P5|P6|P7|P8|P9" docs/implementation-plan.md` — PASS
- `rg -n "auth|login|upload|dashboard|scan|report|tenant|session|submission" src docs package.json` — PASS, matches only phase-plan documentation
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-27 23:31:22 IST
- `find src drizzle docs tests -maxdepth 2 -type d -o -type f | sort` — PASS, required structure present
- `node -e "...required scripts..."` — PASS, all required scripts present
- `rg -n "TODO|FIXME|XXX|HACK" --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo' .` — PASS, no incomplete task markers found
- `rg -n "process\.env|DATABASE_URL|SESSION_SECRET|MINIO|POSTGRES|password\s*=|secret\s*=|api[_-]?key|token\s*=" --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo' .` — PASS, matches only tracker requirements
- `rg -n "auth|login|logout|session|tenant|user_role|upload|submission|scan|report|dashboard|audit|password|secret|api key|apikey|token" src docs package.json next.config.ts tsconfig.json eslint.config.mjs postcss.config.mjs vitest.config.ts .gitignore` — PASS, matches only phase-plan documentation
- `rg -n "\bany\b|strict|allowJs|noImplicitAny" tsconfig.json src tests next.config.ts vitest.config.ts` — PASS, strict mode enabled and no `any` usage found
- `find . -path './node_modules' -prune -o -path './.next' -prune -o \( -name '.env*' -o -name '*secret*' -o -name '*key*' \) -print` — PASS, no local env/secret files found
- `npm run lint` — PASS, no ESLint warnings or errors
- `npm run typecheck` — PASS, TypeScript strict check completed
- `npm run test` — PASS, no test files found and `--passWithNoTests` used
- `npm run build` — PASS, Next.js production build completed

Manual verification:
- Verified the project uses Next.js App Router under `src/app`.
- Verified TypeScript strict mode is enabled in `tsconfig.json`.
- Verified TailwindCSS is wired through `src/app/globals.css` and PostCSS config.
- Verified required directories exist: `src/app`, `src/components`, `src/features`, `src/lib`, `src/server`, `drizzle`, `docs`, and `tests`.
- Verified `package.json` contains all required scripts.
- Verified `docs/implementation-plan.md` lists phases P0 through P9.
- Verified no auth, upload, dashboard, scan, report, database schema, or business feature was implemented.
- Verification pass completed on 2026-04-27 23:31:22 IST.
- Files checked for acceptance criteria and scope: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/server/worker.ts`, `docs/implementation-plan.md`, `drizzle/.gitkeep`, `src/components/.gitkeep`, `src/features/.gitkeep`, `src/lib/.gitkeep`, and `tests/.gitkeep`.
- Tests are not task-specific for P0-T1 because no business logic was introduced; the Vitest harness exists and `npm run test` passes with no tests.
- Tenant isolation is not applicable to P0-T1 because no business data, database schema, or tenant-aware access path was implemented.
- No hard-coded secrets or direct environment access were found in task code.
- Generated TypeScript build info is ignored through `.gitignore`.

Remaining issues: None

Human intervention required: None for P0-T1

---

## P0-T2 Evidence

Status: VERIFIED

Changed files:
- .env.example
- IMPLEMENTATION_TRACKER.md
- docker-compose.yml
- docs/local-development.md

Database migrations: None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions re-read before implementation
- `sed -n '150,215p' IMPLEMENTATION_TRACKER.md` — PASS, exact P0-T2 task and verification prompt read
- `docker compose config` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, no test files found and `--passWithNoTests` used
- `npm run build` — PASS
- `node -e "...required env keys..."` — PASS, all required `.env.example` keys present
- `rg -n "postgres|minio|minio-init|MINIO_BUCKET|mc mb|anonymous set none" docker-compose.yml` — PASS
- `rg -n "docker compose up -d|docker compose config|npm run db:migrate|localhost:9001|npm run dev" docs/local-development.md` — PASS
- `rg -n "auth|login|logout|session|tenant|user_role|upload|submission|scan|report|dashboard|audit|password|secret|api key|apikey|token" src docker-compose.yml .env.example docs/local-development.md package.json` — PASS, matches only infrastructure placeholders and required local setup text
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-27 23:35:32 IST
- P0-T2 verification pass on 2026-04-27 23:38:01 IST:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions re-read
- `sed -n '150,215p' IMPLEMENTATION_TRACKER.md` — PASS, completed P0-T2 task and verification prompt re-read
- Marker search over P0-T2 implementation files — PASS, no incomplete task markers found
- `.env.example` required-key check — PASS, all required keys present
- `docker compose config` — PASS, Compose config resolved PostgreSQL, MinIO, and `minio-init`
- `npm run lint` — PASS, no ESLint warnings or errors
- `npm run typecheck` — PASS, strict TypeScript check completed
- `npm run test` — PASS, no test files found and `--passWithNoTests` used

Manual verification:
- Verified `docker-compose.yml` defines `postgres`, `minio`, and `minio-init` services.
- Verified `minio-init` creates `MINIO_BUCKET` with `mc mb --ignore-existing` and disables anonymous access.
- Verified `.env.example` contains all required keys and uses placeholder local values only.
- Verified `docs/local-development.md` explains starting Docker, checking Compose config, running migrations when available, accessing MinIO console, and starting the app.
- Verified no auth, upload, dashboard, scan, report, database schema, migration, or business feature was implemented.
- Verified tenant isolation is not applicable to P0-T2 because no business tables or tenant data access were added.
- Verification pass completed on 2026-04-27 23:38:01 IST.
- Files checked for acceptance criteria and scope: `docker-compose.yml`, `.env.example`, `docs/local-development.md`, `src`, `drizzle`, `package.json`, and `tsconfig.json`.
- Placeholder local values are present in `.env.example` and Compose defaults; no real secrets were found.
- Tests are not task-specific for P0-T2 because it adds configuration and documentation only; the Vitest harness passes.

Remaining issues: None

Human intervention required: None for P0-T2

---

## P0-T3 Evidence

Status: VERIFIED

Changed files:
- IMPLEMENTATION_TRACKER.md
- package-lock.json
- package.json
- src/lib/env.ts
- tests/env.test.ts

Database migrations: None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions re-read before implementation
- `sed -n '216,268p' IMPLEMENTATION_TRACKER.md` — PASS, exact P0-T3 task and verification prompt read
- `npm install zod --no-audit --no-fund` — STOPPED after no progress in sandbox
- `ps -ef | rg "npm install zod|npm"` — PASS with escalation, identified stalled npm process
- `kill 71765` — PASS, stopped stalled npm process
- `npm install zod --no-audit --no-fund` — PASS after approved network escalation
- `rg -n "process\\.env|DATABASE_URL|APP_URL|SESSION_SECRET|MINIO_" --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo' .` — PASS, found no pre-existing app env access to migrate
- `npm run lint` — PASS
- `npm run typecheck` — FAIL initially because the test used `NodeJS.ProcessEnv`, which Next's types require to include `NODE_ENV`
- `npm run test` — PASS, 1 test file and 3 tests passed
- `npm run lint` — PASS after type fix
- `npm run typecheck` — PASS after changing parser input to `Record<string, string | undefined>`
- `npm run test` — PASS, 1 test file and 3 tests passed
- `npm run build` — PASS
- `rg -n "process\\.env" --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo' .` — PASS, only `src/lib/env.ts` uses `process.env` outside tracker text
- `rg -n "DATABASE_URL|APP_URL|SESSION_SECRET|MINIO_ENDPOINT|MINIO_REGION|MINIO_BUCKET|MINIO_ACCESS_KEY|MINIO_SECRET_KEY|zod|parseEnv|envSchema" src/lib/env.ts tests/env.test.ts package.json` — PASS
- `rg -n "auth|login|logout|session|tenant|user_role|upload|submission|scan|report|dashboard|audit|schema|migration" src tests drizzle docs package.json` — PASS, matches only test placeholder text and existing phase documentation
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-27 23:52:37 IST
- P0-T3 verification pass on 2026-04-27 23:53:36 IST:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions re-read
- `sed -n '216,268p' IMPLEMENTATION_TRACKER.md` — PASS, completed P0-T3 task and verification prompt re-read
- `sed -n '1,220p' src/lib/env.ts` — PASS, env implementation checked
- `sed -n '1,220p' tests/env.test.ts` — PASS, env validation tests checked
- `rg -n "TODO|FIXME|XXX|HACK" src tests package.json package-lock.json --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "process\\.env" --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo' .` — PASS, only `src/lib/env.ts` uses `process.env` outside tracker text
- `rg -n "DATABASE_URL|APP_URL|SESSION_SECRET|MINIO_ENDPOINT|MINIO_REGION|MINIO_BUCKET|MINIO_ACCESS_KEY|MINIO_SECRET_KEY|zod|envSchema|parseEnv|export const env|export type Env" src/lib/env.ts tests/env.test.ts package.json` — PASS
- `rg -n "auth|login|logout|session|tenant|user_role|upload|submission|scan|report|dashboard|audit|schema|migration" src tests drizzle docs package.json` — PASS, matches only test placeholder text and existing phase documentation
- `rg -n "password|secret|api[_ -]?key|token|SESSION_SECRET|MINIO_SECRET_KEY|MINIO_ACCESS_KEY|DATABASE_URL" src tests package.json .env.example docker-compose.yml docs/local-development.md` — PASS, only validation names and placeholder local values found
- `rg -n "\\bany\\b|strict|allowJs|noImplicitAny" tsconfig.json src tests next.config.ts vitest.config.ts` — PASS, strict mode enabled and no `any` usage found
- `npm run lint` — PASS, no ESLint warnings or errors
- `npm run typecheck` — PASS, strict TypeScript check completed
- `npm run test` — PASS, 1 test file and 3 tests passed

Manual verification:
- Verified `src/lib/env.ts` exists.
- Verified Zod validates `DATABASE_URL`, `APP_URL`, `SESSION_SECRET`, `MINIO_ENDPOINT`, `MINIO_REGION`, `MINIO_BUCKET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY`.
- Verified `Env`, `EnvInput`, `envSchema`, `parseEnv`, and typed `env` are exported.
- Verified invalid env failures include `Invalid environment variables` and field names.
- Verified no unnecessary `process.env` usage exists outside `src/lib/env.ts` and tracker text.
- Verified no DB schema, auth, upload, dashboard, scan, report, migration, or business feature was implemented.
- Verified tenant isolation is not applicable to P0-T3 because no business tables or tenant data access were added.
- Verification pass completed on 2026-04-27 23:53:36 IST.
- Files checked for acceptance criteria and scope: `src/lib/env.ts`, `tests/env.test.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `src`, `tests`, `drizzle`, `docs/implementation-plan.md`, and `docs/local-development.md`.
- The test suite is applicable and present for P0-T3: `tests/env.test.ts` covers valid env parsing, invalid value errors, and missing variable errors.
- No real secrets were found; secret-like values are local placeholders in `.env.example`, `docker-compose.yml`, and test fixtures.

Remaining issues: None

Human intervention required: None for P0-T3

---

## P0-T4 Evidence

Status: VERIFIED

Changed files:
- .env.example
- IMPLEMENTATION_TRACKER.md
- docker-compose.yml
- docs/local-development.md
- drizzle.config.ts
- drizzle/0000_steep_peter_quill.sql
- drizzle/meta/0000_snapshot.json
- drizzle/meta/_journal.json
- package-lock.json
- package.json
- src/app/api/health/route.ts
- src/lib/db/index.ts
- src/lib/db/schema.ts
- src/lib/env.ts

Database migrations:
- drizzle/0000_steep_peter_quill.sql

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions re-read before implementation
- `sed -n '269,335p' IMPLEMENTATION_TRACKER.md` — PASS, exact P0-T4 task and verification prompt read
- `npm install pg @types/pg --no-audit --no-fund` — STOPPED after no progress in sandbox
- `ps -ef | rg "npm install pg|npm"` — PASS with escalation, identified stalled npm process
- `kill 73928` — PASS, stopped stalled npm process
- `npm install pg @types/pg --no-audit --no-fund` — PASS after approved network escalation
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 1 test file and 3 tests passed
- `npm run build` — PASS, `/api/health` listed as a dynamic route
- `set -a; source .env.example; set +a; npm run db:generate` — PASS, generated `drizzle/0000_steep_peter_quill.sql`
- `docker compose up -d postgres` — FAIL, Docker daemon is not running
- `set -a; source .env.example; set +a; npm run db:migrate` — FAIL, migration apply could not complete without a reachable PostgreSQL database
- `set -a; source .env.example; set +a; npx tsx -e "...health route..."` — PASS after approved `tsx` escalation, returned HTTP 503 JSON with app/config/storage ok and database error because DB is unavailable
- `docker compose config` — PASS
- `rg -n "process\\.env" --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo' .` — PASS, only `src/lib/env.ts` reads `process.env` outside tracker text
- `rg -n "auth|login|logout|session|tenant|user_role|users|upload|submission|scan|report|dashboard|audit" src drizzle docs package.json --glob '!docs/implementation-plan.md'` — PASS, no future-phase implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src drizzle tests drizzle.config.ts package.json --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 00:13:46 IST
- `POSTGRES_PORT=55432 docker compose up -d --force-recreate postgres` — PASS after approved Docker escalation, PostgreSQL started on local port 55432
- `POSTGRES_PORT=55432 docker compose ps postgres` — PASS, PostgreSQL reported healthy
- `DATABASE_URL=postgresql://plagcheck:replace-with-local-postgres-password@localhost:55432/plagcheck npm run db:migrate` — PASS after approved Docker/network escalation, migration applied successfully
- `DATABASE_URL=postgresql://plagcheck:replace-with-local-postgres-password@localhost:55432/plagcheck npx tsx -e "...health route..."` — PASS after approved `tsx` escalation, returned HTTP 200 JSON with app/config/database/storage ok
- `POSTGRES_PORT=55432 docker compose up -d` — PASS after approved Docker escalation, PostgreSQL and MinIO stack started
- `POSTGRES_PORT=55432 docker compose ps` — PASS, PostgreSQL and MinIO reported healthy
- `POSTGRES_PORT=55432 docker compose logs --tail=50 minio-init` — PASS, `plagcheck-documents` bucket created with private access
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 00:43:59 IST
- `npm run lint` — PASS, final rerun after tracker update
- `npm run typecheck` — PASS, final rerun after tracker update
- `npm run test` — PASS, final rerun after tracker update; 1 test file and 3 tests passed
- `npm run build` — PASS, final rerun after tracker update; `/api/health` listed as a dynamic route
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, final verification timestamp recorded as 2026-04-28 00:45:49 IST

Manual verification:
- Verified `drizzle.config.ts` exists and reads `DATABASE_URL` through the typed env module.
- Verified `src/lib/db/schema.ts` defines only the minimal global `app_metadata` table.
- Verified `src/lib/db/index.ts` exports typed database, pool, connection check, and close helpers.
- Verified generated migration creates only `app_metadata`.
- Verified migration application succeeds against local PostgreSQL when Docker Desktop is running.
- Verified `/api/health` returns HTTP 200 JSON with `app`, `config`, `database`, and `storage` ok statuses when local PostgreSQL is reachable.
- Verified no auth, tenant, user, upload, scan, report, dashboard, audit, or other business tables/features were implemented.
- Verified tenant isolation is not applicable to the global `app_metadata` table and no tenant-scoped business data was added.
- Verified no real secrets were hard-coded; placeholder values remain only in local env/docs/test fixtures.
- Verified Docker Compose supports an alternate local PostgreSQL host port through `POSTGRES_PORT` without changing the container database port.
- Verified Phase 0 acceptance criteria are complete and P1-T1 is unlocked only after Phase 0 verification.

Remaining issues:
- None for P0-T4.

Human intervention required:
- None for P0-T4. Phase 1 will require seed super admin credentials and role policy confirmation before seed/auth verification.

---

## P1-T1 Evidence

Status: VERIFIED

Changed files:
- .env (local only; aligned PostgreSQL host port with running Docker container, contents not recorded)
- IMPLEMENTATION_TRACKER.md
- drizzle/0001_glossy_tomorrow_man.sql
- drizzle/meta/0001_snapshot.json
- drizzle/meta/_journal.json
- src/lib/db/schema.ts

Database migrations:
- drizzle/0001_glossy_tomorrow_man.sql

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, instructions re-read before implementation
- `sed -n '1,420p' IMPLEMENTATION_TRACKER.md` — PASS, current phase and exact P1-T1 task read
- `npm run db:generate` with `.env` loaded — PASS, generated `drizzle/0001_glossy_tomorrow_man.sql`
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 1 test file and 3 tests passed
- `docker compose ps` — PASS, PostgreSQL and MinIO were healthy; PostgreSQL was published on local port 55432
- `sed -n '1,260p' drizzle/0001_glossy_tomorrow_man.sql` — PASS, migration manually inspected
- `npm run db:migrate` with initial `.env` — FAIL, local `.env` still pointed `DATABASE_URL` and `POSTGRES_PORT` at port 5432 while Docker PostgreSQL was running on port 55432
- `npm run db:migrate` with explicit local Docker database env — PASS, migration applied successfully
- Masked `.env` inspection — PASS, confirmed `.env` database port mismatch without printing secrets
- Local `.env` port alignment command — PASS, updated only local PostgreSQL port values to 55432
- `npm run db:migrate` with corrected `.env` — PASS, migration applied successfully through normal local env flow
- PostgreSQL table introspection query — PASS, confirmed `audit_events`, `sessions`, `tenant_settings`, `tenants`, and `users`
- PostgreSQL enum introspection query — PASS, confirmed `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER` in order
- PostgreSQL index introspection query — PASS, confirmed user email, tenant ID, session token hash, and audit lookup indexes
- `rg -n "login|logout|session route|auth route|sign in|signin|sign-in|password reset" src --glob '!lib/db/schema.ts'` — PASS, no login UI/routes were added
- `rg -n "TODO|FIXME|XXX|HACK" src drizzle tests drizzle.config.ts package.json docker-compose.yml docs/local-development.md --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "replace-with|hard-code|SECRET|PASSWORD|password_hash|token_hash" src drizzle.config.ts package.json docs .env.example --glob '!node_modules/**'` — PASS, no hard-coded runtime secrets found; only placeholders/docs and schema column names appeared
- `npm run build` — PASS, Next.js build completed and only `/api/health` appears as an API route
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 00:52:48 IST

Manual verification:
- Verified `src/lib/db/schema.ts` contains only the requested P1-T1 tables and enum in addition to existing `app_metadata`.
- Verified every business table introduced by this task has tenant awareness where applicable: `tenant_settings` and non-super-admin `users` are tenant-bound, `audit_events` can record tenant-scoped or global platform events, and `sessions` are scoped through `user_id`.
- Verified `users_tenant_required_unless_super_admin` prevents non-super-admin users from having a null tenant.
- Verified `users.email` is unique, `users.password_hash` is required, `users.is_active` exists, and `sessions.token_hash`, `sessions.user_id`, and `sessions.expires_at` are required.
- Verified `audit_events` includes `actor_user_id`, `tenant_id`, `action`, `entity_type`, `entity_id`, `metadata`, `ip`, and `user_agent`.
- Verified no login UI, login/logout/me routes, password hashing service, seed script, or dashboard shell was implemented.
- Verified no new tests were required because P1-T1 is schema/migration work; database migration and introspection were used for verification.

Remaining issues:
- None for P1-T1.

Human intervention required:
- None for P1-T1. User authorized the agent to make local-development choices; production credentials remain human-owned.

---

## P1-T2 Evidence

Status: VERIFIED

Changed files:
- IMPLEMENTATION_TRACKER.md
- package-lock.json
- package.json
- src/lib/auth/password.ts
- src/lib/auth/session.ts
- src/lib/env.ts
- src/server/services/auth.service.ts
- tests/auth-password.test.ts
- tests/auth-session.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,280p' AGENTS.md` — PASS, instructions re-read before implementation
- `sed -n '423,477p' IMPLEMENTATION_TRACKER.md` — PASS, exact P1-T2 task and verification prompt read
- `npm install argon2 --no-audit --no-fund` — PASS, added Argon2 dependency
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 3 test files and 7 tests passed
- `npm run build` — PASS, Next.js build completed and only `/api/health` appears as an API route
- `rg -n "argon2id|argon2\\.argon2id|tokenHash|token_hash|sessionToken|plagcheck_session|httpOnly|sameSite|secure" src tests package.json` — PASS, confirmed Argon2id, session hash, and cookie security implementation points
- `find src/app -maxdepth 5 -type f | sort` — PASS, no login/logout/me pages or route files were added
- `rg -n "app/(api|.*login|.*logout|.*me)|route\\.ts|page\\.tsx" src/app` — PASS, no new auth routes/pages found beyond existing app files
- `rg -n "insert\\(schema\\.sessions\\)|values\\(\\{[\\s\\S]*tokenHash|token_hash|sessionToken" src/server/services/auth.service.ts src/lib/auth/session.ts` — PASS, service stores `tokenHash` in sessions; raw session tokens are used only for hashing/cookie return
- `rg -n "TODO|FIXME|XXX|HACK" src tests package.json --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:02:59 IST

Manual verification:
- Verified `src/lib/auth/password.ts` uses `argon2.argon2id` for hashing and `argon2.verify` for password checks.
- Verified `src/lib/auth/session.ts` generates opaque random tokens, hashes tokens with HMAC-SHA256 using `SESSION_SECRET`, and builds httpOnly `sameSite=lax` cookies with `secure` enabled when `NODE_ENV=production`.
- Verified `src/server/services/auth.service.ts` implements `createSession`, `validateSession`, `destroySession`, and `getCurrentUserFromRequest`.
- Verified `createSession` stores only `token_hash` in the database and records a session audit event.
- Verified `destroySession` deletes by token hash, returns an expired session cookie, and records a session audit event when a matching session exists.
- Verified `validateSession` joins sessions to users, rejects inactive users and expired sessions, and does not expose raw session tokens.
- Verified tenant isolation remains respected for this task: sessions are user-scoped, users carry tenant IDs from P1-T1, and auth audit events include tenant IDs when available.
- Verified no password reset, login/logout/me API route, UI page, seed script, dashboard, or scan/provider feature was implemented.

Remaining issues:
- None for P1-T2.

Human intervention required:
- None for P1-T2. User approved canonical roles, deferred password reset, and authorized local-development defaults/placeholders.

---

## P1-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/auth/login/route.ts
- src/app/api/auth/logout/route.ts
- src/app/api/auth/me/route.ts
- src/lib/auth/http.ts
- src/server/services/auth.service.ts
- tests/auth-routes.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions re-read before implementation
- `sed -n '1,260p' CODEX_SINGLE_AUTOPILOT_MASTER_PROMPT.md` — PASS, autopilot prompt read
- `sed -n '260,420p' CODEX_SINGLE_AUTOPILOT_MASTER_PROMPT.md` — PASS, P1-T3 special instructions read
- `sed -n '1,760p' IMPLEMENTATION_TRACKER.md` — PASS, tracker and exact P1-T3 task read
- `npm run lint` — PASS before route-test fix
- `npm run typecheck` — PASS before route-test fix
- `npm run test` — FAIL, one cookie `SameSite` casing assertion was too strict
- `npm run lint` — PASS after test fix
- `npm run typecheck` — PASS after test fix
- `npm run test` — PASS after test fix, 4 test files and 11 tests passed
- `npm run build` — PASS, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, and `/api/health` listed as dynamic API routes
- `find src/app/api/auth -maxdepth 3 -type f | sort` — PASS, confirmed login/logout/me route files exist
- `rg -n "register|registration|password reset|password_reset" src/app src/lib src/server tests --glob '!node_modules/**'` — PASS, no registration or password-reset implementation found
- `rg -n "auth\\.login|auth\\.logout|session\\.create|insert\\(schema\\.auditEvents\\)|Invalid email or password|passwordHash|password_hash|set\\(" src/app/api/auth src/server/services/auth.service.ts tests/auth-routes.test.ts` — PASS, confirmed generic error text, cookie setting, password hash isolation, and audit writes
- `rg -n "TODO|FIXME|XXX|HACK" src tests package.json --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:17:46 IST

Manual verification:
- Verified `POST /api/auth/login` requires email/password, normalizes email, returns the same generic error for malformed and wrong credentials, calls `loginWithPassword`, and sets the returned session cookie.
- Verified inactive users cannot log in through `loginWithPassword`, which returns `null` before password/session creation when `isActive` is false.
- Verified `GET /api/auth/me` uses `getCurrentUserFromRequest` and returns safe user data without `password_hash`.
- Verified `POST /api/auth/logout` reads the session cookie, calls `destroySession`, and clears the session cookie.
- Verified successful login writes an explicit `auth.login` audit event and logout writes an explicit `auth.logout` audit event through the auth service.
- Verified no registration, password reset, dashboard, RBAC guard, seed script, submission, upload, scan, or report feature was implemented.
- Verified tenant isolation remains respected for this task: user/session state comes from the auth service, users retain tenant IDs from P1-T1, and auth audit events include tenant IDs when available.
- Verified no hard-coded secrets were introduced.

Remaining issues:
- None for P1-T3.

Human intervention required:
- None for P1-T3. User approved canonical roles, deferred password reset, and authorized local-development defaults/placeholders.

---

## P1-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/lib/rbac/guards.ts
- src/lib/rbac/roles.ts
- tests/rbac.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, updated root instructions and current state re-read before implementation
- `sed -n '523,572p' IMPLEMENTATION_TRACKER.md` — PASS, exact P1-T4 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 5 test files and 17 tests passed
- `npm run build` — PASS, Next.js build completed
- `rg -n "USER_ROLES|SUPER_ADMIN|INSTITUTION_ADMIN|REVIEWER|USER|assertSameTenant|requireTenantAccess|AuthorizationError|AuthenticationRequiredError" src/lib/rbac tests/rbac.test.ts` — PASS, confirmed role constants, typed guards, and role coverage
- `rg -n "TODO|FIXME|XXX|HACK" src/lib/rbac tests/rbac.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:20:08 IST

Manual verification:
- Verified `src/lib/rbac/roles.ts` contains exactly the canonical roles and role groups for global admin, tenant admin, review, and submission-owner decisions.
- Verified `src/lib/rbac/guards.ts` exports `hasRole`, `requireAuth`, `requireRole`, `requireTenantAccess`, and `assertSameTenant` with typed errors.
- Verified `SUPER_ADMIN` can access tenant/global guard paths while tenant-scoped roles must match tenant IDs.
- Verified `INSTITUTION_ADMIN`, `REVIEWER`, and `USER` tenant access is explicit and denied across tenant boundaries.
- Verified no dashboard, seed, user-management, submission, upload, scan, report, or future-phase feature was implemented.
- Verified no database schema changes or secrets were introduced.

Remaining issues:
- None for P1-T4.

Human intervention required:
- None for P1-T4. User approved canonical roles and local-development defaults.

---

## P1-T5 Evidence

Status: VERIFIED

Changed files:
- .env.example
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- package.json
- scripts/seed.ts
- src/lib/env.ts
- src/server/services/seed.service.ts
- tests/env.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, updated root instructions and current state re-read before implementation
- `sed -n '573,619p' IMPLEMENTATION_TRACKER.md` — PASS, exact P1-T5 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 5 test files and 19 tests passed
- `docker compose ps` — PASS, PostgreSQL and MinIO were healthy; PostgreSQL was published on local port 55432
- `docker compose config` — PASS
- `npm run db:seed` with local env seed placeholders — PASS, created/updated one demo tenant and four users
- `npm run db:seed` with the same local env seed placeholders — PASS, returned the same tenant and user IDs, confirming no duplicate tenant/users were created
- PostgreSQL demo tenant count query — PASS, `demo-institution` count was 1
- PostgreSQL seeded role count query — PASS, exactly one `SUPER_ADMIN`, one `INSTITUTION_ADMIN`, one `REVIEWER`, and one `USER`
- PostgreSQL seeded hash/tenant query — PASS, all four password hashes matched Argon2id format; super admin tenant was null and tenant users were tenant-scoped
- PostgreSQL seeded user count query — PASS, seeded user count was 4
- `npm run build` — PASS, Next.js build completed
- `rg -n "SEED_SUPER_ADMIN|SEED_DEMO|db:seed|seedDatabase|hashPassword|password_hash|\\$argon2id" .env.example package.json scripts src/server/services/seed.service.ts src/lib/env.ts tests/env.test.ts --glob '!node_modules/**'` — PASS, confirmed seed env, package script, hashing, and placeholders
- `rg -n "TODO|FIXME|XXX|HACK" scripts src/server/services/seed.service.ts src/lib/env.ts tests/env.test.ts package.json .env.example --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:22:46 IST

Manual verification:
- Verified `scripts/seed.ts` exists and uses typed env validation through `getSeedEnv`.
- Verified `package.json` includes `db:seed`.
- Verified `src/server/services/seed.service.ts` upserts the demo tenant, tenant settings, super admin, institution admin, reviewer, and user.
- Verified seeded login users use `hashPassword`, so stored passwords are Argon2id hashes, not plaintext.
- Verified seed data is tenant-aware: super admin has null tenant and demo users share the demo tenant ID.
- Verified no registration, password reset, dashboard, submission, upload, scan, report, or future-phase feature was implemented.
- Verified no production secrets were hard-coded; only local placeholder seed values were added to `.env.example`.

Remaining issues:
- None for P1-T5.

Human intervention required:
- None for P1-T5. User authorized local-development placeholders; production seed credentials remain human-owned before deployment.

---

## P1-T6 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/admin/layout.tsx
- src/app/(dashboard)/admin/settings/page.tsx
- src/app/(dashboard)/admin/users/page.tsx
- src/app/(dashboard)/dashboard/page.tsx
- src/app/(dashboard)/layout.tsx
- src/app/(dashboard)/reviewer/layout.tsx
- src/app/(dashboard)/reviewer/queue/page.tsx
- src/app/(dashboard)/submissions/page.tsx
- src/app/login/page.tsx
- src/components/auth/login-form.tsx
- src/components/auth/logout-button.tsx
- src/components/dashboard/dashboard-shell.tsx
- src/lib/auth/server.ts
- src/lib/rbac/navigation.ts
- tests/dashboard-navigation.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, updated root instructions and current state re-read before implementation
- `sed -n '620,668p' IMPLEMENTATION_TRACKER.md` — PASS, exact P1-T6 task and verification prompt read
- `npm run lint` — PASS before server-component smoke fix
- `npm run typecheck` — PASS before server-component smoke fix
- `npm run test` — PASS before server-component smoke fix, 6 test files and 23 tests passed
- `npm run build` — PASS before server-component smoke fix
- `npm run start` — PASS, production server started locally for smoke testing
- `curl -sS -i http://localhost:3000/dashboard` — PASS, returned HTTP 307 with `location: /login`
- `curl -sS -i -c /tmp/plagcheck-cookies.txt ... /api/auth/login` — PASS, seeded super admin login returned HTTP 200 and secure httpOnly session cookie
- Initial authenticated `/dashboard` smoke — NEEDS_FIX, nested page auth checks produced a redirect marker inside the rendered stream
- `npm run lint` — PASS after moving duplicate page auth checks into nested layouts
- `npm run typecheck` — PASS after fix
- `npm run test` — PASS after fix, 6 test files and 23 tests passed
- `npm run build` — PASS after fix, `/login`, `/dashboard`, `/admin/users`, `/admin/settings`, `/reviewer/queue`, `/submissions`, and auth API routes listed
- Restarted `npm run start` — PASS, production server restarted with the fixed build
- `curl -sS -i http://localhost:3000/dashboard` — PASS, unauthenticated request returned HTTP 307 with `location: /login`
- `curl -sS -i -c /tmp/plagcheck-cookies.txt ... /api/auth/login` — PASS, seeded super admin login returned HTTP 200 and session cookie
- `curl -sS -b /tmp/plagcheck-cookies.txt http://localhost:3000/dashboard | rg ...` — PASS, dashboard rendered with super admin identity and role-allowed navigation; no `NEXT_REDIRECT` marker remained
- `curl -sS -b /tmp/plagcheck-cookies.txt http://localhost:3000/admin/users | rg ...` — PASS, admin users placeholder rendered for super admin
- `curl -sS -i -b /tmp/plagcheck-cookies.txt -X POST http://localhost:3000/api/auth/logout` — PASS, logout returned HTTP 200 and cleared session cookie
- Stopped `npm run start` — PASS
- `find src/app -maxdepth 5 -type f | sort` — PASS, confirmed required route files
- `rg -n "getRequiredSession|redirect\\(\\\"/login\\\"\\)|getNavigationItems|TENANT_ADMIN_ROLES|REVIEW_ROLES|No .* displayed yet|user management|create user|upload|scan|report" src/app src/components src/lib tests/dashboard-navigation.test.ts` — PASS, confirmed protected layout, role navigation, placeholder pages, and no future feature implementation
- `rg -n "TODO|FIXME|XXX|HACK" src/app src/components src/lib/auth/server.ts src/lib/rbac/navigation.ts tests/dashboard-navigation.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:25:42 IST

Manual verification:
- Verified `/login` renders a Tailwind login form and redirects authenticated users to `/dashboard`.
- Verified the dashboard route group layout calls `getRequiredSession`, so unauthenticated dashboard/admin/reviewer/submission routes redirect to login.
- Verified navigation is computed by role and tests cover `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER` visibility.
- Verified admin and reviewer route groups use role-protected nested layouts.
- Verified `/dashboard`, `/admin/users`, `/admin/settings`, `/reviewer/queue`, and `/submissions` are placeholder-only pages and do not implement user management, settings management, reviewer workflow, submissions, uploads, scans, or reports.
- Verified no hard-coded secrets were introduced.

Remaining issues:
- None for P1-T6.

Human intervention required:
- None for P1-T6. User authorized local-development defaults/placeholders; production credentials remain human-owned.

---

## Phase 1 Verification Evidence

Status: PHASE VERIFIED

Verification date: 2026-04-28 01:25:42 IST

Evidence summary:
- P1-T1 through P1-T6 are VERIFIED.
- Tenants, tenant settings, users, sessions, and audit events exist.
- Roles exist exactly as `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER`.
- Argon2id password hashing, hashed session tokens, secure session cookies, login/logout/me APIs, RBAC guards, idempotent seed users, and protected dashboard shell are implemented and verified.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed for the completed phase.
- Live server smoke tests verified unauthenticated redirect, seeded login, protected dashboard/admin rendering, and logout.
- Scope checks confirmed no Phase 2 submission/storage feature was implemented early.

Remaining issues:
- None for Phase 1.

Human intervention required:
- None before P2-T1. Defaults/placeholders are approved for local development; production credentials remain human-owned.

---

## P2-T1 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- drizzle/0002_lively_rictor.sql
- drizzle/meta/0002_snapshot.json
- drizzle/meta/_journal.json
- src/lib/db/schema.ts

Database migrations:
- drizzle/0002_lively_rictor.sql

Commands run:
- `sed -n '1,280p' AGENTS.md` — PASS, updated root instructions and current state re-read before implementation
- `sed -n '700,770p' IMPLEMENTATION_TRACKER.md` — PASS, exact P2-T1 task and verification prompt read
- `npm run db:generate` with `.env` loaded — PASS, generated `drizzle/0002_lively_rictor.sql`
- `sed -n '1,260p' drizzle/0002_lively_rictor.sql` — PASS, migration manually inspected
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 6 test files and 23 tests passed
- `npm run db:migrate` — PASS, migration applied successfully
- PostgreSQL table introspection query — PASS, confirmed `submissions` and `submission_files`
- PostgreSQL enum introspection query — PASS, confirmed `DRAFT`, `UPLOADED`, `EXTRACTING`, `READY_FOR_SCAN`, `SCAN_QUEUED`, `SCANNING`, `SCAN_COMPLETE`, `UNDER_REVIEW`, `HOLD`, `CLEARED`, `ESCALATED`, `FAILED`
- PostgreSQL index introspection query — PASS, confirmed tenant, status, creator, reviewer, submission, uploader, checksum, and storage-object indexes
- `npm run build` — PASS
- `rg -n "submissionStatus|submission_status|submissions|submissionFiles|submission_files|upload|storage service|create submission|scan|report" src/lib/db/schema.ts drizzle/0002_lively_rictor.sql src/app src/server src/lib --glob '!node_modules/**'` — PASS, confirmed schema/migration changes and no storage/upload/scan/report implementation beyond existing placeholders
- `rg -n "TODO|FIXME|XXX|HACK" src/lib/db/schema.ts drizzle/0002_lively_rictor.sql --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:29:31 IST

Manual verification:
- Verified `src/lib/db/schema.ts` defines exact `submission_status` enum values.
- Verified `submissions` includes `tenant_id`, `title`, `status`, `created_by_user_id`, nullable `assigned_reviewer_id`, nullable `word_count`, `metadata`, `created_at`, and `updated_at`.
- Verified `submission_files` includes `tenant_id`, `submission_id`, `original_filename`, `storage_bucket`, `storage_key`, `mime_type`, `file_size_bytes`, `checksum_sha256`, `uploaded_by_user_id`, and `created_at`.
- Verified both new tables are tenant-aware and indexed.
- Verified no MinIO storage service, create/list/detail API, upload API, extraction, scan, report, or other later task was implemented.

Remaining issues:
- None for P2-T1.

Human intervention required:
- None for P2-T1. User approved local-development defaults/placeholders.

---

## P2-T2 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- package-lock.json
- package.json
- src/lib/storage/object-storage.ts
- tests/object-storage.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,280p' AGENTS.md` — PASS, updated root instructions and current state re-read before implementation
- `sed -n '770,825p' IMPLEMENTATION_TRACKER.md` — PASS, exact P2-T2 task and verification prompt read
- `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner --no-audit --no-fund` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 7 test files and 25 tests passed
- Initial MinIO smoke with `npx tsx -e` — FAIL, top-level await was not supported in the emitted CommonJS eval format
- MinIO smoke with async wrapper and `.env` loaded — PASS, `putObject`, `getObject`, and `deleteObject` worked for `tenants/00000000-0000-4000-8000-000000000001/submissions/00000000-0000-4000-8000-000000000002/smoke.txt`
- `npm run build` — PASS
- `rg -n "MINIO_ACCESS_KEY|MINIO_SECRET_KEY|secretAccessKey|accessKeyId|getObjectStorageClient|buildTenantStorageKey|putObject|getObject|deleteObject|getPresigned" src tests package.json --glob '!node_modules/**' --glob '!.next/**'` — PASS, credentials appear only in env validation/test fixtures and storage client creation, not client components/routes
- `rg -n "TODO|FIXME|XXX|HACK" src/lib/storage tests/object-storage.test.ts package.json --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:32:26 IST

Manual verification:
- Verified `src/lib/storage/object-storage.ts` exports typed `putObject`, `getObject`, `deleteObject`, `getPresignedUploadUrl`, `getPresignedDownloadUrl`, and `buildTenantStorageKey`.
- Verified storage keys include `tenants/{tenantId}/submissions/{submissionId}/...`.
- Verified filename sanitization removes path traversal and unsafe characters.
- Verified storage configuration is read through the validated env module.
- Verified raw MinIO credentials are not exposed to client code; no client component imports the storage service.
- Verified no upload API, submission API, extraction, scan, report, or future-phase feature was implemented.

Remaining issues:
- None for P2-T2.

Human intervention required:
- None for P2-T2. Local MinIO configuration is present.

---

## P2-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/submissions/route.ts
- src/app/api/submissions/[id]/route.ts
- src/server/services/submissions.service.ts
- tests/submissions-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '814,858p' IMPLEMENTATION_TRACKER.md` — PASS, exact P2-T3 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 8 test files and 29 tests passed
- `npm run build` — PASS, build included `/api/submissions` and `/api/submissions/[id]`
- `npm run start` — PASS for live API smoke, then stopped
- `curl` login as seeded demo user — PASS, returned authenticated session cookie
- `curl` `POST /api/submissions` — PASS, returned HTTP 201 and created submission `41002e0c-e1eb-49eb-8911-7a6bff110cb6`
- `curl` `GET /api/submissions/41002e0c-e1eb-49eb-8911-7a6bff110cb6` — PASS, returned the created submission
- `curl` `GET /api/submissions` — PASS, returned the user's own submission list
- PostgreSQL audit query — PASS, confirmed `submission.create` audit event for `41002e0c-e1eb-49eb-8911-7a6bff110cb6`
- `find src/app/api/submissions -type f -maxdepth 3` — PASS, confirmed only list/create/detail routes exist
- `rg -n "upload|presigned|multipart" src/app/api/submissions src/server/services/submissions.service.ts tests/submissions-service.test.ts` — PASS, confirmed no upload feature implementation in P2-T3
- `rg -n "TODO|FIXME|XXX|HACK" src/app/api/submissions src/server/services/submissions.service.ts tests/submissions-service.test.ts` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:35:54 IST

Manual verification:
- Verified `GET /api/submissions`, `POST /api/submissions`, and `GET /api/submissions/:id` exist.
- Verified submission service query scopes enforce `USER` own submissions, `REVIEWER` tenant submissions, `INSTITUTION_ADMIN` tenant submissions, and `SUPER_ADMIN` global or tenant-filtered access.
- Verified submission creation writes `submission.create` audit events with tenant and actor identifiers.
- Verified all submission queries are tenant-scoped except the intentional super-admin global view.
- Verified upload was not implemented in P2-T3.

Remaining issues:
- None for P2-T3.

Human intervention required:
- None for P2-T3. Authenticated seeded users are available.

---

## P2-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/submissions/[id]/upload/route.ts
- src/server/services/submission-upload.service.ts
- tests/submission-upload.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '860,910p' IMPLEMENTATION_TRACKER.md` — PASS, exact P2-T4 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 9 test files and 34 tests passed
- `npm run build` — PASS, build included `/api/submissions/[id]/upload`
- `npm run start` — PASS for live API smoke, then stopped
- `curl` login as seeded demo user — PASS, returned authenticated session cookie
- `curl` `POST /api/submissions` — PASS, created submission `012a0108-26ec-410a-9b68-81f059019de7`
- `curl` `POST /api/submissions/012a0108-26ec-410a-9b68-81f059019de7/upload` with `text/plain` — PASS, returned HTTP 201, file `76016e7e-92d2-4055-b668-42a6a97e4b50`, status `UPLOADED`, checksum `4e6f3fc03152cb3c2d3bd9a37a76b5f3abad10f890813a5b3c40f6ba454cf5c3`, and tenant-scoped storage key
- `curl` upload with `image/png` — PASS, returned HTTP 400 `Unsupported file type`
- `curl` login as seeded reviewer and upload to user submission — PASS, returned HTTP 403
- PostgreSQL metadata/status/audit query — PASS, confirmed `submission_files` row, `UPLOADED` submission status, and `submission.file.upload` audit event for `76016e7e-92d2-4055-b668-42a6a97e4b50`
- MinIO `getObject` through storage service — PASS, retrieved `text/plain` object body `P2-T4 final upload smoke`
- `find src/app/api/submissions -maxdepth 4 -type f | sort` — PASS, confirmed only submission list/detail/upload routes exist
- `rg -n "TODO|FIXME|XXX|HACK" src/app/api/submissions src/server/services/submission-upload.service.ts tests/submission-upload.test.ts` — PASS, no incomplete task markers found
- `rg -n "MINIO_ACCESS_KEY|MINIO_SECRET_KEY|SESSION_SECRET|password|secretAccessKey|accessKeyId" src/app/api/submissions src/server/services/submission-upload.service.ts tests/submission-upload.test.ts` — PASS, only local placeholder env fixtures appear in tests
- `rg -n "extract|preprocess|scan|report|provider|worker" src/app/api/submissions src/server/services/submission-upload.service.ts tests/submission-upload.test.ts` — PASS, only test descriptions referencing pre-scan state matched; no future extraction, preprocessing, scan, report, provider, or worker feature was implemented
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:43:02 IST

Manual verification:
- Verified `POST /api/submissions/:id/upload` exists.
- Verified upload validation supports PDF, DOC, DOCX, and TXT MIME types and rejects unsupported MIME types.
- Verified max upload size is read from `tenant_settings.settings.maxFileSizeBytes` or `tenant_settings.settings.maxFileSizeMb`, with the approved 25 MB default.
- Verified non-super-admin upload lookup is tenant-scoped at query time.
- Verified only owners, institution admins, and super admins can upload while status is `DRAFT` or `UPLOADED`; reviewers and cross-tenant users are denied.
- Verified metadata includes original filename, storage bucket/key, MIME type, file size, checksum, uploader, tenant, and submission ID.
- Verified storage keys include `tenants/{tenantId}/submissions/{submissionId}/...`.
- Verified upload updates submission status to `UPLOADED` and writes an audit event.
- Verified no extraction, preprocessing, scan, report, or UI feature was implemented in P2-T4.

Remaining issues:
- None for P2-T4.

Human intervention required:
- None for P2-T4. Approved file type and local size defaults were used.

---

## P2-T5 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/submissions/page.tsx
- src/app/(dashboard)/submissions/new/page.tsx
- src/app/(dashboard)/submissions/[id]/page.tsx
- src/components/submissions/submission-create-upload-form.tsx
- src/server/services/submissions.service.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '905,970p' IMPLEMENTATION_TRACKER.md` — PASS, exact P2-T5 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 9 test files and 34 tests passed
- `npm run build` — PASS, build included `/submissions`, `/submissions/new`, and `/submissions/[id]`
- `npm run start` — PASS for browser UI smoke, then stopped
- Playwright browser smoke — PASS, logged in as seeded demo user, opened `/submissions/new`, created and uploaded `plagcheck-p2t5-browser-upload.txt`, landed on `/submissions/1f69777d-cb07-42ae-947e-5fcb4d1c46b1`, and confirmed `UPLOADED` status plus file metadata on the detail page
- `rg -n "TODO|FIXME|XXX|HACK" 'src/app/(dashboard)/submissions' src/components/submissions src/server/services/submissions.service.ts` — PASS, no incomplete task markers found
- `rg -n "extract|preprocess|scan|provider|worker|report" 'src/app/(dashboard)/submissions' src/components/submissions src/server/services/submissions.service.ts` — PASS, no future extraction, preprocessing, scan, provider, worker, or report feature was implemented
- `rg -n "MINIO_ACCESS_KEY|MINIO_SECRET_KEY|SESSION_SECRET|password|secretAccessKey|accessKeyId" 'src/app/(dashboard)/submissions' src/components/submissions src/server/services/submissions.service.ts` — PASS, no secrets or credential references found
- `find 'src/app/(dashboard)/submissions' src/components/submissions -type f | sort` — PASS, confirmed P2-T5 UI files
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:48:36 IST

Manual verification:
- Verified `/submissions` lists submissions visible to the current user through the service-layer tenant/RBAC scope.
- Verified `/submissions/new` provides accessible title and file controls, drag/drop target, file picker, and error messages.
- Verified the UI creates a submission through `POST /api/submissions` and uploads through `POST /api/submissions/:id/upload`.
- Verified `/submissions/:id` shows submission status, uploaded file name, MIME type, size, checksum, submission ID, tenant ID, and file count.
- Verified no extraction, preprocessing, scan, report, or later-phase UI was implemented.

Remaining issues:
- None for P2-T5.

Human intervention required:
- None for P2-T5.

---

## Phase 2 Verification Evidence

Status: PHASE VERIFIED

Date/time: 2026-04-28 01:48:36 IST

Commands and evidence checked:
- Confirmed P2-T1, P2-T2, P2-T3, P2-T4, and P2-T5 are `VERIFIED`.
- Confirmed `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed after P2-T5.
- Confirmed secure tenant-scoped file upload and submission intake work through API and browser UI smoke tests.
- Confirmed files are stored in MinIO under tenant-scoped keys and metadata/checksums are stored in PostgreSQL.
- Confirmed submission status updates to `UPLOADED` and create/upload audit events are written.
- Confirmed searches found no Phase 3 extraction, preprocessing, scan orchestration, reports, provider, or worker implementation.

Human interventions needed before or during Phase 3:
- None for P3-T1 schema work.
- Preprocessing thresholds and a golden sample corpus remain later validation inputs; safe defaults are approved for continued local MVP implementation.

Remaining issues:
- None for Phase 2.

---

## P3-T1 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/lib/db/schema.ts
- drizzle/0003_futuristic_morgan_stark.sql
- drizzle/meta/0003_snapshot.json
- drizzle/meta/_journal.json

Database migrations:
- drizzle/0003_futuristic_morgan_stark.sql

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '980,1065p' IMPLEMENTATION_TRACKER.md` — PASS, exact P3-T1 task and verification prompt read
- `npm run db:generate` — PASS, generated `drizzle/0003_futuristic_morgan_stark.sql`
- `sed -n '1,260p' drizzle/0003_futuristic_morgan_stark.sql` — PASS, migration inspected
- `npm run db:migrate` — PASS, migrations applied successfully
- PostgreSQL introspection query — PASS, confirmed `extracted_texts`, `preprocessing_runs`, and `text_chunks` columns and indexes in the local database
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 9 test files and 34 tests passed
- `npm run build` — PASS
- `rg -n "extractedTexts|extracted_texts|preprocessingRuns|preprocessing_runs|textChunks|text_chunks|extraction_method|rules_applied" src/lib/db/schema.ts drizzle/0003_futuristic_morgan_stark.sql` — PASS, confirmed schema and migration entries
- `rg -n "TODO|FIXME|XXX|HACK" src/lib/db/schema.ts drizzle/0003_futuristic_morgan_stark.sql` — PASS, no incomplete task markers found
- `rg -n "extractText|preprocess|chunkText|/api/.*/extract|scan|provider|worker|report" src/app src/server src/lib --glob '!src/lib/db/schema.ts'` — PASS, no extraction service, preprocessing logic, scan, provider, worker, or report implementation added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:51:05 IST

Manual verification:
- Verified `extracted_texts` includes `tenant_id`, `submission_id`, `raw_text`, `word_count`, `char_count`, `extraction_method`, and `created_at`.
- Verified `preprocessing_runs` includes `tenant_id`, `submission_id`, `original_word_count`, `sanitized_word_count`, `removed_word_count`, `rules_applied`, `sanitized_text`, and `created_at`.
- Verified `text_chunks` includes `tenant_id`, `submission_id`, `chunk_index`, `text`, `start_char`, `end_char`, and `word_count`.
- Verified all three tables are tenant-aware and reference `submissions`.
- Verified P3-T1 stayed schema-only and did not implement extraction or preprocessing behavior.

Remaining issues:
- None for P3-T1.

Human intervention required:
- None for P3-T1.

---

## P3-T2 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- package-lock.json
- package.json
- src/features/extraction/extract-text.ts
- tests/extract-text.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1055,1105p' IMPLEMENTATION_TRACKER.md` — PASS, exact P3-T2 task and verification prompt read
- `npm install mammoth pdf-parse --no-audit --no-fund` — PASS
- `npm run lint` — PASS
- Initial `npm run test` — FAIL, PDF parser fixture returned additional surrounding text so the test assumed too-small a word count
- `npm run test` — PASS, 10 test files and 38 tests passed after correcting the PDF fixture assertion
- `npm run typecheck` — PASS
- `npm run build` — PASS
- `rg -n "extractTextFromTxt|extractTextFromDocx|extractTextFromPdf|extractTextFromFile|UnsupportedExtractionTypeError|mammoth|PDFParse" src/features/extraction tests/extract-text.test.ts package.json` — PASS, confirmed required functions and parser usage
- `rg -n "preprocess|sanitized|bibliography|quote|small match|scan|provider|worker|report" src/features/extraction tests/extract-text.test.ts` — PASS, no preprocessing, scan, provider, worker, or report implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src/features/extraction tests/extract-text.test.ts` — PASS, no incomplete task markers found
- `rg -n "MINIO_ACCESS_KEY|MINIO_SECRET_KEY|SESSION_SECRET|password|secretAccessKey|accessKeyId|api[_-]?key|token" src/features/extraction tests/extract-text.test.ts` — PASS, no secrets or credential references found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:54:59 IST

Manual verification:
- Verified `extractTextFromTxt(buffer)` exists and returns text, word count, character count, and method `txt`.
- Verified `extractTextFromDocx(buffer)` exists and extracts text with `mammoth`.
- Verified `extractTextFromPdf(buffer)` exists and extracts text with `pdf-parse`.
- Verified `extractTextFromFile({ buffer, mimeType, filename })` dispatches TXT, DOCX, and PDF by MIME type or extension.
- Verified legacy `.doc` is rejected with `UnsupportedExtractionTypeError` instead of pretending binary DOC extraction is implemented.
- Verified no preprocessing behavior was implemented.

Remaining issues:
- None for P3-T2.

Human intervention required:
- None for P3-T2. Binary DOC support remains a later policy/tooling decision.

---

## P3-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/submissions/[id]/extract/route.ts
- src/server/services/extraction.service.ts
- tests/extraction-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1108,1165p' IMPLEMENTATION_TRACKER.md` — PASS, exact P3-T3 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 11 test files and 39 tests passed
- `npm run build` — PASS, build included `/api/submissions/[id]/extract`
- `npm run start` — PASS for live API smoke, then stopped
- `curl` login as seeded demo user — PASS, returned authenticated session cookie
- `curl` create submission and upload TXT file — PASS, created `9a08c262-7390-4b26-b7cf-50cd51c74fd2` and uploaded file
- `curl` `POST /api/submissions/9a08c262-7390-4b26-b7cf-50cd51c74fd2/extract` — PASS, returned HTTP 200, extracted text `54df26a3-ff3a-42b2-8ad5-90885f7bd346`, status `READY_FOR_SCAN`, word count `8`, and method `txt`
- PostgreSQL extraction/status/audit query — PASS, confirmed `extracted_texts` row, submission `READY_FOR_SCAN` with word count `8`, and `submission.extract` audit event
- `curl` extract on `DRAFT` submission — PASS, returned HTTP 409
- `curl` extract on already `READY_FOR_SCAN` submission — PASS, returned HTTP 409
- `find src/app/api/submissions -maxdepth 4 -type f | sort` — PASS, confirmed submission list/detail/upload/extract routes only
- `rg -n "extractSubmissionText|submission.extract|extractedTexts|READY_FOR_SCAN|/extract" src/app/api/submissions src/server/services/extraction.service.ts tests/extraction-service.test.ts` — PASS, confirmed P3-T3 implementation points
- `rg -n "preprocess|sanitized|bibliography|quote|small match|scan provider|scan job|source match|ai_assessment|grammar|report" src/app/api/submissions src/server/services/extraction.service.ts tests/extraction-service.test.ts` — PASS, no preprocessing, scan, provider, worker, grammar, or report implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src/app/api/submissions src/server/services/extraction.service.ts tests/extraction-service.test.ts` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 01:58:07 IST

Manual verification:
- Verified extraction route requires authentication and UUID submission ID.
- Verified tenant and owner/staff scope is enforced through the existing submission service before file access.
- Verified extraction requires submission status `UPLOADED`.
- Verified latest tenant-scoped submission file is loaded from MinIO.
- Verified extracted raw text, word count, character count, and extraction method are persisted in `extracted_texts`.
- Verified submission status changes to `READY_FOR_SCAN` and `word_count` is updated.
- Verified `submission.extract` audit event is written.
- Verified no preprocessing, scan, provider, worker, report, AI, or grammar feature was implemented.

Remaining issues:
- None for P3-T3.

Human intervention required:
- None for P3-T3.

---

## P3-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/features/preprocessing/preprocess-text.ts
- tests/preprocess-text.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1148,1208p' IMPLEMENTATION_TRACKER.md` — PASS, exact P3-T4 task and verification prompt read
- Initial `npm run test` — FAIL, two tests expected different non-semantic whitespace after bibliography and quote removal
- `npm run test` — PASS, 12 test files and 46 tests passed after correcting expectations
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS
- `rg -n "normalizeWhitespace|removeBibliographySection|removeQuotedText|removeSmallMatchesByWordThreshold|splitIntoChunks|preprocessText|rulesApplied" src/features/preprocessing/preprocess-text.ts tests/preprocess-text.test.ts` — PASS, confirmed preprocessing engine functions and tests
- `rg -n "api/submissions|route.ts|scan|provider|worker|report|source_match|ai_assessment|grammar" src/features/preprocessing tests/preprocess-text.test.ts` — PASS, no API, scan, provider, worker, report, AI, or grammar implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src/features/preprocessing tests/preprocess-text.test.ts` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:00:43 IST

Manual verification:
- Verified `normalizeWhitespace`, `removeBibliographySection`, `removeQuotedText`, `removeSmallMatchesByWordThreshold`, and `splitIntoChunks` exist.
- Verified `preprocessText` returns `sanitizedText`, `originalWordCount`, `sanitizedWordCount`, `removedWordCount`, `rulesApplied`, and `chunks`.
- Verified original text is counted separately from sanitized text and is not overwritten by the engine.
- Verified tests cover bibliography/removal, references removal, quoted text removal, small-match threshold filtering, whitespace normalization, and chunk splitting.
- Verified no API/database persistence, scan, provider, report, AI, or grammar feature was implemented.

Remaining issues:
- None for P3-T4.

Human intervention required:
- None for P3-T4. Safe default behavior was used.

---

## P3-T5 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/submissions/[id]/preprocess/route.ts
- src/app/(dashboard)/submissions/[id]/page.tsx
- src/components/submissions/preprocess-submission-button.tsx
- src/features/preprocessing/preprocess-text.ts
- src/server/services/extraction.service.ts
- src/server/services/preprocessing.service.ts
- tests/preprocessing-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1208,1275p' IMPLEMENTATION_TRACKER.md` — PASS, exact P3-T5 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 13 test files and 49 tests passed
- `npm run build` — PASS, build included `/api/submissions/[id]/preprocess`
- `npm run start` — PASS for API and UI smoke, then stopped
- `curl` login/create/upload/extract/preprocess smoke — PASS, created submission `06aca7f3-35f2-4d1d-b21d-4121d9216b67`, preprocessing run `3c92564f-378f-4266-95bd-230a706a2b79`, original word count `38`, sanitized word count `18`, removed word count `20`, chunk count `1`, and default rules
- PostgreSQL preprocessing/chunk/audit query — PASS, confirmed `preprocessing_runs`, `text_chunks`, sanitized text separate from raw extracted text, and `submission.preprocess` audit event
- Playwright detail UI check — PASS, `/submissions/06aca7f3-35f2-4d1d-b21d-4121d9216b67` showed extracted words, sanitized words, removed words, chunk count, and rules applied
- `find src/app/api/submissions -maxdepth 4 -type f | sort` — PASS, confirmed submission list/detail/upload/extract/preprocess routes
- `rg -n "preprocessSubmissionText|submission.preprocess|preprocessingRuns|textChunks|PreprocessSubmissionButton|preprocessingRun|sanitizedWordCount|removedWordCount" src/app src/server src/components src/features tests/preprocessing-service.test.ts` — PASS, confirmed P3-T5 implementation points
- `rg -n "scan_jobs|scan_results|source_matches|ai_assessments|grammar_findings|ScanProvider|SCAN_QUEUED|SCANNING|provider|worker|report" src/app src/server src/components src/features tests` — PASS, only existing status constant checks matched; no scan orchestration, provider, worker, report, AI, or grammar implementation added
- `rg -n "TODO|FIXME|XXX|HACK" src/app/api/submissions src/app/'(dashboard)'/submissions src/server/services/preprocessing.service.ts src/components/submissions src/features/preprocessing tests/preprocessing-service.test.ts` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:05:48 IST

Manual verification:
- Verified preprocessing route requires authentication and UUID submission ID.
- Verified preprocessing requires submission status `READY_FOR_SCAN`.
- Verified preprocessing uses the latest tenant-scoped `extracted_texts` row.
- Verified tenant settings are read from `tenant_settings.settings.preprocessing` with safe defaults.
- Verified `preprocessing_runs` stores original/sanitized/removed counts, rules, and sanitized text.
- Verified `text_chunks` stores tenant-scoped sanitized chunks and replaces old chunks for the submission.
- Verified `submission.preprocess` audit event is written.
- Verified detail UI shows extracted word count, sanitized word count, removed word count, chunk count, and rules applied.
- Verified no scan, provider, worker, report, AI, or grammar feature was implemented.

Remaining issues:
- None for P3-T5.

Human intervention required:
- None for P3-T5.

---

## Phase 3 Verification Evidence

Status: PHASE VERIFIED

Date/time: 2026-04-28 02:05:48 IST

Commands and evidence checked:
- Confirmed P3-T1, P3-T2, P3-T3, P3-T4, and P3-T5 are `VERIFIED`.
- Confirmed `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed after P3-T5.
- Confirmed extraction works for TXT/DOCX/PDF through unit fixtures and for TXT through live route smoke.
- Confirmed preprocessing works through unit tests and live route smoke.
- Confirmed services enforce tenant-scoped access through submission lookups and tenant-scoped extracted/preprocessed/chunk queries.
- Confirmed raw extracted text is stored in `extracted_texts` and sanitized scan text is stored separately in `preprocessing_runs`/`text_chunks`.
- Confirmed no Phase 4 scan orchestration, provider adapter, worker, scan result, report, AI, or grammar implementation was added.

Human interventions needed before or during Phase 4:
- None for P4-T1 through mock-provider MVP schema work.
- Real provider credentials/contracts remain deferred until the real provider integration phase.

Remaining issues:
- None for Phase 3.

---

## P4-T1 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/lib/db/schema.ts
- drizzle/0004_volatile_sway.sql
- drizzle/meta/0004_snapshot.json
- drizzle/meta/_journal.json

Database migrations:
- drizzle/0004_volatile_sway.sql

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1275,1365p' IMPLEMENTATION_TRACKER.md` — PASS, exact P4-T1 task and verification prompt read
- `npm run db:generate` — PASS, generated `drizzle/0004_volatile_sway.sql`
- `sed -n '1,320p' drizzle/0004_volatile_sway.sql` — PASS, migration inspected
- `npm run db:migrate` — PASS, migrations applied successfully
- PostgreSQL introspection query — PASS, confirmed `scan_jobs`, `scan_results`, `source_matches`, `ai_assessments`, and `grammar_findings` columns and indexes in the local database
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 13 test files and 49 tests passed
- `npm run build` — PASS
- `rg -n "scanJobs|scan_jobs|scanResults|scan_results|sourceMatches|source_matches|aiAssessments|ai_assessments|grammarFindings|grammar_findings" src/lib/db/schema.ts drizzle/0004_volatile_sway.sql` — PASS, confirmed schema and migration entries
- `rg -n "ScanProvider|mock\\.provider|queueScan|runScan|worker|/scan|start scan|provider interface" src/app src/server src/features tests` — PASS, no provider, queue, worker, scan API, or report implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src/lib/db/schema.ts drizzle/0004_volatile_sway.sql` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:08:36 IST

Manual verification:
- Verified `scan_jobs` includes `tenant_id`, `submission_id`, `provider`, `status`, `attempts`, `error_message`, `started_at`, `finished_at`, and `created_at`.
- Verified `scan_results` includes `tenant_id`, `submission_id`, `scan_job_id`, `similarity_score`, `ai_probability`, original/scanned word counts, provider metadata, and `created_at`.
- Verified `source_matches`, `ai_assessments`, and `grammar_findings` are tenant-aware and reference scan results.
- Verified indexes support lookup by tenant, submission, job, result, and job status.
- Verified P4-T1 stayed schema-only and did not implement scan providers, queues, workers, APIs, or reports.

Remaining issues:
- None for P4-T1.

Human intervention required:
- None for P4-T1. Mock provider remains approved for MVP.

---

## P4-T2 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/features/scanning/providers/types.ts
- src/features/scanning/providers/mock.provider.ts
- src/features/scanning/providers/index.ts
- tests/mock-scan-provider.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1360,1435p' IMPLEMENTATION_TRACKER.md` — PASS, exact P4-T2 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 14 test files and 52 tests passed
- `npm run build` — PASS
- `rg -n "ScanProvider|mockScanProvider|similarityScore|aiProbability|sourceMatches|aiAssessments|grammarFindings|providerMetadata" src/features/scanning tests/mock-scan-provider.test.ts` — PASS, confirmed provider interface, mock provider, outputs, and tests
- `rg -n "fetch\\(|axios|http://|https://|api[_-]?key|SECRET|TOKEN|process\\.env|MINIO|OPENAI|provider key" src/features/scanning tests/mock-scan-provider.test.ts` — PASS, no external calls, secrets, env access, or provider keys; only deterministic `example.invalid` source URLs are present as mock metadata
- `rg -n "enqueueScanJob|claimNextScanJob|markJobRunning|markJobSucceeded|markJobFailed|worker|app/api/.*/scan|scan_jobs.*insert" src/app src/server src/lib src/features tests` — PASS, no queue, worker, or scan API implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src/features/scanning tests/mock-scan-provider.test.ts` — PASS, no incomplete task markers found
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:11:04 IST

Manual verification:
- Verified `src/features/scanning/providers/types.ts` exports typed scan provider input/result models and the `ScanProvider` interface.
- Verified `src/features/scanning/providers/mock.provider.ts` exports deterministic `mockScanProvider`.
- Verified `src/features/scanning/providers/index.ts` re-exports the provider and types.
- Verified the mock provider returns similarity score, AI probability, source matches, AI assessments, grammar findings, and provider metadata.
- Verified the mock provider uses only local deterministic text analysis and does not call external APIs or read secrets.
- Verified no job queue, worker, scan route, or real provider integration was implemented.

Remaining issues:
- None for P4-T2.

Human intervention required:
- None for P4-T2. Real provider keys remain deferred.

---

## P4-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- package.json
- src/lib/jobs/scan-queue.ts
- src/server/worker.ts
- src/server/workers/scan-worker.ts
- tests/scan-queue.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,620p' AGENTS.md` and `sed -n '620,1720p' AGENTS.md` — PASS, root instructions and current state re-read before and during implementation
- `sed -n '1388,1443p' IMPLEMENTATION_TRACKER.md` — PASS, exact P4-T3 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 15 test files and 59 tests passed
- `npm run build` — PASS
- `npm run worker` — PASS, worker loaded `.env`, connected to the queue, and reported no queued scan jobs
- `npx tsx --env-file-if-exists=.env -e '...'` — PASS, live PostgreSQL smoke enqueued a scan job, claimed it with the queue helper, requeued it after first failure, marked it `FAILED` at max attempts, and returned `{"attempts":2,"firstClaimStatus":"RUNNING","finalStatus":"FAILED","provider":"mock","retriedStatus":"QUEUED"}`
- `npx tsx --env-file-if-exists=.env -e '...'` — PASS, cleanup check returned `{"count":0}` for `p4t3-smoke-%` tenants
- `find src/app/api -path '*scan*' -o -path '*scanning*' -print && rg -n "api/submissions/.*/scan|start scan|SCAN_COMPLETE|scanResults|sourceMatches|aiAssessments|grammarFindings|mockScanProvider\\.scan" src tests -g '*.ts' -g '*.tsx'` — PASS, no scan API route, result persistence, report feature, or new mock provider execution was added by P4-T3
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/lib/jobs src/server/workers src/server/worker.ts tests/scan-queue.test.ts package.json` — PASS, no hard-coded secrets in P4-T3 files
- `rg -n "TODO|FIXME|P4-T3|scan queue|scan job|scan worker|claimNextScanJob|enqueueScanJob|markJobFailed|markJobSucceeded|markJobRunning" src tests package.json IMPLEMENTATION_TRACKER.md AGENTS.md` — PASS, no incomplete TODO/FIXME markers related to P4-T3
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:19:30 IST

Manual verification:
- Verified `src/lib/jobs/scan-queue.ts` exports `enqueueScanJob`, `claimNextScanJob`, `markJobRunning`, `markJobSucceeded`, `markJobFailed`, retry constants, and typed scan job status helpers.
- Verified `claimNextScanJob` uses an atomic PostgreSQL update around `FOR UPDATE SKIP LOCKED` and increments attempts when claiming.
- Verified failed jobs return to `QUEUED` before max attempts and become `FAILED` at max attempts.
- Verified `src/server/workers/scan-worker.ts` claims a job, invokes an injected processor, and marks the job succeeded or failed without implementing scan result persistence.
- Verified `src/server/worker.ts` is a runnable worker entrypoint and `package.json` exposes `npm run worker`.
- Verified P4-T3 stayed limited to queue/worker infrastructure and did not add a scan API route or P4-T4 result persistence.

Remaining issues:
- None for P4-T3.

Human intervention required:
- None for P4-T3.

---

## P4-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/submissions/[id]/scan/route.ts
- src/server/services/scanning.service.ts
- src/server/workers/scan-worker.ts
- tests/scan-queue.test.ts
- tests/scanning-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md`, `sed -n '260,620p' AGENTS.md`, `sed -n '620,940p' AGENTS.md`, and `sed -n '940,1120p' AGENTS.md` — PASS, root instructions and current state re-read before P4-T4 implementation
- `sed -n '1444,1496p' IMPLEMENTATION_TRACKER.md` — PASS, exact P4-T4 task and verification prompt read
- Initial `npm run typecheck` — FAIL, worker processor type was too narrow for the real processor return value
- `npm run lint` — PASS
- `npm run typecheck` — PASS after widening `ScanWorkerProcessor` to `Promise<unknown>`
- `npm run test` — PASS, 16 test files and 65 tests passed
- `npm run build` — PASS, build included `/api/submissions/[id]/scan`
- `npx tsx --env-file-if-exists=.env -e '...'` — PASS, live PostgreSQL smoke created a temporary preprocessed submission, started a scan, blocked duplicate start, ran the worker, stored normalized result rows, moved submission to `SCAN_COMPLETE`, marked job `SUCCEEDED`, and returned `{"aiAssessments":2,"auditActions":["submission.scan.completed","submission.scan.queued","submission.scan.started"],"duplicateBlocked":true,"grammarFindings":2,"jobAttempts":1,"jobStatus":"SUCCEEDED","similarityScore":42,"sourceMatches":2,"submissionStatus":"SCAN_COMPLETE","workerStatus":"succeeded"}`
- `npx tsx --env-file-if-exists=.env -e '...'` cleanup check inside smoke — PASS, returned `{"remainingSmokeTenants":0}`
- `npm run worker` — PASS, worker loaded `.env`, connected to the queue, and reported no queued scan jobs after smoke cleanup
- `rg -n "TODO|FIXME|XXX|HACK|P4-T4|scan API|scan worker|SCAN_COMPLETE|submission.scan|startSubmissionScan|processScanJobWithMockProvider|handleScanJobProcessingFailure" src tests IMPLEMENTATION_TRACKER.md AGENTS.md package.json` — PASS, no incomplete TODO/FIXME markers related to P4-T4
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/server/services/scanning.service.ts 'src/app/api/submissions/[id]/scan/route.ts' src/server/workers/scan-worker.ts tests/scanning-service.test.ts tests/scan-queue.test.ts` — PASS, no hard-coded secrets in P4-T4 files
- `rg -n "report|pdf|review_cases|report_snapshots|support_tickets|analytics|Google|OAuth|LMS|provider_accounts|external_api|fetch\\(|axios|https://|http://" src/server/services/scanning.service.ts 'src/app/api/submissions/[id]/scan/route.ts' src/server/workers/scan-worker.ts tests/scanning-service.test.ts tests/scan-queue.test.ts` — PASS, no report/PDF/review/admin/support/integration or external provider implementation was added; matches were only local test URLs
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:24:37 IST

Manual verification:
- Verified `POST /api/submissions/[id]/scan` requires authentication and a UUID submission ID.
- Verified `startSubmissionScan` enforces existing submission RBAC/tenant scope through `getSubmissionById`.
- Verified scan start requires submission status `READY_FOR_SCAN` and a latest tenant-scoped preprocessing run.
- Verified duplicate active scans are prevented by active-job checks plus atomic `READY_FOR_SCAN` to `SCAN_QUEUED` status update.
- Verified scan start writes `submission.scan.queued` audit events.
- Verified the worker claims a queued job, sets submission status to `SCANNING`, calls `mockScanProvider`, stores `scan_results`, `source_matches`, `ai_assessments`, and `grammar_findings`, sets submission status to `SCAN_COMPLETE`, marks the job `SUCCEEDED`, and writes `submission.scan.started`/`submission.scan.completed` audit events.
- Verified worker failure handling requeues the submission for retry or marks it `FAILED` when max attempts are exhausted.
- Verified P4-T4 did not add scan status UI, full report UI, PDF export, review workflow, real provider calls, or advanced integrations.

Remaining issues:
- None for P4-T4.

Human intervention required:
- None for P4-T4.

---

## P4-T5 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/submissions/[id]/page.tsx
- src/components/submissions/scan-status-panel.tsx
- src/components/submissions/scan-submission-button.tsx
- src/server/services/scanning.service.ts
- src/server/services/submissions.service.ts
- tests/scan-status-panel.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,620p' AGENTS.md` and `sed -n '620,1120p' AGENTS.md` — PASS, root instructions and current state re-read before P4-T5 implementation
- `sed -n '1493,1538p' IMPLEMENTATION_TRACKER.md` — PASS, exact P4-T5 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 17 test files and 69 tests passed
- `npm run build` — PASS
- `npm run start` — PASS, local production server started at `http://localhost:3000` for browser smoke
- Playwright ready-state browser smoke — PASS, `READY_FOR_SCAN` submission showed `Scan lifecycle`, `Ready to scan`, and `Start scan`
- Playwright queued-state browser smoke — PASS, clicking `Start scan` posted to `/api/submissions/[id]/scan`, page refreshed to `SCAN_QUEUED`, showed `Scan queued`, and removed the `Start scan` button
- Playwright completed-state browser smoke — PASS, `SCAN_COMPLETE` submission showed `Similarity 42%`, `AI probability 74%`, source match count, grammar finding count, and no full report/PDF/reviewer UI
- `npx tsx --env-file-if-exists=.env -e '...'` — PASS, browser-smoke tenant cleanup returned `{"remainingSmokeTenants":0}`
- `npm run worker` — PASS, worker loaded `.env`, connected to the queue, and reported no queued scan jobs after cleanup
- `rg -n "TODO|FIXME|XXX|HACK|ScanStatusPanel|ScanSubmissionButton|shouldShowScanAction|buildScanTimeline|getScanSummaryForSubmission|Start scan|Scan lifecycle" src tests IMPLEMENTATION_TRACKER.md AGENTS.md` — PASS, no incomplete TODO/FIXME markers related to P4-T5
- `rg -n "Report|report UI|Download PDF|reviewer|review case|sourceTitle|matchedText|sourceUrl|aiAssessments|grammarFindings|sourceMatches|PDF|snapshot" 'src/app/(dashboard)/submissions/[id]/page.tsx' src/components/submissions tests/scan-status-panel.test.ts` — PASS, no full report/PDF/reviewer UI or source-match detail rendering was added; matches were only upload/PDF wording in existing upload UI
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/components/submissions src/server/services/scanning.service.ts 'src/app/(dashboard)/submissions/[id]/page.tsx' tests/scan-status-panel.test.ts` — PASS, no hard-coded secrets in P4-T5 files
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:30:28 IST

Manual verification:
- Verified submission detail page loads `getScanSummaryForSubmission` through the existing tenant-scoped submission access path.
- Verified the scan lifecycle panel shows ready, queued, scanning, complete, and failed state labels.
- Verified the start-scan button renders only when the submission is `READY_FOR_SCAN` and has preprocessing.
- Verified queued/running/completed states do not render the start-scan button, preventing duplicate scan starts from the UI.
- Verified completed scans show only summary values: similarity, AI probability, source-match count, grammar-finding count, and scanned/original word counts.
- Verified P4-T5 did not build a report page, PDF export, reviewer workflow, source-match detail view, real provider calls, or advanced integrations.

Remaining issues:
- None for P4-T5.

Human intervention required:
- None for P4-T5.

---

## Phase 4 Verification Evidence

Status: PHASE VERIFIED

Date/time: 2026-04-28 02:30:28 IST

Commands and evidence checked:
- Confirmed P4-T1, P4-T2, P4-T3, P4-T4, and P4-T5 are `VERIFIED`.
- Confirmed `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed after P4-T5.
- Confirmed `npm run worker` runs against the local PostgreSQL queue.
- Confirmed live DB smoke covered enqueue, claim, retry, worker result persistence, normalized source/AI/grammar rows, status lifecycle, and scan audit events.
- Confirmed browser smoke covered ready, queued, and complete scan UI states.
- Confirmed duplicate active scans are blocked by API/service tests, DB smoke, and UI button removal for queued/running/completed states.
- Confirmed mock provider remains local and deterministic; no paid provider API calls, credentials, reports, PDFs, reviewer workflow, or advanced integrations were added.

Human interventions needed before Phase 5:
- None for P5-T1 schema work.
- Report disclaimer and reviewer workflow policy remain deferred until the relevant P5 tasks require them; safe defaults may be used unless a task is blocked.

Remaining issues:
- None for Phase 4.

---

## P5-T1 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/lib/db/schema.ts
- drizzle/0005_easy_red_skull.sql
- drizzle/meta/0005_snapshot.json
- drizzle/meta/_journal.json

Database migrations:
- drizzle/0005_easy_red_skull.sql

Commands run:
- `sed -n '1,620p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1570,1645p' IMPLEMENTATION_TRACKER.md` — PASS, exact P5-T1 task and verification prompt read
- `npm run db:generate` — PASS, generated `drizzle/0005_easy_red_skull.sql`
- `sed -n '1,320p' drizzle/0005_easy_red_skull.sql` — PASS, migration inspected
- `npm run db:migrate` — PASS, migration applied successfully
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 17 test files and 69 tests passed
- `npm run build` — PASS
- PostgreSQL introspection via `npx tsx --env-file-if-exists=.env -e '...'` — PASS, confirmed `review_cases`, `review_events`, and `report_snapshots` columns, foreign keys, indexes, and `report_snapshots_snapshot_version_positive`
- `rg -n "reviewCases|review_cases|reviewEvents|review_events|reportSnapshots|report_snapshots|snapshotVersion|pdfStorageKey|finalDecision" src/lib/db/schema.ts drizzle/0005_easy_red_skull.sql drizzle/meta/0005_snapshot.json` — PASS, confirmed schema and migration entries
- `rg -n "TODO|FIXME|XXX|HACK" src/lib/db/schema.ts drizzle/0005_easy_red_skull.sql drizzle/meta/0005_snapshot.json` — PASS, no incomplete task markers found
- `rg -n "report.service|ReportJson|reviewer queue|review workflow|PDF|pdf generation|app/api/.*/report|review_cases.*insert|review_events.*insert|report_snapshots.*insert" src tests drizzle/0005_easy_red_skull.sql` — PASS, no report service, review workflow, PDF generation, API route, or insert behavior was implemented in P5-T1; matches were existing PDF extraction/upload support only
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:33:12 IST

Manual verification:
- Verified `review_cases` includes `tenant_id`, `submission_id`, `assigned_reviewer_id`, `status`, nullable `final_decision`, `created_at`, and `updated_at`.
- Verified `review_events` includes `tenant_id`, `review_case_id`, `actor_user_id`, `event_type`, `comment`, JSON `metadata`, and `created_at`.
- Verified `report_snapshots` includes `tenant_id`, `submission_id`, `scan_result_id`, `snapshot_version`, JSON `report_json`, nullable `pdf_storage_key`, `created_by_user_id`, and `created_at`.
- Verified all three tables are tenant-aware and reference the appropriate existing tenant/submission/user/scan tables.
- Verified P5-T1 stayed schema-only and did not implement report assembly, PDF export, reviewer workflow, APIs, or UI.

Remaining issues:
- None for P5-T1.

Human intervention required:
- None for P5-T1.

---

## P5-T2 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/features/reports/report.service.ts
- tests/report-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,620p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1610,1688p' IMPLEMENTATION_TRACKER.md` and `sed -n '1688,1818p' IMPLEMENTATION_TRACKER.md` — PASS, exact P5-T2 task and next-task boundaries read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 18 test files and 72 tests passed
- `npm run build` — PASS
- `npx tsx --env-file-if-exists=.env -e '...'` — PASS, live PostgreSQL smoke assembled a complete report and returned `{"aiAssessments":1,"blockedOtherTenant":true,"files":1,"grammarFindings":1,"reportFooter":"Smoke footer","reviewNotes":1,"similarityScore":37,"sourceMatches":1}`
- `npx tsx --env-file-if-exists=.env -e '...'` cleanup check inside smoke — PASS, returned `{"remainingSmokeTenants":0}`
- `rg -n "ReportJson|getReportJsonForSubmission|buildReportJson|STANDARD_REPORT_DISCLAIMER|resolveTenantBranding|sourceMatches|aiAssessments|grammarFindings|review\\.notes" src/features/reports tests/report-service.test.ts` — PASS, confirmed report assembly implementation and tests
- `rg -n "TODO|FIXME|XXX|HACK" src/features/reports tests/report-service.test.ts` — PASS, no incomplete task markers found
- `rg -n "pdf|PDF|pdfStorageKey|report_snapshots.*insert|reportSnapshots|app/api/.*/report|submissions/.*/report|reviewer/queue|review workflow|Download" src/features/reports tests/report-service.test.ts src/app src/components` — PASS, no report route, PDF generation, snapshot insertion, reviewer workflow, or download behavior was added; matches were existing PDF upload/extraction support only
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/features/reports tests/report-service.test.ts` — PASS, no hard-coded secrets in P5-T2 files
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:36:59 IST

Manual verification:
- Verified `ReportJson` separates similarity score and AI probability.
- Verified report assembly includes submission metadata, file metadata, extraction/preprocessing summary, scan result, source matches, AI assessments, grammar findings, reviewer notes, provider metadata, timestamps, tenant branding, and standard disclaimer.
- Verified `getReportJsonForSubmission` starts from `getSubmissionDetailById`, preserving existing tenant/user submission access control.
- Verified all report data queries include tenant-scoped predicates.
- Verified service returns `null` when the submission is inaccessible or missing required tenant/scan data.
- Verified P5-T2 stayed read-only and did not implement report UI, PDF generation, report snapshot creation, reviewer workflow, API routes, or MinIO writes.

Remaining issues:
- None for P5-T2.

Human intervention required:
- None for P5-T2. Standard disclaimer from the approved autopilot prompt is used.

---

## P5-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/submissions/[id]/report/page.tsx
- src/components/submissions/scan-status-panel.tsx
- src/features/reports/report-page-content.tsx
- src/features/reports/report-view.ts
- tests/report-view.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before verification
- `sed -n '/## P5-T3/,/## P5-T4/p' IMPLEMENTATION_TRACKER.md` — PASS, exact P5-T3 task and verification prompt re-read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 19 test files and 77 tests passed
- `npm run build` — PASS, `/submissions/[id]/report` included as a dynamic route
- `npm run start` — PASS, local production server started for browser smoke
- Playwright browser smoke — PASS, live report rendered DB-backed title, source match, AI assessment, grammar finding, highlighted matched text, separate similarity/AI sections, empty source/AI/grammar states, and cross-tenant 404 access control
- `rg -n "TODO|FIXME|XXX|HACK" src/features/reports src/app/'(dashboard)'/submissions/'[id]'/report src/components/submissions tests/report-view.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "reportSnapshots|report_snapshots|pdfStorageKey|pdf_storage_key|Download PDF|reviewCases|reviewEvents|reviewer queue|review workflow|report snapshot|createSnapshot|MinIO" src/features/reports src/app/'(dashboard)'/submissions/'[id]'/report src/components/submissions tests/report-view.test.ts` — PASS for P5-T3 scope; matches only existing P5-T2 report-service read-only reviewer-note queries, no snapshot/PDF/MinIO/reviewer workflow implementation was added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:47:37 IST

Manual verification:
- Verified `/submissions/[id]/report` uses `getReportJsonForSubmission`, preserving P5-T2 tenant/user access control and returning `notFound()` for inaccessible reports.
- Verified the UI shows overall similarity score, AI probability, source-wise matches, highlighted matched text, AI-assessed sections, grammar findings, exclusions summary, provider metadata, and scan timestamp.
- Verified similarity and AI are separate sections and no combined misconduct score is displayed.
- Verified empty states render for no source matches, no AI assessments, and no grammar findings.
- Verified P5-T3 did not implement PDF generation, immutable report snapshots, MinIO report storage, reviewer workflow, real provider integrations, or future-phase features.

Remaining issues:
- None for P5-T3.

Human intervention required:
- None for P5-T3. Report disclaimer remains the standard disclaimer from P5-T2; formal template/disclaimer approval is still a later pilot gate.

---

## P5-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/reviewer/actions.ts
- src/app/(dashboard)/reviewer/cases/[id]/page.tsx
- src/app/(dashboard)/reviewer/queue/page.tsx
- src/features/review/review.service.ts
- tests/review-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation and verification
- `sed -n '/## P5-T4/,/## P5-T5/p' IMPLEMENTATION_TRACKER.md` — PASS, exact P5-T4 task and verification prompt re-read
- Initial `npm run typecheck` — FAIL, Drizzle selected-row mapper used an invalid `$inferSelect` property on a select object
- `npm run lint` — PASS
- `npm run typecheck` — PASS after replacing the invalid mapper type with an explicit `ReviewCaseRow`
- `npm run test` — PASS, 20 test files and 80 tests passed
- `npm run build` — PASS, `/reviewer/queue` and `/reviewer/cases/[id]` included as dynamic routes
- `npm run start` — PASS, local production server started for browser smoke
- Playwright browser smoke — PASS, reviewer queue showed own/unassigned case and hid another reviewer's case; case page showed timeline/note/status; view-report link opened the report; cross-tenant reviewer case returned 404; institution admin saw all tenant cases
- Live PostgreSQL review workflow smoke via `tsx --env-file-if-exists=.env` — PASS, verified `ASSIGNED_SELF`, `NOTE_ADDED`, and two `STATUS_CHANGED` review events; matching audit actions; reviewer assignment; submission status synchronization to `CLEARED`; and invalid `CLEARED -> ESCALATED` transition blocked with `ReviewCaseStateError`
- Smoke cleanup via `tsx --env-file-if-exists=.env` — PASS, temporary tenants deleted
- `rg -n "TODO|FIXME|XXX|HACK" src/features/review src/app/'(dashboard)'/reviewer tests/review-service.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "reportSnapshots|report_snapshots|pdfStorageKey|pdf_storage_key|Download PDF|PDF|MinIO|storage\\." src/features/review src/app/'(dashboard)'/reviewer tests/review-service.test.ts` — PASS, no PDF generation, immutable snapshot creation, MinIO report storage, or future report-export behavior added
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/features/review src/app/'(dashboard)'/reviewer tests/review-service.test.ts` — PASS, no hard-coded secrets in P5-T4 files
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 02:55:09 IST

Manual verification:
- Verified reviewer route group remains protected by `REVIEW_ROLES`.
- Verified reviewer access is tenant-scoped and limited to unassigned or assigned-to-self cases.
- Verified institution admins can view all review cases for their tenant.
- Verified status changes are constrained to allowed transitions and final statuses cannot transition again.
- Verified each workflow action writes a `review_events` row and an `audit_events` row.
- Verified P5-T4 did not implement PDF generation, immutable snapshots, MinIO report writes, provider integrations, admin analytics, support, or future-phase features.

Remaining issues:
- None for P5-T4.

Human intervention required:
- None for P5-T4. Reviewer workflow policy remains a before-pilot approval item, not a blocker for this tracker-defined MVP implementation.

---

## P5-T5 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- package.json
- package-lock.json
- src/app/api/submissions/[id]/report/pdf/route.ts
- src/features/reports/report-export.service.ts
- src/features/reports/report-pdf.ts
- src/lib/storage/object-storage.ts
- src/types/pdfkit-standalone.d.ts
- tests/object-storage.test.ts
- tests/report-pdf.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation and verification
- `sed -n '/## P5-T5/,/## P5-T6/p' IMPLEMENTATION_TRACKER.md` and `sed -n '1755,1812p' IMPLEMENTATION_TRACKER.md` — PASS, exact P5-T5 task and verification prompt read
- `sed -n '1,260p' CODEX_SINGLE_AUTOPILOT_MASTER_PROMPT.md` — PASS, autopilot root/tracker management instructions re-read and stale AGENTS P5 split reconciled to tracker P5-T5 scope
- `npm install pdfkit @types/pdfkit --no-audit --no-fund` — PASS, added Node-compatible PDF generation library and types
- Initial live PDF route smoke — FAIL, bundled `pdfkit` import could not find `Helvetica.afm` under Next.js server bundle path
- `npm run lint` — PASS after replacing the `require()`-style standalone declaration and removing unused imports
- `npm run typecheck` — PASS
- `npm run test` — PASS, 21 test files and 81 tests passed
- `npm run build` — PASS, `/api/submissions/[id]/report/pdf` included as a dynamic route
- `npm run start` — PASS, local production server started for route smoke
- Live PDF route smoke via `tsx --env-file-if-exists=.env` — PASS, returned HTTP 200, `content-type: application/pdf`, `%PDF` header, `Content-Disposition` attachment filename, and extracted PDF text containing tenant name, file details, similarity score, AI probability, source match, exclusions summary, reviewer note, and disclaimer
- Live PostgreSQL/MinIO verification via `tsx --env-file-if-exists=.env` — PASS, `report_snapshots` row saved `report_json`, `snapshot_version: 1`, and tenant-scoped `pdf_storage_key`; MinIO object existed with `ContentType: application/pdf`; `report.pdf.generated` audit event existed; cross-tenant PDF request returned HTTP 404; stored smoke object and tenants were cleaned up
- `rg -n "TODO|FIXME|XXX|HACK" src/features/reports src/app/api/submissions/'[id]'/report/pdf src/lib/storage tests/report-pdf.test.ts tests/object-storage.test.ts src/types/pdfkit-standalone.d.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/features/reports/report-pdf.ts src/features/reports/report-export.service.ts src/app/api/submissions/'[id]'/report/pdf/route.ts src/types/pdfkit-standalone.d.ts tests/report-pdf.test.ts` — PASS, no hard-coded secrets in P5-T5 files
- `rg -n "Google|OAuth|LMS|provider_accounts|external_api|fetch\\(|axios|support_tickets|analytics|repository matching|client-side quick scan|PWA" src/features/reports/report-pdf.ts src/features/reports/report-export.service.ts src/app/api/submissions/'[id]'/report/pdf/route.ts tests/report-pdf.test.ts` — PASS, no future provider/integration/admin/support/PWA features added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 03:02:32 IST

Manual verification:
- Verified PDF content includes tenant logo/name text, submission details, file details, similarity score, AI probability, source matches, exclusions summary, reviewer notes, report timestamp, scan timestamp, and the standard disclaimer.
- Verified PDF export uses the existing `getReportJsonForSubmission` access path, preserving tenant/user report access control.
- Verified generated PDFs are stored under tenant/submission-scoped report keys in MinIO/S3-compatible storage.
- Verified `report_snapshots` insertion is append-only with a monotonically increasing `snapshot_version` and saved `pdf_storage_key`.
- Verified P5-T5 did not implement Phase 6 analytics/admin/support/customization, Phase 7 security/retention/docs, deployment, or advanced integrations.

Remaining issues:
- None for P5-T5.

Human intervention required:
- None for P5-T5. Formal report template/disclaimer approval remains a before-pilot item and does not block the tracker-defined MVP task.

---

## Phase 5 Verification Evidence

Status: PHASE VERIFIED

Date/time: 2026-04-28 03:02:32 IST

Commands and evidence checked:
- Confirmed P5-T1, P5-T2, P5-T3, P5-T4, and P5-T5 are `VERIFIED` in `IMPLEMENTATION_TRACKER.md`.
- Confirmed `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed after P5-T5.
- Confirmed report schema, report assembly service, report UI, reviewer workflow, PDF export, immutable report snapshot row, MinIO storage, audit events, and tenant/RBAC access controls have task-level evidence.
- Confirmed the current `IMPLEMENTATION_TRACKER.md` P5 scope is P5-T1 through P5-T5; `AGENTS.md` was updated to align with this tracker scope.
- Confirmed no incomplete TODO/FIXME markers, hard-coded secrets, real external provider calls, LMS/OAuth integrations, analytics, support module, retention controls, deployment artifacts, or P9 features were added in P5-T5.

Human interventions needed before Phase 6:
- None blocking P6-T1.
- Report disclaimer/template approval remains pending before pilot/UAT.
- Tenant branding/support/usage-limit choices can be handled in Phase 6 with safe defaults unless a current task becomes blocked.

Remaining issues:
- None for Phase 5.

---

## P6-T1 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/api/admin/analytics/route.ts
- src/features/analytics/analytics.service.ts
- tests/analytics-service.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation and verification
- `sed -n '/## P6-T1/,/## P6-T2/p' IMPLEMENTATION_TRACKER.md` and `sed -n '1818,1875p' IMPLEMENTATION_TRACKER.md` — PASS, exact P6-T1 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 22 test files and 85 tests passed
- `npm run build` — PASS, `/api/admin/analytics` included as a dynamic route
- `npm run start` — PASS, local production server started for API smoke
- Live API smoke via `tsx --env-file-if-exists=.env` — PASS, institution admin saw only tenant A metrics; super admin saw global metrics and tenant-filtered metrics via `tenant_id`; reviewer received HTTP 403; temporary tenants were cleaned up
- `rg -n "TODO|FIXME|XXX|HACK" src/features/analytics src/app/api/admin/analytics tests/analytics-service.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "api[_-]?key|secret|password|token|Bearer|sk-|AKIA|BEGIN PRIVATE KEY|SESSION_SECRET|MINIO_SECRET|DATABASE_URL" src/features/analytics src/app/api/admin/analytics tests/analytics-service.test.ts` — PASS, no hard-coded secrets in P6-T1 files
- `rg -n "PDF|pdf|support_tickets|ticket|logo|primaryColor|settings update|user management|create user|OAuth|LMS|Google|fetch\\(|axios" src/features/analytics src/app/api/admin/analytics tests/analytics-service.test.ts` — PASS, no dashboard UI, settings writes, user management, support, external integration, or future-phase features added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 03:07:38 IST

Manual verification:
- Verified institution admins are forced to their own tenant analytics scope.
- Verified super admins can see global analytics or pass `tenant_id` for a tenant-specific summary.
- Verified analytics queries use the correct tenant column for each table, including `scan_results.tenant_id` for scan metrics.
- Verified safe default limits are used when tenant settings are absent and configured tenant limits are respected when present.
- Verified P6-T1 did not implement dashboard UI, tenant settings mutation, user management, support tickets, security hardening, deployment, or advanced integrations.

Remaining issues:
- None for P6-T1.

Human intervention required:
- None for P6-T1. Usage-limit defaults are used when tenant settings are absent.

---

## P6-T2 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/dashboard/page.tsx
- src/features/analytics/admin-analytics-dashboard.tsx
- src/features/analytics/analytics-view.ts
- tests/analytics-view.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation and verification
- `sed -n '1,260p' CODEX_SINGLE_AUTOPILOT_MASTER_PROMPT.md` — PASS, autopilot prompt re-read
- `sed -n '1840,1933p' IMPLEMENTATION_TRACKER.md` — PASS, exact P6-T2 task and verification prompt read
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 23 test files and 87 tests passed
- `npm run build` — PASS, `/dashboard` included as a dynamic route
- `npx tsx --env-file-if-exists=.env -e ...` smoke seed — PASS after wrapping the script in an async function; the first compile-only attempt failed on top-level await and created no rows
- `npm run start` — PASS, local production server started for dashboard smoke
- Playwright browser smoke — PASS, institution admin saw tenant-scoped real metrics and super admin saw the global dashboard
- `npx tsx --env-file-if-exists=.env -e ...` smoke cleanup — PASS after correcting cleanup order; temporary users and tenants were removed
- `rg -n "TODO|FIXME|P6-T2|admin dashboard|High-risk submissions|Monthly usage" src/features/analytics src/app/'(dashboard)'/dashboard tests/analytics-view.test.ts IMPLEMENTATION_TRACKER.md AGENTS.md` — PASS, no incomplete P6-T2 task markers found
- `rg -n "(api[_-]?key|secret|password|token)\s*=\s*['\"][^'\"]+['\"]|SESSION_SECRET|DATABASE_URL|MINIO_|S3_" src/features/analytics src/app/'(dashboard)'/dashboard tests/analytics-view.test.ts` — PASS, no hard-coded secrets in P6-T2 files
- `rg -n "support|ticket|tenant settings|user management|retention|repository consent|provider|google|lms|pwa" src/features/analytics src/app/'(dashboard)'/dashboard tests/analytics-view.test.ts` — PASS, no future phase features added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 03:15:05 IST

Manual verification:
- Verified `/dashboard` renders the admin analytics dashboard only for `SUPER_ADMIN` and `INSTITUTION_ADMIN` roles.
- Verified institution-admin dashboard metrics use `getAdminAnalytics(session.user)` and are forced to the admin tenant by the P6-T1 service.
- Verified super-admin dashboard shows the global analytics summary.
- Verified dashboard cards/charts cover submissions, words processed, scans completed, high-risk submissions, users by role, and monthly usage.
- Verified chart and usage bars expose `role="meter"` plus `aria-label`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.
- Verified no chart dependency was added.
- Verified only unrelated browser console issue during smoke was a missing `/favicon.ico`; it does not affect P6-T2 behavior.

Remaining issues:
- None for P6-T2.

Human intervention required:
- None for P6-T2.

---

## P6-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/admin/settings/actions.ts
- src/app/(dashboard)/admin/settings/page.tsx
- src/app/(dashboard)/layout.tsx
- src/components/dashboard/dashboard-shell.tsx
- src/features/analytics/analytics.service.ts
- src/features/reports/report-page-content.tsx
- src/features/reports/report-pdf.ts
- src/features/reports/report.service.ts
- src/features/tenants/tenant-brand-mark.tsx
- src/features/tenants/tenant-settings.service.ts
- src/server/services/preprocessing.service.ts
- src/server/services/submission-upload.service.ts
- tests/analytics-service.test.ts
- tests/preprocessing-service.test.ts
- tests/report-pdf.test.ts
- tests/report-service.test.ts
- tests/submission-upload.test.ts
- tests/tenant-settings.test.ts

Database migrations:
- None

Commands run:
- `sed -n '1,260p' AGENTS.md` — PASS, root instructions and current state re-read before implementation and verification
- `sed -n '1934,1984p' IMPLEMENTATION_TRACKER.md` — PASS, exact P6-T3 task and verification prompt read
- `rg -n "tenantSettings|tenant_settings|settings|primaryColor|logo|reportFooter|smallMatch|monthlyWordLimit|maxFileSize|maxWords|tenant settings|admin/settings" src tests drizzle IMPLEMENTATION_TRACKER.md AGENTS.md` — PASS, existing tenant settings/report/upload/preprocessing/analytics hooks inspected
- Initial `npm run lint` — PASS
- Initial `npm run typecheck` — FAIL, preprocessing resolver narrowed to the `limits` object and lost `removeBibliography`/`removeQuotes`; fixed by resolving flags and small-match threshold separately
- Initial `npm run test` — PASS, 24 test files and 91 tests passed
- `npm run typecheck` — PASS after resolver fix
- `npm run test` — PASS, 24 test files and 91 tests passed after resolver fix
- `npm run lint` — PASS after final changes
- `npm run build` — PASS
- Live smoke seed via `npx tsx --env-file-if-exists=.env -` — PASS after avoiding shell-quoted SQL and using default imports for stdin execution; earlier failed attempts created no committed rows
- `npm run start` — PASS, local production server started for settings smoke
- Playwright browser smoke — PASS, institution admin saved settings, fields reloaded, dashboard header color/tenant branding applied, report header color/footer applied, and mobile viewport remained readable
- `/api/admin/analytics` browser fetch — PASS, tenant analytics returned saved `monthlyWordLimit: 12345` and `submissionLimit: 12`
- PostgreSQL settings/audit query via `npx tsx --env-file-if-exists=.env -` — PASS, saved all P6-T3 settings fields and one `tenant.settings.update` audit row
- Smoke cleanup via `npx tsx --env-file-if-exists=.env -` — PASS, temporary tenant and users removed
- Cleanup verification via `npx tsx --env-file-if-exists=.env -` — PASS, temporary tenant/user counts were zero
- `rg -n "TODO|FIXME|XXX|HACK" src/features/tenants src/app/'(dashboard)'/admin/settings src/components/dashboard src/features/reports src/features/analytics src/server/services tests/tenant-settings.test.ts tests/report-service.test.ts tests/report-pdf.test.ts tests/submission-upload.test.ts tests/preprocessing-service.test.ts tests/analytics-service.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "(api[_-]?key|secret|password|token)\s*=\s*['\"][^'\"]+['\"]|SESSION_SECRET|DATABASE_URL|MINIO_|S3_|Bearer|sk-|AKIA|BEGIN PRIVATE KEY" src/features/tenants src/app/'(dashboard)'/admin/settings src/components/dashboard src/features/reports src/features/analytics src/server/services tests/tenant-settings.test.ts` — PASS, no hard-coded secrets in P6-T3 files
- `rg -n "support_tickets|support ticket|create user|delete user|provider_accounts|external_api|Google|OAuth|LMS|PWA|retention|fact-check|repository matching" src/features/tenants src/app/'(dashboard)'/admin/settings src/components/dashboard src/features/reports src/features/analytics src/server/services tests/tenant-settings.test.ts` — PASS, no future phase features added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 03:28:16 IST

Manual verification:
- Verified settings are tenant-scoped through the authenticated institution admin tenant ID.
- Verified `SUPER_ADMIN` without a tenant cannot update institution settings through the settings service.
- Verified saved settings include logo URL/storage key, primary color, report footer, max file size, monthly word limit, submission limit, small-match threshold, and repository reuse default.
- Verified upload, preprocessing, analytics, dashboard branding, report UI, and PDF report paths read the canonical settings shape or backward-compatible flat keys where applicable.
- Verified P6-T3 did not implement user management, support tickets, retention enforcement, repository matching, external providers, OAuth, LMS, PWA, or deployment features.

Remaining issues:
- None for P6-T3.

Human intervention required:
- None for P6-T3. Tenant branding values can be changed from `/admin/settings`; formal branding approval remains a later pilot gate.

---

## P6-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/admin/users/actions.ts
- src/app/(dashboard)/admin/users/page.tsx
- src/features/users/user-management.service.ts
- tests/user-management.test.ts

Database migrations:
- None

Commands run:
- `cat AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '1984,2034p' IMPLEMENTATION_TRACKER.md` — PASS, exact P6-T4 task and verification prompt read
- `sed -n '1,220p' src/app/'(dashboard)'/admin/users/page.tsx` and related `rg`/`sed` inspections — PASS, existing placeholder, auth, RBAC, schema, and password hashing paths inspected
- Initial `npm run lint` — PASS
- Initial `npm run typecheck` — PASS
- Initial `npm run test` — FAIL, dynamic test import produced a different `AuthorizationError` class identity; fixed assertion to check the thrown message
- `npm run test` — PASS, 25 test files and 95 tests passed
- `npm run lint` — PASS after test fix
- `npm run typecheck` — PASS after test fix
- `npm run build` — PASS, `/admin/users` included as a dynamic route
- Live smoke seed via `npx tsx --env-file-if-exists=.env -` — PASS, temporary tenants/admins/users/super-admin created
- `npm run start` — PASS, local production server started for browser smoke
- Playwright browser smoke — PASS after removing a TypeScript-only cast from the smoke script; institution admin list/create/update/deactivate/reset flows and super-admin tenant-admin creation were verified
- PostgreSQL verification via `npx tsx --env-file-if-exists=.env -` — PASS, created user ended as `REVIEWER`, active, reset password verified with Argon2id, super-created tenant admin belonged to the selected tenant, and audit rows existed
- Smoke cleanup via `npx tsx --env-file-if-exists=.env -` — PASS, temporary tenants and users removed
- Cleanup verification via `npx tsx --env-file-if-exists=.env -` — PASS, temporary tenant/user counts were zero
- `rg -n "TODO|FIXME|XXX|HACK" src/features/users src/app/'(dashboard)'/admin/users tests/user-management.test.ts --glob '!node_modules/**' --glob '!.next/**' --glob '!*.tsbuildinfo'` — PASS, no incomplete task markers found
- `rg -n "(api[_-]?key|secret|password|token)\s*=\s*['\"][^'\"]+['\"]|SESSION_SECRET|DATABASE_URL|MINIO_|S3_|Bearer|sk-|AKIA|BEGIN PRIVATE KEY" src/features/users src/app/'(dashboard)'/admin/users` — PASS, no hard-coded secrets in production P6-T4 files
- `rg -n "support_tickets|support ticket|tenant settings|retention|repository matching|provider_accounts|external_api|Google|OAuth|LMS|PWA|fact-check|upload|scan provider" src/features/users src/app/'(dashboard)'/admin/users tests/user-management.test.ts` — PASS, no future phase features added
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 03:36:11 IST

Manual verification:
- Verified institution admin user listing is scoped to the actor tenant and hides other tenants.
- Verified institution admin create/update forms exclude `SUPER_ADMIN` and provide no tenant move/select control.
- Verified manual password reset was implemented instead of reset token generation, consistent with the P6-T4 "or" requirement and the approved MVP default that password reset is not otherwise required.
- Verified super admin can manage tenant admins by selecting a tenant and creating an `INSTITUTION_ADMIN`.
- Verified deactivation and password reset clear target sessions.
- Verified P6-T4 did not implement support tickets, tenant settings changes, retention, external providers, OAuth, LMS, PWA, deployment, upload, scan, or report features.

Remaining issues:
- None for P6-T4.

Human intervention required:
- None for P6-T4.

---

## P7-T4 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- drizzle/0007_famous_valkyrie.sql
- drizzle/meta/0007_snapshot.json
- drizzle/meta/_journal.json
- src/app/(dashboard)/admin/settings/page.tsx
- src/features/tenants/tenant-settings.service.ts
- src/lib/db/schema.ts
- src/server/services/submissions.service.ts
- tests/submissions-service.test.ts
- tests/tenant-isolation.test.ts
- tests/tenant-settings.test.ts

Database migrations:
- drizzle/0007_famous_valkyrie.sql

Commands run:
- `sed -n '1,220p' AGENTS.md` — PASS, root instructions re-read before implementation
- `sed -n '2240,2295p' IMPLEMENTATION_TRACKER.md` — PASS, exact P7-T4 task and verification prompt re-read
- `sed`/`rg` inspections of tenant settings, submission schema/service, settings page, and tests — PASS
- `npm run db:generate` — PASS, generated `drizzle/0007_famous_valkyrie.sql`
- `npm run test -- tests/tenant-settings.test.ts tests/submissions-service.test.ts` — PASS, 2 files and 9 tests passed
- `npm run db:migrate` — PASS, migrations applied successfully
- Initial `npm run lint` — PASS
- Initial `npm run typecheck` — FAIL, stale `tests/tenant-isolation.test.ts` fixture lacked the new nullable consent fields; fixed within P7-T4 scope
- `npm run typecheck` — PASS after fixture fix
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS
- Final `npm run lint` — PASS
- `docker compose exec -T postgres psql -U plagcheck -d plagcheck -c "select column_name, is_nullable from information_schema.columns where table_name = 'submissions' and column_name in ('repository_reuse_consent_at', 'repository_reuse_consent_by') order by column_name;"` — PASS, both consent columns exist and are nullable
- `rg -n "repository matching|repositoryMatching|repository_matches|repository_match|fingerprint|fingerprinting" src tests drizzle docs --glob '!drizzle/meta/*.json'` — PASS, no repository matching or fingerprinting implementation found
- `rg -n "TODO|FIXME|XXX|HACK" src/features/tenants src/server/services/submissions.service.ts src/lib/db/schema.ts 'src/app/(dashboard)/admin/settings/page.tsx' tests/tenant-settings.test.ts tests/submissions-service.test.ts tests/tenant-isolation.test.ts drizzle/0007_famous_valkyrie.sql --glob '!node_modules/**' --glob '!.next/**'` — PASS, no incomplete task markers found
- `rg -n "api[_-]?key|secret|password|token" src/features/tenants src/server/services/submissions.service.ts src/lib/db/schema.ts 'src/app/(dashboard)/admin/settings/page.tsx' tests/tenant-settings.test.ts tests/submissions-service.test.ts tests/tenant-isolation.test.ts drizzle/0007_famous_valkyrie.sql --glob '!node_modules/**' --glob '!.next/**'` — PASS, no new hard-coded secrets in P7-T4 files; existing schema identifiers for password/session hashes are not secrets
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 04:16:37 IST

Manual verification:
- Verified retention settings exist as normalized tenant metadata with safe 365-day defaults and snake_case compatibility keys for `retain_original_files_days` and `retain_reports_days`.
- Verified repository settings exist for `allow_repository_reuse` and `require_user_consent_for_repository`.
- Verified nullable submission consent columns exist in Drizzle schema, migration SQL, generated snapshot, and local PostgreSQL.
- Verified `canUseSubmissionForRepository` returns false unless repository reuse is enabled, consent requirement is enabled, and submission-level consent metadata is present.
- Verified settings remain tenant-scoped through the existing institution-admin tenant settings service and no business data table lost tenant isolation.
- Verified P7-T4 did not implement repository matching, fingerprinting, retention deletion jobs, external providers, OAuth, LMS, PWA, deployment, or documentation-pack features.

Remaining issues:
- None for P7-T4.

Human intervention required:
- None for P7-T4. Formal privacy, retention, and repository consent approval remains required before production sign-off.

---

## P7-T5 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- docs/admin-guide.md
- docs/reviewer-guide.md
- docs/security-notes.md
- docs/uat-checklist.md
- docs/user-guide.md

Database migrations:
- None

Commands run:
- `sed -n '1,230p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '2296,2355p' IMPLEMENTATION_TRACKER.md` — PASS, exact P7-T5 task and verification prompt re-read
- `find docs -maxdepth 2 -type f | sort` — PASS, existing docs inspected before adding the required pack
- `ls docs/admin-guide.md docs/reviewer-guide.md docs/security-notes.md docs/uat-checklist.md docs/user-guide.md` — PASS, all required docs exist
- `rg -in "login|role access|user creation|upload|extraction|preprocessing|scan|report|pdf download|reviewer workflow|analytics|audit logs|tenant isolation" docs/uat-checklist.md` — PASS, UAT checklist covers every required flow
- `rg -n "markdown|mdlint|remark|prettier" package.json` — PASS, no markdown/doc lint script or dependency is configured
- `rg -n "TODO|FIXME|XXX|HACK" docs/admin-guide.md docs/reviewer-guide.md docs/user-guide.md docs/security-notes.md docs/uat-checklist.md` — PASS, no incomplete task markers found
- `rg -n "TODO|FIXME|XXX|HACK|real provider configured|repository matching is implemented|Google Docs import is available|LMS integration is available|PWA|fact-check" docs/admin-guide.md docs/reviewer-guide.md docs/user-guide.md docs/security-notes.md docs/uat-checklist.md docs/security-hardening.md` — PASS, no unavailable feature claims or incomplete markers found
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 04:20:20 IST

Manual verification:
- Verified all five required documentation files exist.
- Verified UAT checklist covers login, role access, user creation, upload, extraction, preprocessing, scan, report, PDF download, reviewer workflow, analytics, audit logs, and tenant isolation.
- Verified docs match the current MVP and describe mock scan provider usage, no repository matching, no real external provider integration, and production approval gates accurately.
- Verified P7-T5 did not change application code, schemas, migrations, deployment artifacts, or future integration behavior.

Remaining issues:
- None for P7-T5.

Human intervention required:
- None for P7-T5. Privacy, retention, consent wording, and security approval remain required before production sign-off.

---

## Phase 7 Verification Evidence

Status: PHASE VERIFIED

Verification date: 2026-04-28 04:20:20 IST

Commands run:
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS
- P7 scope `rg` checks for incomplete markers, hard-coded secrets, unavailable feature claims, repository matching/fingerprinting, and documentation coverage — PASS

Manual verification:
- P7-T1 through P7-T5 are all marked VERIFIED.
- Security hardening exists for headers, rate limiting, CSRF, strict upload validation, and safe errors.
- Tenant isolation tests exist and pass.
- Audit coverage and `/admin/audit` exist.
- Retention settings and repository consent metadata exist.
- Repository reuse guard requires submission-level consent metadata.
- UAT, admin, reviewer, user, and security docs exist.
- No repository matching, real external provider, Google Docs, LMS, PWA, fact-check, deployment, or P9 features were implemented in Phase 7.

Human interventions before production:
- Privacy policy basis approval.
- Retention period and deletion operation approval.
- Repository reuse consent wording approval.
- Security review or external penetration test decision.

Result:
- Phase 7 marked PHASE VERIFIED.
- P8-T1 unlocked.

---

## P8-T1 Evidence

Status: VERIFIED

Changed files:
- .dockerignore
- AGENTS.md
- Dockerfile
- IMPLEMENTATION_TRACKER.md
- docker-compose.prod.example.yml
- package-lock.json

Database migrations:
- None

Commands run:
- `sed -n '1,230p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '2394,2444p' IMPLEMENTATION_TRACKER.md` — PASS, exact P8-T1 task and verification prompt re-read
- `find . -maxdepth 2 \( -name 'Dockerfile*' -o -name '.dockerignore' -o -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' \) -print | sort` — PASS, existing Docker artifacts inspected
- `docker compose -f docker-compose.prod.example.yml config` — PASS, compose structure valid; local `.env` interpolation was observed, so no-interpolate was also used for placeholder verification
- Initial `docker build -t plagcheck-app:p8-t1 .` — FAIL, Docker `npm ci` rejected the existing lockfile and BuildKit warned about secret-named Docker ARG/ENV instructions
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` — PASS, did not fully resolve Docker npm 10 lockfile behavior
- `npm install --ignore-scripts --no-audit --no-fund` — PASS, synced `package-lock.json`/local install state
- `npm ci --dry-run` — PASS, clean install dry run accepted the updated lockfile locally
- Second `docker build -t plagcheck-app:p8-t1 .` — FAIL, Docker base image npm 10 still rejected the npm 11 lockfile shape
- Final `docker build -t plagcheck-app:p8-t1 .` — PASS after pinning npm 11.6.2 in the dependency install stage; Next.js production build completed inside the image
- `docker compose -f docker-compose.prod.example.yml config --no-interpolate` — PASS, `web` and `worker` services use placeholders
- `docker run --rm --entrypoint node plagcheck-app:p8-t1 -e "const p=require('./package.json'); if (p.scripts.start !== 'next start' || !p.scripts.worker?.includes('src/server/worker.ts')) process.exit(1); console.log(JSON.stringify({start:p.scripts.start,worker:p.scripts.worker,tsx:require('fs').existsSync('node_modules/.bin/tsx')}));"` — PASS, image contains web/worker scripts and `tsx`
- `docker run --rm --entrypoint sh plagcheck-app:p8-t1 -c 'test ! -e .env && test ! -e .env.production.local && test -f .env.example'` — PASS, final image does not include local or build-only env files
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS
- `rg -n "TODO|FIXME|XXX|HACK" Dockerfile docker-compose.prod.example.yml .dockerignore package.json package-lock.json --glob '!node_modules/**'` — PASS, no incomplete task markers found
- `rg -n "AKIA|BEGIN PRIVATE KEY|aws_secret_access_key|SESSION_SECRET=[^b$]|MINIO_SECRET_KEY=[^p$]|POSTGRES_PASSWORD=[^r$]" Dockerfile docker-compose.prod.example.yml .dockerignore package.json package-lock.json --glob '!node_modules/**'` — PASS, no committed production secrets found; Dockerfile values are build-only placeholders and production compose uses variable references
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 04:29:34 IST

Manual verification:
- Verified `Dockerfile` builds a Next.js app image.
- Verified the same image can run the web service with `npm run start`.
- Verified the same image can run the current worker command with `npm run worker` because `tsx` is present.
- Verified `docker-compose.prod.example.yml` defines separate `web` and `worker` services.
- Verified `.dockerignore` excludes local env files, `.next`, `node_modules`, Git metadata, and local test/build outputs from the image context.
- Verified no production database, storage, session, provider, hosting, or domain secrets were committed.
- Verified P8-T1 did not add deployment docs, production readiness checklist, provider integrations, OAuth, LMS, PWA, repository matching, or application behavior changes.

Remaining issues:
- None for P8-T1.

Human intervention required:
- None for P8-T1. Production hosting, domain, SSL, production database URL, production S3-compatible credentials, and backup destination remain required before deployment.

---

## P8-T2 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- docs/deployment.md

Database migrations:
- None

Commands run:
- `sed -n '1,230p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '2439,2488p' IMPLEMENTATION_TRACKER.md` — PASS, exact P8-T2 task and verification prompt re-read
- `sed -n '1,240p' docs/local-development.md`, `sed -n '1,220p' .env.example`, and `sed -n '1,160p' docker-compose.prod.example.yml` — PASS, existing local/dev/prod config inspected
- `test -f docs/deployment.md && rg -in "required environment variables|managed postgresql|s3-compatible object storage|run migrations|web service command|worker service command|health check url|backup strategy|rollback strategy|secret rotation|common troubleshooting" docs/deployment.md` — PASS, all required deployment topics covered
- `rg -n "AKIA|sk-[A-Za-z0-9]|BEGIN PRIVATE KEY|DATABASE_URL=postgresql://[^\s]*:[^\s]*@|SESSION_SECRET=[A-Za-z0-9_-]{32,}|MINIO_SECRET_KEY=[A-Za-z0-9_-]{16,}|password:|secret:" docs/deployment.md` — PASS, no real secrets found
- `rg -n "TODO|FIXME|XXX|HACK|Google Docs import is available|LMS integration is available|repository matching is implemented|real scan provider is configured|PWA" docs/deployment.md` — PASS, no incomplete markers or unavailable feature claims found
- `rg -n "markdown|mdlint|remark|prettier" package.json` — PASS, no markdown/doc lint script or dependency is configured
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS
- `date '+%Y-%m-%d %H:%M:%S %Z'` — PASS, verification timestamp recorded as 2026-04-28 04:32:26 IST

Manual verification:
- Verified `docs/deployment.md` is actionable for a Docker-based MVP deployment.
- Verified the doc covers required env vars, managed PostgreSQL, S3-compatible storage, migrations, web and worker service commands, health check URL, backup, rollback, secret rotation, and troubleshooting.
- Verified the doc lists unresolved production gates instead of inventing hosting, SSL, backup, real provider, or production credential details.
- Verified P8-T2 did not change application code, Docker artifacts, schemas, migrations, provider integrations, OAuth, LMS, PWA, or repository matching.

Remaining issues:
- None for P8-T2.

Human intervention required:
- None for P8-T2. Hosting provider, domain, SSL, production database URL, production object storage credentials, backup destination, legal/privacy approval, UAT sign-off, and provider API keys remain production gates.

---

## P8-T3 Evidence

Status: VERIFIED

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- docs/production-readiness.md

Database migrations:
- None

Commands run:
- `sed -n '1,230p' AGENTS.md` — PASS, root instructions and current state re-read before implementation
- `sed -n '2489,2536p' IMPLEMENTATION_TRACKER.md` — PASS, exact P8-T3 task and verification prompt re-read
- `test -f docs/production-readiness.md && rg -in "auth|rbac|tenant isolation|audit logs|backups|restore test|file storage|rate limits|scan worker|pdf generation|support tickets|monitoring hooks|uat sign-off|legal/privacy review|provider api keys|ssl/https" docs/production-readiness.md` — PASS, all required checklist items covered
- `rg -in "production blockers|hosting provider|production domain|ssl/https|production postgresql|production s3|backup destination|legal/privacy|uat sign-off|provider api keys" docs/production-readiness.md` — PASS, production blockers explicitly listed
- `rg -n "AKIA|sk-[A-Za-z0-9]|BEGIN PRIVATE KEY|DATABASE_URL=postgresql://[^\s]*:[^\s]*@|SESSION_SECRET=[A-Za-z0-9_-]{32,}|MINIO_SECRET_KEY=[A-Za-z0-9_-]{16,}|password:|secret:" docs/production-readiness.md` — PASS, no real secrets found
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS

Manual verification:
- Verified `docs/production-readiness.md` covers every required P8-T3 checklist item.
- Verified production blockers are explicit and human-owned.
- Verified P8-T3 did not change application code, Docker artifacts, schemas, migrations, provider integrations, OAuth, LMS, PWA, or repository matching.

Remaining issues:
- None for P8-T3 implementation.

Human intervention required:
- None for P8-T3 implementation. Production launch requires hosting, domain/SSL, production database/storage credentials, backup destination, legal/privacy approval, UAT sign-off, security review decision, and provider keys if replacing the mock provider.

---

## Phase 8 Verification Evidence

Status: PHASE VERIFIED

Verification date: 2026-04-28 04:37:10 IST

Commands run:
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, 29 files and 118 tests passed
- `npm run build` — PASS
- `npm run db:migrate` — PASS
- `docker compose config` — PASS
- `docker compose -f docker-compose.prod.example.yml config --no-interpolate` — PASS
- `docker build -t plagcheck-app:p8-final .` — PASS
- `npm run worker` — PASS, reported no queued scan jobs
- `PORT=3100 npm run start` plus `curl -sS http://127.0.0.1:3100/api/health` — PASS, health returned app/config/database/storage `ok`
- `npm ci --dry-run` — PASS
- Built-image checks for web/worker scripts, `tsx`, and absence of `.env`/`.env.production.local` — PASS
- Full scope searches for incomplete markers and committed production secrets — PASS, only documented placeholder values were found

Manual verification:
- P8-T1 through P8-T3 are all VERIFIED.
- Dockerfile and production compose example exist.
- Web and worker can run from the same built image.
- Deployment docs and production readiness checklist exist and are actionable.
- Human deployment decisions are explicitly listed.
- No production secret, provider credential, domain, SSL certificate, or backup destination was committed.

Result:
- Phase 8 marked PHASE VERIFIED.
- Full MVP implementation verification completed.

---

# Human Intervention Log

Use this table whenever the agent needs a decision, credential, file, or approval.

| Date | Phase/Task | Required human action | Blocking? | Resolution |
|---|---|---|---|---|
| 2026-04-28 | P0-T4 | Start Docker Desktop or provide a reachable PostgreSQL database matching `DATABASE_URL` so `npm run db:migrate` can be verified | Yes | Resolved on 2026-04-28 00:43:59 IST; Docker Desktop running and migration verified with `POSTGRES_PORT=55432` |
| 2026-04-28 | P1 | Provide seed super admin credentials and confirm role/password-reset policy | No for P1-T1/P1-T2; production credentials remain required before deployment | User authorized agent to make local-development choices. Canonical roles remain `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER`; password reset remains deferred unless a later task explicitly requires it. |
| TBD | P2 | Provide file size/word limits and sample files | Yes before UAT | Pending |
| TBD | P3 | Approve preprocessing threshold and provide sample documents | Yes before golden corpus verification | Pending |
| TBD | P4 | Decide whether mock provider is acceptable for MVP | Yes if real provider required | Pending |
| TBD | P5 | Approve report disclaimer and reviewer workflow | Yes before pilot | Pending |
| TBD | P6 | Provide logo/colors/SLA/support categories | No for core logic; yes for final branding | Pending |
| TBD | P7 | Approve privacy, retention, and consent policy | Yes before production | Pending |
| TBD | P8 | Provide hosting, domain, SSL, and production secrets | Yes before deployment | Pending |

---

# Entire MVP Verification Log

Run after Phase 8.

Status: VERIFIED

Verification date: 2026-04-28 04:37:10 IST

Commands run:
- npm run lint: PASS
- npm run typecheck: PASS
- npm run test: PASS, 29 files and 118 tests passed
- npm run build: PASS
- npm run db:migrate: PASS
- docker compose config: PASS
- docker compose -f docker-compose.prod.example.yml config --no-interpolate: PASS
- docker build -t plagcheck-app:p8-final .: PASS
- npm ci --dry-run: PASS
- npm run worker: PASS, no queued scan jobs
- PORT=3100 npm run start and curl /api/health: PASS, app/config/database/storage status ok

End-to-end flows verified:
- Login/logout: VERIFIED by route tests and earlier smoke evidence
- RBAC: VERIFIED by RBAC/navigation tests and protected route smoke evidence
- Tenant isolation: VERIFIED by tenant isolation tests
- User management: VERIFIED by service tests and earlier browser/DB smoke evidence
- Submission creation/upload: VERIFIED by service/API tests and earlier browser/MinIO smoke evidence
- Text extraction: VERIFIED by extraction tests and earlier API smoke evidence
- Preprocessing: VERIFIED by preprocessing tests and earlier UI/API smoke evidence
- Scan queue/worker: VERIFIED by scan queue/scanning tests and `npm run worker` smoke
- Report UI: VERIFIED by report service/view tests and earlier browser smoke evidence
- PDF export: VERIFIED by report PDF/object-storage tests and earlier route smoke evidence
- Reviewer workflow: VERIFIED by review service tests and earlier browser/DB smoke evidence
- Admin analytics: VERIFIED by analytics service/view tests and earlier dashboard smoke evidence
- Audit logs: VERIFIED by audit service tests and earlier `/admin/audit` smoke evidence
- Support tickets: VERIFIED by support service tests and earlier browser/DB smoke evidence
- Deployment readiness: VERIFIED by P8 Docker build/config/docs/readiness evidence

Production blockers:
- Hosting provider and production region are not selected.
- Production domain and SSL/HTTPS setup are not provided.
- Production PostgreSQL URL/credentials are not provided.
- Production S3-compatible storage endpoint/bucket/credentials are not provided.
- Backup destination and restore-test evidence are not provided.
- Legal/privacy approval for retention and consent wording is not recorded.
- Institution UAT sign-off is not recorded.
- Security review or external penetration test decision is not recorded.
- Real scan provider contract/API keys are not provided; MVP remains on the mock provider unless approved later.

Final MVP status: VERIFIED for implementation; NOT DEPLOYMENT-SIGNED-OFF until production blockers are resolved.

---

# Demo Feature Budget And Rate-Limit Overlay

Status: VERIFIED

Verification date: 2026-04-28 11:53:19 IST

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- .env.example
- .env.demo.example
- env.demo-ready.example
- docs/feature-budgets-and-rate-limits.md
- docs/demo-real-provider.md
- docs/demo-ui-flow.md
- docs/uat-results.md
- docs/mvp-release-notes.md
- drizzle/0008_quiet_callisto.sql
- drizzle/meta/0008_snapshot.json
- drizzle/meta/_journal.json
- src/lib/env.ts
- src/lib/db/schema.ts
- src/lib/jobs/scan-queue.ts
- src/features/budgets/feature-budget.service.ts
- src/features/budgets/feature-rate-limit.service.ts
- src/features/scanning/providers/types.ts
- src/features/scanning/providers/demo-real.provider.ts
- src/server/services/scanning.service.ts
- src/server/services/preprocessing.service.ts
- src/app/api/submissions/[id]/scan/route.ts
- src/app/api/submissions/[id]/report/pdf/route.ts
- src/components/budgets/scan-cost-preview.tsx
- src/components/scanning/quick-text-scan-form.tsx
- src/components/submissions/scan-status-panel.tsx
- src/components/submissions/scan-submission-button.tsx
- src/app/(dashboard)/submissions/[id]/page.tsx
- src/features/analytics/analytics.service.ts
- src/features/analytics/admin-analytics-dashboard.tsx
- src/features/reports/report-export.service.ts
- src/features/reports/report-page-content.tsx
- src/features/reports/report.service.ts
- src/features/tenants/tenant-settings.service.ts
- src/app/(dashboard)/admin/settings/actions.ts
- src/app/(dashboard)/admin/settings/page.tsx
- tests/feature-budget-service.test.ts
- tests/env.test.ts
- tests/demo-real-provider.test.ts
- tests/mock-scan-provider.test.ts
- tests/scan-queue.test.ts
- tests/scanning-service.test.ts
- tests/tenant-settings.test.ts

Database migrations:
- drizzle/0008_quiet_callisto.sql

Commands run:
- `npm run db:generate` — PASS, generated feature budget tables and scan mode migration.
- `npm run lint` — PASS after removing an unused scan mode selector prop.
- `npm run typecheck` — PASS on rerun after the first parallel run collided with Next.js build-generated `.next` types.
- `npm run test` — PASS, 31 files and 132 tests passed.
- `npm run build` — PASS.
- `npm run db:migrate` — PASS.
- Initial parallel `npm run db:seed:demo` — FAIL because it raced the migration while `scan_mode` was being added.
- Rerun `npm run db:seed:demo` — PASS, demo tenant and seeded submissions created.
- `npm run worker` — PASS, reported no queued scan jobs.
- `npm run start -- -p 3100` — PASS, app served for smoke tests.
- Authenticated curl smoke for `/api/health`, `/dashboard`, `/scan/new`, `/submissions`, `/reports`, `/reviewer/queue`, `/admin/settings`, `/submissions/b5ca3379-cbe0-4ce3-96f8-a07b2e37417f`, and `/submissions/ebea6c61-1ef5-45b9-9658-3221178a7ad1/report` — PASS.

Manual verification:
- Verified feature budgets and env defaults are validated and documented.
- Verified new tables exist for tenant-aware feature quota limits, usage events, and rollups.
- Verified scan queue stores `scan_mode` and scan start accepts Standard Check, Deep Check, and Local Fallback Check.
- Verified the budget service estimates standard/deep/fallback usage, reserves, consumes, refunds, records fallback usage, blocks only when all relevant feature budgets are exhausted, and records budget audit events.
- Verified demo-real provider calls route through budget checks for Web Source Matching, AI Writing Analysis, Academic Source Lookup, and Grammar Review.
- Verified Grammar Review enforces both per-minute character capacity and max requests per minute.
- Verified exhausted feature budgets fall back locally when allowed and mark fallback metadata instead of failing the entire scan.
- Verified PDF export reserves and consumes PDF Report budget.
- Verified `/scan/new` and a ready `/submissions/[id]` show scan-cost previews.
- Verified `/dashboard` shows feature budget cards with remaining capacity and no visible Tavily, Gemini, OpenAlex, LanguageTool, API, token, or provider terms.
- Verified `/admin/settings` exposes safe tenant feature budget controls for authorized admins.
- Verified seeded report page shows fallback state without exposing vendor names in user-facing provider metadata.

Remaining issues:
- None for the demo feature budget/rate-limit overlay.

Human intervention required:
- None for local demo credit protection. Production billing policy, paid provider contract limits, legal approval, and production deployment credentials remain human-owned gates.

---

### Demo overlay enhancement: scan lifecycle auto-refresh

Status: VERIFIED

Verification date: 2026-04-28 12:03:27 IST

Issue:
- The scan lifecycle UI showed `READY_FOR_SCAN`, `SCAN_QUEUED`, `SCANNING`, and `SCAN_COMPLETE`, but it only updated after a user action or manual page refresh.

Changed files:
- AGENTS.md
- IMPLEMENTATION_TRACKER.md
- src/app/(dashboard)/submissions/[id]/page.tsx
- src/components/submissions/scan-status-panel.tsx
- src/components/submissions/submission-status-auto-refresh.tsx
- tests/scan-status-panel.test.ts

Database migrations:
- None

Commands run:
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test -- tests/scan-status-panel.test.ts` — PASS, 1 file and 5 tests passed
- `npm run build` — PASS
- `npm run test` — PASS, 31 files and 133 tests passed

Manual verification:
- Confirmed the previous implementation had no polling, WebSocket, or Server-Sent Events for scan lifecycle status.
- Added a client-side poller on `/submissions/[id]` that calls the existing tenant-scoped `/api/submissions/[id]` endpoint every 2.5 seconds while status is `SCAN_QUEUED` or `SCANNING`.
- The poller calls `router.refresh()` when status or `updatedAt` changes, so the server-rendered lifecycle panel, status badge, scan summary, report link, and related page data update without manual browser refresh.
- Polling stops automatically after terminal states such as `SCAN_COMPLETE` or `FAILED`.

Remaining issues:
- None for automatic lifecycle status updates.

Human intervention required:
- None.
