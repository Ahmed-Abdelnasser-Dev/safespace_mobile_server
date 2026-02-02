# Emergency Module Documentation

## Overview

The Emergency module handles real-time emergency requests from users in critical situations. It provides a comprehensive API for creating, tracking, and managing emergency requests with support for multiple emergency types and services.

## Features

- **Multi-type Emergency Support**: Handle various emergency types (Car Accident, Medical Emergency, Fire, Crime/Violence, Vehicle Breakdown, Other)
- **Multi-service Coordination**: Request multiple emergency services simultaneously (Police, Ambulance, Fire Department, Roadside Assistance)
- **Location-based**: Automatic GPS location sharing with emergency services
- **Photo Evidence**: Optional photo upload for faster assessment
- **Real-time Tracking**: Track emergency request status (QUEUED, SENT, FAILED)
- **User Medical Information**: Automatic inclusion of user's medical profile when available
- **Central Unit Integration**: Seamless coordination with the Central Unit for emergency dispatch

## Database Schema

### EmergencyRequest Model

```prisma
model EmergencyRequest {
  id                String                 @id @default(uuid())
  requesterUserId   String?
  emergencyTypes    EmergencyType[]        // Array of emergency types
  emergencyServices EmergencyService[]     // Array of services needed
  description       String                 // 0-500 characters
  photoUri          String?                // Optional photo
  lat               Float                  // Latitude (-90 to 90)
  lng               Float                  // Longitude (-180 to 180)
  timestamp         DateTime               // When emergency occurred
  status            EmergencyRequestStatus // QUEUED, SENT, FAILED
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  requester         User?                  // User relationship
}
```

### Enums

**EmergencyType**:
- `CAR_ACCIDENT`
- `MEDICAL_EMERGENCY`
- `FIRE`
- `CRIME_VIOLENCE`
- `VEHICLE_BREAKDOWN`
- `OTHER`

**EmergencyService**:
- `POLICE`
- `AMBULANCE`
- `FIRE_DEPARTMENT`
- `ROADSIDE_ASSISTANCE`

**EmergencyRequestStatus**:
- `QUEUED` - Request created and queued for processing
- `SENT` - Request successfully sent to emergency services
- `FAILED` - Request failed to send

## API Endpoints

### 1. Create Emergency Request

**Endpoint**: `POST /emergency/request`

**Description**: Create a new emergency request. This is a critical endpoint that accepts emergency requests from users and immediately notifies the appropriate emergency services.

**Authentication**: Optional (recommended for better tracking and medical information)

**Request Body** (multipart/form-data or JSON):

```json
{
  "emergencyTypes": ["CAR_ACCIDENT", "MEDICAL_EMERGENCY"],
  "emergencyServices": ["POLICE", "AMBULANCE"],
  "description": "Multi-vehicle collision on Highway 101. Multiple injuries reported.",
  "location": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "timestamp": "2026-02-02T10:30:00Z"  // Optional, defaults to now
}
```

**With Photo Upload** (multipart/form-data):

```bash
curl -X POST http://localhost:3000/emergency/request \
  -F "emergencyTypes=[\"CAR_ACCIDENT\"]" \
  -F "emergencyServices=[\"POLICE\",\"AMBULANCE\"]" \
  -F "description=Accident on Main St" \
  -F "location={\"lat\":37.7749,\"lng\":-122.4194}" \
  -F "photo=@/path/to/photo.jpg"
```

**Response**: `201 Created`

```json
{
  "success": true,
  "message": "Emergency request created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "emergencyTypes": ["CAR_ACCIDENT", "MEDICAL_EMERGENCY"],
    "emergencyServices": ["POLICE", "AMBULANCE"],
    "description": "Multi-vehicle collision on Highway 101. Multiple injuries reported.",
    "photoUri": "/uploads/1643801400-photo.jpg",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": "2026-02-02T10:30:00.000Z",
    "status": "QUEUED",
    "createdAt": "2026-02-02T10:30:05.000Z"
  }
}
```

**Validation Rules**:
- `emergencyTypes`: Array, at least 1 item required
- `emergencyServices`: Array, at least 1 item required
- `description`: String, 1-500 characters required
- `location.lat`: Number, -90 to 90
- `location.lng`: Number, -180 to 180
- `timestamp`: ISO datetime string (optional)
- `photo`: File upload (optional, image only)

---

### 2. Get Emergency Request

**Endpoint**: `GET /emergency/request/:id`

**Description**: Retrieve details of a specific emergency request, including requester information and medical data if available.

**Authentication**: Optional (provides more details when authenticated)

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "requesterUserId": "user-uuid",
    "emergencyTypes": ["MEDICAL_EMERGENCY"],
    "emergencyServices": ["AMBULANCE"],
    "description": "Heart attack symptoms",
    "photoUri": null,
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": "2026-02-02T10:30:00.000Z",
    "status": "SENT",
    "createdAt": "2026-02-02T10:30:05.000Z",
    "updatedAt": "2026-02-02T10:31:00.000Z",
    "requester": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "bloodType": "O+",
      "allergies": ["Penicillin"],
      "chronicConditions": ["Diabetes"],
      "emergencyContactName": "Jane Doe",
      "emergencyContactPhone": "+1234567891"
    }
  }
}
```

**Response**: `404 Not Found`

```json
{
  "success": false,
  "message": "Emergency request not found"
}
```

---

### 3. List Emergency Requests

**Endpoint**: `GET /emergency/requests`

**Description**: List emergency requests with optional filtering by status.

**Authentication**: Optional
- **Unauthenticated**: Returns all emergency requests
- **Authenticated (User)**: Returns only user's own requests
- **Authenticated (Admin)**: Returns all emergency requests

**Query Parameters**:
- `status`: `QUEUED` | `SENT` | `FAILED` (optional)
- `limit`: Number (1-100, default: 20)
- `offset`: Number (default: 0)

**Example Request**:
```
GET /emergency/requests?status=QUEUED&limit=10&offset=0
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "requesterUserId": "user-uuid",
      "emergencyTypes": ["CAR_ACCIDENT"],
      "emergencyServices": ["POLICE"],
      "description": "Minor fender bender",
      "photoUri": "/uploads/photo.jpg",
      "lat": 37.7749,
      "lng": -122.4194,
      "timestamp": "2026-02-02T10:30:00.000Z",
      "status": "QUEUED",
      "createdAt": "2026-02-02T10:30:05.000Z",
      "requester": {
        "id": "user-uuid",
        "fullName": "John Doe",
        "phoneNumber": "+1234567890"
      }
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 4. Update Emergency Request Status

**Endpoint**: `PATCH /emergency/request/:id/status`

**Description**: Update the status of an emergency request. This is an admin-only endpoint for tracking emergency request processing.

**Authentication**: **Required** (JWT token)

**Request Body**:

```json
{
  "status": "SENT"
}
```

**Valid Status Values**:
- `QUEUED`
- `SENT`
- `FAILED`

**Response**: `200 OK`

```json
{
  "success": true,
  "message": "Emergency request status updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "SENT",
    "updatedAt": "2026-02-02T10:35:00.000Z"
  }
}
```

**Response**: `400 Bad Request`

```json
{
  "success": false,
  "message": "Invalid status. Must be one of: QUEUED, SENT, FAILED"
}
```

---

## Architecture

### Module Structure

```
src/modules/emergency/
├── emergency.controller.js  # HTTP request handlers
├── emergency.service.js     # Business logic
├── emergency.repo.js        # Database operations
├── emergency.routes.js      # Route definitions
├── emergency.validators.js  # Zod validation schemas
└── DOCS.md                  # This file
```

### Data Flow

1. **Request Reception**: User sends emergency request via mobile app
2. **Validation**: Zod schemas validate all input data
3. **Persistence**: Request saved to database with QUEUED status
4. **Central Unit Notification**: Request forwarded to Central Unit for coordination
5. **Emergency Services Notification**: Push notifications sent to emergency services
6. **Status Updates**: Admin/Central Unit updates status as request is processed

### Integration Points

#### Central Unit Service

The emergency service integrates with the Central Unit for emergency coordination:

```javascript
centralUnitService.sendEmergencyToCentralUnit({
  emergencyRequestId,
  emergencyTypes,
  emergencyServices,
  description,
  latitude,
  longitude,
  timestamp,
  photoUri,
  requesterUserId
})
```

#### Notifications Service

Emergency requests trigger notifications to emergency services:

```javascript
notificationsService.notifyEmergencyServices({
  emergencyRequestId,
  emergencyTypes,
  emergencyServices,
  location,
  description
})
```

## Error Handling

All endpoints follow standard error response format:

**Validation Error** (`400 Bad Request`):
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "description",
      "message": "Description cannot exceed 500 characters"
    }
  ]
}
```

**Server Error** (`500 Internal Server Error`):
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting on emergency endpoints to prevent abuse
2. **Location Validation**: Ensure coordinates are within valid ranges
3. **Photo Upload**: Validate file types and sizes (images only, max size configured)
4. **Authentication**: While optional, authentication provides better tracking and medical information
5. **Data Privacy**: Medical information only shared with authenticated emergency services

## Best Practices

1. **Always include location**: Accurate GPS coordinates are critical for emergency response
2. **Be specific**: Clear descriptions help emergency services prepare appropriate resources
3. **Include photos**: Visual evidence speeds up assessment and response
4. **Keep descriptions concise**: 500 character limit ensures quick reading
5. **Select appropriate services**: Choose all relevant emergency services

## Example Use Cases

### 1. Car Accident with Injuries

```javascript
{
  "emergencyTypes": ["CAR_ACCIDENT", "MEDICAL_EMERGENCY"],
  "emergencyServices": ["POLICE", "AMBULANCE"],
  "description": "Two-car collision at Main St and 1st Ave. Driver unconscious, passenger with leg injury. Traffic blocked.",
  "location": { "lat": 37.7749, "lng": -122.4194 }
}
```

### 2. Vehicle Breakdown

```javascript
{
  "emergencyTypes": ["VEHICLE_BREAKDOWN"],
  "emergencyServices": ["ROADSIDE_ASSISTANCE"],
  "description": "Flat tire on Highway 101 northbound, near Exit 42. Car safely on shoulder.",
  "location": { "lat": 37.8044, "lng": -122.2712 }
}
```

### 3. Fire Emergency

```javascript
{
  "emergencyTypes": ["FIRE"],
  "emergencyServices": ["FIRE_DEPARTMENT", "AMBULANCE"],
  "description": "Smoke coming from building at 123 Main St. Residents evacuating.",
  "location": { "lat": 37.7849, "lng": -122.4094 }
}
```

## Future Enhancements

- Real-time status updates via WebSocket
- ETA tracking for emergency services
- Multi-language support for descriptions
- Voice-to-text for hands-free emergency reporting
- Integration with wearable devices for automatic detection
- Video upload support in addition to photos
