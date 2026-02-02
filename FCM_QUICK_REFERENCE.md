# SafeSpace FCM - Quick Reference Card

## 🎯 What's New

Firebase Cloud Messaging (FCM) push notifications for SafeSpace mobile app.

## 📦 What Was Installed

```bash
npm install firebase-admin  # v12+
```

## ⚙️ Environment Setup

```bash
# .env file
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## 🔌 API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Login + send FCM token |
| `/auth/update-fcm-token` | POST | Update token when it refreshes |
| `/notifications/send-accident-notification` | POST | Send accident alert |

## 💻 Code Changes Summary

### Files Modified (7)
- `src/modules/notifications/fcm.provider.js` - Real FCM implementation
- `src/modules/notifications/notifications.service.js` - Service enhancements
- `src/modules/auth/auth.repo.js` - DB methods for FCM tokens
- `src/modules/auth/auth.validators.js` - Validation schemas
- `src/modules/auth/auth.controller.js` - Controller handlers
- `src/modules/auth/auth.service.js` - Business logic
- `src/config/env.js` - Environment variables

### Files Created (5)
- `FCM_SETUP_GUIDE.md` - Complete backend setup guide
- `FCM_IMPLEMENTATION_SUMMARY.md` - Technical details
- `FCM_README.md` - Overview and quick start
- `MOBILE_FCM_INTEGRATION.md` - Mobile app integration
- `FCM_QUICK_REFERENCE.md` - This file

### Database (No Changes Needed)
- `Session` table already has `fcmToken` field
- `NotificationLog` table already exists

## 🚀 Getting Started (Backend)

### Step 1: Firebase Setup (5 min)
1. Go to Firebase Console
2. Create project or use existing
3. Generate service account key
4. Save to secure location

### Step 2: Configure (2 min)
```bash
export FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/key.json
export FIREBASE_PROJECT_ID=your-project-id
```

### Step 3: Test (3 min)
```bash
# Start server
npm run dev

# Login with FCM token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password",
    "deviceId": "device-1",
    "fcmToken": "token_from_firebase"
  }'
```

## 📱 Getting Started (Mobile)

### Step 1: Add Firebase SDK
**Flutter**:
```bash
flutter pub add firebase_core firebase_messaging
```

**React Native**:
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### Step 2: Get FCM Token
```dart
// Flutter
String? token = await FirebaseMessaging.instance.getToken();
```

```javascript
// React Native
const token = await messaging().getToken();
```

### Step 3: Send During Login
```json
{
  "email": "user@example.com",
  "password": "password",
  "fcmToken": "token_from_step_2"
}
```

### Step 4: Handle Notifications
```dart
// Flutter
FirebaseMessaging.onMessage.listen((message) {
  // Show notification
});
```

## 🗄️ Database Queries

### Check FCM Tokens
```sql
SELECT "userId", "deviceId", "fcmToken" 
FROM "Session" 
WHERE "fcmToken" IS NOT NULL 
LIMIT 10;
```

### View Notification History
```sql
SELECT * FROM "NotificationLog" 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

## 📊 Monitoring

### Check Status
```bash
# View server logs
tail -f /var/log/safespace.log

# Check database
psql -c "SELECT COUNT(*) FROM \"NotificationLog\" WHERE status='SENT';"
```

## 🔧 Common Tasks

### Send Test Notification
```bash
curl -X POST http://localhost:3000/notifications/send-accident-notification \
  -H "Content-Type: application/json" \
  -d '{
    "accidentId": "test-123",
    "userIds": ["user-uuid"],
    "title": "Test Alert",
    "body": "This is a test"
  }'
```

### Update FCM Token
```bash
curl -X POST http://localhost:3000/auth/update-fcm-token \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-uuid",
    "fcmToken": "new-token"
  }'
```

## ❌ Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase not initialized | Check `FIREBASE_SERVICE_ACCOUNT_PATH` |
| Token not stored | Verify mobile sends `fcmToken` during login |
| Notifications fail | Check Firebase credentials |
| Invalid token error | This is OK - session revoked, user logs in again |

## 📚 Documentation

- [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md) - Detailed backend setup
- [MOBILE_FCM_INTEGRATION.md](./MOBILE_FCM_INTEGRATION.md) - Mobile app guide
- [FCM_README.md](./FCM_README.md) - Full overview
- [src/modules/notifications/DOCS.md](./src/modules/notifications/DOCS.md) - API docs

## ✅ Deployment Checklist

- [ ] Firebase credentials set
- [ ] Environment variables configured
- [ ] `npm install firebase-admin` completed
- [ ] Prisma generated
- [ ] Server starts without errors
- [ ] Test login with FCM token
- [ ] Test notification sending
- [ ] Monitor logs for errors
- [ ] Set up alerts

## 🔑 Key Features

✅ Real-time push notifications  
✅ Per-device delivery  
✅ Automatic token management  
✅ Delivery tracking  
✅ Platform-specific optimization  
✅ Error handling  
✅ Production-ready  

## 📞 Quick Help

**Q: Where do I get the Firebase credentials?**  
A: Firebase Console > Project Settings > Service Accounts > Generate New Private Key

**Q: Do I need to modify database?**  
A: No, schema already supports FCM tokens and notification logs

**Q: How do I test this?**  
A: Follow FCM_SETUP_GUIDE.md Step 5 for testing instructions

**Q: What if notifications don't work?**  
A: Check 1) credentials, 2) FCM token stored, 3) device permissions, 4) server logs

## 🎓 Learning Path

1. Read [FCM_README.md](./FCM_README.md) - Overview (5 min)
2. Follow [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md) - Setup (30 min)
3. Review [src/modules/notifications/DOCS.md](./src/modules/notifications/DOCS.md) - API (10 min)
4. Read [MOBILE_FCM_INTEGRATION.md](./MOBILE_FCM_INTEGRATION.md) - Mobile (30 min)
5. Test end-to-end (20 min)
6. Deploy to production (follow steps 7 in setup guide)

**Total Time: ~1.5 hours**

## 📋 Support Resources

| Resource | Link |
|----------|------|
| Firebase Docs | https://firebase.google.com/docs/cloud-messaging |
| Admin SDK | https://firebase.google.com/docs/admin/setup |
| Pricing | https://firebase.google.com/pricing |
| Error Codes | https://firebase.google.com/docs/cloud-messaging/manage-tokens |

---

**Version**: 1.0  
**Date**: February 2026  
**Status**: ✅ Ready for Use
