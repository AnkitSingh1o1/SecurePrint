import express from 'express';
import multer from 'multer';
import { FileController } from './controllers/fileController';

const app = express();
const upload = multer({ dest: 'uploads/' });

const fileController = FileController.getInstance();

app.use(express.json());

app.post('/api/files/upload', upload.array('files'), fileController.uploadFiles);
app.get('/api/files', fileController.listFiles);
app.get('/api/files/:id/stream', fileController.streamFile);

export default app;