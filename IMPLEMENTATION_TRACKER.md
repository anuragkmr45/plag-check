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
| MVP implementation status | IN_PROGRESS |
| Current phase | Phase 0 |
| Current task | P0-T2 |
| Last verified task | P0-T1 |
| Last phase verified | None |
| Next human decision needed | Confirm local environment and `.env` values after Phase 0 setup |

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
| P0 Foundation | IN_PROGRESS | P0-T1 verified; P0-T2 through P0-T4 pending | Confirm local environment and env values |
| P1 Auth/RBAC/Tenancy | NOT_STARTED | Pending | Seed admin credentials and role policy |
| P2 Submissions/Storage | NOT_STARTED | Pending | File limits and sample files |
| P3 Extraction/Preprocessing | NOT_STARTED | Pending | Preprocessing thresholds and test documents |
| P4 Scan Orchestration | NOT_STARTED | Pending | Provider decision/API keys if real provider is needed |
| P5 Review/Reports | NOT_STARTED | Pending | Report template/disclaimer approval |
| P6 Admin/Support/Customization | NOT_STARTED | Pending | Branding, support categories, usage limits |
| P7 Security/QA/Compliance | NOT_STARTED | Pending | Privacy/security/retention approval |
| P8 Deployment Readiness | NOT_STARTED | Pending | Hosting, domain, production secrets |
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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P0-T3 — Environment validation

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P0-T4 — Drizzle baseline and health route

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P1-T2 — Password hashing and auth service

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P1-T3 — Login/logout/me API routes

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P1-T4 — RBAC guards

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P1-T5 — Seed script

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P1-T6 — Dashboard shell and protected pages

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P2-T2 — MinIO storage service

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P2-T3 — Create submission API

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P2-T4 — Upload API

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P2-T5 — Upload UI

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P3-T2 — Text extraction service

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P3-T3 — Extraction API and worker step

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P3-T4 — Preprocessing engine

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P3-T5 — Preprocessing API and preview UI

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P4-T2 — Scan provider interface and mock provider

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P4-T3 — PostgreSQL-backed job queue

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P4-T4 — Start scan API

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P4-T5 — Scan status UI

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P5-T2 — Report service

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P5-T3 — Report UI

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P5-T4 — Reviewer queue and status workflow

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P5-T5 — PDF report generation

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P6-T2 — Admin dashboard UI

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P6-T3 — Tenant settings and customization

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P6-T4 — User management UI

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P6-T5 — Support ticket module

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P7-T2 — Tenant isolation tests

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P7-T3 — Audit coverage

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P7-T4 — Data retention and consent

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P7-T5 — UAT and documentation pack

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P8-T2 — Deployment docs

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

---

## P8-T3 — Production readiness checklist

Status: NOT_STARTED

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

Implementation evidence: Pending

Verification evidence: Pending

Remaining/blockers: Pending

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

Status: NOT_STARTED

Changed files: Pending

Database migrations: Pending

Commands run: Pending

Manual verification: Pending

Remaining issues: Pending

Human intervention required: Pending

---

## P0-T3 Evidence

Status: NOT_STARTED

Changed files: Pending

Database migrations: Pending

Commands run: Pending

Manual verification: Pending

Remaining issues: Pending

Human intervention required: Pending

---

## P0-T4 Evidence

Status: NOT_STARTED

Changed files: Pending

Database migrations: Pending

Commands run: Pending

Manual verification: Pending

Remaining issues: Pending

Human intervention required: Pending

---

# Human Intervention Log

Use this table whenever the agent needs a decision, credential, file, or approval.

| Date | Phase/Task | Required human action | Blocking? | Resolution |
|---|---|---|---|---|
| TBD | P0 | Confirm local `.env` values and Docker availability | Yes before local verification | Pending |
| TBD | P1 | Provide seed super admin credentials | Yes before seed verification | Pending |
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

Status: NOT_STARTED

Verification date: Pending

Commands run:
- npm run lint: Pending
- npm run typecheck: Pending
- npm run test: Pending
- npm run build: Pending

End-to-end flows verified:
- Login/logout: Pending
- RBAC: Pending
- Tenant isolation: Pending
- User management: Pending
- Submission creation/upload: Pending
- Text extraction: Pending
- Preprocessing: Pending
- Scan queue/worker: Pending
- Report UI: Pending
- PDF export: Pending
- Reviewer workflow: Pending
- Admin analytics: Pending
- Audit logs: Pending
- Support tickets: Pending
- Deployment readiness: Pending

Production blockers:
- Pending

Final MVP status: NOT_STARTED
