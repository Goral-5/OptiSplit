import express from 'express';
import {
  createExpense,
  getExpensesBetweenUsers,
  deleteExpense,
} from '../controllers/expense.controller.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateExpenseCreation, sanitizeExpenseData } from '../middleware/expenseValidation.js';

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Create expense - with validation middleware
router.post('/', 
  sanitizeExpenseData,
  validateExpenseCreation,
  createExpense
);

// Get expenses between two users
router.get('/user/:userId', getExpensesBetweenUsers);

// Delete expense
router.delete('/:id', deleteExpense);

export default router;
