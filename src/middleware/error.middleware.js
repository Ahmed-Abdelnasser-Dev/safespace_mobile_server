import { ERROR_CODES } from "../config/constants.js";

export function notFoundMiddleware(req, res) {
  res.status(404).json({
    code: ERROR_CODES.NOT_FOUND,
    message: "Route not found",
    requestId: req.requestId,
  });
}

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  // Validation errors (zod)
  if (err.name === "ZodError") {
    return res.status(400).json({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Validation failed",
      details: err.issues?.map((i) => ({
        path: i.path?.join("."),
        message: i.message,
      })),
      requestId: req.requestId,
    });
  }

  const code = err.code || (status >= 500 ? ERROR_CODES.INTERNAL_ERROR : "ERROR");
  const body = {
    code,
    message: err.expose ? err.message : status >= 500 ? "Internal server error" : err.message,
    requestId: req.requestId,
  };

  if (process.env.NODE_ENV !== "production" && status >= 500) {
    body.debug = { message: err.message, stack: err.stack };
  }

  res.status(status).json(body);
}

