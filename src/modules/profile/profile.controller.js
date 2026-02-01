import {
  updateMedicalInfoSchema,
  updateIdentificationSchema,
  updatePersonalInfoSchema,
} from "./profile.validators.js";

/**
 * Profile controller - handles HTTP requests/responses for profile operations
 */
export function createProfileController({ profileService }) {
  return {
    /**
     * GET /me/profile - Get complete user profile
     */
    getProfile: async (req, res, next) => {
      try {
        const userId = req.userId; // Set by requireAuth middleware
        const profile = await profileService.getProfile(userId);
        res.status(200).json(profile);
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /me/medical-info - Get medical information
     */
    getMedicalInfo: async (req, res, next) => {
      try {
        const userId = req.userId;
        const medicalInfo = await profileService.getMedicalInfo(userId);
        res.status(200).json(medicalInfo);
      } catch (err) {
        next(err);
      }
    },

    /**
     * PUT /me/medical-info - Update medical information
     */
    updateMedicalInfo: async (req, res, next) => {
      try {
        const userId = req.userId;
        const body = updateMedicalInfoSchema.parse(req.body);
        const updated = await profileService.updateMedicalInfo(userId, body);
        res.status(200).json(updated);
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /me/identification - Get identification data
     */
    getIdentification: async (req, res, next) => {
      try {
        const userId = req.userId;
        const identification = await profileService.getIdentification(userId);
        res.status(200).json(identification);
      } catch (err) {
        next(err);
      }
    },

    /**
     * PUT /me/identification - Update identification data
     */
    updateIdentification: async (req, res, next) => {
      try {
        const userId = req.userId;
        const body = updateIdentificationSchema.parse(req.body);
        const updated = await profileService.updateIdentification(userId, body);
        res.status(200).json(updated);
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /me/personal-info - Get personal information
     */
    getPersonalInfo: async (req, res, next) => {
      try {
        const userId = req.userId;
        const personalInfo = await profileService.getPersonalInfo(userId);
        res.status(200).json(personalInfo);
      } catch (err) {
        next(err);
      }
    },

    /**
     * PATCH /me/personal-info - Update personal information
     */
    updatePersonalInfo: async (req, res, next) => {
      try {
        const userId = req.userId;
        const body = updatePersonalInfoSchema.parse(req.body);
        const updated = await profileService.updatePersonalInfo(userId, body);
        res.status(200).json(updated);
      } catch (err) {
        next(err);
      }
    },
  };
}
