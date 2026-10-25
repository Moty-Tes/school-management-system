import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// The authenticate middleware guarantees req.auth exists!
router.post('/', authenticate, studentController.createStudentHandler);
router.get('/', authenticate, studentController.listStudentsHandler);
router.post('/bulk', authenticate, studentController.bulkCreateHandler);
router.get('/:id/profile', authenticate, studentController.getProfileHandler);

router.patch('/:id', authenticate, studentController.updateStudentHandler);
router.delete('/:id', authenticate, studentController.deleteStudentHandler);
router.post('/promote', authenticate, studentController.promoteClassHandler);

export default router;