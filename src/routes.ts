import rateLimit from 'express-rate-limit';
import { FileController } from './controllers/fileController';
import { Router } from "express";

const router = Router();
const fileController = FileController.getInstance();

const viewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: "Too many attempts. Please slow down.",
});

const tokenLimiter = rateLimit({
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

export default router;
