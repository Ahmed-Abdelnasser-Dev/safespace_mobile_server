# SafeSpace Push Notifications - FCM Implementation

This document provides an overview of the Firebase Cloud Messaging (FCM) push notification system implemented for SafeSpace.

## 📋 Overview

SafeSpace now has a complete push notification system that:
- ✅ Sends real-time alerts about accidents to nearby users
- ✅ Stores FCM tokens securely per user session
- ✅ Tracks notification delivery status
- ✅ Handles automatic token refresh and expiration
- ✅ Provides platform-specific optimizations (Android & iOS)

## 🚀 Quick Start

### For Backend Developers

1. **Set up Firebase Credentials** (5 minutes)
   - Read: [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md) - Step 1-2

2. **Configure Environment Variables** (2 minutes)
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ```

3. **Test the Setup** (5 minutes)
   - Read: [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md) - Step 5

### For Mobile Developers

1. **Integrate Firebase SDK** (10 minutes)
   - Read: [MOBILE_FCM_INTEGRATION.md](./MOBILE_FCM_INTEGRATION.md) - Sections 1-2

2. **Get and Send FCM Token** (10 minutes)
   - Read: [MOBILE_FCM_INTEGRATION.md](./MOBILE_FCM_INTEGRATION.md) - Sections 3-4

3. **Handle Incoming Notifications** (10 minutes)
   - Read: [MOBILE_FCM_INTEGRATION.md](./MOBILE_FCM_INTEGRATION.md) - Section 5

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md) | Complete Firebase setup and backend integration | Backend developers, DevOps |
| [MOBILE_FCM_INTEGRATION.md](./MOBILE_FCM_INTEGRATION.md) | Mobile app integration guide | Mobile developers |
| [FCM_IMPLEMENTATION_SUMMARY.md](./FCM_IMPLEMENTATION_SUMMARY.md) | Technical implementation details | Backend developers |
| [src/modules/notifications/DOCS.md](./src/modules/notifications/DOCS.md) | Module API documentation | Backend developers |

## 🔧 API Endpoints

### 1. Login with FCM Token
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "deviceId": "device-id",
  "fcmToken": "FCM_TOKEN_FROM_MOBILE_APP"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2. Update FCM Token
```bash
POST /auth/update-fcm-token
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "fcmToken": "new_fcm_token"
}
```

**Response:**
```json
{
  "ok": true,
  "fcmToken": "new_fcm_token"
}
```

### 3. Send Accident Notification
```bash
POST /notifications/send-accident-notification
Content-Type: application/json

{
  "accidentId": "550e8400-e29b-41d4-a716-446655440002",
  "userIds": ["user-id-1", "user-id-2"],
  "title": "Accident Alert",
  "body": "An accident has been reported on Main Street",
  "streetName": "Main Street"
}
```

**Response:**
```json
{
  "ok": true,
  "sent": 2,
  "failed": 0
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App                           │
│  • Firebase SDK                                         │
│  • Get FCM Token                                        │
│  • Send to server on login                              │
│  • Handle incoming notifications                        │
└──────────────────────┬──────────────────────────────────┘
                       │ FCM Token
                       ↓
┌─────────────────────────────────────────────────────────┐
│            SafeSpace Backend (Node.js)                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Auth Module                            ││
│  │  • Store FCM token in Session                       ││
│  │  • Update FCM token endpoint                        ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │           Notifications Module                      ││
│  │  • Query active sessions with FCM tokens           ││
│  │  • Send messages via Firebase Admin SDK             ││
│  │  • Log delivery status                              ││
│  └─────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │ FCM Messages
                       ↓
┌─────────────────────────────────────────────────────────┐
│          Firebase Cloud Messaging (FCM)                 │
│  • Route messages to correct devices                    │
│  • Handle delivery and retries                          │
└──────────────────────┬──────────────────────────────────┘
                       │ Push Notification
                       ↓
┌─────────────────────────────────────────────────────────┐
│         Mobile Device (Android/iOS)                     │
│  • Receive notification                                 │
│  • Display alert to user                                │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### Session Table (Enhanced)
```sql
CREATE TABLE "Session" (
  id             STRING PRIMARY KEY,
  userId         STRING NOT NULL,
  deviceId       STRING,
  fcmToken       STRING,              -- Firebase token for this device
  refreshTokenHash STRING NOT NULL,
  revokedAt      TIMESTAMP,           -- NULL if active
  expiresAt      TIMESTAMP NOT NULL,
  createdAt      TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES "User"(id)
);
```

### NotificationLog Table (Existing)
```sql
CREATE TABLE "NotificationLog" (
  id         STRING PRIMARY KEY,
  accidentId STRING,
  userId     STRING,
  provider   STRING,                 -- "FCM"
  status     STRING,                 -- "SENT" or "FAILED"
  error      STRING,                 -- Error details if failed
  createdAt  TIMESTAMP DEFAULT NOW()
);
```

## 📊 Monitoring

### View Recent Notifications
```sql
SELECT * FROM "NotificationLog" 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Check Active Sessions
```sql
SELECT COUNT(*) as active_devices
FROM "Session"
WHERE "fcmToken" IS NOT NULL 
  AND "revokedAt" IS NULL 
  AND "expiresAt" > NOW();
```

### View Delivery Stats
```sql
SELECT status, COUNT(*) as count
FROM "NotificationLog"
GROUP BY status;
```

## 🔐 Security Considerations

1. **Credentials Management**
   - Never commit service account keys to git
   - Use environment variables or secure vaults
   - Rotate keys periodically

2. **Token Lifecycle**
   - Tokens are automatically revoked when invalid
   - Sessions expire according to refresh token TTL
   - Users log in again to get new tokens

3. **Data Privacy**
   - FCM tokens are stored per session (device)
   - Accident location is sent as data payload
   - No user personal data in notifications

## 📈 Performance Considerations

1. **Batch Sending**
   - Notifications are sent one user at a time
   - Each device gets individual message
   - Can be optimized with batch API later

2. **Token Management**
   - Expired tokens are automatically revoked
   - Invalid tokens trigger session revocation
   - Minimal database queries

3. **Concurrency**
   - Non-blocking async/await operations
   - Firebase handles request queuing
   - No impact on other API endpoints

## ⚙️ Configuration

| Variable | Type | Example | Notes |
|----------|------|---------|-------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | String | `/path/to/serviceAccountKey.json` | Absolute path to service account JSON |
| `FIREBASE_PROJECT_ID` | String | `safespace-abc123` | From Firebase Console |
| `NODE_ENV` | String | `production` | Environment: development, test, production |
| `JWT_ACCESS_TTL` | String | `15m` | Access token expiry |
| `JWT_REFRESH_TTL` | String | `30d` | Refresh token (and session) expiry |

## 🧪 Testing Checklist

- [ ] Firebase credentials configured
- [ ] Environment variables set
- [ ] npm dependencies installed (`firebase-admin`)
- [ ] Prisma client generated
- [ ] Login with FCM token works
- [ ] FCM token is stored in database
- [ ] FCM token update endpoint works
- [ ] Test notification sends successfully
- [ ] Notification appears on mobile device
- [ ] Notification logs are recorded
- [ ] Invalid tokens are handled gracefully
- [ ] Error logs are captured

## 🐛 Troubleshooting

### Firebase Not Initialized
**Error**: `FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set`
**Solution**: Set the environment variable pointing to service account JSON

### Token Not Stored
**Error**: FCM tokens missing in Session table
**Solution**: Ensure mobile app sends `fcmToken` during login

### Notifications Not Delivered
**Error**: Notification logs show `status: FAILED`
**Solution**: Check Firebase credentials, check device internet, check notification permissions

### Invalid Token Errors
**Error**: `messaging/invalid-registration-token`
**Solution**: This is expected. Session is automatically revoked. User should log in again.

## 📞 Support

For issues:
1. Check logs: `pm2 logs safespace` or server logs
2. Check database: Query `NotificationLog` table
3. Check credentials: Verify service account JSON
4. Review documentation: See linked guides above

## 🔄 Version History

- **v1.0.0** (Feb 2026) - Initial implementation
  - Firebase Admin SDK integration
  - FCM token management
  - Notification delivery tracking
  - Mobile app integration guide

## 📝 Next Steps

1. ✅ Implement backend FCM integration (DONE)
2. ⬜ Integrate Firebase SDK in mobile app
3. ⬜ Test end-to-end delivery
4. ⬜ Deploy to staging environment
5. ⬜ Production deployment with monitoring
6. ⬜ Add batch sending optimization
7. ⬜ Add topic-based subscriptions

---

**Last Updated**: February 2, 2026  
**Status**: ✅ Ready for Development & Testing
