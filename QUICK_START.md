# SafeSpace Companion - Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Docker & Docker Compose (optional, for database)
- Firebase Project with Admin SDK credentials

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Using Docker Compose (Recommended)

```bash
docker-compose up -d postgres
```

#### Using Local PostgreSQL

Update `.env`:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/safespace_mobile_server_db
```

### 3. Firebase Configuration

Your Firebase credentials are already configured:

```bash
# Verify service account key exists
ls -la .config/firebase/safespace-companion-2026-firebase-adminsdk-fbsvc-c2c7b1f657.json

# Verify .env has Firebase settings
grep FIREBASE .env
```

**Expected output:**
```
FIREBASE_SERVICE_ACCOUNT_PATH=./.config/firebase/safespace-companion-2026-firebase-adminsdk-fbsvc-c2c7b1f657.json
FIREBASE_PROJECT_ID=safespace-companion-2026
```

### 4. Database Migrations

```bash
npx prisma migrate deploy
```

This creates all required tables including:
- User
- Session (stores FCM tokens)
- Accident
- NotificationLog
- And more...

### 5. Verify Setup

```bash
npm test
```

All tests should pass.

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000`

**Expected startup logs:**
```
[nodemon] watching path(s): *.*
[nodemon] starting `node src/server.js`
[dotenv] injecting env (.env)
Firebase Admin SDK initialized with project: safespace-companion-2026
Server running at http://localhost:3000
```

### Production Mode

```bash
npm start
```

Set environment variables before starting:
```bash
export NODE_ENV=production
export DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/safespace_db
export FIREBASE_SERVICE_ACCOUNT_PATH=/secure/path/to/service-account.json
export FIREBASE_PROJECT_ID=safespace-companion-2026
export JWT_ACCESS_SECRET=your-secure-secret
export JWT_REFRESH_SECRET=your-secure-refresh-secret

npm start
```

## API Endpoints

### Authentication

```bash
# Register new user
POST /auth/register
Content-Type: application/json
{
  "phoneNumber": "+1234567890",
  "fcmToken": "your-fcm-token"
}

# Login
POST /auth/login
Content-Type: application/json
{
  "phoneNumber": "+1234567890",
  "fcmToken": "your-fcm-token"
}
```

### Profile

```bash
# Get user profile
GET /profile
Authorization: Bearer {access_token}

# Update profile
PUT /profile
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "emergencyPhoneNumbers": ["+1234567890"]
}
```

### Accidents

```bash
# Report accident (mobile user)
POST /accidents/report
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "message": "Collision at intersection",
  "occurredAt": "2026-02-02T12:00:00Z"
}
```

### Central Unit

```bash
# Receive accident from central unit
POST /centralUnit/receive-accident
Authorization: Bearer {cu-auth-token}
Content-Type: application/json
{
  "centralUnitAccidentId": "cu-123",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "occurredAt": "2026-02-02T12:00:00Z"
}
```

## Testing Notifications

### 1. Start the Server

```bash
npm run dev
```

### 2. Register a Test User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "fcmToken": "test-fcm-token"
  }'
```

### 3. Create Multiple Test Users

```bash
for i in {2..5}; do
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"phoneNumber\": \"+123456789$i\",
      \"fcmToken\": \"test-fcm-token-$i\"
    }"
done
```

### 4. Report an Accident

```bash
# Get access token from login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}' \
  | jq -r '.accessToken')

# Report accident
curl -X POST http://localhost:3000/accidents/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": {"lat": 40.7128, "lng": -74.0060},
    "message": "Test accident",
    "occurredAt": "2026-02-02T12:00:00Z"
  }'
```

### 5. Check Notification Logs

```bash
# Connect to database
psql postgresql://postgres:postgres@localhost:5432/safeespace_mobile_server_db

# View notifications sent
SELECT * FROM "NotificationLog"
ORDER BY "createdAt" DESC
LIMIT 10;

# Check success rate
SELECT 
  status,
  COUNT(*) as count
FROM "NotificationLog"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

## File Structure

```
safespace_mobile_server/
├── .config/firebase/                 # Firebase credentials (gitignored)
│   └── safespace-companion-2026-firebase-adminsdk-fbsvc-c2c7b1f657.json
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Environment template
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Database migrations
├── src/
│   ├── app.js                        # Express app setup
│   ├── server.js                     # Server entry point
│   ├── routes.js                     # All API routes
│   ├── config/
│   │   ├── env.js                    # Environment validation
│   │   └── constants.js              # App constants
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT authentication
│   │   ├── error.middleware.js       # Error handling
│   │   └── requestLogger.middleware.js  # Logging
│   └── modules/
│       ├── auth/                     # Authentication
│       ├── profile/                  # User profiles
│       ├── accidents/                # Accident reporting
│       ├── centralUnit/              # Central unit integration
│       └── notifications/            # FCM push notifications
├── tests/
│   ├── unit/                         # Unit tests
│   └── integration/                  # Integration tests
├── FIREBASE_CONFIGURATION.md         # Firebase setup guide
├── ACCIDENT_NOTIFICATIONS_INTEGRATION.md  # Notifications guide
└── README.md                         # Project overview
```

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./.config/firebase/service-account.json
FIREBASE_PROJECT_ID=safespace-companion-2026

# JWT
JWT_ACCESS_SECRET=your-secure-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Optional

```bash
# Server
NODE_ENV=development|production
PORT=3000

# JWT TTL
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# Central Unit
CENTRAL_UNIT_BASE_URL=http://localhost:5000
CENTRAL_UNIT_INBOUND_AUTH_MODE=proxy|mtls|off

# TLS/mTLS
TLS_CERT_PATH=./certs/server.crt
TLS_KEY_PATH=./certs/server.key
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection string
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Firebase Initialization Failed

```bash
# Verify service account file
ls -la .config/firebase/safespace-companion-2026-firebase-adminsdk-fbsvc-c2c7b1f657.json

# Verify JSON format
node -e "console.log(JSON.parse(require('fs').readFileSync('.config/firebase/safespace-companion-2026-firebase-adminsdk-fbsvc-c2c7b1f657.json')))"

# Check environment variables
grep FIREBASE .env
```

### Migration Errors

```bash
# Reset database (development only!)
npx prisma migrate reset

# Or view migration status
npx prisma migrate status
```

## Production Deployment

### Environment Setup

1. Create `.env.production`
2. Set all required variables
3. Never commit `.env.production`
4. Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

### Pre-Deployment Checklist

- [ ] All tests passing: `npm test`
- [ ] No console errors: `npm run lint`
- [ ] Database migrations up-to-date: `npx prisma migrate status`
- [ ] Firebase credentials secured
- [ ] JWT secrets are strong and unique
- [ ] Database backups configured
- [ ] Monitoring and logging setup
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error handling validated

### Docker Deployment

```bash
# Build image
docker build -t safespace-mobile-server:1.0.0 .

# Run container
docker run -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/firebase.json \
  -v /path/to/firebase.json:/secrets/firebase.json \
  -p 3000:3000 \
  safespace-mobile-server:1.0.0
```

### Kubernetes Deployment

```bash
# Create secrets
kubectl create secret generic firebase-credentials \
  --from-file=.config/firebase/safespace-companion-2026-firebase-adminsdk-fbsvc-c2c7b1f657.json

# Deploy
kubectl apply -f k8s/deployment.yaml
```

## Monitoring & Logging

### Server Logs

```bash
# Tail logs
npm run dev | grep -E "error|warn|Firebase"

# Or use persistent logging
npm run dev > logs/app.log 2>&1 &
```

### Database Monitoring

```bash
# Active connections
psql -c "SELECT datname, count(*) as connections FROM pg_stat_activity GROUP BY datname;"

# Slow queries
EXPLAIN ANALYZE SELECT * FROM "Accident" WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

### Application Health

```bash
# Check all services
curl http://localhost:3000/health

# Monitor accident reporting
curl http://localhost:3000/accidents/stats
```

## Documentation

- [FIREBASE_CONFIGURATION.md](FIREBASE_CONFIGURATION.md) - Firebase setup details
- [ACCIDENT_NOTIFICATIONS_INTEGRATION.md](ACCIDENT_NOTIFICATIONS_INTEGRATION.md) - Notifications integration
- [README.md](README.md) - Project overview
- Prisma Schema: `prisma/schema.prisma`

## Support

For issues or questions:
1. Check the documentation files above
2. Review server logs: `npm run dev`
3. Check database: `psql $DATABASE_URL`
4. Run tests: `npm test`

---

**Last Updated**: February 2, 2026  
**Status**: ✅ Production Ready
