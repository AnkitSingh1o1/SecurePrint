"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fileController_1 = require("./controllers/fileController");
const express_1 = require("express");
const router = (0, express_1.Router)();
const fileController = fileController_1.FileController.getInstance();
const viewLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: "Too many attempts. Please slow down.",
});
const tokenLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many preview attempts. Please try again later."
});
// STATIC ROUTES FIRST
// Shopkeeper visits this
router.get("/view/:token", viewLimiter, fileController.viewUsingToken);
// Viewer HTML page 
router.get("/viewer/:token", viewLimiter, fileController.viewerPage);
// Secure PDF streaming
router.get("/secureStream", viewLimiter, tokenLimiter, fileController.secureStream);
// Upload
router.post("/upload", fileController.uploadFiles);
// Generate one time access link
router.get("/:id/access", fileController.generateAccessLink);
// Delete file
router.delete("/:id", fileController.deleteFile);
// Unsafe routes (dev only)
// router.get('/:id/stream', fileController.streamFile);
// router.get("/:id/share", fileController.generateShareLink);
// router.get("/", fileController.listFiles);
// router.get("/:id/preview", fileController.previewFile);
exports.default = router;
