import { v4 as uuidv4 } from 'uuid';
import { FileRepository } from '../repositories/fileRepo';
import { AppError } from '../utils/errorHandler';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_NAME } from "../utils/s3Client";
import fs from 'node:fs';
import path from 'node:path';
import { FileRecord } from '../models/file';
import mime from 'mime';
import { UploadedFile } from "express-fileupload";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Readable } from "node:stream";
import { bodyToBuffer } from '../utils/streamUtils';
import { TokenRepository } from '../repositories/tokenRepo';


const TOKEN_TTL = Number(process.env.TOKEN_TTL_SECONDS || 600); // seconds
export class FileService {
  private static instance: FileService;
  private readonly fileRepo: FileRepository;
  private readonly tokenRepo: TokenRepository;

  private constructor() {
    this.fileRepo = FileRepository.getInstance();
    this.tokenRepo = TokenRepository.getInstance();
  }

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  public async saveUploadedFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    return files.map(async (file) => {
    const detectedMime = mime.lookup(file.originalname) || file.mimetype;
      const record = {
        id: uuidv4(),
        originalName: file.originalname,
        mimeType: detectedMime,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
      };
      return await this.fileRepo.saveFile(record);
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
    
      if (mimeType !== "application/pdf") {
      throw new AppError("Only PDFs allowed", 400);
    }
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

    await this.fileRepo.saveFile(record);
    savedFiles.push(record);
  }

  return savedFiles;
}



  public async getAllFiles() {
    return await this.fileRepo.getAllFiles();
  }

  public async streamFile(fileId: string, res: any) {
    const file = await this.fileRepo.getFileById(fileId);
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
    const file = await this.fileRepo.getFileById(fileId);
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
    const file = await this.fileRepo.getFileById(id);
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
    const file = await this.fileRepo.getFileById(id);
    if (!file) return null;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min
  }

  public async getWatermarkedPdfStream(id: string) {
    const file = await this.fileRepo.getFileById(id);
    if (!file) return null;

    const isPdf =
      file.mimeType?.includes("pdf") ||
      file.originalName.toLowerCase().endsWith(".pdf");

    if (!isPdf) return null;

    //Download original PDF from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.s3Key!,
    });

    const s3Response = await s3Client.send(command);
    if (!s3Response.Body) return null;

    const pdfBuf = await bodyToBuffer(s3Response.Body);

    //Load the PDF and apply watermark
    const pdfDoc = await PDFDocument.load(pdfBuf, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const watermark = "SECURE PRINT • DO NOT COPY";
    const fontSize = 48;
    const opacity = 0.15;

    for (const page of pages) {
      const { width, height } = page.getSize();
      const rotate = degrees(-60);

      const tileGapX = 300;
      const tileGapY = 200;

      for (let x = -width; x < width * 2; x += tileGapX) {
        for (let y = 0; y < height * 2; y += tileGapY) {
          page.drawText(watermark, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(1, 0, 0),
            rotate,
            opacity,
          });
        }
      }
    }
    const modifiedBytes = await pdfDoc.save();
    const buffer = Buffer.from(modifiedBytes);
    const outStream = Readable.from(buffer);
    return {
      stream: outStream,
      contentType: "application/pdf",
      fileName: file.originalName,
    };
  }

  public async generateOneTimeAccessLink(fileId: string) {
        const file = await this.fileRepo.getFileById(fileId);
        if (!file) return null;

        const token = uuidv4();
    await this.tokenRepo.save(token, fileId, TOKEN_TTL);

    return `${process.env.BASE_URL || "http://localhost:4000"}/api/files/view/${token}`;
  }

  /**
   * Atomically consume the token (GET+DEL) and return fileId or {valid:false, reason}
   */
    public async consumeOneTimeToken(token: string) {
        const fileId = await this.tokenRepo.consume(token);
    if (!fileId) {
      return { valid: false, reason: "Invalid or expired token" };
    }
    //verify file exists
    const file = await this.fileRepo.getFileById(fileId);
    if (!file) {
      return { valid: false, reason: "File not found" };
    }
    return { valid: true, fileId };
  }

    public async deleteFile(id: string) {
  // Check from metadata
  const file = await this.fileRepo.getFileById(id);
  if (!file) {
    return { success: false, message: "File not found" };
  }

  // 1. Delete from S3
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.s3Key,
    })
  );

  // 2. Remove metadata
  await this.fileRepo.deleteFileById(id);

  return { success: true, message: "File deleted successfully" };
}
}