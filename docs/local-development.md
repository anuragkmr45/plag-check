# Local Development

This guide covers the local services required for the foundation phase.

## Prerequisites

- Node.js and npm installed.
- Docker Desktop or a compatible Docker Engine with Compose support.
- Local ports `5432`, `9000`, and `9001` available. If `5432` is already in
  use, set `POSTGRES_PORT` in `.env` to another host port, such as `55432`.

## Environment

Create a local environment file from the example:

```sh
cp .env.example .env
```

Replace the placeholder passwords and `SESSION_SECRET` in `.env` before running
the app locally. Do not commit `.env`.

## Start Docker Services

Start PostgreSQL, MinIO, and the MinIO bucket initializer:

```sh
docker compose up -d
```

Check the resolved Compose configuration:

```sh
docker compose config
```

## Run Migrations

Database schema is introduced in later Phase 0 tasks. Once migrations exist,
run them with:

```sh
npm run db:migrate
```

## Access MinIO

Open the MinIO console at:

```txt
http://localhost:9001
```

Use the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` values from your local
`.env` file. The bucket initializer creates the bucket named by `MINIO_BUCKET`.

## Start the App

Install dependencies if needed:

```sh
npm install
```

Start the Next.js development server:

```sh
npm run dev
```

Open the app at:

```txt
http://localhost:3000
```
