import { Router } from 'express';
import { upload } from '../middleware/upload.middleware.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

// POST /api/v1/upload
router.post('/', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      return;
    }
    
    // Construct the public URL that Express will serve statically
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({ success: true, data: { url: fileUrl } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Upload failed' } });
  }
});

export default router;