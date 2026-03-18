import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  getGroupExpenses,
  addMember,
  removeMember,
  deleteGroup,
  getGroupBalances,
  getOptimizedGroupSettlements,
  getGroupSummary,
}
from '../controllers/group.controller.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyGroupMember } from '../middleware/groupAccess.js';

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Group CRUD
router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', verifyGroupMember, getGroupById);
router.get('/:id/expenses', verifyGroupMember, getGroupExpenses);
router.delete('/:id', deleteGroup);

// Balance and Analytics endpoints
router.get('/:id/balances', verifyGroupMember, getGroupBalances);
router.get('/:id/optimized-settlements', verifyGroupMember, getOptimizedGroupSettlements);
router.get('/:id/summary', verifyGroupMember, getGroupSummary);

// Member management
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
