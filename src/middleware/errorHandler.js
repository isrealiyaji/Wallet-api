/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
      error: "Duplicate entry",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Resource not found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Not found middleware
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

export default {
  errorHandler,
  notFound,
};
