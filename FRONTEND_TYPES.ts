/**
 * SafeSpace Mobile App - API Type Definitions & Interfaces
 * Use this file in your mobile app for full type safety
 * 
 * Last Updated: February 1, 2026
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface AuthResponse {
  user: UserBase;
  accessToken: string;
  refreshToken: string;
}

export interface UserBase {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string; // ISO 8601 DateTime
  updatedAt: string; // ISO 8601 DateTime
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface UserProfile extends UserBase {
  // Personal Information
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  address?: string;
  street?: string;

  // Medical Information
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  disabilities?: string[];
  medicalNotes?: string;
  heightCm?: number;
  weightKg?: number;
  smoker?: boolean;
  alcoholConsumption?: AlcoholConsumption;
  medicalInfoUpdatedAt?: string; // ISO 8601 DateTime

  // Identification Data
  fullLegalName?: string;
  dateOfBirth?: string; // ISO 8601 DateTime
  gender?: Gender;
  nationality?: string;
  nationalIdNumber?: string;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  identificationVerifiedAt?: string; // ISO 8601 DateTime
}

// ============================================================================
// MEDICAL INFORMATION
// ============================================================================

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type AlcoholConsumption = 'none' | 'occasional' | 'moderate' | 'heavy';

export interface MedicalInfo {
  id: string;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  disabilities?: string[];
  medicalNotes?: string;
  heightCm?: number;
  weightKg?: number;
  smoker?: boolean;
  alcoholConsumption?: AlcoholConsumption;
  medicalInfoUpdatedAt?: string; // ISO 8601 DateTime
}

export interface MedicalInfoUpdate {
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  disabilities?: string[];
  medicalNotes?: string;
  heightCm?: number;
  weightKg?: number;
  smoker?: boolean;
  alcoholConsumption?: AlcoholConsumption;
}

// ============================================================================
// IDENTIFICATION DATA
// ============================================================================

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Identification {
  id: string;
  fullLegalName?: string;
  dateOfBirth?: string; // ISO 8601 DateTime
  gender?: Gender;
  nationality?: string;
  nationalIdNumber?: string;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  identificationVerifiedAt?: string; // ISO 8601 DateTime
}

export interface IdentificationUpdate {
  fullLegalName?: string;
  dateOfBirth?: string; // ISO 8601 DateTime
  gender?: Gender;
  nationality?: string;
  nationalIdNumber?: string;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

// ============================================================================
// PERSONAL INFORMATION
// ============================================================================

export interface PersonalInfo {
  id: string;
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  address?: string;
  street?: string;
}

export interface PersonalInfoUpdate {
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  address?: string;
  street?: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface ApiError {
  statusCode: number;
  code: ErrorCode;
  message: string;
  issues?: ValidationIssue[];
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'CENTRAL_UNIT_AUTH_FAILED';

export interface ValidationIssue {
  code: string;
  path: string[];
  message: string;
}

// ============================================================================
// VALIDATION CONSTRAINTS
// ============================================================================

export const VALIDATION_CONSTRAINTS = {
  medicalInfo: {
    bloodType: {
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    },
    allergies: {
      maxItems: 50,
      itemMaxLength: 200,
    },
    chronicConditions: {
      maxItems: 50,
      itemMaxLength: 200,
    },
    currentMedications: {
      maxItems: 100,
      itemMaxLength: 200,
    },
    disabilities: {
      maxItems: 30,
      itemMaxLength: 200,
    },
    medicalNotes: {
      maxLength: 5000,
    },
    heightCm: {
      min: 30,
      max: 300,
    },
    weightKg: {
      min: 2,
      max: 500,
    },
    smoker: {
      type: 'boolean',
    },
    alcoholConsumption: {
      enum: ['none', 'occasional', 'moderate', 'heavy'],
    },
  },
  identification: {
    fullLegalName: {
      minLength: 1,
      maxLength: 200,
    },
    dateOfBirth: {
      type: 'datetime',
    },
    gender: {
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    nationality: {
      maxLength: 100,
    },
    nationalIdNumber: {
      maxLength: 100,
    },
    passportNumber: {
      maxLength: 100,
    },
    emergencyContactName: {
      minLength: 1,
      maxLength: 200,
    },
    emergencyContactPhone: {
      minLength: 5,
      maxLength: 50,
    },
    emergencyContactRelation: {
      maxLength: 100,
    },
  },
  personalInfo: {
    displayName: {
      minLength: 1,
      maxLength: 100,
    },
    username: {
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z0-9_-]+$',
    },
    profilePictureUrl: {
      type: 'url',
      maxLength: 500,
    },
    email: {
      type: 'email',
      maxLength: 255,
    },
    phoneNumber: {
      maxLength: 50,
    },
    country: {
      maxLength: 100,
    },
    city: {
      maxLength: 100,
    },
    address: {
      maxLength: 500,
    },
    street: {
      maxLength: 200,
    },
  },
} as const;

// ============================================================================
// HTTP REQUEST/RESPONSE
// ============================================================================

export interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface HttpResponse<T> {
  status: number;
  data: T;
  error?: ApiError;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IAuthService {
  register(email: string, password: string, fullName: string, phone: string): Promise<AuthResponse>;
  login(email: string, password: string, deviceId?: string): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
}

export interface IProfileService {
  getProfile(): Promise<UserProfile>;
  
  getMedicalInfo(): Promise<MedicalInfo>;
  updateMedicalInfo(data: MedicalInfoUpdate): Promise<MedicalInfo>;
  
  getIdentification(): Promise<Identification>;
  updateIdentification(data: IdentificationUpdate): Promise<Identification>;
  
  getPersonalInfo(): Promise<PersonalInfo>;
  updatePersonalInfo(data: PersonalInfoUpdate): Promise<PersonalInfo>;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export interface ProfileState {
  loading: boolean;
  error: ApiError | null;
  profile: UserProfile | null;
  medicalInfo: MedicalInfo | null;
  identification: Identification | null;
  personalInfo: PersonalInfo | null;
  lastUpdated: {
    profile?: Date;
    medicalInfo?: Date;
    identification?: Date;
    personalInfo?: Date;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: ApiError | null;
  user: UserBase | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface MedicalInfoFormData {
  bloodType: BloodType | '';
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  disabilities: string;
  medicalNotes: string;
  heightCm: number | '';
  weightKg: number | '';
  smoker: boolean;
  alcoholConsumption: AlcoholConsumption | '';
}

export interface IdentificationFormData {
  fullLegalName: string;
  dateOfBirth: string; // ISO format
  gender: Gender | '';
  nationality: string;
  nationalIdNumber: string;
  passportNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

export interface PersonalInfoFormData {
  displayName: string;
  username: string;
  profilePictureUrl: string;
  email: string;
  phoneNumber: string;
  country: string;
  city: string;
  address: string;
  street: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

export type Partial<T> = {
  [K in keyof T]?: T[K];
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
