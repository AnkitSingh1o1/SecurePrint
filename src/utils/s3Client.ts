import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config(); 
if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_BUCKET_NAME
) {
  console.warn("⚠️ Missing one or more AWS environment variables");
}
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";