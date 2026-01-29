# Central Unit module

## Responsibilities
- Outbound HTTP integration to Central Unit (timeouts, retries, idempotency key).
- Inbound webhook receiver authenticated via **mTLS** (or proxy-verified header).

## Public endpoints
- `POST /central-unit/send-accident-to-central-unit`
- `POST /central-unit/receive-accident-from-central-unit` (typo is required)

## Inbound auth
Implemented in `centralUnit.inboundAuth.js`:
- `CENTRAL_UNIT_INBOUND_AUTH_MODE=mtls`: requires `req.client.authorized === true` and optional CN allowlist.
- `CENTRAL_UNIT_INBOUND_AUTH_MODE=proxy`: requires a verified header (default `x-client-cert-verified: true`).

