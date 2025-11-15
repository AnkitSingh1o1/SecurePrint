import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { handleError } from '../utils/errorHandler';
import { successResponse } from '../utils/apiResponse';
import multer from "multer";
import { Readable } from "stream";
import { toNodeReadable } from '../utils/streamUtils';

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
      const stream = await fileService.streamFileFromS3(id);
      if (!stream || !stream.Body) {
        return res.status(404).json({
          success: false,
          message: "File not found or could not be streamed",
        });
      }
    const nodeStream = await toNodeReadable(stream.Body);
    res.setHeader("Content-Type", stream.ContentType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${stream.FileName || "file"}"`
    );
    nodeStream.pipe(res);
    } catch (err: any) {
      console.error("Stream error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  public async generateShareLink(req: Request, res: Response){
    try {
      const { id } = req.params;
      const signedUrl = await fileService.generateSignedUrl(id);
      if (!signedUrl) {
        return res.status(404).json({ success: false, message: "File not found" });
      }
      return res.status(200).json({ success: true, url: signedUrl });
    } catch (err: any) {
      console.error("Share link error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}