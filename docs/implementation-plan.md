# Implementation Plan

This plan follows the locked phase order in `IMPLEMENTATION_TRACKER.md`.

## P0 Foundation

Bootstrap the Next.js App Router project, local infrastructure configuration,
environment validation, Drizzle baseline, and health route.

## P1 Auth, RBAC, and Tenancy

Add tenant-aware auth data structures, secure custom sessions, login APIs, RBAC
guards, seed data, and protected shell pages.

## P2 Submissions and Storage

Add submission/file records, S3-compatible object storage helpers, submission
creation, upload APIs, and upload UI.

## P3 Extraction and Preprocessing

Add extracted text records, document extraction, preprocessing rules, worker
steps, APIs, and preview UI.

## P4 Scan Orchestration

Add scan schemas, provider adapter interfaces, mock provider behavior,
PostgreSQL-backed jobs, scan APIs, and status UI.

## P5 Review and Reports

Add review workflow data, report service/UI, reviewer queue/status handling, and
PDF report generation.

## P6 Admin, Support, and Customization

Add analytics, admin dashboard, tenant settings, user management, customization,
and support tickets.

## P7 Security, QA, and Compliance

Add hardening, tenant isolation tests, audit coverage, data retention, consent
controls, UAT notes, and documentation.

## P8 Deployment Readiness

Add production container setup, deployment documentation, and production
readiness checks.

## P9 Advanced Optional

Optional post-MVP features remain locked until explicit MVP sign-off.
