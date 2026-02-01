/**
 * Profile service - business logic for user profile operations
 */
export function createProfileService({ profileRepo }) {
  
  function makeError(statusCode, code, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.code = code;
    err.expose = true;
    return err;
  }

  return {
    /**
     * Get user's medical information
     */
    async getMedicalInfo(userId) {
      const medicalInfo = await profileRepo.getMedicalInfo(userId);
      
      if (!medicalInfo) {
        throw makeError(404, "NOT_FOUND", "User not found");
      }
      
      return medicalInfo;
    },

    /**
     * Update user's medical information
     */
    async updateMedicalInfo(userId, data) {
      try {
        const updated = await profileRepo.updateMedicalInfo(userId, data);
        return updated;
      } catch (err) {
        if (err.code === "P2025") {
          throw makeError(404, "NOT_FOUND", "User not found");
        }
        throw err;
      }
    },

    /**
     * Get user's identification data
     */
    async getIdentification(userId) {
      const identification = await profileRepo.getIdentification(userId);
      
      if (!identification) {
        throw makeError(404, "NOT_FOUND", "User not found");
      }
      
      return identification;
    },

    /**
     * Update user's identification data
     */
    async updateIdentification(userId, data) {
      try {
        const updated = await profileRepo.updateIdentification(userId, data);
        return updated;
      } catch (err) {
        if (err.code === "P2025") {
          throw makeError(404, "NOT_FOUND", "User not found");
        }
        throw err;
      }
    },

    /**
     * Get user's personal information
     */
    async getPersonalInfo(userId) {
      const personalInfo = await profileRepo.getPersonalInfo(userId);
      
      if (!personalInfo) {
        throw makeError(404, "NOT_FOUND", "User not found");
      }
      
      return personalInfo;
    },

    /**
     * Update user's personal information
     */
    async updatePersonalInfo(userId, data) {
      // Check username uniqueness if provided
      if (data.username) {
        const isAvailable = await profileRepo.isUsernameAvailable(data.username, userId);
        if (!isAvailable) {
          throw makeError(409, "CONFLICT", "Username already taken");
        }
      }
      
      try {
        const updated = await profileRepo.updatePersonalInfo(userId, data);
        return updated;
      } catch (err) {
        if (err.code === "P2025") {
          throw makeError(404, "NOT_FOUND", "User not found");
        }
        if (err.code === "P2002") {
          // Unique constraint violation
          if (err.meta?.target?.includes("username")) {
            throw makeError(409, "CONFLICT", "Username already taken");
          }
          if (err.meta?.target?.includes("email")) {
            throw makeError(409, "CONFLICT", "Email already in use");
          }
        }
        throw err;
      }
    },

    /**
     * Get complete user profile
     */
    async getProfile(userId) {
      const profile = await profileRepo.getProfile(userId);
      
      if (!profile) {
        throw makeError(404, "NOT_FOUND", "User not found");
      }
      
      return profile;
    },
  };
}
