"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRepository = void 0;
class FileRepository {
    constructor() {
        this.files = [];
    }
    static getInstance() {
        if (!FileRepository.instance) {
            FileRepository.instance = new FileRepository();
        }
        return FileRepository.instance;
    }
    saveFile(file) {
        this.files.push(file);
        return file;
    }
    getAllFiles() {
        return this.files;
    }
    getFileById(id) {
        return this.files.find((f) => f.id === id);
    }
}
exports.FileRepository = FileRepository;
