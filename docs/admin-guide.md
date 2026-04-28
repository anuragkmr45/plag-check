# Admin Guide

This guide covers the MVP administration flows for institution admins and super admins.

## Roles

- `SUPER_ADMIN`: global administrative role for cross-tenant oversight where implemented.
- `INSTITUTION_ADMIN`: tenant administrator for dashboard, users, settings, audit logs, submissions, and support.
- `REVIEWER`: tenant reviewer for review queue and review cases.
- `USER`: tenant user for submissions and support.

## Dashboard

Open `/dashboard` after signing in.

Institution admins see tenant-scoped analytics. Super admins see global analytics where implemented. Dashboard metrics include submission counts, processed word usage, completed scans, risk counts, role counts, and tenant usage meters.

## User Management

Open `/admin/users`.

Institution admins can:

- Create tenant users for allowed non-super-admin roles.
- Update user roles within allowed tenant roles.
- Activate and deactivate users.
- Set a new temporary password.

Super admins can create and manage tenant admin accounts by selecting a tenant where the UI provides that control.

The MVP does not provide email invitations or self-service password reset.

## Tenant Settings

Open `/admin/settings`.

Editable settings include:

- Logo URL and logo storage key.
- Primary color.
- Report footer.
- Maximum file size.
- Monthly word limit.
- Submission limit.
- Small-match threshold.
- Original-file retention days.
- Report retention days.
- Repository reuse toggle.
- Required user consent for repository reuse.

Settings are tenant-scoped. Repository reuse settings only store metadata in the MVP. Repository matching is not implemented.

## Audit Logs

Open `/admin/audit`.

Institution admins can review audit events for their own tenant. Filters are available for action, entity type, actor user ID, and date range. Super admins can review broader audit data where implemented.

Critical actions such as login/logout, user changes, submission lifecycle events, report PDF generation, review events, tenant settings updates, and support status changes are recorded.

## Support Tickets

Open `/support`.

Tenant users can create support tickets and add comments. Institution admins can view tenant tickets and update ticket status. Super admins can view tickets globally where implemented.

## Operating Notes

- Use tenant-scoped test accounts when validating admin behavior.
- Do not place production secrets in source files or documentation.
- Production rollout still requires approval for privacy policy, retention periods, consent wording, hosting, SSL, backups, and production secrets.
