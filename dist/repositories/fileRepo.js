"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRepository = void 0;
const file_1 = require("../models/file");
class FileRepository {
    constructor() { }
    static getInstance() {
        if (!FileRepository.instance) {
            FileRepository.instance = new FileRepository();
        }
        return FileRepository.instance;
    }
    async saveFile(file) {
        return await file_1.FileModel.create({
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            path: file.path,
            s3Key: file.s3Key,
            uploadedAt: file.uploadedAt
        });
    }
    async getAllFiles() {
        return await file_1.FileModel.find().lean();
    }
    async getFileById(id) {
        return await file_1.FileModel.findOne({ id }).lean();
    }
    async deleteFileById(id) {
        return await file_1.FileModel.findOneAndDelete({ id });
    }
    async findOlderThan(date) {
        return file_1.FileModel.find({ uploadedAt: { $lt: date } });
    }
    async deleteById(id) {
        return file_1.FileModel.deleteOne({ fileId: id });
    }
}
exports.FileRepository = FileRepository;
