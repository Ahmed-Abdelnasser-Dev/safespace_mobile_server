# Profile module

## Responsibilities
- Manage user profile data across three categories: Medical Information, Identification Data, and Personal Information.
- Provide authenticated endpoints for users to view and update their profile.
- Ensure sensitive data (medical records, ID numbers) is handled securely.

## Public endpoints
All endpoints require authentication (JWT access token via `Authorization: Bearer` header):

### Complete Profile
- `GET /me/profile` - Get complete user profile (all safe fields)

### Medical Information
- `GET /me/medical-info` - Get medical information
- `PUT /me/medical-info` - Update medical information

### Identification Data
- `GET /me/identification` - Get identification data
- `PUT /me/identification` - Update identification data

### Personal Information
- `GET /me/personal-info` - Get personal information
- `PATCH /me/personal-info` - Update personal information

## Security features
- All endpoints protected by `requireAuth` middleware
- Users can only access/modify their own data (userId from JWT)
- Password hash never returned in responses
- Username uniqueness validation
- Email uniqueness validation
- Zod schema validation on all inputs

## Key exports
- `createProfileService()` in `profile.service.js`
- `createProfileController()` in `profile.controller.js`
- `createProfileRouter()` in `profile.routes.js`
