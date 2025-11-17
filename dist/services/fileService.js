"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const uuid_1 = require("uuid");
const fileRepo_1 = require("../repositories/fileRepo");
const errorHandler_1 = require("../utils/errorHandler");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Client_1 = require("../utils/s3Client");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const mime_1 = __importDefault(require("mime"));
const pdf_lib_1 = require("pdf-lib");
const node_stream_1 = require("node:stream");
const streamUtils_1 = require("../utils/streamUtils");
const tokenRepo_1 = require("../repositories/tokenRepo");
const TOKEN_TTL = Number(process.env.TOKEN_TTL_SECONDS || 600); // seconds
class FileService {
    constructor() {
        this.fileRepo = fileRepo_1.FileRepository.getInstance();
        this.tokenRepo = tokenRepo_1.TokenRepository.getInstance();
    }
    static getInstance() {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }
    async saveUploadedFiles(files) {
        if (!files || files.length === 0) {
            throw new errorHandler_1.AppError('No files uploaded', 400);
        }
        return files.map(async (file) => {
            const detectedMime = mime_1.default.lookup(file.originalname) || file.mimetype;
            const record = {
                id: (0, uuid_1.v4)(),
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
    async uploadFiles(files) {
        if (!files || files.length === 0)
            throw new errorHandler_1.AppError("No files uploaded", 400);
        const savedFiles = [];
        for (const file of files) {
            //express-fileupload uses `file.name`, not `file.originalname`
            const originalName = file.name || "unknown.pdf";
            //Safely handle undefined file names or extensions
            const extension = originalName?.includes(".")
                ? originalName.split(".").pop()
                : "";
            //Use mime-types lookup safely, fallback to file.mimetype or default
            const mimeType = (extension && mime_1.default.lookup(extension)) ||
                file.mimetype ||
                "application/octet-stream";
            if (mimeType !== "application/pdf") {
                throw new errorHandler_1.AppError("Only PDFs allowed", 400);
            }
            //Safe S3 key generation
            const s3Key = `${(0, uuid_1.v4)()}-${originalName}`;
            //Upload to S3
            await s3Client_1.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: file.data, // express-fileupload provides Buffer here
                ContentType: mimeType,
                ServerSideEncryption: "AES256",
            }));
            const record = {
                id: (0, uuid_1.v4)(),
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
    async getAllFiles() {
        return await this.fileRepo.getAllFiles();
    }
    async streamFile(fileId, res) {
        const file = await this.fileRepo.getFileById(fileId);
        if (!file) {
            throw new errorHandler_1.AppError('File not found', 404);
        }
        if (!file.path) {
            throw new errorHandler_1.AppError('File path is undefined', 500);
        }
        const filePath = node_path_1.default.resolve(file.path);
        const readStream = node_fs_1.default.createReadStream(filePath);
        res.setHeader('Content-Type', file.mimeType);
        readStream.pipe(res);
    }
    async generateShareLink(fileId, expiresInSec = 600) {
        const file = await this.fileRepo.getFileById(fileId);
        if (!file)
            throw new errorHandler_1.AppError("File not found", 404);
        const command = new client_s3_1.GetObjectCommand({
            Bucket: s3Client_1.S3_BUCKET_NAME,
            Key: file.s3Key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client_1.s3Client, command, { expiresIn: expiresInSec });
        return url;
    }
    //Stream file directly from S3
    async streamFileFromS3(id) {
        const file = await this.fileRepo.getFileById(id);
        if (!file)
            return null;
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
        });
        const response = await s3Client_1.s3Client.send(command);
        return {
            Body: response.Body,
            ContentType: response.ContentType,
            FileName: file.originalName,
        };
    }
    async generateSignedUrl(id) {
        const file = await this.fileRepo.getFileById(id);
        if (!file)
            return null;
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(s3Client_1.s3Client, command, { expiresIn: 300 }); // 5 min
    }
    async getWatermarkedPdfStream(id) {
        const file = await this.fileRepo.getFileById(id);
        if (!file)
            return null;
        const isPdf = file.mimeType?.includes("pdf") ||
            file.originalName.toLowerCase().endsWith(".pdf");
        if (!isPdf)
            return null;
        //Download original PDF from S3
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
        });
        const s3Response = await s3Client_1.s3Client.send(command);
        if (!s3Response.Body)
            return null;
        const pdfBuf = await (0, streamUtils_1.bodyToBuffer)(s3Response.Body);
        //Load the PDF and apply watermark
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuf, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const watermark = "SECURE PRINT • DO NOT COPY";
        const fontSize = 48;
        const opacity = 0.15;
        for (const page of pages) {
            const { width, height } = page.getSize();
            const rotate = (0, pdf_lib_1.degrees)(-60);
            const tileGapX = 300;
            const tileGapY = 200;
            for (let x = -width; x < width * 2; x += tileGapX) {
                for (let y = 0; y < height * 2; y += tileGapY) {
                    page.drawText(watermark, {
                        x,
                        y,
                        size: fontSize,
                        font,
                        color: (0, pdf_lib_1.rgb)(1, 0, 0),
                        rotate,
                        opacity,
                    });
                }
            }
        }
        const modifiedBytes = await pdfDoc.save();
        const buffer = Buffer.from(modifiedBytes);
        const outStream = node_stream_1.Readable.from(buffer);
        return {
            stream: outStream,
            contentType: "application/pdf",
            fileName: file.originalName,
        };
    }
    async generateOneTimeAccessLink(fileId) {
        const file = await this.fileRepo.getFileById(fileId);
        if (!file)
            return null;
        const token = (0, uuid_1.v4)();
        await this.tokenRepo.save(token, fileId, TOKEN_TTL);
        return `${process.env.BASE_URL || "http://localhost:4000"}/api/files/view/${token}`;
    }
    /**
     * Atomically consume the token (GET+DEL) and return fileId or {valid:false, reason}
     */
    async consumeOneTimeToken(token) {
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
    async deleteFile(id) {
        // Check from metadata
        const file = await this.fileRepo.getFileById(id);
        if (!file) {
            return { success: false, message: "File not found" };
        }
        // 1. Delete from S3
        await s3Client_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
        }));
        // 2. Remove metadata
        await this.fileRepo.deleteFileById(id);
        return { success: true, message: "File deleted successfully" };
    }
    async cleanupOldFiles(days) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        // Find old files
        const oldFiles = await this.fileRepo.findOlderThan(cutoff);
        let deleteCount = 0;
        for (const file of oldFiles) {
            try {
                // Delete from S3
                await s3Client_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: file.s3Key,
                }));
                // Delete from Mongo
                await this.fileRepo.deleteById(file.id);
                deleteCount++;
            }
            catch (err) {
                console.error("Failed to delete file:", file.id, err);
            }
        }
        return deleteCount;
    }
}
exports.FileService = FileService;
