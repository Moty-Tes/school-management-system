import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { createServer } from 'http';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { resolveTenant } from './middleware/tenant.middleware.js';
import { prisma } from './lib/prisma.js';
import { initSocket } from './lib/socket.js'; // <-- Import the socket initializer

// Route Imports
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import classRoutes from './routes/class.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import financeRoutes from './routes/finance.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import parentRoutes from './routes/parent.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import demoRoutes from './routes/demo.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import auditRoutes from './routes/audit.routes.js';
import messageRoutes from './routes/message.routes.js';
import libraryRoutes from './routes/library.routes.js';
import transportRoutes from './routes/transport.routes.js';
import hostelRoutes from './routes/hostel.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import behaviorRoutes from './routes/behavior.routes.js';
import healthRoutes from './routes/health.routes.js';
import ptmRoutes from './routes/ptm.routes.js';
import aiRoutes from './routes/ai.routes.js';
import examRoutes from './routes/exam.routes.js';
import formRoutes from './routes/form.routes.js';
import broadcastRoutes from './routes/broadcast.routes.js';
import admissionRoutes from './routes/admission.routes.js';
import cbtRoutes from './routes/cbt.routes.js';
import frontdeskRoutes from './routes/frontdesk.routes.js';
import cafeteriaRoutes from './routes/cafeteria.routes.js';
import clubRoutes from './routes/club.routes.js';
import fundraisingRoutes from './routes/fundraising.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import gradingRoutes from './routes/grading.routes.js';
import exportRoutes from './routes/export.routes.js';
import roleRoutes from './routes/role.routes.js';
import platformRoutes from './routes/platform.routes.js';
import { startAutomations } from './services/automation.service.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer); // <-- Start the Radio Station

// Security & Parsing
app.use(helmet());
app.use(cors({ origin: env.WEB_BASE_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static File Serving
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Tenant Resolution
app.use(resolveTenant);

// Health Check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), environment: env.NODE_ENV });
  } catch {
    res.status(500).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
  }
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/parents', parentRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/demo', demoRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/hostel', hostelRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/behavior', behaviorRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/ptm', ptmRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/forms', formRoutes);
app.use('/api/v1/broadcasts', broadcastRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/cbt', cbtRoutes);
app.use('/api/v1/frontdesk', frontdeskRoutes);
app.use('/api/v1/cafeteria', cafeteriaRoutes);
app.use('/api/v1/clubs', clubRoutes);
app.use('/api/v1/fundraising', fundraisingRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/grading', gradingRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/platform', platformRoutes);


// Error Handler
app.use(errorHandler);

// Start Server
startAutomations();

httpServer.listen(env.API_PORT, () => {
  console.log(`🚀 API & WebSockets running on http://localhost:${env.API_PORT}`);
});