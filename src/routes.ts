import { FileController } from './controllers/fileController';
import { Router } from "express";

const router = Router();

const fileController = FileController.getInstance();

// Upload
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
router.get("/secureStream", fileController.secureStream);

// Delete file
router.delete("/:id", fileController.deleteFile);

//Unsafe-OnlyForDev
// router.get('/:id/stream', fileController.streamFile);
// router.get("/:id/share", fileController.generateShareLink);

export default router;