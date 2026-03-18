import express from 'express';
import { getFinancialSummary, getAnalytics, getCategoryBreakdown } from '../controllers/analytics.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Dashboard & Analytics routes
router.get('/summary', getFinancialSummary);
router.get('/analytics', getAnalytics);
router.get('/category', getCategoryBreakdown);

export default router;
