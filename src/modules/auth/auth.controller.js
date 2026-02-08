import { 
  registerSchema, 
  loginSchema, 
  refreshSchema, 
  logoutSchema, 
  updateFcmTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema 
} from "./auth.validators.js";

export function createAuthController({ authService }) {
  return {
    register: async (req, res, next) => {
      try {
        const body = registerSchema.parse(req.body);
        const result = await authService.register(body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    login: async (req, res, next) => {
      try {
        const body = loginSchema.parse(req.body);
        const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
        const userAgent = req.get("user-agent") || "unknown";
        
        const result = await authService.login({ 
          ...body, 
          ipAddress, 
          userAgent 
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    refresh: async (req, res, next) => {
      try {
        const body = refreshSchema.parse(req.body);
        const result = await authService.refresh(body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    logout: async (req, res, next) => {
      try {
        const body = logoutSchema.parse(req.body);
        const result = await authService.logout(body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    updateFcmToken: async (req, res, next) => {
      try {
        const body = updateFcmTokenSchema.parse(req.body);
        const result = await authService.updateFcmToken(body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    verifyEmail: async (req, res, next) => {
      try {
        const body = verifyEmailSchema.parse(req.body);
        const result = await authService.verifyEmail(body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    resendVerificationEmail: async (req, res, next) => {
      try {
        const body = resendVerificationSchema.parse(req.body);
        const result = await authService.resendVerificationEmail(body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}

