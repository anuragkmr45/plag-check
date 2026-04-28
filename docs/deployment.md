# Deployment Guide

This guide describes an MVP production-style deployment using the P8 Docker image and separate web and worker services. It does not choose a hosting provider or include production secrets.

## Required Environment Variables

Set these values in the hosting platform secret manager or an uncommitted production env file:

| Variable | Purpose |
|---|---|
| `APP_URL` | Public HTTPS origin, for example `https://plagcheck.example.edu`. |
| `DATABASE_URL` | Managed PostgreSQL connection URL. |
| `SESSION_SECRET` | Random session signing secret with at least 32 characters. |
| `MINIO_ENDPOINT` | S3-compatible object storage endpoint. |
| `MINIO_REGION` | Storage region. |
| `MINIO_BUCKET` | Storage bucket for uploaded documents and reports. |
| `MINIO_ACCESS_KEY` | Storage access key from the provider secret manager. |
| `MINIO_SECRET_KEY` | Storage secret key from the provider secret manager. |
| `WEB_PORT` | Optional host port when using Docker Compose directly. |

Do not commit a populated production env file. Keep `.env.example` as the placeholder reference only.

## Managed PostgreSQL

1. Create a managed PostgreSQL database.
2. Create an application database user with privileges limited to the application database.
3. Enable SSL/TLS in the provider connection settings when the provider supports it.
4. Store the final connection string in `DATABASE_URL`.
5. Confirm the database is reachable from both the web and worker runtime networks.

The schema is managed by Drizzle migrations in `drizzle/`.

## S3-Compatible Object Storage

1. Create a private bucket for uploaded documents and generated reports.
2. Create an access key scoped to that bucket.
3. Set `MINIO_ENDPOINT`, `MINIO_REGION`, `MINIO_BUCKET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY`.
4. Keep public bucket access disabled.
5. Confirm the web service can write uploaded files and generated PDF reports.

Local development uses MinIO. Production can use any compatible S3 service if the endpoint and credentials are supplied through environment variables.

## Build The Image

Build the production image:

```sh
docker build -t plagcheck-app:latest .
```

The same image runs the web service and the worker service.

## Run Migrations

Run migrations before starting or promoting a new release:

```sh
docker compose -f docker-compose.prod.example.yml run --rm web npm run db:migrate
```

For managed platforms that do not use Docker Compose, run the same command inside the application image with the production environment variables present:

```sh
npm run db:migrate
```

## Web Service Command

The web service command is:

```sh
npm run start
```

The service listens on `PORT`, defaulting to `3000` in the production compose example. Put it behind HTTPS at the public `APP_URL`.

## Worker Service Command

The worker service command is:

```sh
npm run worker
```

Run at least one worker process for scan jobs. Scale worker replicas based on queue volume and database capacity.

## Docker Compose Example

Use `docker-compose.prod.example.yml` as a template:

```sh
docker compose -f docker-compose.prod.example.yml config --no-interpolate
docker compose -f docker-compose.prod.example.yml up -d --build
```

The example defines separate `web` and `worker` services using the same image. Replace environment variable values through the host environment, a deployment secret manager, or an uncommitted production env file.

## Health Check URL

After deployment, check:

```txt
https://your-domain.example/api/health
```

The health route reports application, database, and storage configuration status. Treat a failed database or storage status as a deployment blocker.

## Backup Strategy

Back up both persistent systems:

- PostgreSQL: enable automated daily backups and point-in-time recovery when the provider supports it.
- Object storage: enable versioning or scheduled bucket backup where available.

Before production sign-off, record:

- Backup frequency.
- Retention period.
- Backup owner.
- Restore procedure.
- Last restore test date.

## Rollback Strategy

For application rollback:

1. Keep the previous image tag available.
2. Stop new deployment rollout.
3. Redeploy the previous image tag for both web and worker.
4. Confirm `/api/health`.
5. Confirm login, submission listing, and worker startup.

For database rollback, prefer forward fixes. Reverting migrations can risk data loss and requires human approval with a verified backup.

## Secret Rotation

Rotate secrets through the deployment platform:

1. Create the replacement secret.
2. Update the web and worker environment.
3. Restart web and worker services.
4. Confirm `/api/health`.
5. Revoke the old secret after verification.

For `SESSION_SECRET`, expect existing sessions to become invalid if the value changes.

## Common Troubleshooting

### Web service does not start

- Confirm all required environment variables are present.
- Confirm `npm run db:migrate` has been run.
- Check application logs for environment validation errors.

### Health check fails database status

- Confirm `DATABASE_URL` is correct.
- Confirm network access from the web container to PostgreSQL.
- Confirm the database user has access to the application database.

### Health check fails storage status

- Confirm storage endpoint, region, bucket, and credentials.
- Confirm the bucket exists and is private.
- Confirm network access from the web container to object storage.

### Worker does not process scans

- Confirm the worker service is running `npm run worker`.
- Confirm the worker uses the same `DATABASE_URL` as the web service.
- Confirm scan jobs exist and are not already completed or permanently failed.

### PDF generation fails

- Confirm object storage settings are valid.
- Confirm the report flow can read the submission, scan result, and report data for the same tenant.

## Production Gates

Do not deploy to production until these human-owned decisions are resolved:

- Hosting provider and region.
- Domain and SSL/HTTPS setup.
- Production PostgreSQL credentials.
- Production S3-compatible storage credentials.
- Backup destination and restore test plan.
- Privacy, retention, and consent approvals.
- Real scan provider contract and API keys if replacing the mock provider.
