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
            fileService.streamFile(id, res);
        }
        catch (err) {
            (0, errorHandler_1.handleError)(err, res);
        }
    }
    async generateShareLink(req, res) {
        try {
            const { id } = req.params;
            const url = await fileService.generateShareLink(id);
            return (0, apiResponse_1.successResponse)({ url }, "Shareable link generated");
        }
        catch (err) {
            (0, errorHandler_1.handleError)(err, res);
        }
    }
    ;
}
exports.FileController = FileController;
