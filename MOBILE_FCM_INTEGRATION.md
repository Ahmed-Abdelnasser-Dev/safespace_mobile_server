# SafeSpace Mobile - FCM Integration Guide

Quick reference for integrating Firebase Cloud Messaging (FCM) in the SafeSpace mobile app.

## 1. Setup Firebase in Mobile App

### Flutter
```bash
flutter pub add firebase_core firebase_messaging
flutter pub get
```

### React Native
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
# or
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

### Android Native
Add to `build.gradle`:
```gradle
implementation 'com.google.firebase:firebase-messaging:23.2.0'
```

### iOS Native
Use CocoaPods:
```bash
pod 'Firebase/Messaging'
```

## 2. Initialize Firebase

### Flutter
```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart'; // Generated file

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}
```

### React Native
```javascript
import { initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
  // ... other config
};

initializeApp(firebaseConfig);
```

## 3. Get FCM Token

### Flutter
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

final FirebaseMessaging _messaging = FirebaseMessaging.instance;

// Get FCM token
Future<String?> getFcmToken() async {
  try {
    final String? token = await _messaging.getToken();
    print('FCM Token: $token');
    return token;
  } catch (e) {
    print('Error getting FCM token: $e');
    return null;
  }
}

// Listen for token refresh
_messaging.onTokenRefresh.listen((newToken) {
  print('FCM Token refreshed: $newToken');
  // Send new token to server
  updateFcmToken(newToken);
});
```

### React Native
```javascript
import messaging from '@react-native-firebase/messaging';

// Get FCM token
async function getFcmToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Listen for token refresh
messaging().onTokenRefresh(token => {
  console.log('FCM Token refreshed:', token);
  updateFcmToken(token);
});
```

## 4. Send Token to Server on Login

### Request to Backend
```bash
POST http://your-backend.com/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "device-12345",
  "fcmToken": "eO6mZ4T9...very_long_token...8x9Y2w"
}
```

### Flutter Example
```dart
Future<void> login(String email, String password) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  final response = await http.post(
    Uri.parse('http://your-backend.com/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
      'deviceId': 'device-unique-id',
      'fcmToken': fcmToken,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Store tokens
    prefs.setString('accessToken', data['accessToken']);
    prefs.setString('refreshToken', data['refreshToken']);
    prefs.setString('sessionId', data['sessionId']); // Store for token updates
  }
}
```

## 5. Handle Incoming Notifications

### Flutter - Foreground Messages
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Message received in foreground: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
  print('Data: ${message.data}');

  // Handle different notification types
  if (message.data['type'] == 'ACCIDENT') {
    String accidentId = message.data['accidentId'];
    String streetName = message.data['streetName'];
    
    // Show alert dialog or navigate to accident details
    showAccidentAlert(
      title: message.notification?.title ?? 'Accident Alert',
      body: message.notification?.body ?? '',
      accidentId: accidentId,
      streetName: streetName,
    );
  }
});

// Handle background messages
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('Background message received');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
}

// Register background handler
FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

// Handle notification when app is terminated (user taps on it)
FirebaseMessaging.instance.getInitialMessage().then((message) {
  if (message != null) {
    print('App opened from notification');
    handleNotificationTap(message);
  }
});

// Handle notification tap when app is in background
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('Notification tapped');
  handleNotificationTap(message);
});
```

### React Native - Foreground Messages
```javascript
import messaging from '@react-native-firebase/messaging';

// Listen to messages when app is in foreground
messaging().onMessage(async (message) => {
  console.log('Foreground message:', message);
  
  if (message.data.type === 'ACCIDENT') {
    showAccidentAlert({
      title: message.notification.title,
      body: message.notification.body,
      accidentId: message.data.accidentId,
      streetName: message.data.streetName,
    });
  }
});

// Handle notification when app is background and notification is tapped
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('Notification tapped');
  handleNotificationTap(remoteMessage);
});

// Check if app was opened from notification
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log('App opened from notification');
      handleNotificationTap(remoteMessage);
    }
  });
```

## 6. Update FCM Token When It Refreshes

### Flutter
```dart
Future<void> updateFcmToken(String newToken) async {
  final prefs = await SharedPreferences.getInstance();
  final sessionId = prefs.getString('sessionId');
  final accessToken = prefs.getString('accessToken');

  if (sessionId == null) return;

  try {
    final response = await http.post(
      Uri.parse('http://your-backend.com/auth/update-fcm-token'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode({
        'sessionId': sessionId,
        'fcmToken': newToken,
      }),
    );

    if (response.statusCode == 200) {
      print('FCM token updated successfully');
    } else {
      print('Failed to update FCM token: ${response.statusCode}');
    }
  } catch (e) {
    print('Error updating FCM token: $e');
  }
}
```

### React Native
```javascript
async function updateFcmToken(newToken) {
  const sessionId = await AsyncStorage.getItem('sessionId');
  const accessToken = await AsyncStorage.getItem('accessToken');

  if (!sessionId) return;

  try {
    const response = await fetch('http://your-backend.com/auth/update-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        fcmToken: newToken,
      }),
    });

    if (response.ok) {
      console.log('FCM token updated successfully');
    } else {
      console.log('Failed to update FCM token:', response.status);
    }
  } catch (error) {
    console.error('Error updating FCM token:', error);
  }
}
```

## 7. Notification Payload Format

The server sends notifications with this structure:

```json
{
  "notification": {
    "title": "Safe Space Alert",
    "body": "An accident has been reported near you"
  },
  "data": {
    "type": "ACCIDENT",
    "accidentId": "550e8400-e29b-41d4-a716-446655440000",
    "streetName": "Main Street",
    "lat": "40.7128",
    "lng": "-74.0060"
  }
}
```

## 8. Request Notification Permissions

### Flutter
```dart
Future<void> requestNotificationPermission() async {
  final settings = await FirebaseMessaging.instance.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );

  print('Notification permissions: ${settings.authorizationStatus}');
}
```

### React Native
```javascript
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

async function requestNotificationPermission() {
  try {
    const result = await request(
      Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.NOTIFICATION 
        : PERMISSIONS.ANDROID.POST_NOTIFICATIONS
    );

    console.log('Notification permission:', result);
  } catch (error) {
    console.error('Error requesting permission:', error);
  }
}
```

## 9. Testing

### Send Test Notification via Server API
```bash
curl -X POST http://your-backend.com/notifications/send-accident-notification \
  -H "Content-Type: application/json" \
  -d '{
    "accidentId": "test-123",
    "userIds": ["user-id-1"],
    "title": "Test Accident",
    "body": "This is a test notification",
    "streetName": "Test Street"
  }'
```

### Check FCM Token
```dart
// Flutter - Print FCM token
FirebaseMessaging.instance.getToken().then((token) {
  print('FCM Token: $token');
});
```

```javascript
// React Native - Print FCM token
messaging().getToken().then(token => {
  console.log('FCM Token:', token);
});
```

## 10. Troubleshooting

### Notifications Not Received
1. Verify app has notification permissions
2. Check FCM token is being sent to server during login
3. Verify Firebase configuration is correct
4. Check device internet connection
5. Look at server logs for errors

### Token Not Updating
1. Ensure `sessionId` is stored after login
2. Verify `update-fcm-token` endpoint is called on token refresh
3. Check for network errors in logs

### App Crashes on Firebase Initialization
1. Ensure Firebase configuration file is present
2. Check Firebase dependencies are installed
3. Verify `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)

## 11. Best Practices

1. **Store Session ID**: Keep `sessionId` for later FCM token updates
2. **Handle All States**: Listen for foreground, background, and terminated states
3. **Request Permissions**: Always request notification permissions upfront
4. **Handle Failures**: Implement retry logic for token updates
5. **Log Errors**: Log all FCM-related errors for debugging
6. **Test Early**: Test FCM integration during development
7. **Monitor Delivery**: Check notification logs on server

## 12. Resources

- [Firebase Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Flutter Firebase Setup](https://firebase.flutter.dev/)
- [React Native Firebase Setup](https://rnfirebase.io/)
- [Android Firebase Integration](https://firebase.google.com/docs/android/setup)
- [iOS Firebase Integration](https://firebase.google.com/docs/ios/setup)

---

For backend API documentation, see [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md)
