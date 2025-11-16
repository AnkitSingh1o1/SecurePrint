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

scheduleCleanup();
connectDB(); 
const allowedOrigins = [
  "http://localhost:4000",         
]
dotenv.config();

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

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(morgan("dev"));

// Redirect HTTP → HTTPS in production
app.use(enforceHTTPS);

// Trust reverse proxy (necessary for x-forwarded-proto to work)
app.set("trust proxy", 1);

// Health check route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "SecurePrint API is running fine!" });
});

// File-related routes
app.use("/api/files", fileRoutes);

// Global error handler
// app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//   errorHandler(err, res);
// });
app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server or Postman (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE"],
  })
);

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

export default app;