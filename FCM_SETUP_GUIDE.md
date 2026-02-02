# Firebase Cloud Messaging (FCM) Setup Guide

This guide provides step-by-step instructions to set up push notifications for the SafeSpace mobile app using Firebase Cloud Messaging (FCM).

## Overview

The SafeSpace backend uses FCM to send real-time push notifications to mobile users about accidents and emergencies. The system:
- Stores FCM tokens per user session (device)
- Sends individual messages to each user's registered devices
- Tracks delivery status in the database
- Automatically handles invalid or expired tokens

## Prerequisites

- Firebase project (free tier is sufficient for development)
- Google Cloud account
- Node.js server running the SafeSpace backend
- Mobile app with Firebase SDK integrated

## Step 1: Create a Firebase Project

### 1.1 Create Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** or select existing project
3. Enter project name: `safespace` (or your preferred name)
4. Accept Firebase terms and click **"Create project"**
5. Wait for project initialization (1-2 minutes)

### 1.2 Enable Firebase Cloud Messaging
1. In Firebase Console, go to **Messaging** (left sidebar)
2. Click **"Enable"** if not already enabled
3. Note your **Sender ID** (visible in Cloud Messaging settings)
   - Format: `123456789012` (numeric ID)
   - This will be used in the mobile app

### 1.3 Note Project ID
1. Go to **Project Settings** (gear icon)
2. Under **General** tab
3. Note your **Project ID** (e.g., `safespace-abc123`)

## Step 2: Generate Service Account Credentials

### 2.1 Create Service Account
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Ensure **Node.js** is selected in the SDK snippet dropdown
4. Click **"Generate New Private Key"** button
5. A JSON file will be downloaded automatically
   - **Keep this file secure** - it contains sensitive credentials

### 2.2 Secure the Credentials File
```bash
# Move to a secure location
mkdir -p ~/.config/firebase
mv ~/Downloads/serviceAccountKey.json ~/.config/firebase/

# Restrict permissions (Linux/Mac)
chmod 600 ~/.config/firebase/serviceAccountKey.json

# Add to .gitignore (never commit!)
echo ".config/firebase/" >> .gitignore
```

## Step 3: Configure Backend Environment

### 3.1 Update .env File
```bash
# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT_PATH=/home/nasser/.config/firebase/serviceAccountKey.json
FIREBASE_PROJECT_ID=safespace-abc123
```

Replace:
- `/home/nasser/.config/firebase/serviceAccountKey.json` with your actual path
- `safespace-abc123` with your actual Firebase Project ID

### 3.2 Verify Dependencies
```bash
npm list firebase-admin
# Should show firebase-admin@^12.0.0 or higher
```

## Step 4: Mobile App Integration

### 4.1 Get FCM Token from Mobile App

The mobile app must obtain the FCM token from Firebase SDK:

**For Flutter:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

final FirebaseMessaging _messaging = FirebaseMessaging.instance;

String? fcmToken = await _messaging.getToken(
  vapidKey: 'YOUR_VAPID_KEY', // For Web only
);
print('FCM Token: $fcmToken');
```

**For React Native:**
```javascript
import messaging from '@react-native-firebase/messaging';

const fcmToken = await messaging().getToken();
console.log('FCM Token:', fcmToken);
```

**For Android Native:**
```java
FirebaseMessaging.getInstance().getToken()
  .addOnCompleteListener(new OnCompleteListener<String>() {
    @Override
    public void onComplete(@NonNull Task<String> task) {
      if (!task.isSuccessful()) {
        Log.w(TAG, "Fetching FCM registration token failed", task.getException());
        return;
      }
      String token = task.getResult();
      Log.d(TAG, "FCM Token: " + token);
    }
  });
```

### 4.2 Send FCM Token During Login

When the user logs in, include the FCM token:

**Request:**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "unique-device-id",
  "fcmToken": "cz8S6mZ4...very_long_token_string...8x9Y2w"
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

### 4.3 Update FCM Token When It Refreshes

Firebase may refresh the FCM token periodically. When this happens, call:

**Request:**
```bash
POST /auth/update-fcm-token
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "fcmToken": "new_fcm_token_after_refresh..."
}
```

**Response:**
```json
{
  "ok": true,
  "fcmToken": "new_fcm_token_after_refresh..."
}
```

### 4.4 Handle Incoming Notifications

The mobile app must handle incoming notifications. The backend sends messages in this format:

**Notification Payload:**
```json
{
  "notification": {
    "title": "Safe Space Alert",
    "body": "An accident has been reported near you"
  },
  "data": {
    "type": "ACCIDENT",
    "accidentId": "550e8400-e29b-41d4-a716-446655440002",
    "streetName": "Main Street",
    "lat": "40.7128",
    "lng": "-74.0060"
  }
}
```

**Flutter Implementation:**
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Message received in foreground: ${message.notification?.title}');
  print('Data: ${message.data}');
  
  if (message.data['type'] == 'ACCIDENT') {
    // Show accident alert UI
    String accidentId = message.data['accidentId'];
    String streetName = message.data['streetName'];
    // Handle accident notification
  }
});
```

## Step 5: Test the Setup

### 5.1 Test FCM Connection
```bash
# From backend server
npm test
# Should pass FCM initialization tests
```

### 5.2 Send Test Notification
```bash
# Using Firebase Admin SDK directly
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const message = {
  notification: {
    title: 'Test Notification',
    body: 'This is a test message'
  },
  token: 'YOUR_FCM_TOKEN_HERE'
};

admin.messaging().send(message)
  .then(response => console.log('Message sent:', response))
  .catch(error => console.log('Error:', error));
"
```

### 5.3 Test via Backend API
```bash
# Assuming you have users and sessions set up
POST /notifications/send-accident-notification
Content-Type: application/json

{
  "accidentId": "550e8400-e29b-41d4-a716-446655440000",
  "userIds": ["550e8400-e29b-41d4-a716-446655440001"],
  "title": "Test Accident Alert",
  "body": "Testing FCM notification delivery",
  "streetName": "Test Street"
}
```

## Step 6: Monitoring and Debugging

### 6.1 Check Notification Logs
```sql
-- View recent notifications
SELECT id, "userId", status, error, "createdAt" 
FROM "NotificationLog" 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Check failed notifications
SELECT * FROM "NotificationLog" 
WHERE status = 'FAILED' 
ORDER BY "createdAt" DESC;
```

### 6.2 Check User Sessions
```sql
-- View active sessions with FCM tokens
SELECT id, "userId", "deviceId", "fcmToken", "expiresAt"
FROM "Session"
WHERE "fcmToken" IS NOT NULL 
  AND "revokedAt" IS NULL
  AND "expiresAt" > NOW()
LIMIT 20;
```

### 6.3 Check Server Logs
```bash
# View backend logs for FCM errors
pm2 logs safespace  # If using PM2
# OR
tail -f /var/log/safespace.log
```

### 6.4 Common Issues

**Issue: "FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set"**
- Solution: Set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` file

**Issue: "Firebase service account not found"**
- Solution: Verify file path is correct and file exists
- Use absolute path, not relative path

**Issue: "Invalid registration token"**
- Solution: FCM tokens expire or become invalid. Sessions are automatically revoked.
- User needs to log in again to get a new token.

**Issue: "Quota exceeded for quota metric"**
- Solution: Firebase free tier has limits. Check [pricing page](https://firebase.google.com/pricing)
- For production, upgrade to Blaze plan (pay-as-you-go)

**Issue: Notifications not arriving on device**
- Solution: 
  1. Verify FCM token is stored correctly in database
  2. Check device has internet connection
  3. Verify app has notification permissions granted
  4. Check app is properly handling remote messages
  5. Look at Firebase Console > Messaging > Diagnostics

## Step 7: Production Deployment

### 7.1 Use Secure Credential Storage
Instead of storing the service account file on disk, use environment-based secrets:

**Option 1: Environment Variable (Base64 encoded)**
```bash
# Encode credentials
cat serviceAccountKey.json | base64 > credentials.b64

# In deployment (e.g., Docker):
ENV FIREBASE_SERVICE_ACCOUNT_JSON=<base64_encoded_content>
```

**Option 2: Cloud Secret Manager (Recommended)**
```bash
# Google Cloud Secret Manager
gcloud secrets create firebase-sa --data-file=serviceAccountKey.json
gcloud secrets add-iam-policy-binding firebase-sa \
  --member=serviceAccount:my-app@appspot.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 7.2 Enable CORS for Mobile Apps
Ensure your backend allows requests from authorized mobile app origins:

```javascript
// In app.js
cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true
})
```

### 7.3 Rate Limiting
Implement rate limiting for notification endpoints:

```javascript
const rateLimit = require('express-rate-limit');

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many notification requests'
});

app.post('/notifications/send-accident-notification', notificationLimiter, ...);
```

### 7.4 Monitoring & Alerts
Set up monitoring for:
- FCM token failures
- Notification delivery latency
- Firebase quota usage
- Error rates

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [FCM Error Codes](https://firebase.google.com/docs/cloud-messaging/manage-tokens#handle-errors)

## Support

For issues or questions:
1. Check Firebase Console Diagnostics
2. Review server logs
3. Check notification delivery status in database
4. Verify service account credentials are valid
5. Contact support with relevant logs and error messages
