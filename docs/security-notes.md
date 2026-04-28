# Security Notes

These notes summarize MVP security controls and production gates.

## Authentication

- The app uses custom session authentication.
- Passwords are hashed with Argon2id.
- Session cookies are httpOnly and sameSite lax.
- Raw session tokens are not stored in the database.
- Inactive users cannot log in.

## Authorization

- Role-based access uses `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER`.
- Protected dashboard routes require an authenticated session.
- Business data access is tenant-scoped unless explicitly global for super-admin behavior.
- Service-layer queries enforce tenant constraints for submissions, reports, review cases, analytics, audit logs, users, support tickets, and settings.

## Web Security

- Security headers are configured globally.
- State-changing API routes use same-origin CSRF checks.
- Login and upload routes are rate limited.
- API responses use safe error helpers to avoid leaking internals.

## File Security

- Uploads are limited to the accepted PDF, DOC, DOCX, and TXT types.
- Upload validation checks MIME type, extension, filename, size, and file signatures where supported.
- Object keys include tenant and submission identifiers.
- Local development uses MinIO; production must use S3-compatible storage with production credentials from environment variables.

## Audit

Audit events are written for critical actions, including authentication, user administration, submission lifecycle events, scan completion, PDF generation, review events, tenant settings updates, and support status changes.

Institution admins view tenant-scoped audit logs. Super-admin global audit viewing is supported where implemented.

## Consent And Retention

- Tenant settings include original-file retention days and report retention days.
- Tenant settings include repository reuse and required user consent metadata.
- Submission records include nullable repository reuse consent timestamp and consenting user ID.
- The repository reuse guard does not allow repository reuse unless consent metadata is present.
- Repository matching is not implemented in the MVP.

## Production Gates

Before production use, the following must be approved and configured:

- Privacy policy and consent wording.
- Retention periods and deletion operations.
- Hosting provider, domain, SSL, production database, and production object storage.
- Backup and restore process.
- Production secrets through environment variables.
- Security review or external penetration test decision.
- Real scan provider contracts and API keys if replacing the mock provider.
