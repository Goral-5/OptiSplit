import PersonalExpense from '../models/PersonalExpense.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Create a new personal expense
 */
export const createPersonalExpense = async (req, res, next) => {
  try {
    const { amount, category, description, date, notes } = req.body;

    // Validate required fields
    if (!amount || !category) {
      throw new ApiError(400, 'Amount and category are required');
    }

    if (amount <= 0) {
      throw new ApiError(400, 'Amount must be greater than zero');
    }

    const expenseData = {
      userId: req.userId,
      amount: parseFloat(amount),
      category: category.trim(),
      description: description?.trim() || '',
      date: date ? new Date(date) : new Date(),
      notes: notes?.trim() || '',
    };

    const expense = await PersonalExpense.create(expenseData);

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all personal expenses for current user
 */
export const getPersonalExpenses = async (req, res, next) => {
  try {
    const { month, year, category, limit = 50 } = req.query;

    const query = { userId: req.userId };

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    const expenses = await PersonalExpense.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get personal expense summary
 */
export const getPersonalExpenseSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const query = { userId: req.userId };

    // Current month by default
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);
    query.date = { $gte: startDate, $lte: endDate };

    // Get total spent this month
    const totalSpent = await PersonalExpense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get category breakdown
    const categoryBreakdown = await PersonalExpense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSpent: totalSpent[0]?.total || 0,
        categoryBreakdown,
        period: {
          month: targetMonth + 1,
          year: targetYear,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete personal expense
 */
export const deletePersonalExpense = async (req, res, next) => {
  try {
    const expense = await PersonalExpense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!expense) {
      throw new ApiError(404, 'Personal expense not found');
    }

    res.status(200).json({
      success: true,
      message: 'Personal expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
