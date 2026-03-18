import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import PersonalExpense from '../models/PersonalExpense.js';
import Balance from '../models/Balance.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Get user's overall financial summary
 */
export const getFinancialSummary = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get all groups user is part of
    const userGroups = await Expense.aggregate([
      { $match: { 'splits.userId': userId } },
      { $group: { _id: '$groupId' } },
    ]);

    const groupIds = userGroups.map(g => g._id).filter(id => id !== null);

    // ===== CRITICAL FIX: Use Balance collection =====
    // Balance schema: { user: debtor, owesTo: creditor, amount }
    // "user owes owesTo the amount"
    
    // Calculate total owed TO user (user is creditor)
    const owedToUser = await Balance.aggregate([
      { $match: { owesTo: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    // Calculate total user OWES (user is debtor)
    const userOwes = await Balance.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get personal expenses total (current month)
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const personalExpensesTotal = await PersonalExpense.aggregate([
      { 
        $match: { 
          userId, 
          date: { $gte: startOfMonth } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOwedToUser: owedToUser[0]?.total || 0,
        totalUserOwes: userOwes[0]?.total || 0,
        netBalance: (owedToUser[0]?.total || 0) - (userOwes[0]?.total || 0),
        personalExpensesThisMonth: personalExpensesTotal[0]?.total || 0,
        activeGroups: groupIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics data with charts
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { months = 6 } = req.query;

    const currentDate = new Date();
    const startDate = new Date(currentDate.setMonth(currentDate.getMonth() - parseInt(months)));

    // Monthly spending trend (personal expenses)
    const monthlyTrend = await PersonalExpense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Category distribution (personal expenses)
    const categoryDistribution = await PersonalExpense.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Group vs Personal comparison
    const groupExpenses = await Expense.aggregate([
      {
        $match: {
          'splits.userId': userId,
          date: { $gte: startDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const personalTotal = await PersonalExpense.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlyTrend,
        categoryDistribution,
        groupVsPersonal: {
          groupExpenses: groupExpenses[0]?.total || 0,
          personalExpenses: personalTotal[0]?.total || 0,
        },
        period: {
          startDate,
          endDate: new Date(),
          months: parseInt(months),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category-wise breakdown
 */
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { type = 'personal', months = 3 } = req.query;

    const currentDate = new Date();
    const startDate = new Date(currentDate.setMonth(currentDate.getMonth() - parseInt(months)));

    let breakdown;

    if (type === 'personal') {
      breakdown = await PersonalExpense.aggregate([
        { $match: { userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            average: { $avg: '$amount' },
          },
        },
        { $sort: { total: -1 } },
      ]);
    } else {
      // Group expenses breakdown
      breakdown = await Expense.aggregate([
        { 
          $match: { 
            'splits.userId': userId,
            date: { $gte: startDate }
          } 
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        breakdown,
        type,
        period: { months: parseInt(months) },
      },
    });
  } catch (error) {
    next(error);
  }
};
