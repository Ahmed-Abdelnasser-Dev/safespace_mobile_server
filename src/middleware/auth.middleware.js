import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

/**
 * Authentication middleware that verifies JWT access token
 * and attaches userId to the request object.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Missing or invalid authorization header");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      err.expose = true;
      throw err;
    }
    
    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const env = getEnv();
    
    if (!env.JWT_ACCESS_SECRET) {
      const err = new Error("JWT_ACCESS_SECRET not configured");
      err.statusCode = 500;
      err.code = "INTERNAL_ERROR";
      err.expose = false;
      throw err;
    }
    
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    
    // Attach userId to request for downstream handlers
    req.userId = payload.sub;
    
    next();
  } catch (err) {
    // Handle JWT-specific errors
    if (err.name === "JsonWebTokenError") {
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      err.message = "Invalid access token";
      err.expose = true;
    } else if (err.name === "TokenExpiredError") {
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      err.message = "Access token expired";
      err.expose = true;
    }
    
    next(err);
  }
}
