import { v4 as uuidv4 } from 'uuid';
import { FileRepository } from '../repositories/fileRepo';
import { AppError } from '../utils/errorHandler';
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_NAME } from "../utils/s3Client";
import fs from 'fs';
import path from 'path';
import { FileRecord } from '../models/file';
import mime from 'mime';
import { UploadedFile } from "express-fileupload";

export class FileService {
  private static instance: FileService;
  private readonly fileRepo: FileRepository;

  private constructor() {
    this.fileRepo = FileRepository.getInstance();
  }

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  public saveUploadedFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    return files.map((file) => {
    // ...inside upload route after file is saved
    const detectedMime = mime.lookup(file.originalname) || file.mimetype;
      const record = {
        id: uuidv4(),
        originalName: file.originalname,
        mimeType: detectedMime,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
      };
      return this.fileRepo.saveFile(record);
    });
  }

  /**
   * Upload files to S3 and save metadata in repository
   */
async uploadFiles(files: UploadedFile[]): Promise<FileRecord[]> {
  if (!files || files.length === 0) throw new AppError("No files uploaded", 400);

  const savedFiles: FileRecord[] = [];

  for (const file of files) {
    //express-fileupload uses `file.name`, not `file.originalname`
    const originalName = file.name || "unknown.pdf";
    //Safely handle undefined file names or extensions
    const extension = originalName?.includes(".")
      ? originalName.split(".").pop()
      : "";

    //Use mime-types lookup safely, fallback to file.mimetype or default
    const mimeType =
      (extension && mime.lookup(extension)) ||
      file.mimetype ||
      "application/octet-stream";

    //Safe S3 key generation
    const s3Key = `${uuidv4()}-${originalName}`;

    //Upload to S3
    await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: file.data, // express-fileupload provides Buffer here
          ContentType: mimeType,
        })
      );

    const record: FileRecord = {
        id: uuidv4(),
        originalName,
        mimeType,
        size: file.size || 0,
        s3Key,
        uploadedAt: new Date(),
      };

    this.fileRepo.saveFile(record);
    savedFiles.push(record);
  }

  return savedFiles;
}



  public getAllFiles() {
    return this.fileRepo.getAllFiles();
  }

  public streamFile(fileId: string, res: any) {
    const file = this.fileRepo.getFileById(fileId);
    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (!file.path) {
      throw new AppError('File path is undefined', 500);
    }
    const filePath = path.resolve(file.path);
    const readStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', file.mimeType);
    readStream.pipe(res);
  }

  async generateShareLink(fileId: string, expiresInSec = 600) {
    const file = this.fileRepo.getFileById(fileId);
    if (!file) throw new AppError("File not found", 404);

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: file.s3Key!,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSec });
    return url;
  }

    //Stream file directly from S3
  async streamFileFromS3(id: string) {
    const file = this.fileRepo.getFileById(id);
    if (!file) return null;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    const response = await s3Client.send(command);
    return {
    Body: response.Body,
    ContentType: response.ContentType,
    FileName: file.originalName,
  };  
}

  async generateSignedUrl(id: string) {
    const file = this.fileRepo.getFileById(id);
    if (!file) return null;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min
  }
}