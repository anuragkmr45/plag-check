# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

ARG NPM_VERSION=11.6.2

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install -g "npm@$NPM_VERSION" \
  && npm ci

FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN set -eu; \
  printf '%s\n' \
    'DATABASE_URL=postgresql://placeholder:placeholder@postgres:5432/plagcheck' \
    'APP_URL=http://localhost:3000' \
    'SESSION_SECRET=build-time-placeholder-session-secret-32-chars' \
    'MINIO_ENDPOINT=http://minio:9000' \
    'MINIO_REGION=us-east-1' \
    'MINIO_BUCKET=plagcheck-documents' \
    'MINIO_ACCESS_KEY=placeholder-access-key' \
    'MINIO_SECRET_KEY=placeholder-secret-key' \
    > .env.production.local; \
  npm run build; \
  rm .env.production.local

FROM base AS runner

ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
