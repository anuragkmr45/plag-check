# AGENTS.md — Unified Autopilot Agent File for Anti-Plagiarism + AI-Detection SaaS

This file is the **single source of truth** for the coding agent. It combines the master prompt, implementation plan, tracker, verification gates, human-intervention rules, and anti-hallucination controls.

Place this file at the **root of the repository**.

The agent must not rely on memory, assumptions, or earlier chat messages. It must read this file before every implementation step.

---

## 0. Project identity

**Project:** Institutional Anti-Plagiarism and AI-Detection SaaS  
**Delivery model:** Web/browser SaaS with local Docker development and production container deployment  
**Primary stack:** Next.js App Router, TypeScript, TailwindCSS, Drizzle ORM, PostgreSQL, MinIO/S3-compatible object storage

---

## 1. Product source scope

The implementation must satisfy the uploaded project documents and procurement requirements:

- Cloud/browser-based SaaS solution.
- Secure HTTPS access.
- Minimum one-year subscription-ready product model.
- Plagiarism detection from web/internet sources, academic sources, and optional institutional repository.
- Similarity percentage, highlighted matches, and source-wise report.
- AI-generated content detection with probability/indicator.
- Grammar and spell checking.
- Optional/desirable writing suggestions, fact-checking, linguistic analysis.
- PDF, DOC, DOCX, TXT support.
- Exclusion filters for bibliography, quotes, and configurable small matches.
- Minimum 300 submissions and approximately 10,00,000 words/month capacity.
- Multiple concurrent users.
- Role-based access for Super Admin, Institution Admin, Reviewer, and User.
- Secure login/password protection.
- User creation, deletion, and management.
- Admin usage dashboard.
- Detailed similarity reports.
- Downloadable/printable PDF reports.
- Submission history and searchable archive.
- Usage analytics.
- Secure document storage.
- No unauthorized access or data leakage.
- Data confidentiality.
- Audit logs/activity tracking.
- Training/manuals.
- Helpdesk/support and SLA issue handling.
- Basic UI customization: logo, colour theme, dashboard view, report footer.
- Future integration/API support with LMS/institutional systems.
- No reuse of submitted content without explicit consent.

The technical blueprint additionally recommends:

- Smart orchestration rather than monolithic heavy processing.
- Preprocessing before paid API calls.
- Provider adapter pattern.
- Multi-tenant PostgreSQL architecture.
- Tenant isolation, ideally with PostgreSQL RLS after MVP hardening.
- PWA and client-side quick scan as later-stage features.
- Google Docs import as a later-stage integration.
- Immutable report snapshots.
- Review workflow state machine.
- Cost controls through text sanitization and local/mock/optional self-hosted services.

---

## 2. Fixed tech stack

Do not change the stack unless a human explicitly updates this file.

| Layer | Required choice |
|---|---|
| Web framework | Next.js App Router |
| Language | TypeScript, strict mode |
| Styling | TailwindCSS |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Object storage | MinIO for development; S3-compatible storage for production |
| Local infra | Docker Compose |
| Validation | Zod |
| Auth | Custom session auth with httpOnly cookies |
| Password hashing | Argon2id |
| Testing | Vitest for unit/service tests; Playwright later for E2E |
| Jobs | PostgreSQL-backed queue for MVP |
| Deployment | Containerized web + worker services |
| Charts | Start simple; add chart libraries only when analytics/report phase needs them |
| PDF | Node-compatible PDF generation; keep report snapshot immutable |

---

## 3. Non-negotiable agent rules

1. Read this file before every coding step.
2. Implement only the first task whose status is not `VERIFIED` and whose dependencies are satisfied.
3. Do not skip phases.
4. Do not implement future-phase features early.
5. Do not invent requirements, API endpoints, provider behavior, or credentials.
6. If external API docs or credentials are missing, mark `BLOCKED_HUMAN`.
7. Never hard-code secrets.
8. Never store raw session tokens.
9. Never store plain passwords.
10. Every business table must include `tenant_id` unless explicitly global by design.
11. Every tenant-scoped query must enforce tenant isolation.
12. Every critical state-changing action must create an audit event.
13. Do not mark a task `VERIFIED` without command/test evidence.
14. If tests fail, mark `NEEDS_FIX`, fix only that task, then verify again.
15. If human input is required, stop and ask for that exact input.
16. After human input is provided, resume from the same blocked task or phase.
17. Keep all changed files and verification notes recorded in this file.
18. Do not claim the full software is complete until final end-to-end verification passes.

---

## 4. Repository structure

Target structure:

```txt
src/
  app/
    (public)/
    (auth)/
    (dashboard)/
    api/
  components/
  features/
    auth/
    tenants/
    users/
    submissions/
    files/
    extraction/
    preprocessing/
    scanning/
    reports/
    review/
    analytics/
    audit/
    support/
    integrations/
  lib/
    db/
    auth/
    rbac/
    storage/
    validators/
    security/
    jobs/
    env.ts
  server/
    services/
    workers/
drizzle/
docs/
tests/
```

---

## 5. Master prompt for Codex

Use this as the controlling prompt inside Codex when starting or resuming work:

```txt
You are the implementation agent for an institutional Anti-Plagiarism and AI-Detection SaaS.

Your only source of truth is AGENTS.md in the repository root.

Read AGENTS.md completely before making changes.

Operate in autopilot task mode:
1. Find the first task in AGENTS.md whose status is not VERIFIED and whose dependencies are satisfied.
2. Check whether the task requires human input.
3. If human input is required, mark the task BLOCKED_HUMAN, record the exact needed input in AGENTS.md, and stop.
4. If no human input is required, implement only that one task.
5. Do not implement future phase features.
6. Run the required verification commands.
7. If verification fails, fix only the current task and verify again.
8. When verification passes, update AGENTS.md with:
   - task status VERIFIED
   - files changed
   - commands run
   - evidence summary
   - remaining issues, if any
   - next task ID
9. Continue to the next task only after the current task is VERIFIED.
10. At phase end, run the phase verification gate.
11. If a phase requires human intervention, stop and request the exact input.
12. After human input is provided, resume from the blocked task/phase.

Do not hallucinate. Do not invent external APIs. Do not hard-code secrets. Do not skip verification.
```

---

## 6. Status values

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No implementation started. |
| `IN_PROGRESS` | Work started but not verified. |
| `IMPLEMENTED` | Code added, verification not complete. |
| `NEEDS_FIX` | Verification failed; fix before continuing. |
| `BLOCKED_HUMAN` | Human input, credentials, approval, or business decision required. |
| `VERIFIED` | Implemented and verified with evidence. |
| `SKIPPED_APPROVED` | Human explicitly approved skipping. |
| `LOCKED` | Future phase not allowed yet. |

---

## 7. Current implementation state

| Field | Value |
|---|---|
| Overall status | MVP_VERIFIED |
| Current phase | MVP complete + local demo-ready overlay |
| Current task | Report visual analysis and PDF export polish verified; certified P9 provider work remains locked until human approval |
| Last verified task | P8-T3 |
| Last verified phase | P8 Deployment readiness |
| MVP status | VERIFIED |
| Demo Real status | VERIFIED for local product demonstration with fallbacks |
| Full-feature status | NOT_READY |
| Last human gate | P2 local upload defaults approved by user |
| Next expected human gate | MVP/demo sign-off and production gates: hosting, SSL, production secrets, backup destination, certified provider decision if required, legal/privacy review, and UAT sign-off |

---

## 7A. Demo Real local demo overlay

The user approved a local live-demo overlay after MVP verification. This does not unlock certified/paid provider scope.

Demo Real uses:

- Tavily for web-source discovery when `TAVILY_API_KEY` is present.
- Gemini for AI-content likelihood when `GEMINI_API_KEY` is present.
- OpenAlex for academic metadata demo.
- LanguageTool public API for grammar/spell checks.
- Mock/heuristic/local fallbacks when keys are missing or APIs fail, with `provider_metadata.fallback=true`.

Do not claim certified plagiarism detection, full academic database coverage, or production sign-off from this overlay.

## 7B. Demo report visual analysis and PDF polish

Status: VERIFIED on 2026-04-28 11:24:19 IST.

The local demo report page and PDF export now include visual analysis summaries for:

- Similarity versus originality estimate.
- AI-like versus human-like writing indicator.
- Scanned versus excluded text.
- Grammar finding density.
- Top source match scores.

This is a visualization and demo-report usability enhancement only. It does not change scan-provider behavior, certified provider scope, tenant isolation, RBAC policy, or production sign-off status.

## 7C. Demo feature budgets and rate limits

Status: VERIFIED on 2026-04-28 after local checks.

The local demo build includes feature-wise usage budgets and rate limits for:

- Full Checks.
- Web Source Matching.
- AI Writing Analysis.
- Academic Source Lookup.
- Grammar Review.
- PDF Reports.
- Fallback Scans.
- Monthly Words Processed.

Dashboard and user-facing budget UI must use these feature labels only. Do not show internal vendor/API names in budget cards. Provider metadata may still store internal names for debugging, but reports and dashboards should present feature-level live/fallback state.

Default demo math:

- 300 standard scans/month use 900 Web Source Matching units.
- 100 Web Source Matching units remain as reserve from the 1,000-unit demo allowance.
- 300 standard scans/month use 300 AI Writing Analysis requests.
- AI input is capped at 8,000 tokens and output at 1,024 tokens.
- 300 standard scans/month use up to 5,400,000 Grammar Review characters.
- 300 standard scans/month use 600 Academic Source Lookup units.

This is a local demo credit-protection layer. It is not production billing, procurement certification, or paid-provider contract enforcement.

## 7D. Demo scan lifecycle auto-refresh

Status: VERIFIED on 2026-04-28 12:03:27 IST.

Submission detail pages now poll the tenant-scoped submission status endpoint while a scan is `SCAN_QUEUED` or `SCANNING`. The page refreshes its server-rendered data automatically when the status changes, so users can see lifecycle updates without manually refreshing the browser.

This is a lightweight polling enhancement for the existing PostgreSQL-backed worker flow. It is not a WebSocket/SSE implementation and does not replace the requirement to run the worker process.

## 7E. Demo Teal + Ink UI refresh

Status: VERIFIED on 2026-04-28 12:13:52 IST.

The local demo UI now uses a professional Teal + Ink theme across the app shell, login, dashboard, cards, tables, forms, and common surfaces. The default app background is softly tinted, the sidebar uses a deep teal treatment, panels use warm off-white/mint surfaces, and primary actions use teal/ink colors.

This is a visual-only demo polish pass. It does not change APIs, database schema, authentication, RBAC, scan provider behavior, budget logic, or production sign-off status.

## 8. Canonical roles

Use exactly these roles:

```txt
SUPER_ADMIN
INSTITUTION_ADMIN
REVIEWER
USER
```

Role rules:

- `SUPER_ADMIN`: platform-wide control, tenant creation, global analytics, support oversight.
- `INSTITUTION_ADMIN`: tenant-level control, users, settings, reports, analytics.
- `REVIEWER`: tenant-scoped review workflow, report investigation, notes, statuses.
- `USER`: submit documents, view own submissions, see allowed reports/feedback.

---

## 9. Canonical submission statuses

```txt
DRAFT
UPLOADED
EXTRACTING
READY_FOR_SCAN
SCAN_QUEUED
SCANNING
SCAN_COMPLETE
UNDER_REVIEW
HOLD
CLEARED
ESCALATED
FAILED
```

---

## 10. Core database tables

Initial MVP tables:

```txt
tenants
tenant_settings
users
sessions
password_reset_tokens
audit_events
submissions
submission_files
extracted_texts
preprocessing_runs
text_chunks
scan_jobs
scan_results
source_matches
ai_assessments
grammar_findings
review_cases
review_events
report_snapshots
usage_counters
support_tickets
support_ticket_comments
```

Advanced/future tables may be added only in later phases:

```txt
provider_accounts
external_api_keys
google_oauth_accounts
lms_integrations
repository_entries
quick_scan_events
fact_check_results
pwa_sync_events
```

---

## 11. Required verification commands

Run as applicable after each task:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:generate
npm run db:migrate
docker compose config
```

Task-specific commands may be added. If a command cannot run because the repo is not ready yet, record the reason in the evidence log.

---

# 12. Phase gates and implementation tracker

## Phase summary

| Phase | Name | Status | Human gate |
|---|---|---|---|
| P0 | Foundation | VERIFIED | Local env confirmation resolved for development |
| P1 | Auth, tenancy, RBAC | VERIFIED | Local-development defaults approved; production credentials later |
| P2 | Submissions and storage | VERIFIED | Defaults approved; sample files can be generated if needed |
| P3 | Extraction and preprocessing | VERIFIED | Exclusion thresholds and test documents deferred for later validation |
| P4 | Scan orchestration with mock provider | VERIFIED | Mock scan provider approved for MVP; real provider keys deferred |
| P5 | Reports and reviewer workflow | VERIFIED | Report disclaimer/template approval before pilot |
| P6 | Admin, analytics, customization, support | IN_PROGRESS | Branding/support SLA details if needed |
| P7 | Security, QA, compliance | NOT_STARTED | Retention/privacy approval if needed |
| P8 | MVP deployment readiness | NOT_STARTED | Hosting/secrets/domain for production deploy |
| P9 | Real providers and grammar engine | LOCKED | Provider contract/API keys required |
| P10 | Google Docs, API, LMS integrations | LOCKED | OAuth/LMS credentials required |
| P11 | PWA, quick scan, repository, fact-checking | LOCKED | Feature approval and policy decisions required |
| P12 | Final full-feature verification | LOCKED | Final UAT and production sign-off |

---

## P0 — Foundation

**Goal:** Create project foundation, Docker dev services, env validation, Drizzle baseline, and health route.

**Do not implement:** auth, upload, scan, reports, dashboards.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P0-T1 | Bootstrap Next.js App Router + TypeScript + Tailwind project and folder structure. | None | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T1 evidence. |
| P0-T2 | Add package scripts: dev, build, start, lint, typecheck, test, db:generate, db:migrate, db:studio, worker. | P0-T1 | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T1/P0-T2 evidence. |
| P0-T3 | Add Docker Compose for PostgreSQL and MinIO with bucket initialization. | P0-T1 | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T2 evidence. |
| P0-T4 | Add `.env.example` and Zod env validation. | P0-T1 | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T3 evidence. |
| P0-T5 | Configure Drizzle ORM baseline and migration folder. | P0-T4 | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T4 evidence. |
| P0-T6 | Add `/api/health` checking app, DB, and storage/config status. | P0-T5 | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T4 evidence. |
| P0-T7 | Add docs: local development, implementation overview, command reference. | P0-T1 | VERIFIED | See IMPLEMENTATION_TRACKER.md P0-T1/P0-T2 evidence. |

### P0 phase verification

P0 is complete only if:

- Next.js + TypeScript + Tailwind exists.
- Docker Compose starts PostgreSQL and MinIO.
- Env validation exists.
- Drizzle is configured.
- Health route exists.
- No later-phase features exist.
- Verification commands pass or failures are documented and fixed.

### P0 human gate

Ask human only if missing:

- Project/repo name.
- Local dev port preference.
- Database name.
- MinIO bucket name.
- Confirmation that Docker is available.

---

## P1 — Auth, tenancy, RBAC

**Goal:** Multi-tenant auth, sessions, seed users, protected shell, audit base.

**Do not implement:** uploads, extraction, scans, reports.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P1-T1 | Add schemas for tenants, tenant_settings, users, sessions, audit_events. | P0 verified | VERIFIED | Schema, migration, DB introspection, and checks verified; see tracker P1-T1 evidence. |
| P1-T2 | Implement Argon2id password hashing and secure session token hashing. | P1-T1 | VERIFIED | Password/session helpers, auth service, tests, and checks verified; see tracker P1-T2 evidence. |
| P1-T3 | Implement login, logout, and me API routes. | P1-T2 | VERIFIED | Login/logout/me routes, route tests, audit writes, and checks verified; see tracker P1-T3 evidence. |
| P1-T4 | Implement RBAC helpers and tenant access guards. | P1-T1 | VERIFIED | RBAC helpers and role/tenant guard tests verified; see tracker P1-T4 evidence. |
| P1-T5 | Add seed script for super admin, demo tenant, admin, reviewer, user. | P1-T2 | VERIFIED | Idempotent seed script, env placeholders, Argon2id hashes, and DB verification complete; see tracker P1-T5 evidence. |
| P1-T6 | Build login page and protected dashboard shell with role-based navigation. | P1-T3, P1-T4 | VERIFIED | Protected dashboard shell, role navigation, placeholders, build, tests, and smoke tests verified; see tracker P1-T6 evidence. |

### P1 phase verification

P1 is complete only if:

- Roles exist exactly as defined.
- Passwords are hashed.
- Raw session tokens are never stored.
- Login/logout/me work.
- Dashboard shell is protected.
- Role navigation works.
- Tenant isolation is enforced in auth/user queries.
- Audit events are written.

### P1 human gate

Ask human only if needed:

- Super admin seed email/password.
- Demo tenant name.
- Password policy preference.
- Whether SSO is required now or later. Default: later.

---

## P2 — Submissions and storage

**Goal:** Create submissions and upload PDF/DOC/DOCX/TXT into MinIO.

**Do not implement:** extraction, preprocessing, scanning, reports.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P2-T1 | Add submissions and submission_files schemas. | P1 verified | VERIFIED | Submission schema, migration, enum, indexes, and DB introspection verified; see tracker P2-T1 evidence. |
| P2-T2 | Implement MinIO/S3-compatible object storage service with tenant-scoped keys. | P2-T1 | VERIFIED | Typed storage service, tenant-scoped keys, tests, build, and MinIO smoke verified; see tracker P2-T2 evidence. |
| P2-T3 | Implement submission create/list/detail APIs with RBAC. | P2-T1 | VERIFIED | Submission API routes, service-layer tenant/RBAC scopes, audit event creation, tests, build, and smoke checks verified; see tracker P2-T3 evidence. |
| P2-T4 | Implement upload API supporting PDF, DOC, DOCX, TXT with file size/type validation. | P2-T2, P2-T3 | VERIFIED | Upload route, typed upload service, MIME/size/permission tests, DB metadata/status/audit checks, and MinIO object smoke verified; see tracker P2-T4 evidence. |
| P2-T5 | Build submission list, create, upload, and detail UI. | P2-T4 | VERIFIED | Submission list, create/upload form, detail page, build, and browser UI smoke verified; see tracker P2-T5 evidence. |
| P2-T6 | Add upload audit events and storage access tests. | P2-T4 | VERIFIED | Covered by P2-T4 verification: upload audit events, metadata/status checks, storage tests, and MinIO smoke are verified. |

### P2 phase verification

P2 is complete only if:

- Submissions can be created.
- PDF/DOC/DOCX/TXT upload works.
- Invalid files are rejected.
- File size limits are enforced.
- Files are stored with tenant-scoped keys.
- File metadata is saved.
- Status becomes `UPLOADED`.
- Cross-tenant access fails.

### P2 human gate

Ask human only if needed:

- Max file size.
- Default monthly word cap.
- Sample files for PDF/DOC/DOCX/TXT.
- Whether DOC must be fully supported immediately or DOCX-first is acceptable.

---

## P3 — Extraction and preprocessing

**Goal:** Extract text and prepare sanitized payload before scan.

**Do not implement:** scan providers, scan queue, report UI.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P3-T1 | Add extracted_texts, preprocessing_runs, text_chunks schemas. | P2 verified | VERIFIED | Tenant-aware extraction/preprocessing/chunk schemas, migration, DB introspection, and checks verified; see tracker P3-T1 evidence. |
| P3-T2 | Implement TXT, DOCX, and PDF text extraction service. | P3-T1 | VERIFIED | Typed extraction functions, parser dependencies, TXT/DOCX/PDF fixture tests, build, and scope checks verified; see tracker P3-T2 evidence. |
| P3-T3 | Add extraction API that loads from storage, extracts text, stores raw text and word count. | P3-T2 | VERIFIED | Extraction API, service, status update, audit event, route smoke, tests, and build verified; see tracker P3-T3 evidence. |
| P3-T4 | Implement preprocessing: bibliography removal, quote removal, small match threshold, normalization. | P3-T3 | VERIFIED | Preprocessing engine, rule tests, chunks, build, and scope checks verified; see tracker P3-T4 evidence. |
| P3-T5 | Implement chunking and store sanitized text/chunks. | P3-T4 | VERIFIED | Preprocess API stores preprocessing runs and chunks, with audit and route smoke; see tracker P3-T5 evidence. |
| P3-T6 | Build preprocessing summary UI. | P3-T5 | VERIFIED | Covered by P3-T5 detail UI summary and Playwright verification. |
| P3-T7 | Add tests for extraction and preprocessing rules. | P3-T2, P3-T4 | VERIFIED | Covered by P3-T2 extraction fixture tests, P3-T4 preprocessing rule tests, and P3-T5 service tests. |

### P3 phase verification

P3 is complete only if:

- Raw extracted text is stored separately from sanitized scan text.
- TXT/DOCX/PDF extraction works.
- Bibliography/reference exclusion works.
- Quote exclusion works.
- Small-match threshold works.
- Word counts are recorded.
- Chunks are stored.
- No scanning/reporting is added early.

### P3 human gate

Ask human only if needed:

- Small match default threshold. Default: 14 words.
- Institution-specific bibliography/citation rules.
- Sample academic documents.

---

## P4 — Scan orchestration with mock provider

**Goal:** Build scan job queue and provider adapter using mock provider first.

**Do not implement:** paid APIs, final report PDF, integrations.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P4-T1 | Add scan_jobs, scan_results, source_matches, ai_assessments, grammar_findings schemas. | P3 verified | VERIFIED | Tenant-aware scan schema, migration, DB introspection, and checks verified; see tracker P4-T1 evidence. |
| P4-T2 | Implement ScanProvider interface and deterministic mock provider. | P4-T1 | VERIFIED | Provider interface, deterministic mock provider, tests, build, and no-external-call checks verified; see tracker P4-T2 evidence. |
| P4-T3 | Implement PostgreSQL-backed scan queue with claim/retry/fail/succeed logic. | P4-T1 | VERIFIED | Queue helpers, worker entrypoint, retry tests, worker command, and PostgreSQL queue smoke verified; see tracker P4-T3 evidence. |
| P4-T4 | Add start scan API, scan status transitions, mock worker execution, and normalized result persistence. | P4-T2, P4-T3 | VERIFIED | Start scan API, scanning service, mock worker persistence, status lifecycle, duplicate prevention, audit events, tests, build, and live worker smoke verified; see tracker P4-T4 evidence. |
| P4-T5 | Build scan status UI. | P4-T4 | VERIFIED | Submission detail scan lifecycle panel, guarded start button, summary-only complete state, tests, build, and browser smoke verified; see tracker P4-T5 evidence. |

### P4 phase verification

P4 is complete only if:

- Scan queue works.
- Worker processes queued jobs.
- Mock provider returns deterministic similarity/AI/grammar/source data.
- Status moves through `SCAN_QUEUED`, `SCANNING`, `SCAN_COMPLETE` or `FAILED`.
- Results persist in normalized tables.
- Duplicate active scans are blocked.
- Paid provider APIs are not invented or added without approval.

### P4 human gate

Usually none for mock provider. Ask human only if:

- Scan policy thresholds are required.
- Turnaround-time target is required.

---

## P5 — Reports and reviewer workflow

**Goal:** Build report UI, immutable snapshots, reviewer case workflow, PDF export.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P5-T1 | Add review_cases, review_events, report_snapshots schemas. | P4 verified | VERIFIED | Tenant-aware review/report snapshot schema, migration, DB introspection, and checks verified; see tracker P5-T1 evidence. |
| P5-T2 | Implement typed report assembly service. | P5-T1 | VERIFIED | Typed read-only report assembly service, tests, build, and tenant-isolation DB smoke verified; see tracker P5-T2 evidence. |
| P5-T3 | Build report UI with separate similarity, AI, source matches, exclusions, grammar. | P5-T2 | VERIFIED | Protected `/submissions/[id]/report`, report presentation helpers, empty states, highlighted matches, separate AI/similarity sections, browser smoke, and checks verified; see tracker P5-T3 evidence. |
| P5-T4 | Implement reviewer queue, reviewer case page, notes, statuses, event timeline. | P5-T1, P5-T3 | VERIFIED | Tenant-aware queue/detail pages, reviewer self-assignment, notes, status transitions, event timeline, report links, review/audit event writes, tests, DB smoke, and browser smoke verified; see tracker P5-T4 evidence. |
| P5-T5 | Implement PDF report generation, MinIO storage, and immutable report snapshot creation. | P5-T4 | VERIFIED | PDF route, PDF renderer, tenant-scoped storage key, MinIO object storage, `report_snapshots.pdf_storage_key`, audit event, tests, build, and live access-control smoke verified; see tracker P5-T5 evidence. |

### P5 phase verification

P5 is complete only if:

- Similarity and AI scores are separate.
- Source matches are visible.
- Highlighted matched content is shown where possible.
- Exclusion summary is shown.
- Reviewer can assign/review/comment/status-change.
- PDF report downloads.
- Report snapshot is immutable.
- Access is tenant/role controlled.

### P5 human gate

Ask human only if needed:

- Official report disclaimer text.
- Report branding/footer.
- Reviewer decision labels.
- Student visibility policy.
- Escalation policy.

---

## P6 — Admin, analytics, customization, support

**Goal:** Institutional admin controls, dashboards, user management, support/helpdesk.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P6-T1 | Implement analytics service and `/api/admin/analytics`. | P5 verified | VERIFIED | Tenant-scoped analytics service/API, super-admin global/tenant scope, usage limits, tests, build, and live API smoke verified; see tracker P6-T1 evidence. |
| P6-T2 | Build admin dashboard cards/usage metrics. | P6-T1 | VERIFIED | Admin dashboard cards, accessible meter charts, tenant/global admin views, tests, build, and Playwright smoke verified; see tracker P6-T2 evidence. |
| P6-T3 | Implement tenant settings: logo, colour, report footer, file limits, word limits, small-match threshold. | P6-T2 | VERIFIED | Tenant settings form/service, branding application, usage limits, audit event, tests, build, and Playwright smoke verified; see tracker P6-T3 evidence. |
| P6-T4 | Implement institution user management UI/API. | P1 verified | VERIFIED | Tenant-scoped user management service/actions/UI, role restrictions, manual password reset, audit events, tests, build, and browser smoke verified; see tracker P6-T4 evidence. |
| P6-T5 | Implement support ticket module: schemas, `/support` UI, ticket detail/comments/status lifecycle, and audit events. | P6-T4 | VERIFIED | Tenant-aware support tables, support service/actions/UI, RBAC/tenant scope, comments, status audit events, tests, build, and browser/DB smoke verified; see tracker P6-T5 evidence. |

### P6 phase verification

P6 is complete only if:

- Admin sees tenant usage.
- Super admin can view global/tenant summaries.
- Tenant settings are editable and applied.
- Institution admin cannot create SUPER_ADMIN.
- User management is tenant-scoped.
- Support tickets work.
- Audit events are written.

### P6 human gate

Ask human only if needed:

- Logo/branding assets.
- Default usage limits.
- Support categories/SLA labels.
- Dashboard card preferences.

---

## P7 — Security, QA, compliance

**Goal:** Harden access, audit, consent, retention, tenant isolation, documentation.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P7-T1 | Add security hardening: headers, login/upload rate limits, CSRF strategy, strict file validation, safe errors, and central helpers. | P6 verified | VERIFIED | Global headers, same-origin CSRF checks, login/upload rate limits, stricter upload validation, safe JSON helpers, docs, tests, build, and live smoke verified; see tracker P7-T1 evidence. |
| P7-T2 | Add tenant isolation tests across submissions, reports, user management, storage keys, and analytics. | P7-T1 | VERIFIED | Seeded tenant A/B fixture tests passed for submissions, report access path, user management, storage keys, and analytics scope; see tracker P7-T2 evidence. |
| P7-T3 | Improve audit coverage for listed critical actions and add `/admin/audit`. | P7-T2 | VERIFIED | Required audit action registry, tenant-scoped audit service, `/admin/audit` page with filters, tests, build, and browser smoke verified; see tracker P7-T3 evidence. |
| P7-T4 | Implement retention settings and repository reuse consent metadata. | P7-T3 | VERIFIED | Retention settings, repository consent settings, nullable submission consent fields, migration, no-consent/no-reuse guard tests, build, and PostgreSQL column smoke verified; see tracker P7-T4 evidence. |
| P7-T5 | Add docs: UAT checklist, admin guide, reviewer guide, user guide, security notes. | P7-T4 | VERIFIED | Required docs created and verified against current MVP behavior, UAT flow coverage, unavailable feature claims, lint/typecheck/test/build, and Phase 7 verification; see tracker P7-T5 evidence. |

### P7 phase verification

P7 is complete only if:

- Auth and upload routes are rate limited.
- CSRF strategy is documented/implemented.
- Tenant isolation tests pass.
- Audit page exists.
- Consent is required before repository reuse.
- Retention settings exist.
- User/admin/reviewer/security docs exist.

### P7 human gate

Ask human only if needed:

- Privacy/retention durations.
- Consent wording approval.
- Incident/escalation contacts.
- Legal/security approval.

---

## P8 — MVP deployment readiness

**Goal:** Production-ready container setup and deployment docs for MVP.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P8-T1 | Add production Docker setup for web and worker plus production compose example. | P7 verified | VERIFIED | Production Dockerfile, `.dockerignore`, same-image web/worker commands, production compose example, clean Docker build, and no-secret checks verified; see tracker P8-T1 evidence. |
| P8-T2 | Add deployment docs covering env, managed PostgreSQL, S3-compatible storage, migrations, web/worker, health, backup, rollback, secrets, and troubleshooting. | P8-T1 | VERIFIED | `docs/deployment.md` added and verified for all required topics, no real secrets, and lint/typecheck/test/build; see tracker P8-T2 evidence. |
| P8-T3 | Add production readiness checklist and run full MVP verification if all P8 tasks are verified. | P8-T2 | VERIFIED | Production readiness checklist, Phase 8 verification, and full MVP verification passed; production blockers listed; see tracker P8-T3 and final MVP evidence. |

### P8 phase verification

P8 is complete only if:

- Container build works.
- Web and worker commands are documented.
- Production compose example exists.
- Backup/restore/rollback docs exist.
- MVP end-to-end verification passes.
- No advanced locked features are accidentally added.

### P8 human gate

Ask human for production deployment only if proceeding beyond local MVP:

- Hosting provider.
- Domain.
- Production PostgreSQL credentials.
- S3-compatible storage credentials.
- SSL/HTTPS setup.
- Monitoring/logging service.

---

## P9 — Real providers and grammar engine

**Locked until MVP is verified and human approves provider integration.**

**Goal:** Replace/add to mock provider with real provider adapters and optional self-hosted grammar.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P9-T1 | Human approval: choose provider(s) and provide API credentials/docs. | P8 verified | BLOCKED_HUMAN | Pending |
| P9-T2 | Add provider config table/settings and env validation. | P9-T1 | LOCKED | Pending |
| P9-T3 | Add real plagiarism/AI provider adapter skeleton without guessing undocumented endpoints. | P9-T1 | LOCKED | Pending |
| P9-T4 | Implement provider request/response mapping using official docs only. | P9-T3 | LOCKED | Pending |
| P9-T5 | Add provider fallback and failure handling. | P9-T4 | LOCKED | Pending |
| P9-T6 | Optional: add self-hosted LanguageTool container and adapter. | P9-T1 | LOCKED | Pending |
| P9-T7 | Verify live provider flow with approved test credentials. | P9-T4 | LOCKED | Pending |

### P9 human gate

Required:

- Provider choice: Copyleaks, Winston AI, Turnitin/OEM, or other.
- API keys.
- Official API docs or package references.
- Data retention terms.
- Pricing/usage limits.

Do not implement real provider calls without these.

---

## P10 — Google Docs, external API, LMS foundation

**Locked until MVP is verified and human provides integration credentials.**

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P10-T1 | Human approval: provide Google OAuth and/or LMS/API requirements. | P8 verified | BLOCKED_HUMAN | Pending |
| P10-T2 | Add API key table and scoped external API auth. | P10-T1 | LOCKED | Pending |
| P10-T3 | Add external submission creation and result retrieval endpoints. | P10-T2 | LOCKED | Pending |
| P10-T4 | Add Google OAuth config with narrow scopes. | P10-T1 | LOCKED | Pending |
| P10-T5 | Implement Google Docs import into existing submission pipeline. | P10-T4 | LOCKED | Pending |
| P10-T6 | Add LMS/LTI foundation only if credentials/spec are available. | P10-T1 | LOCKED | Pending |

### P10 human gate

Required:

- Google OAuth client ID/secret.
- Approved Google scopes.
- LMS vendor and integration type.
- External API consumers and permission scopes.

---

## P11 — PWA, quick scan, repository, fact-checking, advanced analytics

**Locked until MVP is verified and human approves advanced scope.**

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P11-T1 | Human approval: select advanced features to enable. | P8 verified | BLOCKED_HUMAN | Pending |
| P11-T2 | Add PWA app shell caching and offline-safe UX. | P11-T1 | LOCKED | Pending |
| P11-T3 | Add client-side quick scan as non-authoritative preview. | P11-T1 | LOCKED | Pending |
| P11-T4 | Add institutional repository entries and consent-gated promotion. | P7-T5 | LOCKED | Pending |
| P11-T5 | Add local repository matching/fingerprinting if approved. | P11-T4 | LOCKED | Pending |
| P11-T6 | Add fact-check assistance only with approved provider/API. | P11-T1 | LOCKED | Pending |
| P11-T7 | Add advanced analytics/charts. | P6 verified | LOCKED | Pending |

### P11 human gate

Required:

- Which advanced features are approved.
- Privacy policy for quick scan/local inference.
- Repository reuse policy.
- Fact-checking provider/API key.
- Analytics visualization preferences.

---

## P12 — Final full-feature verification

**Goal:** Verify the full software after MVP + approved advanced phases.

| Task | Description | Dependencies | Status | Verification evidence |
|---|---|---|---|---|
| P12-T1 | Run full feature checklist against all implemented phases. | Approved prior phases | LOCKED | Pending |
| P12-T2 | Run full command suite: lint, typecheck, test, build, migrations, Docker checks. | P12-T1 | LOCKED | Pending |
| P12-T3 | Run role/tenant/security E2E checks. | P12-T2 | LOCKED | Pending |
| P12-T4 | Confirm human UAT sign-off and production readiness. | P12-T3 | LOCKED | Pending |

---

# 13. Per-task implementation protocol

For every task:

1. Set task status to `IN_PROGRESS`.
2. Implement only the task.
3. Run verification commands.
4. If commands fail, set `NEEDS_FIX` and fix only current task.
5. If human input is missing, set `BLOCKED_HUMAN`, log exact input required, and stop.
6. If all checks pass, set `VERIFIED`.
7. Add evidence to the implementation evidence log.
8. Move to the next task only after verification.

---

# 14. Per-task verification prompt

The agent must run this internally after each task:

```txt
Verify the current task.

1. Re-read AGENTS.md.
2. Confirm the current task acceptance criteria are satisfied.
3. Confirm no future-phase feature was added.
4. Confirm no hard-coded secrets exist.
5. Confirm TypeScript remains strict.
6. Confirm tenant isolation if business data was touched.
7. Confirm audit events if state-changing behavior was touched.
8. Run required commands.
9. If anything fails, mark NEEDS_FIX and fix only this task.
10. If human input is missing, mark BLOCKED_HUMAN and stop.
11. If all checks pass, mark VERIFIED with evidence.
```

---

# 15. Phase verification prompt

At the end of each phase:

```txt
Verify the full phase.

1. Confirm every task in the phase is VERIFIED or SKIPPED_APPROVED.
2. Confirm all phase acceptance criteria are satisfied.
3. Confirm no locked future-phase features were added.
4. Run lint, typecheck, test, and build when applicable.
5. Confirm human gate status.
6. If human input is required, mark phase BLOCKED_HUMAN and stop.
7. If complete, mark phase VERIFIED and move to the next phase.
```

---

# 16. Human intervention protocol

When human input is required, the agent must write:

```txt
BLOCKED_HUMAN
Phase:
Task:
Reason:
Exact input needed:
Recommended default:
Impact if skipped:
```

After the human provides input, the agent must:

1. Record the input in the Human Input Log.
2. Update the blocked task status back to `IN_PROGRESS`.
3. Continue from the same task.
4. Never restart from a later task.

---

# 17. Evidence log

The agent must append entries here.

| Date/time | Task | Status | Files changed | Commands run | Evidence summary | Remaining issue |
|---|---|---|---|---|---|---|
| Pending | None | NOT_STARTED | None | None | No implementation yet | None |
| 2026-04-28 01:17:46 IST | P1-T3 | VERIFIED | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, `src/lib/auth/http.ts`, `src/server/services/auth.service.ts`, `tests/auth-routes.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | Login/logout/me routes implemented with auth service, generic credential errors, secure cookies, safe `/me` response, and explicit login/logout audit writes. | None |
| 2026-04-28 01:20:08 IST | P1-T4 | VERIFIED | `src/lib/rbac/roles.ts`, `src/lib/rbac/guards.ts`, `tests/rbac.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | RBAC role constants and typed auth/role/tenant guards implemented with tests covering all canonical roles and tenant access decisions. | None |
| 2026-04-28 01:22:46 IST | P1-T5 | VERIFIED | `.env.example`, `package.json`, `scripts/seed.ts`, `src/lib/env.ts`, `src/server/services/seed.service.ts`, `tests/env.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run db:seed` twice, PostgreSQL introspection queries | Idempotent seed script creates one super admin, one demo tenant, and demo admin/reviewer/user accounts with Argon2id password hashes. | None |
| 2026-04-28 01:25:42 IST | P1-T6 | VERIFIED | `src/app/login/page.tsx`, `src/app/(dashboard)/*`, `src/components/auth/*`, `src/components/dashboard/dashboard-shell.tsx`, `src/lib/auth/server.ts`, `src/lib/rbac/navigation.ts`, `tests/dashboard-navigation.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, curl smoke tests | Login page, protected dashboard shell, role navigation, placeholder pages, unauthenticated redirect, seeded login, and logout verified. Phase 1 marked verified. | None |
| 2026-04-28 01:29:31 IST | P2-T1 | VERIFIED | `src/lib/db/schema.ts`, `drizzle/0002_lively_rictor.sql`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/_journal.json`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, PostgreSQL introspection queries | Tenant-aware submissions and submission_files schema added with exact status enum and indexes. | None |
| 2026-04-28 01:32:26 IST | P2-T2 | VERIFIED | `package.json`, `package-lock.json`, `src/lib/storage/object-storage.ts`, `tests/object-storage.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, MinIO put/get/delete smoke | Typed MinIO/S3-compatible storage service added with tenant-scoped key generation and no client credential exposure. | None |
| 2026-04-28 01:35:54 IST | P2-T3 | VERIFIED | `src/app/api/submissions/route.ts`, `src/app/api/submissions/[id]/route.ts`, `src/server/services/submissions.service.ts`, `tests/submissions-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, API curl smoke, PostgreSQL audit query | Submission create/list/detail APIs implemented with role-aware tenant scope and `submission.create` audit writes. Upload was not implemented in this task. | None |
| 2026-04-28 01:43:02 IST | P2-T4 | VERIFIED | `src/app/api/submissions/[id]/upload/route.ts`, `src/server/services/submission-upload.service.ts`, `tests/submission-upload.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, upload API curl smoke, PostgreSQL metadata/status/audit query, MinIO getObject smoke | Upload API implemented with PDF/DOC/DOCX/TXT MIME support, tenant max-size defaults/settings, owner/admin access, tenant-scoped storage keys, metadata/checksum persistence, `UPLOADED` status update, and upload audit events. | None |
| 2026-04-28 01:48:36 IST | P2-T5 | VERIFIED | `src/app/(dashboard)/submissions/page.tsx`, `src/app/(dashboard)/submissions/new/page.tsx`, `src/app/(dashboard)/submissions/[id]/page.tsx`, `src/components/submissions/submission-create-upload-form.tsx`, `src/server/services/submissions.service.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, Playwright browser UI smoke | Submission list, create/upload form, and detail page implemented. Browser smoke created and uploaded a document, then confirmed `UPLOADED` status and file metadata. Phase 2 marked verified. | None |
| 2026-04-28 01:51:05 IST | P3-T1 | VERIFIED | `src/lib/db/schema.ts`, `drizzle/0003_futuristic_morgan_stark.sql`, `drizzle/meta/0003_snapshot.json`, `drizzle/meta/_journal.json`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, PostgreSQL introspection query | Tenant-aware `extracted_texts`, `preprocessing_runs`, and `text_chunks` schemas added and verified. No extraction or preprocessing behavior was implemented in this schema task. | None |
| 2026-04-28 01:54:59 IST | P3-T2 | VERIFIED | `package.json`, `package-lock.json`, `src/features/extraction/extract-text.ts`, `tests/extract-text.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm install mammoth pdf-parse --no-audit --no-fund`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | TXT, DOCX, and PDF extraction functions added with in-memory fixtures and typed dispatch by MIME/filename. No preprocessing behavior was implemented. | None |
| 2026-04-28 01:58:07 IST | P3-T3 | VERIFIED | `src/app/api/submissions/[id]/extract/route.ts`, `src/server/services/extraction.service.ts`, `tests/extraction-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, extraction API curl smoke, PostgreSQL extraction/status/audit query | Extraction API added. Smoke verified MinIO load, extracted text persistence, word count update, `READY_FOR_SCAN` status, and `submission.extract` audit event. No preprocessing or scan feature was implemented. | None |
| 2026-04-28 02:00:43 IST | P3-T4 | VERIFIED | `src/features/preprocessing/preprocess-text.ts`, `tests/preprocess-text.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | Preprocessing engine added for whitespace normalization, bibliography/reference removal, quote removal, small-match threshold filtering, and chunking. Tests cover each rule and raw/sanitized separation. | None |
| 2026-04-28 02:05:48 IST | P3-T5 | VERIFIED | `src/app/api/submissions/[id]/preprocess/route.ts`, `src/app/(dashboard)/submissions/[id]/page.tsx`, `src/components/submissions/preprocess-submission-button.tsx`, `src/features/preprocessing/preprocess-text.ts`, `src/server/services/extraction.service.ts`, `src/server/services/preprocessing.service.ts`, `tests/preprocessing-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, preprocess API curl smoke, PostgreSQL preprocessing/chunk/audit query, Playwright UI check | Preprocessing API and detail summary UI implemented. Smoke verified preprocessing run persistence, text chunks, sanitized/raw separation, audit event, and displayed summary. Phase 3 marked verified. | None |
| 2026-04-28 02:08:36 IST | P4-T1 | VERIFIED | `src/lib/db/schema.ts`, `drizzle/0004_volatile_sway.sql`, `drizzle/meta/0004_snapshot.json`, `drizzle/meta/_journal.json`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, PostgreSQL introspection query | Tenant-aware scan job/result/source/AI/grammar schemas added and verified. No provider, queue, worker, scan API, or report feature was implemented. | None |
| 2026-04-28 02:11:04 IST | P4-T2 | VERIFIED | `src/features/scanning/providers/types.ts`, `src/features/scanning/providers/mock.provider.ts`, `src/features/scanning/providers/index.ts`, `tests/mock-scan-provider.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | Typed scan provider interface and deterministic mock provider added. Tests verify deterministic similarity, AI, source match, grammar, and metadata output without external calls or secrets. | None |
| 2026-04-28 02:19:30 IST | P4-T3 | VERIFIED | `package.json`, `src/lib/jobs/scan-queue.ts`, `src/server/worker.ts`, `src/server/workers/scan-worker.ts`, `tests/scan-queue.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run worker`, live PostgreSQL queue smoke, smoke cleanup check | PostgreSQL-backed scan queue added with tenant-derived enqueue, `FOR UPDATE SKIP LOCKED` claiming, running/succeeded/failed updates, max-attempt retry behavior, worker iteration wrapper, and worker command. No scan API route or result persistence was added. | None |
| 2026-04-28 02:24:37 IST | P4-T4 | VERIFIED | `src/app/api/submissions/[id]/scan/route.ts`, `src/server/services/scanning.service.ts`, `src/server/workers/scan-worker.ts`, `tests/scan-queue.test.ts`, `tests/scanning-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run worker`, live PostgreSQL scan lifecycle smoke | Scan start API, tenant-scoped eligibility checks, duplicate-active-scan prevention, mock worker execution, normalized scan result persistence, status lifecycle, and scan audit events verified. No scan status UI, report UI, PDF, review workflow, or real provider calls were added. | None |
| 2026-04-28 02:30:28 IST | P4-T5 | VERIFIED | `src/app/(dashboard)/submissions/[id]/page.tsx`, `src/components/submissions/scan-status-panel.tsx`, `src/components/submissions/scan-submission-button.tsx`, `src/server/services/scanning.service.ts`, `src/server/services/submissions.service.ts`, `tests/scan-status-panel.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, `npm run worker`, Playwright browser smoke, smoke cleanup check | Submission detail page now shows scan lifecycle UI, start action only for preprocessed ready submissions, queued/running/completed states without duplicate start action, and completed similarity/AI summary only. Phase 4 marked verified. | None |
| 2026-04-28 02:33:12 IST | P5-T1 | VERIFIED | `src/lib/db/schema.ts`, `drizzle/0005_easy_red_skull.sql`, `drizzle/meta/0005_snapshot.json`, `drizzle/meta/_journal.json`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, PostgreSQL introspection query | Tenant-aware `review_cases`, `review_events`, and `report_snapshots` schemas added and verified. No report service, PDF generation, reviewer workflow, APIs, or UI behavior was implemented. | None |
| 2026-04-28 02:36:59 IST | P5-T2 | VERIFIED | `src/features/reports/report.service.ts`, `tests/report-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, live PostgreSQL report assembly smoke | Typed report assembly service added with submission/file/extraction/preprocessing/scan/source/AI/grammar/review/provider/tenant-branding data, standard disclaimer, tenant-scoped DB queries, tests, and cross-tenant smoke verification. No report UI, PDF generation, snapshot insertion, reviewer workflow, or API route was added. | None |
| 2026-04-28 02:47:37 IST | P5-T3 | VERIFIED | `src/app/(dashboard)/submissions/[id]/report/page.tsx`, `src/components/submissions/scan-status-panel.tsx`, `src/features/reports/report-page-content.tsx`, `src/features/reports/report-view.ts`, `tests/report-view.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke | Report UI added from DB-backed report service data with separate similarity/AI sections, highlighted source matches, AI sections, grammar findings, exclusions, provider metadata, scan timestamp, empty states, and cross-tenant 404 verification. No PDF generation, immutable snapshots, MinIO report writes, reviewer workflow, or future integrations were added. | None |
| 2026-04-28 02:55:09 IST | P5-T4 | VERIFIED | `src/app/(dashboard)/reviewer/actions.ts`, `src/app/(dashboard)/reviewer/cases/[id]/page.tsx`, `src/app/(dashboard)/reviewer/queue/page.tsx`, `src/features/review/review.service.ts`, `tests/review-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke, live PostgreSQL review workflow smoke | Reviewer workflow added with tenant/RBAC-scoped queue and case pages, self-assignment, notes, status transitions, event timeline, report links, review event writes, audit event writes, submission status synchronization, invalid-transition blocking, and admin tenant-wide queue visibility. No PDF generation, immutable snapshots, MinIO report writes, or future integrations were added. | None |
| 2026-04-28 03:02:32 IST | P5-T5 | VERIFIED | `package.json`, `package-lock.json`, `src/app/api/submissions/[id]/report/pdf/route.ts`, `src/features/reports/report-export.service.ts`, `src/features/reports/report-pdf.ts`, `src/lib/storage/object-storage.ts`, `src/types/pdfkit-standalone.d.ts`, `tests/object-storage.test.ts`, `tests/report-pdf.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm install pdfkit @types/pdfkit --no-audit --no-fund`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, live PostgreSQL/MinIO PDF route smoke | PDF export added with generated PDF content, tenant-scoped MinIO storage, immutable `report_snapshots` row with `pdf_storage_key`, report-generated audit event, required section checks, and cross-tenant 404 verification. Phase 5 marked verified; AGENTS P5 task split reconciled to tracker P5-T5 scope. | None |
| 2026-04-28 03:07:38 IST | P6-T1 | VERIFIED | `src/app/api/admin/analytics/route.ts`, `src/features/analytics/analytics.service.ts`, `tests/analytics-service.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, live API smoke | Admin analytics service/API added with tenant-scoped totals, status counts, monthly scan/word usage, high similarity/AI counts, user role counts, usage limits, institution-admin tenant scope, super-admin global/tenant scope, and reviewer 403 verification. No dashboard UI, settings mutation, user management, support, or future features were added. | None |
| 2026-04-28 03:15:05 IST | P6-T2 | VERIFIED | `src/app/(dashboard)/dashboard/page.tsx`, `src/features/analytics/admin-analytics-dashboard.tsx`, `src/features/analytics/analytics-view.ts`, `tests/analytics-view.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke | Admin dashboard UI added on `/dashboard` for `SUPER_ADMIN` and `INSTITUTION_ADMIN`, with real analytics cards, accessible meter charts for status/role/usage metrics, tenant-scoped institution admin view, global super-admin view, responsive mobile smoke, and no chart library. No tenant settings mutation, user management, support, retention, external provider, or integration features were added. | None |
| 2026-04-28 03:28:16 IST | P6-T3 | VERIFIED | `src/app/(dashboard)/admin/settings/actions.ts`, `src/app/(dashboard)/admin/settings/page.tsx`, `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/features/tenants/tenant-settings.service.ts`, `src/features/tenants/tenant-brand-mark.tsx`, `src/features/reports/report.service.ts`, `src/features/reports/report-page-content.tsx`, `src/features/reports/report-pdf.ts`, `src/features/analytics/analytics.service.ts`, `src/server/services/submission-upload.service.ts`, `src/server/services/preprocessing.service.ts`, `tests/tenant-settings.test.ts`, supporting tests, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke, PostgreSQL settings/audit smoke | Tenant settings service and `/admin/settings` added with tenant-scoped institution-admin save/load, logo URL/storage key, primary color, report footer, file/word/submission/small-match limits, repository reuse default false, audit events, dashboard/report branding, existing limit resolver integration, and tests. No user management, support, retention enforcement, external provider, OAuth, LMS, PWA, or deployment features were added. | None |
| 2026-04-28 03:36:11 IST | P6-T4 | VERIFIED | `src/app/(dashboard)/admin/users/actions.ts`, `src/app/(dashboard)/admin/users/page.tsx`, `src/features/users/user-management.service.ts`, `tests/user-management.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke, PostgreSQL user/audit smoke | Tenant-scoped user management service, server actions, and `/admin/users` UI added. Institution admins can list own tenant users, create non-super-admin users, update roles, activate/deactivate users, and manually reset passwords; super admins can create/manage tenant admins by selecting a tenant. Audit events and session invalidation verified. No support, retention, external provider, integration, upload, scan, or report features were added. | None |
| 2026-04-28 03:50:48 IST | P6-T5 | VERIFIED | `src/lib/db/schema.ts`, `drizzle/0006_peaceful_newton_destine.sql`, `drizzle/meta/0006_snapshot.json`, `drizzle/meta/_journal.json`, `src/features/support/support.service.ts`, `src/app/(dashboard)/support/actions.ts`, `src/app/(dashboard)/support/page.tsx`, `src/app/(dashboard)/support/[id]/page.tsx`, `src/lib/rbac/navigation.ts`, `tests/support-service.test.ts`, `tests/dashboard-navigation.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke, PostgreSQL support/audit smoke | Support ticket module added with tenant-aware ticket/comment schemas, support status enum, typed service, `/support` and `/support/[id]`, create/comment/status actions, RBAC scope, audit events, and tests. Browser smoke verified user create/comment, institution-admin status update, cross-tenant 404, and super-admin global visibility. Phase 6 marked verified in the tracker. | None |
| 2026-04-28 03:59:53 IST | P7-T1 | VERIFIED | `next.config.ts`, `src/lib/security/headers.ts`, `src/lib/security/api-responses.ts`, `src/lib/security/csrf.ts`, `src/lib/security/rate-limit.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/submissions/route.ts`, `src/app/api/submissions/[id]/extract/route.ts`, `src/app/api/submissions/[id]/preprocess/route.ts`, `src/app/api/submissions/[id]/scan/route.ts`, `src/app/api/submissions/[id]/upload/route.ts`, `src/app/api/submissions/[id]/report/pdf/route.ts`, `src/server/services/submission-upload.service.ts`, `docs/security-hardening.md`, `tests/security-hardening.test.ts`, `tests/submission-upload.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, curl header/rate-limit/CSRF smoke | Security hardening added with global headers, same-origin CSRF checks, login/upload rate limits, stricter upload validation, safe JSON error helpers, and docs. Live smoke verified headers, CSRF 403, login 429, and upload 429. No product features or future integrations were added. | None |
| 2026-04-28 04:03:00 IST | P7-T2 | VERIFIED | `tests/tenant-isolation.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run test -- tests/tenant-isolation.test.ts`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | Tenant isolation tests added with seeded tenant A/B fixtures covering user submission scope, reviewer report access path, admin user-management boundary, tenant-scoped storage keys, and analytics tenant scope. No access leak was found, so no production code fix was needed. | None |
| 2026-04-28 04:09:15 IST | P7-T3 | VERIFIED | `src/features/audit/audit.service.ts`, `src/app/(dashboard)/admin/audit/page.tsx`, `src/lib/rbac/navigation.ts`, `tests/audit-service.test.ts`, `tests/dashboard-navigation.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run start`, Playwright browser smoke, PostgreSQL audit smoke | Admin audit module added with required action registry, tenant-scoped audit listing, action/entity/user/date filters, `/admin/audit` UI, and navigation. Browser smoke verified institution-admin tenant scope, filter behavior, super-admin global scope, and cleanup. | None |
| 2026-04-28 04:16:37 IST | P7-T4 | VERIFIED | `src/lib/db/schema.ts`, `drizzle/0007_famous_valkyrie.sql`, `drizzle/meta/0007_snapshot.json`, `drizzle/meta/_journal.json`, `src/features/tenants/tenant-settings.service.ts`, `src/app/(dashboard)/admin/settings/page.tsx`, `src/server/services/submissions.service.ts`, `tests/tenant-settings.test.ts`, `tests/submissions-service.test.ts`, `tests/tenant-isolation.test.ts`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run db:generate`, `npm run db:migrate`, `npm run test -- tests/tenant-settings.test.ts tests/submissions-service.test.ts`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, PostgreSQL consent-column introspection, scope `rg` checks | Retention settings, repository reuse consent settings, nullable submission consent columns, and typed no-consent/no-reuse guard logic added and verified. No repository matching, fingerprinting, external provider, OAuth, LMS, PWA, or deployment features were added. | None |
| 2026-04-28 04:20:20 IST | P7-T5 | VERIFIED | `docs/uat-checklist.md`, `docs/admin-guide.md`, `docs/reviewer-guide.md`, `docs/user-guide.md`, `docs/security-notes.md`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, documentation coverage `rg` checks | Required UAT/admin/reviewer/user/security docs added and verified against current MVP behavior. UAT covers all required flows, docs state mock-provider and no-repository-matching limits, and Phase 7 was marked PHASE VERIFIED. | None |
| 2026-04-28 04:29:34 IST | P8-T1 | VERIFIED | `.dockerignore`, `Dockerfile`, `docker-compose.prod.example.yml`, `package-lock.json`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `docker build -t plagcheck-app:p8-t1 .`, `docker compose -f docker-compose.prod.example.yml config --no-interpolate`, image script/env checks, `npm ci --dry-run`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` | Production container setup added. The same image builds the Next.js app and can run `npm run start` or `npm run worker`; production compose example defines separate web and worker services with env placeholders only. Lockfile was synced for clean Docker installs. | None |
| 2026-04-28 04:32:26 IST | P8-T2 | VERIFIED | `docs/deployment.md`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, deployment-doc coverage and secret scans | Deployment guide added with env vars, managed PostgreSQL, S3-compatible storage, migrations, web/worker commands, health checks, backup, rollback, secret rotation, troubleshooting, and explicit production gates. No real secrets or unavailable feature claims were added. | None |
| 2026-04-28 04:37:10 IST | P8-T3 | VERIFIED | `docs/production-readiness.md`, `IMPLEMENTATION_TRACKER.md`, `AGENTS.md` | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run db:migrate`, `docker compose config`, production compose config, `docker build -t plagcheck-app:p8-final .`, `npm run worker`, live `/api/health` smoke | Production readiness checklist added with all required items and explicit blockers. Phase 8 marked PHASE VERIFIED and full MVP implementation verification passed; production deployment remains blocked on human-owned deployment, legal/privacy, UAT, security, and provider decisions. | Production gates only |

---

# 18. Human input log

| Date/time | Phase/task | Input requested | Input received | Decision | Result |
|---|---|---|---|---|---|
| Pending | None | None | None | None | None |

---

# 19. Blocker log

| Date/time | Phase/task | Blocker | Type | Resolution needed | Status |
|---|---|---|---|---|---|
| Pending | None | None | None | None | None |

---

# 20. Remaining work log

| Phase/task | Remaining item | Reason | Required action | Owner |
|---|---|---|---|---|
| All | Full implementation | Project not started | Run Codex autopilot prompt | Agent/human |

---

# 21. Final MVP verification checklist

MVP is ready only when all are true:

- Browser SaaS app works.
- Secure login works.
- Four canonical roles work.
- Tenant isolation works.
- User management works.
- PDF/DOC/DOCX/TXT upload works.
- MinIO/S3-compatible storage works.
- Text extraction works.
- Bibliography/quote/small-match exclusion works.
- Scan queue works.
- Mock scan provider works.
- Similarity score exists.
- AI probability exists.
- Source-wise matches exist.
- Grammar/spell findings exist.
- Report UI exists.
- PDF report export exists.
- Submission history exists.
- Reviewer workflow exists.
- Admin dashboard exists.
- Usage analytics exists.
- Tenant customization exists.
- Support/helpdesk exists.
- Audit logs exist.
- No reuse without consent is enforced.
- Retention settings exist.
- UAT docs exist.
- Deployment docs exist.
- Production Docker setup exists.
- No hard-coded secrets.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.

---

# 22. Final full-feature verification checklist

Full feature completion requires MVP plus all human-approved advanced features:

- Real scan provider adapter configured and verified.
- Grammar engine/provider verified.
- External API key system verified.
- Google Docs import verified if approved.
- LMS/API integration verified if approved.
- PWA/offline shell verified if approved.
- Client-side quick scan verified if approved.
- Repository matching verified if approved.
- Fact-checking verified if approved.
- Advanced analytics verified if approved.
- Human UAT sign-off recorded.
- Production readiness sign-off recorded.

---

# 23. Final warning to the agent

Do not say the software is complete just because files exist. It is complete only when the relevant checklist passes and the evidence log proves it.

Do not hallucinate external provider behavior. If a provider endpoint, credential, or API contract is unknown, stop and ask.

Do not skip human gates. Human gates exist to prevent wrong business, legal, privacy, provider, or deployment decisions.
