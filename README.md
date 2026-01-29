# SafeSpace Mobile Server

Express (JavaScript) + PostgreSQL (Prisma) backend for:
- Accidents & Emergency reporting
- Central Unit integration over HTTP + inbound webhook protected by **mTLS**
- (Implemented last) JWT auth (access/refresh) + push notifications

## Requirements
- Node.js (current project is ESM, `"type": "module"`)
- Postgres (or Docker)

## Quick start (local)

1) Create `.env` from `.env.example` and set `DATABASE_URL`.

2) Install deps:

```bash
npm install
```

3) Start:

```bash
npm run dev
```

Server health check: `GET /health`

## Docker

```bash
docker compose up --build
```

This starts:
- `db`: Postgres 16
- `api`: Node server

## Endpoints (must match exactly)

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh-token`
  - `POST /auth/logout`
- Accidents & emergency:
  - `POST /accident/report-accident`
  - `POST /accident/emergency-request`
- Central Unit:
  - `POST /central-unit/send-accident-to-central-unit`
  - `POST /central-unit/receive-accident-from-central-unit`
- Notifications:
  - `POST /notifications/send-accident-notification`

## Central Unit inbound mTLS

This project supports two deployment modes for the inbound webhook:
- **Direct Node TLS (dev/local)**: configure `TLS_CERT_PATH`, `TLS_KEY_PATH`, and `CENTRAL_UNIT_MTLS_CA_CERT_PATH`, set `CENTRAL_UNIT_INBOUND_AUTH_MODE=mtls`.
- **Proxy terminated mTLS (prod typical)**: configure your reverse proxy/ingress to enforce mTLS and forward a verified header, set `CENTRAL_UNIT_INBOUND_AUTH_MODE=proxy`.

## Prisma note (offline environments)

Prisma CLI sometimes needs to download engine binaries from `binaries.prisma.sh`. If that is blocked, you may see timeouts during `prisma generate` / migrations.

Helpful env vars (Prisma docs):
- `PRISMA_ENGINES_MIRROR` (use your own mirror)
- `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` (ignore checksum download issues)

An initial SQL migration is committed at `prisma/migrations/0001_init/migration.sql`.

## Postman

Collection file: `postman/safespace-mobile-server.postman_collection.json`  
Variables: `baseUrl`, `accessToken`, `refreshToken`

## Tests

```bash
npm test
```

