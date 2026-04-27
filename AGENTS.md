# AGENTS.md — Master Agent Prompt and Execution Rules

## Purpose

This file is the master instruction file for the coding agent implementing the Anti-Plagiarism and AI-Detection SaaS.

The agent must use this file together with `IMPLEMENTATION_TRACKER.md`. The tracker is the source of truth for what is implemented, verified, blocked, or remaining. The agent must never assume that a phase or task is complete unless the tracker contains implementation evidence and verification evidence.

---

## Product Source Scope

The implementation must satisfy the uploaded procurement and technical scope:

- Cloud/web-browser SaaS anti-plagiarism software.
- HTTPS-secured access.
- Plagiarism/similarity detection from web, academic sources, and optional institutional repository.
- AI-generated content indicator/probability.
- Grammar and spell checking.
- PDF, DOC/DOCX, and TXT support.
- Exclusion filters for bibliography, quotes, and configurable small matches.
- Minimum 300 submissions and approximately 10,00,000 words/month processing capacity.
- Role-based access for Super Admin, Admin, Reviewer, and User/Student/Faculty.
- Admin dashboard, user management, reporting, downloadable/printable PDF reports, history/archive, analytics, audit logs, secure storage, data confidentiality, and no reuse without consent.
- Training, documentation, helpdesk/support, updates, SLA-based issue handling, and UI customization.

The product blueprint additionally recommends smart orchestration, preprocessing before paid provider calls, provider adapters, multi-tenant PostgreSQL design, storage isolation, review workflow state machine, auditability, and phased delivery.

---

## Fixed Tech Stack

Use this stack unless a human explicitly changes it in the tracker.

| Layer | Required Choice |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | TailwindCSS |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Object storage | MinIO for local development, S3-compatible storage for production |
| Local infra | Docker Compose |
| Validation | Zod |
| Testing | Vitest for unit/service tests, Playwright later for E2E |
| Auth | Custom session auth with httpOnly cookies, Argon2id password hashing, RBAC |
| Jobs | PostgreSQL-backed jobs for MVP; Redis/BullMQ only if explicitly approved later |
| Deployment | Containerized web + worker services |

---

## Master Prompt for Codex / Coding Agent

Paste this at the beginning of every coding session:

```txt
You are the implementation agent for an Anti-Plagiarism and AI-Detection SaaS.

Your primary instruction files are:
1. AGENTS.md
2. IMPLEMENTATION_TRACKER.md

STRICT EXECUTION RULES:
1. Read AGENTS.md and IMPLEMENTATION_TRACKER.md before making changes.
2. Identify the first task whose status is not VERIFIED and whose dependencies are satisfied.
3. Implement only that task. Do not build future-phase features.
4. Use Next.js App Router, TypeScript, TailwindCSS, Drizzle ORM, PostgreSQL, MinIO, and Docker Compose.
5. Keep TypeScript strict. Avoid `any`; if unavoidable, explain why in the tracker.
6. Keep code modular under `src/features/*`, `src/lib/*`, and `src/server/*`.
7. All business tables must be tenant-aware unless explicitly global by design.
8. All DB access must go through typed service/helper functions.
9. Never hard-code secrets. Use environment variables validated by Zod.
10. Never mark a task complete without evidence.
11. After implementation, run the task verification prompt from IMPLEMENTATION_TRACKER.md.
12. If verification fails, fix the task before moving forward.
13. If human input is required, mark the task or phase BLOCKED and clearly list the human action needed.
14. Update IMPLEMENTATION_TRACKER.md after every task, including changed files, commands run, test results, remaining work, and verification status.
15. Do not claim completion unless the project compiles or the tracker clearly records what failed.
```

---

## Non-Hallucination Rules

The agent must not hallucinate implementation status.

A task may be marked `IMPLEMENTED` only if:

1. Code or documentation was actually created or modified.
2. The changed files are listed in the tracker.
3. Commands run are listed in the tracker.
4. Any migration file names are listed.
5. Known failures or skipped checks are listed.

A task may be marked `VERIFIED` only if:

1. The task verification prompt was run.
2. Evidence confirms all acceptance criteria are satisfied.
3. Required commands pass, or failures are documented and accepted by a human.
4. No future-phase feature was accidentally added.

A phase may be marked `PHASE VERIFIED` only if:

1. Every task in that phase is `VERIFIED`.
2. The phase verification prompt was run.
3. Human-intervention requirements are resolved or explicitly waived.
4. The tracker records the phase verification date and evidence.

---

## Status Values

Use these exact values in the tracker.

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

## Required Implementation Evidence Format

After each task, update the tracker with this format:

```md
### Evidence for TASK_ID

Status: IMPLEMENTED | VERIFIED | NEEDS_FIX | BLOCKED_HUMAN

Changed files:
- path/to/file
- path/to/file

Database migrations:
- drizzle/xxxx_migration_name.sql

Commands run:
- npm run lint — PASS/FAIL
- npm run typecheck — PASS/FAIL
- npm run test — PASS/FAIL
- npm run build — PASS/FAIL, if applicable

Manual verification:
- What was checked manually.

Remaining issues:
- None, or exact remaining issue.

Human intervention required:
- None, or exact decision/secret/account/sample/data needed.
```

---

## Required Task Flow

For every task:

1. Read this file.
2. Read `IMPLEMENTATION_TRACKER.md`.
3. Confirm dependencies are satisfied.
4. Copy the task prompt from the tracker.
5. Implement only that task.
6. Run local checks.
7. Copy and run the task verification prompt.
8. Fix any issues.
9. Update tracker evidence.
10. Proceed only to the next task after current task is `VERIFIED` or explicitly `SKIPPED_APPROVED`.

---

## Generic Task Verification Prompt

Use after every task unless a more specific prompt exists in the tracker.

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Verify TASK_ID only.

Check:
1. Did the implementation satisfy every acceptance criterion for TASK_ID?
2. Did the implementation avoid future-phase scope creep?
3. Are all changed files listed in the tracker?
4. Are database migrations listed, if any?
5. Are commands run and results listed?
6. Do lint, typecheck, tests, and build pass where applicable?
7. Are tenant isolation, RBAC, validation, and audit requirements handled if relevant to this task?
8. Is any human intervention still required?

If complete, update TASK_ID status to VERIFIED and add verification evidence.
If incomplete, update TASK_ID status to NEEDS_FIX and list exact missing work.
If blocked by missing human input, update TASK_ID status to BLOCKED_HUMAN and list exact input needed.
Do not move to the next task unless TASK_ID is VERIFIED or SKIPPED_APPROVED.
```

---

## Generic Phase Verification Prompt

Use after the last task of every phase.

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Verify PHASE_ID as a complete phase.

Check:
1. Are all tasks in this phase marked VERIFIED or SKIPPED_APPROVED?
2. Is implementation evidence present for every completed task?
3. Is verification evidence present for every completed task?
4. Are phase-level acceptance criteria satisfied?
5. Are there hidden gaps, duplicated work, broken dependencies, or accidental future-phase features?
6. Do npm run lint, npm run typecheck, npm run test, and npm run build pass where applicable?
7. Are human-intervention items for this phase resolved or explicitly waived?
8. Is the next phase safe to begin?

If the phase is complete, mark PHASE_ID as PHASE VERIFIED in the tracker.
If not complete, list exact remaining items and keep the next phase locked.
```

---

## Entire Implementation Verification Prompt

Use only after Phase 8 is complete. Phase 9 is optional and must not block MVP sign-off unless explicitly required by a human.

```txt
Read AGENTS.md and IMPLEMENTATION_TRACKER.md.

Perform a full end-to-end MVP implementation verification.

Verify that the implementation satisfies the required procurement and technical scope:
1. Cloud/web-browser SaaS application.
2. Secure login and role-based access.
3. Super Admin, Institution Admin, Reviewer, and User flows.
4. Tenant isolation across DB queries, UI, API, analytics, files, reports, audit logs, and support tickets.
5. PDF, DOC/DOCX, TXT upload support.
6. Secure MinIO/S3-compatible file storage.
7. Text extraction.
8. Preprocessing with bibliography, quote, and configurable small-match exclusions.
9. Scan provider adapter with mock provider working.
10. PostgreSQL-backed scan job queue and worker.
11. Similarity score, AI probability, source matches, AI assessments, and grammar findings stored.
12. Report UI separates similarity and AI evidence.
13. PDF report generation works.
14. Reviewer workflow works with notes/status/timeline.
15. Admin dashboard, analytics, user management, customization, support tickets, audit logs.
16. Data retention and repository consent controls exist.
17. Production Docker setup and deployment documentation exist.
18. Required docs exist: local development, deployment, UAT, admin guide, reviewer guide, user guide, security notes, production readiness.
19. npm run lint passes.
20. npm run typecheck passes.
21. npm run test passes.
22. npm run build passes.
23. Any production blockers are listed clearly.

If complete, mark MVP_IMPLEMENTATION_STATUS = VERIFIED.
If incomplete, list all remaining work by phase and task ID.
Do not invent evidence. Use only code, command output, docs, and tracker entries.
```

---

## Human Intervention Policy

The coding agent must stop and mark `BLOCKED_HUMAN` when any of the following are required:

- Production API keys or provider contracts.
- OAuth credentials.
- Production database/storage credentials.
- Domain, SSL, or deployment target decisions.
- Legal/privacy approval.
- Institutional policy thresholds.
- Report disclaimer approval.
- Tenant logo/color/branding approval.
- SLA/support workflow approval.
- Test documents or golden corpus from the human.
- Any decision that affects compliance, procurement, cost, or external vendor obligations.

The agent may continue with mock providers and placeholders only when the phase plan allows it and the tracker states that real external integration is deferred.

---

## Phase Human-Intervention Checklist

| Phase | Human input likely needed before phase can be closed |
|---|---|
| Phase 0 | Confirm repo name, local environment, `.env` values, Docker availability. |
| Phase 1 | Seed admin email/password, role policy confirmation. |
| Phase 2 | File size limit, word limit, accepted MIME list, sample test files. |
| Phase 3 | Preprocessing rules, small-match threshold, sample documents/golden corpus. |
| Phase 4 | External provider decision/API keys if not using mock provider; scan SLA expectations. |
| Phase 5 | Report template, disclaimer wording, reviewer workflow policy. |
| Phase 6 | Tenant branding, usage limits, SLA/support categories, admin permissions. |
| Phase 7 | Privacy/legal approval, retention period, consent policy, security review. |
| Phase 8 | Hosting provider, domain, SSL, production secrets, backup destination. |
| Phase 9 | Google OAuth credentials, LMS/API credentials, paid provider credentials. |

---

## Locked Execution Order

The agent must execute tasks in this order unless a human updates the tracker.

```txt
P0-T1 → P0-T2 → P0-T3 → P0-T4
P1-T1 → P1-T2 → P1-T3 → P1-T4 → P1-T5 → P1-T6
P2-T1 → P2-T2 → P2-T3 → P2-T4 → P2-T5
P3-T1 → P3-T2 → P3-T3 → P3-T4 → P3-T5
P4-T1 → P4-T2 → P4-T3 → P4-T4 → P4-T5
P5-T1 → P5-T2 → P5-T3 → P5-T4 → P5-T5
P6-T1 → P6-T2 → P6-T3 → P6-T4 → P6-T5
P7-T1 → P7-T2 → P7-T3 → P7-T4 → P7-T5
P8-T1 → P8-T2 → P8-T3
P9 only after MVP sign-off
```

---

## Scope Lock

Phase 0–8 are the MVP implementation scope.

Phase 9 features are optional advanced features and must not be implemented early:

- Real paid scan provider integration.
- Google Docs import.
- LMS/LTI integration.
- Client-side quick scan.
- PWA offline queue.
- Fact-checking.
- Institutional repository matching.
- Advanced analytics.

The agent may create adapter interfaces earlier, but must not call real external APIs until the relevant phase and credentials are approved.
