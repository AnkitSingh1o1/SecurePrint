"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const fileService_1 = require("../services/fileService");
const errorHandler_1 = require("../utils/errorHandler");
const apiResponse_1 = require("../utils/apiResponse");
const multer_1 = __importDefault(require("multer"));
const streamUtils_1 = require("../utils/streamUtils");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const fileService = fileService_1.FileService.getInstance();
class FileController {
    static getInstance() {
        if (!FileController.instance) {
            FileController.instance = new FileController();
        }
        return FileController.instance;
    }
    async uploadFiles(req, res) {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }
            //Dynamically handle both single and multiple file uploads
            const uploadedKey = Object.keys(req.files)[0];
            const uploadedData = req.files[uploadedKey];
            const files = Array.isArray(uploadedData) ? uploadedData : [uploadedData];
            const uploadedFiles = await fileService.uploadFiles(files);
            return (0, apiResponse_1.successResponse)(res, uploadedFiles, 'Files uploaded successfully');
        }
        catch (err) {
            (0, errorHandler_1.handleError)(err, res);
        }
    }
    async listFiles(req, res) {
        try {
            const files = fileService.getAllFiles();
            return (0, apiResponse_1.successResponse)(res, files);
        }
        catch (err) {
            (0, errorHandler_1.handleError)(err, res);
        }
    }
    async streamFile(req, res) {
        try {
            const { id } = req.params;
            const stream = await fileService.streamFileFromS3(id);
            if (!stream?.Body) {
                return res.status(404).json({
                    success: false,
                    message: "File not found or could not be streamed",
                });
            }
            const nodeStream = await (0, streamUtils_1.toNodeReadable)(stream.Body);
            res.setHeader("Content-Type", stream.ContentType || "application/octet-stream");
            res.setHeader("Content-Disposition", `inline; filename="${stream.FileName || "file"}"`);
            nodeStream.pipe(res);
        }
        catch (err) {
            console.error("Stream error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    async generateShareLink(req, res) {
        try {
            const { id } = req.params;
            const signedUrl = await fileService.generateSignedUrl(id);
            if (!signedUrl) {
                return res.status(404).json({ success: false, message: "File not found" });
            }
            return res.status(200).json({ success: true, url: signedUrl });
        }
        catch (err) {
            console.error("Share link error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    async previewFile(req, res) {
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
            res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(result.fileName)}"`);
            res.setHeader("Cache-Control", "no-store");
            result.stream.pipe(res);
        }
        catch (err) {
            console.error("previewFile error:", err);
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    async generateAccessLink(req, res) {
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
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
    async secureStream(req, res) {
        try {
            const token = req.query.token || (req.params.token);
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
        }
        catch (err) {
            console.error("secureStream error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    async viewUsingToken(req, res) {
        try {
            const { token } = req.params;
            return res.redirect(`/api/files/viewer/${token}`);
        }
        catch (err) {
            console.error("viewUsingToken error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    async viewerPage(req, res) {
        const token = req.params.token;
        const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secure PDF Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; }
          iframe { width: 100%; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <iframe src="/api/files/secureStream?token=${token}"></iframe>
      </body>
    </html>
  `;
        return res.send(html);
    }
    async deleteFile(req, res) {
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
        }
        catch (err) {
            console.error("deleteFile error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.FileController = FileController;
