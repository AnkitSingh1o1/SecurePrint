"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const fileService_1 = require("../services/fileService");
const errorHandler_1 = require("../utils/errorHandler");
const apiResponse_1 = require("../utils/apiResponse");
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
            const uploadedFiles = fileService.saveUploadedFiles(req.files);
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
}
exports.FileController = FileController;
