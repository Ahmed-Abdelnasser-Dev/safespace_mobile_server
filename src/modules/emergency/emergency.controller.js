import { createEmergencyRequestSchema, getEmergencyRequestSchema, listEmergencyRequestsSchema } from "./emergency.validators.js";

/**
 * Emergency Controller
 * Handles HTTP requests for emergency operations
 * 
 * @param {Object} deps - Controller dependencies
 * @param {Object} deps.emergencyService - Emergency service instance
 */
export function createEmergencyController({ emergencyService }) {
  return {
    /**
     * Handler for creating a new emergency request
     * POST /emergency/request
     * 
     * @param {import('express').Request} req - Express request
     * @param {import('express').Response} res - Express response
     * @param {import('express').NextFunction} next - Express next function
     */
    createEmergencyRequestHandler: async (req, res, next) => {
      try {
        // Handle multipart/form-data parsing quirks for location
        let rawLocation = req.body.location;
        if (typeof rawLocation === "string") {
          try {
            rawLocation = JSON.parse(rawLocation);
          } catch (e) {
            // Validator will catch invalid format
          }
        }

        // Handle photo upload if present
        let photoUri = null;
        if (req.file) {
          photoUri = `/uploads/${req.file.filename}`;
        } else if (req.body.photoUri) {
          photoUri = req.body.photoUri;
        }

        // Parse emergencyTypes and emergencyServices if they're strings
        let emergencyTypes = req.body.emergencyTypes;
        if (typeof emergencyTypes === "string") {
          try {
            emergencyTypes = JSON.parse(emergencyTypes);
          } catch (e) {
            // Validator will catch invalid format
          }
        }

        let emergencyServices = req.body.emergencyServices;
        if (typeof emergencyServices === "string") {
          try {
            emergencyServices = JSON.parse(emergencyServices);
          } catch (e) {
            // Validator will catch invalid format
          }
        }

        const bodyData = {
          emergencyTypes,
          emergencyServices,
          description: req.body.description,
          location: rawLocation,
          timestamp: req.body.timestamp,
        };

        // Validate request body
        const body = createEmergencyRequestSchema.parse(bodyData);

        // Get authenticated user ID if available
        const requesterUserId = req.userId || null;

        // Create emergency request
        const result = await emergencyService.createEmergencyRequest({
          requesterUserId,
          emergencyTypes: body.emergencyTypes,
          emergencyServices: body.emergencyServices,
          description: body.description,
          photoUri,
          location: body.location,
          timestamp: body.timestamp,
        });

        res.status(201).json({
          success: true,
          message: "Emergency request created successfully",
          data: result,
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * Handler for getting a single emergency request by ID
     * GET /emergency/request/:id
     * 
     * @param {import('express').Request} req - Express request
     * @param {import('express').Response} res - Express response
     * @param {import('express').NextFunction} next - Express next function
     */
    getEmergencyRequestHandler: async (req, res, next) => {
      try {
        const params = getEmergencyRequestSchema.parse({ id: req.params.id });

        const emergencyRequest = await emergencyService.getEmergencyRequest(params.id);

        if (!emergencyRequest) {
          return res.status(404).json({
            success: false,
            message: "Emergency request not found",
          });
        }

        res.status(200).json({
          success: true,
          data: emergencyRequest,
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * Handler for listing emergency requests
     * GET /emergency/requests
     * 
     * @param {import('express').Request} req - Express request
     * @param {import('express').Response} res - Express response
     * @param {import('express').NextFunction} next - Express next function
     */
    listEmergencyRequestsHandler: async (req, res, next) => {
      try {
        const query = listEmergencyRequestsSchema.parse({
          status: req.query.status,
          limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
        });

        // If user is authenticated and not admin, filter by their user ID
        const userId = req.userId || null;
        const isAdmin = req.userRole === "ADMIN";

        const options = {
          ...query,
          // Only filter by userId if not admin
          userId: !isAdmin ? userId : undefined,
        };

        const result = await emergencyService.listEmergencyRequests(options);

        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
          },
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * Handler for updating emergency request status
     * PATCH /emergency/request/:id/status
     * Admin only endpoint
     * 
     * @param {import('express').Request} req - Express request
     * @param {import('express').Response} res - Express response
     * @param {import('express').NextFunction} next - Express next function
     */
    updateEmergencyRequestStatusHandler: async (req, res, next) => {
      try {
        const params = getEmergencyRequestSchema.parse({ id: req.params.id });
        const { status } = req.body;

        if (!["QUEUED", "SENT", "FAILED"].includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status. Must be one of: QUEUED, SENT, FAILED",
          });
        }

        const updated = await emergencyService.updateEmergencyRequestStatus(
          params.id,
          status
        );

        res.status(200).json({
          success: true,
          message: "Emergency request status updated",
          data: updated,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}
