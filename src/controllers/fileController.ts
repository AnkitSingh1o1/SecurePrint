import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { handleError } from '../utils/errorHandler';
import { successResponse } from '../utils/apiResponse';
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
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
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    //Dynamically handle both single and multiple file uploads
    const uploadedKey = Object.keys(req.files)[0];
    const uploadedData = (req.files as any)[uploadedKey];
    const files = Array.isArray(uploadedData) ? uploadedData : [uploadedData];

    const uploadedFiles = await fileService.uploadFiles(files);
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

  public async generateShareLink(req: Request, res: Response){
    try {
      const { id } = req.params;
      const url = await fileService.generateShareLink(id);
      return successResponse({ url }, "Shareable link generated");
    } catch (err) {
      handleError(err, res)
    }
  };
}