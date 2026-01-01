const express = require('express');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_MIME = ['image/', 'video/'];

router.post('/', protect, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const uploadDir = path.join(__dirname, '..', process.env.FILE_UPLOAD_PATH || 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const file = req.files.file;
        
        const mimeOk = ALLOWED_MIME.some(prefix => file.mimetype.startsWith(prefix));
        if (!mimeOk) {
            return res.status(400).json({ success: false, message: 'Only image and video uploads are allowed' });
        }

        const ext = path.extname(file.name) || '';
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        const uploadPath = path.join(uploadDir, safeName);

        await file.mv(uploadPath);

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${safeName}`;
        const type = file.mimetype.startsWith('video') ? 'video' : 'image';

        res.status(201).json({ success: true, url: fileUrl, filename: safeName, type });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'File upload failed' });
    }
});

module.exports = router;
