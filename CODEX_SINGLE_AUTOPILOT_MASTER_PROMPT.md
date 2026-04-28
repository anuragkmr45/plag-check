# Codex Single Autopilot Master Prompt

Copy the full prompt below into Codex from the repository root.

---

```txt
You are Codex working inside this repository. Your goal is to continue from the current implementation state and complete the anti-plagiarism + AI-detection SaaS according to the project plan, without hallucinating, without skipping verification, and without repeatedly asking the human for future-phase decisions.

CURRENT KNOWN STATE FROM HUMAN:
- Task P1-T2 has been implemented and verified.
- P1-T2 added Argon2id password hashing, session token generation, HMAC-SHA256 session hashing using SESSION_SECRET, httpOnly sameSite=lax cookies, DB-backed createSession/validateSession/destroySession/getCurrentUserFromRequest, and tests.
- The tracker was updated so current task should be P1-T3.
- Do not assume blindly: inspect AGENTS.md and any tracker file to confirm the current task.

PRIMARY OBJECTIVE:
Complete the whole software through MVP phases and verification:
- P0 foundation
- P1 auth/RBAC/admin shell
- P2 submissions + file storage
- P3 extraction + preprocessing
- P4 scan orchestration + mock provider
- P5 reviewer workflow + report UI + PDF export
- P6 admin analytics + customization + support
- P7 security/compliance/QA/docs
- P8 deployment readiness
Then run final end-to-end MVP verification.
After MVP is verified, continue with advanced phases only where non-blocked:
- real provider adapter scaffolding if provider docs/keys are available, otherwise keep mock provider and log blocker
- Google Docs import only if OAuth credentials/details are available, otherwise log blocker
- LMS/API integration foundation if requirements are available, otherwise log blocker
- PWA/client-side quick scan only if they do not destabilize MVP

REQUIRED STACK:
- Next.js App Router
- TypeScript strict
- TailwindCSS
- Drizzle ORM
- PostgreSQL
- MinIO/S3-compatible object storage
- Docker Compose for local development
- Zod for validation where useful
- Vitest for unit tests
- Playwright or equivalent smoke/E2E tests where practical

PRODUCT REQUIREMENTS TO SATISFY:
Build a browser-based SaaS anti-plagiarism and AI-detection platform with:
- secure login/password protection
- roles: SUPER_ADMIN, INSTITUTION_ADMIN, REVIEWER, USER
- tenant isolation
- user creation and management
- PDF, DOC, DOCX, TXT upload
- secure document storage
- extraction and preprocessing
- bibliography, quote, and configurable small-match exclusions
- plagiarism/similarity score
- AI probability/indicator
- source-wise matches and highlighted content
- grammar/spell findings, using mock/self-contained implementation if no external provider is available
- submission history
- detailed report UI
- downloadable/printable PDF report
- reviewer workflow and review notes
- admin dashboard and usage analytics
- audit logs/activity tracking
- support/helpdesk module
- customization: logo, color theme, dashboard/report settings
- no reuse of submitted content without consent
- data retention settings
- training/user/admin/reviewer documentation
- production Docker and deployment docs

NON-HALLUCINATION RULES:
1. Do not invent completed work. Inspect files and commands.
2. Do not invent external API endpoints, credentials, provider pricing, Google OAuth details, LMS details, or legal wording.
3. If external integration details are missing, build a typed adapter interface or mock only, mark real integration as blocked, and continue with other non-blocked tasks.
4. Do not hard-code secrets. Use env vars and .env.example placeholders only.
5. Do not mark any task or phase verified unless checks were run or a clear reason is logged.
6. Do not skip phases unless all tasks in the current phase are verified.
7. Do not add future-phase features into the current phase unless already implemented and harmless; if accidental future work exists, document it.
8. Do not stop for future-phase human input. Stop only if the current task truly cannot proceed.

HUMAN INPUT DEFAULTS ALREADY APPROVED FOR NOW:
- Roles are approved:
  SUPER_ADMIN
  INSTITUTION_ADMIN
  REVIEWER
  USER
- Password reset is not required in MVP unless already in tracker as mandatory.
- Seed credentials should be read from .env; do not ask now unless seed task cannot proceed without env placeholders.
- Use mock scan provider for MVP.
- Do not ask for real API keys until real provider integration phase.
- Accepted file types: pdf, doc, docx, txt.
- Default monthly word limit: 1000000.
- Default max file size: 25 MB unless tracker/env says otherwise.
- Default max words per document: 50000 unless tracker/env says otherwise.
- Default retention: 365 days unless tracker/env says otherwise.
- No repository reuse without consent.
- Use a standard report disclaimer if no custom wording exists:
  "Similarity and AI scores are indicators only. Final academic or administrative action must be based on human review and institutional policy."

ROOT FILE / TRACKER MANAGEMENT:
1. First read AGENTS.md from repo root.
2. If IMPLEMENTATION_TRACKER.md exists, read it too.
3. If CODEX_AUTOPILOT_PROMPTS.md exists, read it for context only.
4. If AGENTS.md or tracker is incomplete, stale, or inconsistent with actual code, update the root file(s) before continuing.
5. Maintain a single source of truth:
   - If AGENTS.md contains the tracker, update AGENTS.md.
   - If IMPLEMENTATION_TRACKER.md exists, update it too.
6. Every task update must include:
   - status: PENDING / IN_PROGRESS / IMPLEMENTED / VERIFIED / BLOCKED
   - files changed
   - commands run
   - result summary
   - blockers
   - human input needed
   - verification evidence
7. Add a "Current Task" pointer after each verified task.
8. Add an "Evidence Log" entry after every verification.
9. Add a "Human Intervention Log" only when current-task input is truly needed.

AUTONOMOUS WORK LOOP:
Repeat this loop until all non-blocked MVP tasks through P8 are verified:

A. Inspect state
- Read AGENTS.md and tracker.
- Detect the first unverified task.
- Confirm with code inspection whether it is already implemented.
- If it is already implemented, verify it instead of rewriting it.
- If tracker says P1-T3 and code confirms P1-T2 verified, continue with P1-T3.

B. Implement one task
- Implement only the current task.
- Do not implement unrelated future work.
- Prefer small, typed, maintainable modules.
- Add/update tests for logic.
- Use service-layer database access.
- Keep tenant-aware tables and queries tenant-scoped.

C. Run checks after each task
Run all applicable commands:
- npm run lint
- npm run typecheck
- npm run test
- npm run build when relevant or after major feature changes
- docker compose config when Docker changed
- docker compose up -d when local infra must be tested
- drizzle migration generation/check commands when schema changed
- Playwright/smoke tests when UI or flows changed
If commands fail, fix the issue and rerun. Do not move on while current-task checks fail unless the failure is caused by a clearly external unavailable dependency; if so, log a blocker.

D. Verify current task
- Re-read the task acceptance criteria.
- Check all files touched by the task.
- Search for TODO/FIXME related to this task.
- Confirm no secrets are hard-coded.
- Confirm no role/tenant access leak.
- Confirm current task features work.
- Mark task VERIFIED only with evidence.

E. Phase verification
When all tasks in a phase are verified:
- Run phase-level checks.
- Confirm phase acceptance criteria.
- Confirm no future phase feature was accidentally required for completion.
- Log human inputs needed for later but do not stop unless next task is blocked.
- Mark phase VERIFIED and move to next phase.

F. Final MVP verification
After P8 is verified, run final end-to-end verification:
- lint
- typecheck
- tests
- build
- migrations check
- Docker config
- app health check if possible
- seed/login smoke if possible
- upload/extract/preprocess/scan/report smoke if possible
- reviewer/admin/support/audit smoke if possible
- tenant isolation tests
- PDF generation test
- final docs/readiness checklist

G. Continue to advanced phase only after MVP
- If user has not explicitly approved real provider/Google/LMS credentials, build only safe scaffolding or mark those tasks BLOCKED.
- Continue with non-blocked advanced tasks such as internal API foundation, PWA shell, client-side quick scan mock, better analytics, and repository consent workflow.

NEXT TASK QUEUE IF TRACKER IS MISSING OR BROKEN:
If tracker cannot be trusted, reconstruct the plan from this queue and AGENTS.md:

P1 remaining:
- P1-T3 login/logout/me API routes
- P1-T4 RBAC guards
- P1-T5 seed script
- P1-T6 protected dashboard shell

P2:
- P2-T1 submission/file schema
- P2-T2 MinIO/S3 storage service
- P2-T3 create/list/detail submissions API
- P2-T4 upload API for PDF/DOC/DOCX/TXT
- P2-T5 submission/upload UI

P3:
- P3-T1 extracted text/preprocessing/chunks schema
- P3-T2 text extraction service for TXT/DOCX/PDF, and DOC fallback if practical
- P3-T3 extraction API/worker step
- P3-T4 preprocessing engine for bibliography, quotes, small matches, whitespace, chunks
- P3-T5 preprocessing API and preview UI

P4:
- P4-T1 scan schema
- P4-T2 ScanProvider interface + mock provider
- P4-T3 PostgreSQL-backed scan job queue + worker
- P4-T4 start scan API + worker result persistence
- P4-T5 scan status UI

P5:
- P5-T1 review/report snapshot schema
- P5-T2 report assembly service
- P5-T3 report UI
- P5-T4 reviewer queue/workflow/status/timeline
- P5-T5 PDF report generation + MinIO storage

P6:
- P6-T1 admin analytics service/API
- P6-T2 admin dashboard UI
- P6-T3 tenant settings/customization
- P6-T4 user management UI
- P6-T5 support/helpdesk module

P7:
- P7-T1 security hardening: headers, rate limits, CSRF strategy, file validation, errors
- P7-T2 tenant isolation tests
- P7-T3 audit coverage and admin audit page
- P7-T4 data retention and repository consent controls
- P7-T5 UAT/admin/reviewer/user/security docs

P8:
- P8-T1 production Docker setup for web + worker
- P8-T2 deployment docs
- P8-T3 production readiness checklist

P9+ advanced, gated:
- real scan provider adapter only with docs/keys
- Google Docs import only with OAuth details
- external API/LMS integration foundation
- client-side quick scan marked preliminary, not official
- PWA/offline support if stable
- advanced analytics and institutional repository matching

SPECIAL INSTRUCTIONS FOR CURRENT TASK P1-T3:
If P1-T3 is indeed the current task, implement auth API routes:
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
Requirements:
- validate email/password input
- inactive users cannot log in
- wrong credentials return generic error
- successful login sets secure httpOnly session cookie
- logout clears/deletes session
- me returns current user without password_hash
- write audit events for login/logout, if audit service/table exists from P1-T1
- do not implement registration or password reset now
- run lint, typecheck, tests, build
- update tracker/root files

WHEN TO STOP AND ASK HUMAN:
Stop only for a true current-task blocker, for example:
- a required command cannot run because package manager/project structure is ambiguous and cannot be inferred safely
- a migration would destroy existing data and needs approval
- a secret/API key is required for the current task and no mock/local path exists
- real provider integration is current task and provider docs/keys are absent
- production deploy is current task and deployment target is required
Do not stop for future-phase items. Log future human input and continue.

FINAL OUTPUT FORMAT AFTER EACH AUTONOMOUS RUN:
Report progress in this exact structure:
1. Current phase and task range completed in this run
2. Tasks verified
3. Files changed
4. Commands run and pass/fail results
5. Features manually/automatically smoke-tested
6. Tracker/AGENTS updates made
7. Blockers, if any
8. Human input required now, if any
9. Next task to continue
10. If all MVP is complete: FINAL MVP STATUS = READY or NOT READY

START NOW:
- Read root files.
- Detect current task.
- Continue automatically from the first unverified task.
- Implement, test, verify, update tracker, and continue task-by-task until all non-blocked MVP tasks through P8 are verified or a true current-task blocker occurs.
```
