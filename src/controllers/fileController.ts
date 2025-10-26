import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { handleError } from '../utils/errorHandler';
import { successResponse } from '../utils/apiResponse';

const fileService = FileService.getInstance();

export class FileController {
  private static instance: FileController;
  public static getInstance(): FileController {
    if (!FileController.instance) {
      FileController.instance = new FileController();
    }
    return FileController.instance;
  }

  public async uploadFiles(req: Request, res: Response) {
    try {
      const uploadedFiles = fileService.saveUploadedFiles(req.files as Express.Multer.File[]);
      return successResponse(res, uploadedFiles, 'Files uploaded successfully');
    } catch (err) {
      handleError(err, res);
    }
  }

  public async listFiles(req: Request, res: Response) {
    try {
      const files = fileService.getAllFiles();
      return successResponse(res, files);
    } catch (err) {
      handleError(err, res);
    }
  }

  public async streamFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      fileService.streamFile(id, res);
    } catch (err) {
      handleError(err, res);
    }
  }
}