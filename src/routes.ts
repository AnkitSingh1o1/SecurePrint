import { FileController } from './controllers/fileController';
import { Router } from "express";

const router = Router();

const fileController = FileController.getInstance();

router.post('/upload', fileController.uploadFiles);
router.get('/', fileController.listFiles);
router.get('/:id/stream', fileController.streamFile);
router.get("/:id/share", fileController.generateShareLink);
router.get("/:id/preview", fileController.previewFile);
router.get("/:id/access", fileController.generateAccessLink);
router.get("/view/:token", fileController.viewUsingToken);
router.delete("/:id", fileController.deleteFile);

export default router;