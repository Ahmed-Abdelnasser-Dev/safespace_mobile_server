# Emergency Request API - Quick Reference

## Overview
The Emergency Request endpoint allows users to request emergency services in critical situations. It supports multiple emergency types and services, automatic location sharing, and optional photo uploads.

## Base Endpoint
```
POST /emergency/request
```

## Request Format

### Content-Type
- `application/json` - For requests without photo
- `multipart/form-data` - For requests with photo

### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `emergencyTypes` | `Array<string>` | Types of emergency | At least 1 required, see enum below |
| `emergencyServices` | `Array<string>` | Services needed | At least 1 required, see enum below |
| `description` | `string` | Detailed description | 1-500 characters |
| `location` | `object` | GPS coordinates | `{lat: number, lng: number}` |
| `location.lat` | `number` | Latitude | -90 to 90 |
| `location.lng` | `number` | Longitude | -180 to 180 |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `string` | ISO datetime | Auto-generated if not provided |
| `photo` | `File` | Photo upload | Image files only (multipart/form-data) |

## Enums

### EmergencyType
```typescript
type EmergencyType = 
  | "CAR_ACCIDENT"
  | "MEDICAL_EMERGENCY"
  | "FIRE"
  | "CRIME_VIOLENCE"
  | "VEHICLE_BREAKDOWN"
  | "OTHER";
```

### EmergencyService
```typescript
type EmergencyService = 
  | "POLICE"
  | "AMBULANCE"
  | "FIRE_DEPARTMENT"
  | "ROADSIDE_ASSISTANCE";
```

## Example Requests

### JavaScript/Fetch (JSON)

```javascript
const response = await fetch('http://localhost:3000/emergency/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    emergencyTypes: ['CAR_ACCIDENT', 'MEDICAL_EMERGENCY'],
    emergencyServices: ['POLICE', 'AMBULANCE'],
    description: 'Multi-vehicle collision on Highway 101. Multiple injuries.',
    location: {
      lat: 37.7749,
      lng: -122.4194
    },
    timestamp: new Date().toISOString()
  })
});

const data = await response.json();
console.log(data);
```

### JavaScript/Fetch (With Photo)

```javascript
const formData = new FormData();
formData.append('emergencyTypes', JSON.stringify(['CAR_ACCIDENT']));
formData.append('emergencyServices', JSON.stringify(['POLICE', 'AMBULANCE']));
formData.append('description', 'Accident on Main Street');
formData.append('location', JSON.stringify({ lat: 37.7749, lng: -122.4194 }));
formData.append('photo', photoFile); // File object from input

const response = await fetch('http://localhost:3000/emergency/request', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

### React Native Example

```jsx
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

async function createEmergencyRequest() {
  // Get current location
  const location = await Location.getCurrentPositionAsync({});
  
  const requestData = {
    emergencyTypes: ['CAR_ACCIDENT'],
    emergencyServices: ['POLICE', 'AMBULANCE'],
    description: 'Accident on Highway 101',
    location: {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    },
    timestamp: new Date().toISOString()
  };

  const response = await fetch('http://localhost:3000/emergency/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  });

  const data = await response.json();
  return data;
}

// With photo upload
async function createEmergencyRequestWithPhoto(photoUri) {
  const formData = new FormData();
  
  formData.append('emergencyTypes', JSON.stringify(['CAR_ACCIDENT']));
  formData.append('emergencyServices', JSON.stringify(['POLICE']));
  formData.append('description', 'Accident with photo evidence');
  
  const location = await Location.getCurrentPositionAsync({});
  formData.append('location', JSON.stringify({
    lat: location.coords.latitude,
    lng: location.coords.longitude
  }));
  
  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'emergency-photo.jpg'
  });

  const response = await fetch('http://localhost:3000/emergency/request', {
    method: 'POST',
    body: formData
  });

  return await response.json();
}
```

### Axios Example

```javascript
import axios from 'axios';

// Without photo
const response = await axios.post('http://localhost:3000/emergency/request', {
  emergencyTypes: ['MEDICAL_EMERGENCY'],
  emergencyServices: ['AMBULANCE'],
  description: 'Heart attack symptoms - urgent',
  location: {
    lat: 37.7749,
    lng: -122.4194
  }
});

// With photo
const formData = new FormData();
formData.append('emergencyTypes', JSON.stringify(['FIRE']));
formData.append('emergencyServices', JSON.stringify(['FIRE_DEPARTMENT']));
formData.append('description', 'Building fire on Main St');
formData.append('location', JSON.stringify({ lat: 37.7749, lng: -122.4194 }));
formData.append('photo', photoFile);

const response = await axios.post('http://localhost:3000/emergency/request', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

## Success Response

**Status Code:** `201 Created`

```json
{
  "success": true,
  "message": "Emergency request created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "emergencyTypes": ["CAR_ACCIDENT", "MEDICAL_EMERGENCY"],
    "emergencyServices": ["POLICE", "AMBULANCE"],
    "description": "Multi-vehicle collision on Highway 101. Multiple injuries.",
    "photoUri": "/uploads/1643801400-photo.jpg",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": "2026-02-02T10:30:00.000Z",
    "status": "QUEUED",
    "createdAt": "2026-02-02T10:30:05.000Z"
  }
}
```

## Error Responses

### Validation Error (400 Bad Request)

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

### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## TypeScript Types

```typescript
// Request types
interface EmergencyRequestPayload {
  emergencyTypes: EmergencyType[];
  emergencyServices: EmergencyService[];
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp?: string; // ISO 8601 format
  photo?: File; // For multipart/form-data only
}

// Response types
interface EmergencyRequestResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    emergencyTypes: EmergencyType[];
    emergencyServices: EmergencyService[];
    description: string;
    photoUri: string | null;
    lat: number;
    lng: number;
    timestamp: string;
    status: 'QUEUED' | 'SENT' | 'FAILED';
    createdAt: string;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

## Best Practices

1. **Always get user location permission first** before calling this endpoint
2. **Validate data on the client side** before sending to reduce round trips
3. **Handle offline scenarios** - queue requests and send when connection is restored
4. **Show loading states** - emergency requests may take a few seconds
5. **Compress photos** before upload to reduce bandwidth and speed up uploads
6. **Use retry logic** for failed requests with exponential backoff
7. **Log errors** for debugging but don't expose sensitive info to users

## Common Issues

### Issue: "At least one emergency type is required"
**Solution:** Ensure `emergencyTypes` is an array with at least one valid value

### Issue: "Description cannot exceed 500 characters"
**Solution:** Limit description input on the client side to 500 characters

### Issue: Location not being sent
**Solution:** Make sure location permissions are granted and you're sending `{lat, lng}` object

### Issue: Photo upload failing
**Solution:** Check that:
- File is a valid image format (JPEG, PNG)
- Using `multipart/form-data` content type
- Other fields are JSON stringified when using FormData
- File size is reasonable (< 10MB recommended)

## Additional Endpoints

### Get Emergency Request
```
GET /emergency/request/:id
```

### List Emergency Requests
```
GET /emergency/requests?status=QUEUED&limit=20&offset=0
```

### Update Status (Admin Only)
```
PATCH /emergency/request/:id/status
Authorization: Bearer <token>

{
  "status": "SENT"
}
```

For complete documentation, see [DOCS.md](./DOCS.md)
