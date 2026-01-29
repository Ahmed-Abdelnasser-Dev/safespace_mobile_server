# Auth module (implemented last)

## Responsibilities
- JWT access + refresh authentication.
- Refresh token rotation with DB-stored hashed refresh tokens.

## Public endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`

