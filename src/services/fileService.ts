import { v4 as uuidv4 } from 'uuid';
import { FileRepository } from '../repositories/fileRepo';
import { AppError } from '../utils/errorHandler';
import fs from 'fs';
import path from 'path';
import { FileRecord } from '../models/file';
import mime from 'mime';

export class FileService {
  private static instance: FileService;
  private fileRepo: FileRepository;

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

  public getAllFiles() {
    return this.fileRepo.getAllFiles();
  }

  public streamFile(fileId: string, res: any) {
    const file = this.fileRepo.getFileById(fileId);
    if (!file) {
      throw new AppError('File not found', 404);
    }

    const filePath = path.resolve(file.path);
    const readStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', file.mimeType);
    readStream.pipe(res);
  }
}