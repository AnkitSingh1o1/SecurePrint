"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const uuid_1 = require("uuid");
const fileRepo_1 = require("../repositories/fileRepo");
const errorHandler_1 = require("../utils/errorHandler");
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
    * Save metadata and fix MIME type based on file extension.
    */
    async saveFileMetadata(file) {
        const extension = path_1.default.extname(file.originalname);
        const detectedMime = mime_1.default.lookup(extension) || file.mimetype;
        const newFile = {
            id: (0, uuid_1.v4)(),
            originalName: file.originalname,
            mimeType: detectedMime,
            size: file.size,
            path: file.path,
            uploadedAt: new Date(),
        };
        this.fileRepo.saveFile(newFile);
        return newFile;
    }
    getAllFiles() {
        return this.fileRepo.getAllFiles();
    }
    streamFile(fileId, res) {
        const file = this.fileRepo.getFileById(fileId);
        if (!file) {
            throw new errorHandler_1.AppError('File not found', 404);
        }
        const filePath = path_1.default.resolve(file.path);
        const readStream = fs_1.default.createReadStream(filePath);
        res.setHeader('Content-Type', file.mimeType);
        readStream.pipe(res);
    }
}
exports.FileService = FileService;
