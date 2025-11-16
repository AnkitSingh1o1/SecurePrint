import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { handleError } from '../utils/errorHandler';
import { successResponse } from '../utils/apiResponse';
import multer from "multer";
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
      if (!stream?.Body) {
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

  public async previewFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await fileService.getWatermarkedPdfStream(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "File not found or not a PDF",
        });
      }
      res.setHeader("Content-Type", result.contentType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(result.fileName)}"`
      );
      res.setHeader("Cache-Control", "no-store");

      result.stream.pipe(res);
    } catch (err: any) {
      console.error("previewFile error:", err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  public async generateAccessLink(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const link = await fileService.generateOneTimeAccessLink(id);
    if (!link) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    return res.status(200).json({
      success: true,
      link
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

public async secureStream(req: Request, res: Response) {
  try {
    const token = (req.query.token as string) || (req.params.token);
    if (!token) {
      return res.status(400).json({ success: false, message: "Token missing" });
    }

    // Consume token via Redis (ONE-TIME)
    const result = await fileService.consumeOneTimeToken(token);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    const fileId = result.fileId;
    if (!fileId) {
      return res.status(400).json({ success: false, message: "Token does not reference a file" });
    }

    const previewResult = await fileService.getWatermarkedPdfStream(fileId);
    if (!previewResult) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="secure.pdf"`);
    res.setHeader("Cache-Control", "no-store");
    previewResult.stream.pipe(res);

  } catch (err: any) {
    console.error("secureStream error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

public async viewUsingToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    return res.redirect(`/api/files/viewer/${token}`);

  } catch (err: any) {
    console.error("viewUsingToken error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}


public async viewerPage(req: Request, res: Response) {
  const filePath = require("node:path").join(__dirname, "../public/pdf-viewer.html");
  return res.sendFile(filePath);
}

public async deleteFile(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await fileService.deleteFile(id);

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (err: any) {
    console.error("deleteFile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

}