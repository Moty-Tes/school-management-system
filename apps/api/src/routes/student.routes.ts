import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const studentManagers = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'];
const studentViewers = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR', 'TEACHER', 'ACCOUNTANT'];

// Student Directory & Queries
router.get('/', authenticate, requireRoles(...studentViewers), studentController.listStudentsHandler);
router.get('/:id/profile', authenticate, studentController.getProfileHandler);

// Student Lifecycle & Enrollment Mutations
router.post('/', authenticate, requireRoles(...studentManagers), studentController.createStudentHandler);
router.post('/bulk', authenticate, requireRoles(...studentManagers), studentController.bulkCreateHandler);
router.patch('/:id', authenticate, requireRoles(...studentManagers), studentController.updateStudentHandler);
router.delete('/:id', authenticate, requireRoles(...studentManagers), studentController.deleteStudentHandler);
router.post('/promote', authenticate, requireRoles(...studentManagers), studentController.promoteClassHandler);

export default router;
