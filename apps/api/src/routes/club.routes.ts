import { Router } from 'express';
import * as clubController from '../controllers/club.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, clubController.createHandler);
router.get('/', authenticate, clubController.listHandler);
router.get('/:id/members', authenticate, clubController.getMembersHandler);
router.post('/:id/members', authenticate, clubController.addMemberHandler);
router.delete('/members/:membershipId', authenticate, clubController.removeMemberHandler);
router.get('/student/:studentId', authenticate, clubController.getStudentClubsHandler);

export default router;