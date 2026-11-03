import { Router } from 'express';
import * as financeController from '../controllers/finance.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const financeStaff = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT'];
const invoiceViewers = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT'];

// GET /api/v1/finance/summary
// Summary metrics and chart trends
router.get('/summary', authenticate, requireRoles(...financeStaff), financeController.getSummaryHandler);

// GET /api/v1/finance/payments
// List payments with invoice details
router.get('/payments', authenticate, requireRoles(...financeStaff), financeController.listPaymentsHandler);

// GET /api/v1/finance/invoices
// Lists all invoices with server-enforced record-level scoping (students/parents scoped to own records)
router.get('/invoices', authenticate, requireRoles(...invoiceViewers), financeController.listInvoicesHandler);

// POST /api/v1/finance/invoices
// Creates a new invoice for a student
router.post('/invoices', authenticate, requireRoles(...financeStaff), financeController.createInvoiceHandler);

// POST /api/v1/finance/invoices/:id/pay
// Records a payment against a specific invoice
router.post('/invoices/:id/pay', authenticate, requireRoles(...financeStaff), financeController.recordPaymentHandler);
router.post('/invoices/bulk', authenticate, requireRoles(...financeStaff), financeController.bulkInvoiceHandler);

// Payment Gateway Integrations
router.post('/payments/initialize', authenticate, financeController.initializeGatewayPaymentHandler);
router.post('/webhooks/chapa', financeController.chapaWebhookHandler);
router.post('/webhooks/telebirr', financeController.telebirrWebhookHandler);

export default router;
