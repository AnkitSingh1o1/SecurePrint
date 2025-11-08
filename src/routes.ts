import { FileController } from './controllers/fileController';
import { Router } from "express";

const router = Router();

const fileController = FileController.getInstance();

router.post('/upload', fileController.uploadFiles);
router.get('/', fileController.listFiles);
router.get('/:id/stream', fileController.streamFile);
router.get("/:id/share", fileController.generateShareLink);


export default router;