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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mime_1 = __importDefault(require("mime"));
class FileService {
    constructor() {
        this.fileRepo = fileRepo_1.FileRepository.getInstance();
    }
    static getInstance() {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }
    saveUploadedFiles(files) {
        if (!files || files.length === 0) {
            throw new errorHandler_1.AppError('No files uploaded', 400);
        }
        return files.map((file) => {
            // ...inside upload route after file is saved
            const detectedMime = mime_1.default.lookup(file.originalname) || file.mimetype;
            const record = {
                id: (0, uuid_1.v4)(),
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
    async uploadFiles(files) {
        if (!files || files.length === 0)
            throw new errorHandler_1.AppError("No files uploaded", 400);
        const savedFiles = [];
        for (const file of files) {
            //Safely handle undefined file names or extensions
            const extension = file.originalname?.includes(".")
                ? file.originalname.split(".").pop()
                : "";
            //Use mime-types lookup safely, fallback to file.mimetype or default
            const mimeType = (extension && mime_1.default.lookup(extension)) ||
                file.mimetype ||
                "application/octet-stream";
            //Safe S3 key generation
            const s3Key = `${(0, uuid_1.v4)()}-${file.originalname || "unnamed-file"}`;
            //Upload to S3
            await s3Client_1.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: file.buffer,
                ContentType: mimeType,
            }));
            const record = {
                id: (0, uuid_1.v4)(),
                originalName: file.originalname || "unknown",
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
    getAllFiles() {
        return this.fileRepo.getAllFiles();
    }
    streamFile(fileId, res) {
        const file = this.fileRepo.getFileById(fileId);
        if (!file) {
            throw new errorHandler_1.AppError('File not found', 404);
        }
        if (!file.path) {
            throw new errorHandler_1.AppError('File path is undefined', 500);
        }
        const filePath = path_1.default.resolve(file.path);
        const readStream = fs_1.default.createReadStream(filePath);
        res.setHeader('Content-Type', file.mimeType);
        readStream.pipe(res);
    }
    async generateShareLink(fileId, expiresInSec = 600) {
        const file = this.fileRepo.getFileById(fileId);
        if (!file)
            throw new errorHandler_1.AppError("File not found", 404);
        const command = new client_s3_1.GetObjectCommand({
            Bucket: s3Client_1.S3_BUCKET_NAME,
            Key: file.s3Key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client_1.s3Client, command, { expiresIn: expiresInSec });
        return url;
    }
}
exports.FileService = FileService;
