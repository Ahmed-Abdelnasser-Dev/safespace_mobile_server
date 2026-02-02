# Mobile App Implementation Guide - Emergency Request

This guide shows how to implement the Emergency Request feature in your React Native mobile app.

## Table of Contents
1. [Service Layer](#service-layer)
2. [State Management](#state-management)
3. [UI Components](#ui-components)
4. [Permissions & Location](#permissions--location)
5. [Complete Example](#complete-example)

---

## Service Layer

### 1. API Service (`services/emergencyService.ts`)

```typescript
import * as FileSystem from 'expo-file-system';
import {
  EmergencyType,
  EmergencyService,
  CreateEmergencyRequestPayload,
  CreateEmergencyRequestResponse,
  Location,
} from '../types/api';

const API_BASE_URL = 'http://localhost:3000'; // Replace with your API URL

export class EmergencyService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create an emergency request without photo
   */
  async createEmergencyRequest(
    payload: CreateEmergencyRequestPayload
  ): Promise<CreateEmergencyRequestResponse> {
    const response = await fetch(`${this.baseUrl}/emergency/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create emergency request');
    }

    return response.json();
  }

  /**
   * Create an emergency request with photo
   */
  async createEmergencyRequestWithPhoto(
    payload: CreateEmergencyRequestPayload,
    photoUri: string
  ): Promise<CreateEmergencyRequestResponse> {
    const formData = new FormData();
    
    // Add emergency data as JSON strings
    formData.append('emergencyTypes', JSON.stringify(payload.emergencyTypes));
    formData.append('emergencyServices', JSON.stringify(payload.emergencyServices));
    formData.append('description', payload.description);
    formData.append('location', JSON.stringify(payload.location));
    
    if (payload.timestamp) {
      formData.append('timestamp', payload.timestamp);
    }

    // Add photo
    const filename = photoUri.split('/').pop() || 'emergency-photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${this.baseUrl}/emergency/request`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type - let fetch set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create emergency request');
    }

    return response.json();
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Location> {
    const { Location } = await import('expo-location');
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  }
}

// Singleton instance
export const emergencyService = new EmergencyService();
```

---

## State Management

### 2. React Context (`context/EmergencyContext.tsx`)

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  EmergencyType,
  EmergencyService as EmergencyServiceEnum,
  CreateEmergencyRequestResponse,
  Location,
} from '../types/api';
import { emergencyService } from '../services/emergencyService';

interface EmergencyContextType {
  loading: boolean;
  error: string | null;
  currentRequest: CreateEmergencyRequestResponse['data'] | null;
  
  createEmergencyRequest: (
    emergencyTypes: EmergencyType[],
    emergencyServices: EmergencyServiceEnum[],
    description: string,
    location: Location,
    photoUri?: string
  ) => Promise<void>;
  
  clearError: () => void;
  clearCurrentRequest: () => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<CreateEmergencyRequestResponse['data'] | null>(null);

  const createEmergencyRequest = useCallback(
    async (
      emergencyTypes: EmergencyType[],
      emergencyServices: EmergencyServiceEnum[],
      description: string,
      location: Location,
      photoUri?: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          emergencyTypes,
          emergencyServices,
          description,
          location,
          timestamp: new Date().toISOString(),
        };

        let response: CreateEmergencyRequestResponse;

        if (photoUri) {
          response = await emergencyService.createEmergencyRequestWithPhoto(payload, photoUri);
        } else {
          response = await emergencyService.createEmergencyRequest(payload);
        }

        setCurrentRequest(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create emergency request';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(null);
  }, []);

  return (
    <EmergencyContext.Provider
      value={{
        loading,
        error,
        currentRequest,
        createEmergencyRequest,
        clearError,
        clearCurrentRequest,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within EmergencyProvider');
  }
  return context;
}
```

---

## UI Components

### 3. Emergency Request Screen (`screens/EmergencyRequestScreen.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { EmergencyType, EmergencyService as EmergencyServiceEnum } from '../types/api';
import { useEmergency } from '../context/EmergencyContext';

export function EmergencyRequestScreen() {
  const { loading, error, createEmergencyRequest, clearError } = useEmergency();
  
  // Form state
  const [selectedTypes, setSelectedTypes] = useState<EmergencyType[]>([]);
  const [selectedServices, setSelectedServices] = useState<EmergencyServiceEnum[]>([]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Location Required',
        'Emergency services need your location. Please enable location permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleType = (type: EmergencyType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleService = (service: EmergencyServiceEnum) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Camera permission required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one emergency type');
      return;
    }

    if (selectedServices.length === 0) {
      Alert.alert('Error', 'Please select at least one emergency service');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    if (description.length > 500) {
      Alert.alert('Error', 'Description cannot exceed 500 characters');
      return;
    }

    if (!locationGranted) {
      Alert.alert('Error', 'Location permission is required');
      return;
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      await createEmergencyRequest(
        selectedTypes,
        selectedServices,
        description,
        locationData,
        photoUri || undefined
      );

      Alert.alert(
        'Success',
        'Emergency request sent successfully. Help is on the way!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedTypes([]);
              setSelectedServices([]);
              setDescription('');
              setPhotoUri(null);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send emergency request');
    }
  };

  const emergencyTypes: { value: EmergencyType; label: string; icon: string }[] = [
    { value: 'CAR_ACCIDENT', label: 'Car Accident', icon: '🚗' },
    { value: 'MEDICAL_EMERGENCY', label: 'Medical Emergency', icon: '🏥' },
    { value: 'FIRE', label: 'Fire', icon: '🔥' },
    { value: 'CRIME_VIOLENCE', label: 'Crime/Violence', icon: '🚨' },
    { value: 'VEHICLE_BREAKDOWN', label: 'Vehicle Breakdown', icon: '🔧' },
    { value: 'OTHER', label: 'Other', icon: '⚠️' },
  ];

  const emergencyServices: { value: EmergencyServiceEnum; label: string; icon: string }[] = [
    { value: 'POLICE', label: 'Police', icon: '👮' },
    { value: 'AMBULANCE', label: 'Ambulance', icon: '🚑' },
    { value: 'FIRE_DEPARTMENT', label: 'Fire Department', icon: '🚒' },
    { value: 'ROADSIDE_ASSISTANCE', label: 'Roadside Assistance', icon: '🔧' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Request</Text>
        <Text style={styles.subtitle}>Select emergency type and describe the situation</Text>
      </View>

      {/* Emergency Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Type *</Text>
        <View style={styles.buttonGrid}>
          {emergencyTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                selectedTypes.includes(type.value) && styles.typeButtonSelected,
              ]}
              onPress={() => toggleType(type.value)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  selectedTypes.includes(type.value) && styles.typeLabelSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Emergency Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Needed *</Text>
        <View style={styles.buttonGrid}>
          {emergencyServices.map((service) => (
            <TouchableOpacity
              key={service.value}
              style={[
                styles.serviceButton,
                selectedServices.includes(service.value) && styles.serviceButtonSelected,
              ]}
              onPress={() => toggleService(service.value)}
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text
                style={[
                  styles.serviceLabel,
                  selectedServices.includes(service.value) && styles.serviceLabelSelected,
                ]}
              >
                {service.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description * ({description.length}/500)</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Describe the emergency situation in detail..."
          value={description}
          onChangeText={setDescription}
          maxLength={500}
        />
      </View>

      {/* Photo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo (Optional)</Text>
        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
              <Text style={styles.removePhotoText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Text style={styles.addPhotoText}>📷 Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>🚨 SEND EMERGENCY REQUEST</Text>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⚠️ Your location will be shared with emergency services
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#dc2626',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fee',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#dc2626',
    fontWeight: '600',
  },
  serviceButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceButtonSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  serviceLabelSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removePhotoButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 14,
  },
  addPhotoButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    marginBottom: 8,
  },
  errorDismiss: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
```

---

## Complete Example

### 4. App Entry Point (`App.tsx`)

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EmergencyProvider } from './context/EmergencyContext';
import { EmergencyRequestScreen } from './screens/EmergencyRequestScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <EmergencyProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="EmergencyRequest"
            component={EmergencyRequestScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </EmergencyProvider>
  );
}
```

---

## Installation

### Required Dependencies

```bash
# Core dependencies
npm install @react-navigation/native @react-navigation/native-stack

# Expo dependencies
npx expo install expo-location expo-image-picker expo-file-system

# React Native dependencies (if not using Expo)
npm install react-native-screens react-native-safe-area-context
```

---

## Testing

### 5. Manual Testing Checklist

- [ ] Location permission requested on app launch
- [ ] Can select multiple emergency types
- [ ] Can select multiple emergency services
- [ ] Description validates 1-500 characters
- [ ] Can take and attach photo
- [ ] Can remove attached photo
- [ ] Submit button shows loading state
- [ ] Success alert shown after submission
- [ ] Form resets after successful submission
- [ ] Error messages displayed correctly
- [ ] Works without photo (optional field)
- [ ] Works offline (shows appropriate error)

---

## Production Considerations

1. **API URL**: Replace `http://localhost:3000` with your production API URL
2. **Error Handling**: Add retry logic for network failures
3. **Offline Support**: Queue requests when offline
4. **Photo Compression**: Compress photos before upload to save bandwidth
5. **Analytics**: Track emergency request creation events
6. **Crash Reporting**: Integrate Sentry or similar for error tracking
7. **Performance**: Use React.memo for optimization
8. **Accessibility**: Add proper accessibility labels
9. **Testing**: Add unit and integration tests
10. **Localization**: Support multiple languages

---

## Advanced Features

### Background Location Tracking

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundLocation from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    // Store location for emergency use
  }
});

export async function startBackgroundLocationTracking() {
  await BackgroundLocation.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: BackgroundLocation.Accuracy.High,
    distanceInterval: 100,
  });
}
```

### Retry Logic

```typescript
async function createEmergencyRequestWithRetry(
  payload: CreateEmergencyRequestPayload,
  photoUri?: string,
  maxRetries = 3
): Promise<CreateEmergencyRequestResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (photoUri) {
        return await emergencyService.createEmergencyRequestWithPhoto(payload, photoUri);
      } else {
        return await emergencyService.createEmergencyRequest(payload);
      }
    } catch (error) {
      lastError = error as Error;
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed after retries');
}
```

### Offline Queue

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@emergency_requests_queue';

export async function queueEmergencyRequest(payload: any) {
  const queue = await getQueue();
  queue.push({ ...payload, timestamp: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function processQueue() {
  const queue = await getQueue();
  
  for (const request of queue) {
    try {
      await emergencyService.createEmergencyRequest(request);
      // Remove from queue on success
      await removeFromQueue(request.timestamp);
    } catch (error) {
      console.error('Failed to process queued request', error);
    }
  }
}

async function getQueue() {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

async function removeFromQueue(timestamp: number) {
  const queue = await getQueue();
  const updated = queue.filter((r: any) => r.timestamp !== timestamp);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}
```

---

## Summary

This implementation provides:

✅ Complete service layer for API integration  
✅ React Context for state management  
✅ Full-featured UI component with validation  
✅ Photo upload support  
✅ Location permission handling  
✅ Error handling and user feedback  
✅ Production-ready code structure  
✅ Advanced features (retry, offline queue)  

**Next Steps:**
1. Install dependencies
2. Copy service and context code
3. Integrate EmergencyRequestScreen into your navigation
4. Update API_BASE_URL with your server URL
5. Test thoroughly before production release
