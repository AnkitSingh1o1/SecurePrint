import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import fileRoutes from "./routes";
import { connectDB } from "./configs/dbConfig";

connectDB(); 

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

// Health check route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "✅ SecurePrint API is running fine!" });
});

// File-related routes
app.use("/api/files", fileRoutes);

// Global error handler
// app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//   errorHandler(err, res);
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 SecurePrint backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;