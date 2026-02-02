# Notifications Module

## Responsibilities
- Provide a `NotificationService` abstraction and an FCM provider implementation.
- Send real-time push notifications to mobile users via Firebase Cloud Messaging (FCM).
- Track notification delivery status in the database.
- Handle FCM token management and lifecycle.

## Architecture

### FCM Provider (`fcm.provider.js`)
- Initializes Firebase Admin SDK with service account credentials
- Sends notifications to users via their registered FCM tokens
- Handles FCM-specific error cases (invalid tokens, expired sessions)
- Logs notification delivery attempts

### Notification Service (`notifications.service.js`)
- Provides high-level interface for sending accident notifications
- Manages notification payload construction
- Records delivery status and errors in the database

### Database Integration
- **Sessions Model**: Stores FCM tokens per user session (device)
- **NotificationLog Model**: Tracks all notification delivery attempts

## Public Endpoints

### Send Accident Notification
- **Endpoint**: `POST /notifications/send-accident-notification`
- **Description**: Send push notification to multiple users about an accident
- **Request Body**:
  ```json
  {
    "accidentId": "uuid-string",
    "userIds": ["uuid-1", "uuid-2"],
    "title": "Accident Alert",
    "body": "An accident has been reported nearby",
    "streetName": "Main Street (optional)",
    "data": { "additionalField": "value" }
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "sent": 2,
    "failed": 0
  }
  ```

## Setup Instructions

### 1. Firebase Project Setup

#### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project" or select an existing one
3. Enable Firebase Cloud Messaging (FCM)

#### Generate Service Account Credentials
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file securely
5. Note the `project_id` from the downloaded JSON

### 2. Server Configuration

#### Environment Variables
Add the following to your `.env` file:
```env
# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

#### File Structure
Place your Firebase service account key file at the specified path:
```
/path/to/serviceAccountKey.json
```

**Security Note**: Never commit the service account key to version control. Use environment variables or secure vaults.

### 3. Mobile App Integration

#### Send FCM Token on Login/Registration
When a user logs in or registers, the mobile app must send the FCM token:

**Login Request**:
```json
{
  "email": "user@example.com",
  "password": "password",
  "deviceId": "unique-device-identifier",
  "fcmToken": "FCM_TOKEN_FROM_FIREBASE_SDK"
}
```

**Registration Request**:
```json
{
  "email": "user@example.com",
  "password": "password",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "fcmToken": "FCM_TOKEN_FROM_FIREBASE_SDK"
}
```

#### Update FCM Token
Add an endpoint to update the FCM token when it refreshes:
```
POST /auth/update-fcm-token
{
  "sessionId": "session-id",
  "fcmToken": "new-fcm-token"
}
```

### 4. Database Migration

Run the migration to create notification logs table:
```bash
npm run prisma:migrate
```

This will create:
- `NotificationLog` table for tracking delivery attempts
- Indexes on `accidentId`, `userId`, and `createdAt`

## Implementation Details

### How It Works

1. **Token Registration**: When users log in, FCM tokens are stored in the `Session` model
2. **Notification Trigger**: When an accident is reported, the emergency module calls the notification service
3. **Token Fetching**: FCM provider queries active sessions with valid, non-expired FCM tokens
4. **Message Sending**: Firebase Admin SDK sends individual messages to each token
5. **Error Handling**: Invalid/expired tokens are automatically revoked
6. **Logging**: Delivery status is recorded in the database for audit and debugging

### Error Handling

#### Invalid Token Errors
- If a token is invalid or the device is unregistered, the session is automatically revoked
- The user will need to log in again to generate a new token
- Logged in the `NotificationLog` table with status `FAILED`

#### Firebase Connection Errors
- If Firebase Admin SDK fails to initialize, all sends will fail
- Errors are logged with details for debugging
- Graceful fallback (doesn't crash the server)

### Message Format

#### Notification Payload (Sent to Device)
```json
{
  "notification": {
    "title": "Safe Space Alert",
    "body": "An accident has been reported near you"
  },
  "data": {
    "type": "ACCIDENT",
    "accidentId": "uuid-string",
    "streetName": "Main Street"
  }
}
```

#### Android-Specific Settings
- Priority: `high` (immediate delivery)
- TTL: 3600 seconds (1 hour)

#### iOS-Specific Settings
- Priority: `10` (urgent)

## Monitoring & Debugging

### View Notification Logs
```sql
SELECT * FROM "NotificationLog" ORDER BY "createdAt" DESC LIMIT 50;
```

### Check Active User Sessions with FCM Tokens
```sql
SELECT "id", "userId", "deviceId", "fcmToken", "expiresAt" 
FROM "Session" 
WHERE "fcmToken" IS NOT NULL 
  AND "revokedAt" IS NULL 
  AND "expiresAt" > NOW();
```

### Common Issues

#### FCM Tokens Not Being Stored
- Ensure mobile app sends `fcmToken` during login/registration
- Check `Session` table for `fcmToken` values
- Verify Firebase Admin SDK is properly initialized

#### Notifications Not Being Delivered
- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` points to valid credentials
- Check service account has FCM permissions
- Look for error logs from the FCM provider
- Verify user sessions haven't expired

#### Firebase Admin SDK Initialization Fails
- Verify service account JSON file path is correct
- Check `FIREBASE_PROJECT_ID` matches the JSON file
- Ensure file permissions allow Node.js to read the file
- Validate JSON file is not corrupted

## Future Enhancements

- [ ] Batch sending for better performance
- [ ] Topic-based subscriptions (e.g., city-based alerts)
- [ ] Notification scheduling/delayed sending
- [ ] Rich media attachments (images, sounds)
- [ ] Interactive notification actions
- [ ] Delivery confirmation webhooks
- [ ] Rate limiting and throttling
- [ ] Multi-language support

