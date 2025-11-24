import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import fileRoutes from "./routes";
import { connectDB } from "./configs/dbConfig";
import { testRedisConnection } from "./configs/redisClient";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { scheduleCleanup } from "./cron/cleanup";
import { enforceHTTPS } from "./middleware/httpsRedirect";
import { globalErrorHandler } from "./middleware/errorHandler";

dotenv.config();
connectDB();

const allowedOrigins = [
  "http://localhost:3000",                 // Frontend local
  "https://secure-print-frontend.vercel.app", // Frontend prod
  "https://secureprint-19d4.onrender.com",
  "https://secure-print-frontend-gt9cn76e7-ankits-projects-addbf167.vercel.app" // Frontend URL
];

const requiredEnvVars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
}

const app: Application = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Allow preflight
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(morgan("dev"));
app.use(enforceHTTPS);

// Trust reverse proxy (needed for HTTPS redirects)
app.set("trust proxy", 1);

// Security headers
app.disable("x-powered-by");

// Prevent MIME sniffing
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// Prevent your viewer from being embedded elsewhere (clickjacking)
// app.use((req, res, next) => {
//   res.setHeader("X-Frame-Options", "DENY");
//   next();
// });

// Prevent small-scale XSS attacks
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Health check route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "SecurePrint API is running fine!" });
});

// File-related routes
app.use("/api/files", fileRoutes);

// Global error handler
app.use(globalErrorHandler);

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute globally
  message: "Too many requests, slow down."
});
app.use(globalLimiter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`:: SecurePrint backend running on port ${PORT}`);
  console.log(`:: Environment: ${process.env.NODE_ENV || "development"}`);
});

testRedisConnection();
scheduleCleanup();

export default app;