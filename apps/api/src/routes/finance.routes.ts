import { Router } from 'express';
import * as financeController from '../controllers/finance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/finance/summary
// Summary metrics and chart trends
router.get('/summary', authenticate, financeController.getSummaryHandler);

// GET /api/v1/finance/payments
// List payments with invoice details
router.get('/payments', authenticate, financeController.listPaymentsHandler);

// GET /api/v1/finance/invoices
// Lists all invoices for the school
router.get('/invoices', authenticate, financeController.listInvoicesHandler);

// POST /api/v1/finance/invoices
// Creates a new invoice for a student
router.post('/invoices', authenticate, financeController.createInvoiceHandler);

// POST /api/v1/finance/invoices/:id/pay
// Records a payment against a specific invoice
router.post('/invoices/:id/pay', authenticate, financeController.recordPaymentHandler);
router.post('/invoices/bulk', authenticate, financeController.bulkInvoiceHandler);

export default router;