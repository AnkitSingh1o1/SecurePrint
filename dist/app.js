"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fileController_1 = require("./controllers/fileController");
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const fileController = fileController_1.FileController.getInstance();
app.use(express_1.default.json());
app.post('/api/files/upload', upload.array('files'), fileController.uploadFiles);
app.get('/api/files', fileController.listFiles);
app.get('/api/files/:id/stream', fileController.streamFile);
exports.default = app;
