import express from 'express';
import {
  createPersonalExpense,
  getPersonalExpenses,
  deletePersonalExpense,
  getPersonalExpenseSummary,
} from '../controllers/personal-expense.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Personal Expense CRUD
router.post('/', createPersonalExpense);
router.get('/', getPersonalExpenses);
router.get('/summary', getPersonalExpenseSummary);
router.delete('/:id', deletePersonalExpense);

export default router;
