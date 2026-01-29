import {
  reportAccidentSchema,
  emergencyRequestSchema,
} from "./accidents.validators.js";

export function createAccidentsController({ accidentsService }) {
  return {
    reportAccidentHandler: async (req, res, next) => {
      try {
        // Handle multipart/form-data parsing quirks
        let rawLocation = req.body.location;
        if (typeof rawLocation === "string") {
          try {
            rawLocation = JSON.parse(rawLocation);
          } catch (e) {
            // ignore JSON parse error, validator will catch invalid format
          }
        }

        // Parse media from body if it's a JSON string
        let bodyMedia = [];
        if (req.body.media) {
          if (typeof req.body.media === "string") {
            try {
              bodyMedia = JSON.parse(req.body.media);
            } catch (e) {
              // ignore, will be empty array
            }
          } else if (Array.isArray(req.body.media)) {
            bodyMedia = req.body.media;
          }
        }

        // Construct media from uploaded files
        const uploadedMedia = (req.files || []).map((file) => ({
          type: file.mimetype.startsWith("video") ? "video" : "image",
          url: `/uploads/${file.filename}`,
        }));

        const bodyData = {
          location: rawLocation,
          message: req.body.message,
          occurredAt: req.body.occurredAt,
          media: [...bodyMedia, ...uploadedMedia],
        };

        const body = reportAccidentSchema.parse(bodyData);
        const result = await accidentsService.reportAccident({
          reporterUserId: null,
          location: body.location,
          message: body.message,
          occurredAt: body.occurredAt,
          media: body.media || [],
        });
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    emergencyRequestHandler: async (req, res, next) => {
      try {
        const body = emergencyRequestSchema.parse(req.body);
        const result = await accidentsService.createEmergencyRequest({
          requesterUserId: null,
          requestedAt: body.requestedAt,
          location: body.location,
          message: body.message,
          requestTypes: body.requestTypes,
        });
        res.status(202).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}
