# Auth module (implemented last)

## Responsibilities
- JWT access + refresh authentication.
- Refresh token rotation with DB-stored hashed refresh tokens.
- Email verification for new users.
- Account lockout protection against brute force attacks.
- Login attempt tracking and security monitoring.

## Security Features

### Rate Limiting
- **Login/Register**: 5 attempts per 15 minutes (per IP + email)
- **Token Refresh**: 20 attempts per 15 minutes
- **Email Verification**: 5 emails per hour
- **Password Reset**: 3 attempts per hour (when implemented)

### Account Lockout
- Locks account after 5 failed login attempts within 15 minutes
- Lock duration: 15 minutes
- Automatic unlock after duration expires
- All login attempts are logged with IP and user agent

### Email Verification
- Verification token generated on registration (24-hour expiry)
- Users can resend verification email
- Email verification status tracked in user profile

## Public endpoints
- `POST /auth/register` - Create new account (returns verification token)
- `POST /auth/login` - Authenticate user (checks account lock status)
- `POST /auth/refresh-token` - Rotate refresh token
- `POST /auth/logout` - Revoke session
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/update-fcm-token` - Update FCM token for push notifications

## Implementation Notes

### Account Enumeration Protection
- Login errors use generic "Invalid credentials" message
- Failed attempts logged for non-existent users (don't reveal existence)
- Registration returns "User already exists" instead of "Email already in use"

### Security Headers
- Helmet.js enabled for XSS, clickjacking protection
- CORS configured with credentials support
- HPP (HTTP Parameter Pollution) protection
- Request body size limited to 1MB

### Token Security
- Refresh tokens hashed with SHA-256 before storage
- Access tokens: 15-minute expiry
- Refresh tokens: 30-day expiry with rotation
- Token reuse detection triggers full session revocation

## TODO
- Implement email service for sending verification emails
- Add password reset flow
- Add 2FA/MFA support
- Implement password complexity validation
- Add session management UI (view/revoke active sessions)

