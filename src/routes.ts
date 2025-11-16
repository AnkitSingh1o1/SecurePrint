import rateLimit from 'express-rate-limit';
import { FileController } from './controllers/fileController';
import { Router } from "express";

const router = Router();

const fileController = FileController.getInstance();

//API Health
router.get("/health", (_req, res) => {
  res.status(200).json({ message: "SecurePrint API is running fine!" });
});// Upload
router.post("/upload", fileController.uploadFiles);

// List all files (dev only, remove in prod)
router.get("/", fileController.listFiles);

// Preview (dev use only)
router.get("/:id/preview", fileController.previewFile);

// Generate one time access link
router.get("/:id/access", fileController.generateAccessLink);

// Shopkeeper visits this
// clean, simple, user-friendly link to share.
// Think of it as a "front door".
router.get("/view/:token", fileController.viewUsingToken);

// Viewer HTML page
// HTML page in between for:
// PDF display
// buttons
// watermark UI
//later: prevent screenshot, blur, CSS overlays, warnings, instructions, ads, etc.
router.get("/viewer/:token", fileController.viewerPage);

// Secure PDF streaming (token consumed here)
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // ONLY 10 secureStreams per minute per IP
  message: "Too many preview attempts. Please try again later."
});
router.get("/secureStream", tokenLimiter, fileController.secureStream);

// Delete file
router.delete("/:id", fileController.deleteFile);

//Unsafe-OnlyForDev
// router.get('/:id/stream', fileController.streamFile);
// router.get("/:id/share", fileController.generateShareLink);

export default router;