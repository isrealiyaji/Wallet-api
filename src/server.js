import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import "./config/database.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(helmet());


app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use("/", limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Wallet App API",
    version: "1.0.0",
    documentation: "/api/health",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes with /api prefix
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/wallet", walletRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start serve
app.listen(PORT, () => {
  console.log(`
   Wallet App API Server Runnin
    Environment: ${process.env.NODE_ENV?.padEnd(24) || "development".padEnd(24)}
     Port: ${PORT.toString().padEnd(31)}
     URL: http://localhost:${PORT.toString().padEnd(17)}
                                          
     API Documentation:                
     http://localhost:${PORT}/health${" ".padEnd(8)}
  
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

export default app;
