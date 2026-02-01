/**
 * Profile repository - handles database operations for user profile data
 * @param {PrismaClient} prisma - Prisma client instance
 */
export function createProfileRepo(prisma) {
  // Safe field selection - excludes passwordHash
  const safeUserSelect = {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    
    // Personal Information
    displayName: true,
    username: true,
    profilePictureUrl: true,
    phoneNumber: true,
    country: true,
    city: true,
    address: true,
    street: true,
    
    // Medical Information
    bloodType: true,
    allergies: true,
    chronicConditions: true,
    currentMedications: true,
    disabilities: true,
    medicalNotes: true,
    heightCm: true,
    weightKg: true,
    smoker: true,
    alcoholConsumption: true,
    medicalInfoUpdatedAt: true,
    
    // Identification Data
    fullLegalName: true,
    dateOfBirth: true,
    gender: true,
    nationality: true,
    nationalIdNumber: true,
    passportNumber: true,
    emergencyContactName: true,
    emergencyContactPhone: true,
    emergencyContactRelation: true,
    identificationVerifiedAt: true,
  };

  return {
    /**
     * Get user's medical information
     */
    async getMedicalInfo(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          bloodType: true,
          allergies: true,
          chronicConditions: true,
          currentMedications: true,
          disabilities: true,
          medicalNotes: true,
          heightCm: true,
          weightKg: true,
          smoker: true,
          alcoholConsumption: true,
          medicalInfoUpdatedAt: true,
        },
      });
    },

    /**
     * Update user's medical information
     */
    async updateMedicalInfo(userId, data) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          medicalInfoUpdatedAt: new Date(),
        },
        select: {
          id: true,
          bloodType: true,
          allergies: true,
          chronicConditions: true,
          currentMedications: true,
          disabilities: true,
          medicalNotes: true,
          heightCm: true,
          weightKg: true,
          smoker: true,
          alcoholConsumption: true,
          medicalInfoUpdatedAt: true,
        },
      });
    },

    /**
     * Get user's identification data
     */
    async getIdentification(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullLegalName: true,
          dateOfBirth: true,
          gender: true,
          nationality: true,
          nationalIdNumber: true,
          passportNumber: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRelation: true,
          identificationVerifiedAt: true,
        },
      });
    },

    /**
     * Update user's identification data
     */
    async updateIdentification(userId, data) {
      return prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          fullLegalName: true,
          dateOfBirth: true,
          gender: true,
          nationality: true,
          nationalIdNumber: true,
          passportNumber: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRelation: true,
          identificationVerifiedAt: true,
        },
      });
    },

    /**
     * Get user's personal information
     */
    async getPersonalInfo(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          displayName: true,
          username: true,
          profilePictureUrl: true,
          email: true,
          phoneNumber: true,
          country: true,
          city: true,
          address: true,
          street: true,
        },
      });
    },

    /**
     * Update user's personal information
     */
    async updatePersonalInfo(userId, data) {
      return prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          displayName: true,
          username: true,
          profilePictureUrl: true,
          email: true,
          phoneNumber: true,
          country: true,
          city: true,
          address: true,
          street: true,
        },
      });
    },

    /**
     * Get complete user profile (all safe fields)
     */
    async getProfile(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: safeUserSelect,
      });
    },

    /**
     * Check if username is available
     */
    async isUsernameAvailable(username, excludeUserId) {
      const existing = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      
      if (!existing) return true;
      if (excludeUserId && existing.id === excludeUserId) return true;
      return false;
    },
  };
}
