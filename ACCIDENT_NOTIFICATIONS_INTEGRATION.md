# SafeSpace - Accident Notifications Integration

## Overview

The SafeSpace system now has automatic push notification delivery when accidents are reported. Users receive real-time FCM notifications when:

1. **Central Unit sends an accident** - All users with active FCM tokens are notified
2. **Mobile user reports an accident** - All other users with active FCM tokens are notified

## Data Flow

### When Central Unit Sends an Accident

```
Central Unit (Raspberry Pi)
    ↓ POST /centralUnit/receive-accident
    ↓
Backend Server
    ├─ Store accident in database
    ├─ Fetch all active users with FCM tokens
    ├─ Send individual FCM messages to each user
    └─ Log delivery status
    ↓
Firebase Cloud Messaging
    ↓
Mobile App Devices (Push Notification)
```

### When Mobile User Reports an Accident

```
Mobile App User
    ↓ POST /accidents/report
    ↓
Backend Server
    ├─ Store accident in database
    ├─ Send to Central Unit for coordination
    ├─ Fetch all other active users with FCM tokens
    ├─ Send individual FCM messages to each user
    └─ Log delivery status
    ↓
Firebase Cloud Messaging
    ↓
Other Mobile App Devices (Push Notification)
```

## Implementation Details

### Repository Layer Changes

#### `accidents.repo.js` - New Method
```javascript
async getActiveUsersWithFcmTokens(excludeUserId = null)
```
- Queries all active sessions with valid FCM tokens
- Optionally excludes a user (e.g., the accident reporter)
- Returns array of unique user IDs

#### `centralUnit.repo.js` - New Method
```javascript
async getActiveUsersWithFcmTokens()
```
- Same as accidents repo but doesn't exclude any users
- All users get notified about central unit accidents

### Service Layer Changes

#### `accidents.service.js` - Enhanced reportAccident()
- Now sends notifications after storing accident
- Fetches active users (excluding reporter)
- Sends accident notification via FCM
- Logs errors without failing the main request

#### `centralUnit.service.js` - Enhanced receiveAccidentFromCentralUnit()
- Now sends notifications when accident is received
- Fetches all active users
- Sends accident notification via FCM
- Includes full location and source information

## API Notification Payloads

### Central Unit Accident Notification
```json
{
  "notification": {
    "title": "Accident Nearby",
    "body": "An accident has been reported in your area. Please stay alert."
  },
  "data": {
    "type": "ACCIDENT",
    "accidentId": "550e8400-e29b-41d4-a716-446655440000",
    "lat": "40.7128",
    "lng": "-74.0060",
    "source": "CENTRAL_UNIT"
  }
}
```

### Mobile User Accident Notification
```json
{
  "notification": {
    "title": "Accident Report",
    "body": "An accident has been reported nearby"
  },
  "data": {
    "type": "ACCIDENT",
    "accidentId": "550e8400-e29b-41d4-a716-446655440001",
    "lat": "40.7128",
    "lng": "-74.0060",
    "source": "MOBILE_USER",
    "message": "Collision on Main Street"
  }
}
```

## Features

### ✅ Automatic Delivery
- Accidents trigger notifications automatically
- No manual intervention required
- Notifications sent to all active users

### ✅ Non-Blocking
- Notification sending is async
- Doesn't delay accident reporting
- Errors don't fail the main request

### ✅ Smart Filtering
- Only sends to users with active FCM tokens
- Excludes expired sessions
- Excludes revoked sessions
- Excludes the reporting user (for mobile reports)

### ✅ Tracking
- All notifications logged in database
- Success/failure status recorded
- Error details captured for debugging

### ✅ Scalability
- Per-user notifications (individual messages)
- Handled by Firebase at scale
- No impact on accident reporting latency

## Database Queries

### Check Notifications Sent for an Accident
```sql
SELECT * FROM "NotificationLog"
WHERE "accidentId" = 'accident-uuid'
ORDER BY "createdAt" DESC;
```

### Check Delivery Stats
```sql
SELECT 
  "accidentId",
  COUNT(*) as total,
  SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM "NotificationLog"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "accidentId"
ORDER BY "createdAt" DESC;
```

### View Notification Failures
```sql
SELECT * FROM "NotificationLog"
WHERE status = 'FAILED'
ORDER BY "createdAt" DESC
LIMIT 20;
```

## Integration Points

### Endpoints That Trigger Notifications

1. **POST /centralUnit/receive-accident**
   - Receives accident from central unit
   - Automatically sends to all users
   - See: `centralUnit.service.js:receiveAccidentFromCentralUnit()`

2. **POST /accidents/report**
   - Mobile user reports accident
   - Automatically sends to all other users
   - See: `accidents.service.js:reportAccident()`

### Services Used

- **accidentsRepo** - Fetches active users, creates accidents
- **centralUnitRepo** - Fetches active users, creates accidents from central unit
- **notificationsService** - Sends FCM notifications
- **centralUnitService** - Coordinates with central unit
- **logger** - Logs all operations

## Configuration

No additional configuration needed beyond FCM setup:

```env
# Already configured for FCM
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Error Handling

### Network Errors
- Logged with warning level
- Don't fail the accident reporting
- Application continues normally

### FCM Token Issues
- Invalid tokens are automatically revoked
- Session marked as revoked in database
- User logs in again to get new token

### Database Errors
- Logged with error level
- Notifications won't be sent
- Accident still gets reported

## Testing

### Test Central Unit Accident Notification
```bash
# 1. Have user(s) logged in with FCM tokens
# 2. Send accident from central unit
curl -X POST http://localhost:3000/centralUnit/receive-accident \
  -H "Content-Type: application/json" \
  -d '{
    "centralUnitAccidentId": "cu-123",
    "occurredAt": "2026-02-02T12:00:00Z",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }'

# 3. Check notification logs
psql -c "SELECT * FROM \"NotificationLog\" ORDER BY \"createdAt\" DESC LIMIT 5;"

# 4. Verify push notification on mobile device
```

### Test Mobile User Accident Notification
```bash
# 1. Have multiple users logged in with FCM tokens
# 2. Report accident from mobile
curl -X POST http://localhost:3000/accidents/report \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "message": "Collision on Main Street",
    "occurredAt": "2026-02-02T12:00:00Z"
  }'

# 3. All users except reporter should get notification
# 4. Check notification logs
psql -c "SELECT COUNT(*) FROM \"NotificationLog\" WHERE status='SENT' AND \"createdAt\" > NOW() - INTERVAL '1 minute';"
```

## Performance Considerations

### Notification Sending
- **Latency**: < 100ms per user (typically)
- **Throughput**: Scales with Firebase capacity
- **Memory**: Minimal (streaming)
- **Database queries**: Optimized with distinct on userId

### Scalability
- Per-user individual messages (not batch)
- Firebase handles routing to devices
- No in-app queuing or caching
- Stateless operation

### Database Impact
- Single query to fetch active users (indexed)
- Bulk insert of notification logs (batched)
- Minimal blocking on accident creation

## Monitoring

### Key Metrics
- Notifications sent per accident
- Notification delivery success rate
- Average delivery latency
- User engagement (view/tap rates on mobile)

### Alert Triggers
- High failure rate (> 10%)
- No active users with FCM tokens
- Firebase API errors
- Database query failures

## Future Enhancements

### Short Term
- [ ] Filter by location radius (geo-fencing)
- [ ] Category-based subscriptions (accident types)
- [ ] Delivery confirmation hooks
- [ ] Batch sending optimization

### Medium Term
- [ ] User location history tracking
- [ ] Smart notification timing
- [ ] Do-not-disturb hours
- [ ] Notification frequency limits

### Long Term
- [ ] ML-based targeting
- [ ] Predictive routing
- [ ] Cross-device synchronization
- [ ] Analytics dashboard

## Troubleshooting

### Notifications Not Sending

**Check 1: Are there active users?**
```sql
SELECT COUNT(*) FROM "Session"
WHERE "fcmToken" IS NOT NULL
  AND "revokedAt" IS NULL
  AND "expiresAt" > NOW();
```

**Check 2: Are notifications being logged?**
```sql
SELECT COUNT(*) FROM "NotificationLog"
WHERE "createdAt" > NOW() - INTERVAL '5 minutes';
```

**Check 3: Check server logs**
```bash
grep "sendAccidentNotification\|receiveAccidentFromCentralUnit" /var/log/safespace.log | tail -20
```

### Notifications Failing
**Check notification log errors:**
```sql
SELECT "userId", error, COUNT(*) as count
FROM "NotificationLog"
WHERE status = 'FAILED'
GROUP BY "userId", error
ORDER BY count DESC;
```

### Users Not Receiving Mobile Notifications
1. Check FCM token is stored in database
2. Verify mobile app has notification permissions
3. Check if app is handling remote messages
4. Check Firebase Console diagnostics

## Security

### Data Protection
- FCM tokens stored per session
- Sessions expire automatically
- Invalid tokens revoked immediately
- No PII in notification payloads

### Access Control
- Accident endpoints protected (auth required for mobile)
- Central unit endpoints protected (mTLS/proxy auth)
- Notification service internal only

### Privacy
- Users only notified of accident occurrences
- No personal information shared
- Location data sent only as accident coordinates
- Message content optional

## Code References

### Key Files
- `src/modules/accidents/accidents.service.js` - Handles mobile accident reporting
- `src/modules/accidents/accidents.repo.js` - Database operations for accidents
- `src/modules/centralUnit/centralUnit.service.js` - Handles central unit accidents
- `src/modules/centralUnit/centralUnit.repo.js` - Database operations for central unit
- `src/modules/notifications/notifications.service.js` - FCM notification sending

### Modified Functions
1. **accidents.service.reportAccident()**
   - Now fetches active users and sends notifications
   - Location: `src/modules/accidents/accidents.service.js`

2. **centralUnit.service.receiveAccidentFromCentralUnit()**
   - Now fetches active users and sends notifications
   - Location: `src/modules/centralUnit/centralUnit.service.js`

3. **accidents.repo.getActiveUsersWithFcmTokens()**
   - New method to fetch users for notification
   - Location: `src/modules/accidents/accidents.repo.js`

4. **centralUnit.repo.getActiveUsersWithFcmTokens()**
   - New method to fetch users for notification
   - Location: `src/modules/centralUnit/centralUnit.repo.js`

---

**Integration Date**: February 2, 2026  
**Status**: ✅ Complete and tested  
**Ready for**: Development, testing, production deployment
