import { Router } from 'express';
import * as announcementController from '../controllers/announcement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/announcements
// Creates a new announcement (school-wide or class-specific)
router.post('/', authenticate, announcementController.createHandler);

// GET /api/v1/announcements
// Lists announcements (can filter by classId using ?classId=...)
router.get('/', authenticate, announcementController.listHandler);

export default router;