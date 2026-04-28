# Production Readiness Checklist

Use this checklist before approving production use. Every item needs an owner, date, evidence link, and pass/fail result.

## Application Controls

- [ ] Auth: login, logout, inactive-user rejection, and session cookie behavior verified in the target environment.
- [ ] RBAC: `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `REVIEWER`, and `USER` route access verified.
- [ ] Tenant isolation: tenant A cannot read, mutate, review, report, audit, analyze, or manage tenant B data.
- [ ] Audit logs: critical authentication, user, submission, scan, report, review, settings, and support events are visible in `/admin/audit`.
- [ ] Rate limits: login and upload rate limits are confirmed under production topology.
- [ ] Support tickets: user create/comment and admin status workflow verified.

## Data And Storage

- [ ] File storage: production S3-compatible bucket exists, is private, and is reachable by web and worker services.
- [ ] Uploaded files: PDF, DOC, DOCX, and TXT upload validation verified.
- [ ] PDF generation: report PDF export creates immutable report snapshots and writes to object storage.
- [ ] Backups: PostgreSQL and object storage backup schedules are enabled and documented.
- [ ] Restore test: PostgreSQL restore and object storage restore have been tested with recorded evidence.
- [ ] Retention: original-file and report retention periods are approved and operational deletion procedures are documented.

## Worker And Processing

- [ ] Scan worker: at least one worker service is running `npm run worker`.
- [ ] Scan queue: queued, running, completed, failed, and retry states are verified.
- [ ] Mock provider: MVP mock scan provider usage is explicitly accepted, or real provider credentials and contract are approved in a later phase.
- [ ] Preprocessing: bibliography, quote, small-match, and whitespace processing are verified with institution samples.

## Deployment

- [ ] Docker image: `docker build -t plagcheck-app:latest .` passes.
- [ ] Web service: production web service runs `npm run start`.
- [ ] Worker service: production worker service runs `npm run worker`.
- [ ] Migrations: `npm run db:migrate` runs successfully against the production database before release.
- [ ] Health check: `/api/health` is reachable over the production HTTPS URL.
- [ ] SSL/HTTPS: production domain has valid TLS and redirects plain HTTP where the hosting layer supports it.
- [ ] Rollback: previous image tag and rollback procedure are documented.

## Monitoring Hooks

- [ ] Web service logs are collected.
- [ ] Worker service logs are collected.
- [ ] Health check alerts are configured.
- [ ] Database capacity and connection alerts are configured.
- [ ] Object storage error alerts are configured.
- [ ] Support/escalation contact and response expectations are documented.

## Sign-Off

- [ ] UAT sign-off: `docs/uat-checklist.md` completed with evidence.
- [ ] Legal/privacy review: privacy policy, data processing basis, consent wording, and retention periods approved.
- [ ] Security review: security notes reviewed and penetration test decision recorded.
- [ ] Provider API keys: real scan provider keys are either approved and stored in a secret manager, or mock provider use is explicitly accepted for MVP.
- [ ] Training/docs: admin, reviewer, user, deployment, and security docs reviewed by pilot administrators.

## Production Blockers

These items are not solved by code and must be completed before production launch:

- Hosting provider and production region decision.
- Production domain and SSL/HTTPS setup.
- Production PostgreSQL URL and credentials.
- Production S3-compatible storage endpoint, bucket, access key, and secret key.
- Backup destination and restore-test evidence.
- Legal/privacy approval for retention and repository consent wording.
- UAT sign-off from the institution.
- Security review or external penetration test decision.
- Real provider API keys and contract if the deployment must use a real scan provider instead of the MVP mock provider.
