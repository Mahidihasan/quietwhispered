import express from 'express';
import { uploadMedia, deleteMedia } from '../controllers/mediaController.js';
import upload from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadMedia);
router.delete('/delete', protect, deleteMedia);

export default router;
