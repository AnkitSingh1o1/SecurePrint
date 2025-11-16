import mongoose, { Schema, Document } from "mongoose";

export interface FileDocument extends Document {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  s3Key?: string;
  uploadedAt: Date;
}

const FileSchema = new Schema<FileDocument>(
  {
    id: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String },
    s3Key: { type: String },
    uploadedAt: { type: Date, required: true },
  },
  { collection: "files" }
);

FileSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

export const FileModel = mongoose.model<FileDocument>("File", FileSchema);

export interface FileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  s3Key?: string;
  uploadedAt: Date;
}
