import express from 'express';
import {
  createSettlement,
  getSettlementData,
  getOptimizedSettlements,
} from '../controllers/settlement.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Create settlement
router.post('/', createSettlement);

// Get settlement data
router.get('/:type/:id/data', getSettlementData);

// Get optimized settlements (NEW feature)
router.get('/:type/:id/optimized', getOptimizedSettlements);

export default router;
