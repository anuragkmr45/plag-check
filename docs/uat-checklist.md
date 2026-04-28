# UAT Checklist

Use this checklist to validate the MVP in a local or staging environment. Record the tenant, user account, document name, browser, date, result, and evidence for every item.

## Environment

- Confirm Docker services are running for PostgreSQL and MinIO.
- Confirm migrations have been applied.
- Confirm the application is running with non-production test credentials.
- Confirm seeded or manually created accounts exist for `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER`.

## Login

- Sign in with a valid active user.
- Confirm wrong credentials return a generic error.
- Confirm an inactive user cannot sign in.
- Sign out and confirm the session no longer opens protected pages.

## Role Access

- Confirm `USER` can access dashboard, submissions, and support.
- Confirm `REVIEWER` can access reviewer queue/cases and support.
- Confirm `INSTITUTION_ADMIN` can access dashboard, submissions, admin users, settings, audit logs, and support.
- Confirm `SUPER_ADMIN` can access global admin views where implemented.
- Confirm users cannot access routes outside their role.

## User Creation

- As an institution admin, create a tenant user.
- Confirm institution admins cannot create a `SUPER_ADMIN`.
- Update the created user's role within allowed tenant roles.
- Deactivate and reactivate the user.
- Reset the temporary password and confirm the new password works.

## Upload

- Create a new submission.
- Upload one accepted file type from PDF, DOC, DOCX, or TXT.
- Confirm unsupported file types are rejected.
- Confirm file size and tenant usage limits are enforced from tenant settings.
- Confirm the uploaded file is stored under a tenant-scoped object key.

## Extraction

- Run extraction for an uploaded submission.
- Confirm extracted text, word count, and extraction metadata are stored.
- Confirm extraction is not allowed for a submission in the wrong state.

## Preprocessing

- Run preprocessing after extraction.
- Confirm bibliography, quote, small-match, and whitespace processing results are shown.
- Confirm the configured small-match threshold is used.
- Confirm preprocessing is not allowed before extraction is complete.

## Scan

- Start a scan after preprocessing is complete.
- Confirm the scan is queued and processed by the local worker.
- Confirm the MVP uses the mock scan provider unless a later provider phase is approved.
- Confirm scan results include similarity score, AI probability, source matches, AI assessments, and grammar findings.
- Confirm duplicate active scans are prevented.

## Report

- Open the report page after scan completion.
- Confirm similarity evidence and AI evidence are displayed separately.
- Confirm source matches include highlighted matched text.
- Confirm grammar findings are shown when available.
- Confirm the standard report disclaimer appears.

## PDF Download

- Download or generate the PDF report.
- Confirm a PDF file is returned.
- Confirm a report snapshot row is created.
- Confirm the PDF object is stored under a tenant-scoped report key in MinIO/S3-compatible storage.

## Reviewer Workflow

- As a reviewer, open the reviewer queue.
- Assign or open an eligible review case.
- Add a review note.
- Move the case through allowed statuses.
- Confirm invalid transitions are rejected.
- Confirm review events and audit events are written.

## Analytics

- As an institution admin, open the dashboard.
- Confirm counts and usage meters reflect the tenant only.
- As a super admin, confirm the global view includes all tenants where implemented.
- Confirm usage limits match tenant settings.

## Audit Logs

- Open `/admin/audit` as an institution admin.
- Confirm only the current tenant's audit events are visible.
- Filter by action, entity, actor, and date where applicable.
- Confirm super admin global audit visibility where implemented.

## Tenant Isolation

- Create or use two tenants with separate users and submissions.
- Confirm tenant A users cannot list, open, scan, review, report, or manage tenant B data.
- Confirm tenant-scoped storage keys include the correct tenant and submission IDs.
- Confirm support tickets, analytics, audit logs, and user management remain tenant-scoped.

## Consent And Retention

- Confirm tenant settings expose original-file retention days, report retention days, repository reuse, and required repository consent metadata.
- Confirm new submissions are not repository-reusable without recorded submission-level consent.
- Confirm repository matching itself is not present in the MVP.

## Sign-Off Notes

- Record any failed item with exact reproduction steps.
- Do not approve production use until privacy, retention, consent wording, hosting, SSL, backup, and production secret decisions are approved.
