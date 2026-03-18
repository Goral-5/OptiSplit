import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import PersonalExpense from '../models/PersonalExpense.js';
import Balance from '../models/Balance.js';
import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import { 
  validateSplitData, 
  calculateSplits,
  validateMultiplePayersData,
  roundTo2Decimals 
} from '../services/expense-split.service.js';
import { calculateBilateralBalance } from '../services/balance.service.js';
import { minimizeTransactions } from '../services/debt-optimization.service.js';

// Create expense
export const createExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      description,
      amount,
      category,
      date,
      groupId,
      paidBy,
      splitType,
      splits,
    } = req.body;
    
    // ===== VALIDATE REQUIRED FIELDS =====
    if (!description || !amount) {
      throw new ApiError(400, 'Description and amount are required');
    }
    
    if (!splitType && groupId) {
      throw new ApiError(400, 'Split type is required for group expenses');
    }
    
    const totalAmount = Number(amount);
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new ApiError(400, 'Amount must be greater than zero');
    }
    
    // ===== VERIFY GROUP MEMBERSHIP =====
    let groupMembers = [];
    if (groupId) {
      const group = await Group.findById(groupId).session(session);
      
      if (!group) {
        throw new ApiError(404, 'Group not found');
      }
      
      const isMember = group.members.some(
        (m) => m.userId.toString() === req.userId.toString()
      );
      
      if (!isMember) {
        throw new ApiError(403, 'You must be a member of the group to add expenses');
      }
      
      groupMembers = group.members.map(m => m.userId.toString());
    }
    
    // ===== HANDLE PERSONAL EXPENSE =====
    if (!groupId) {
      const personalExpenseData = {
        userId: req.userId,
        description: description.trim(),
        amount: totalAmount,
        category: category?.trim() || 'Other',
        date: date ? new Date(date) : new Date(),
      };
      
      const personalExpense = await PersonalExpense.create(personalExpenseData);
      
      const populatedExpense = await PersonalExpense.findById(personalExpense._id)
        .populate('userId', '_id name email imageUrl')
        .lean();
      
      await session.commitTransaction();
      
      res.status(201).json({
        success: true,
        data: populatedExpense,
      });
      return;
    }
    
    // ===== GROUP EXPENSE FLOW =====
    
    // Validate payers
    if (!paidBy || !Array.isArray(paidBy) || paidBy.length === 0) {
      throw new ApiError(400, 'At least one payer is required');
    }
    
    const totalPaid = paidBy.reduce((sum, p) => sum + Number(p.amount), 0);
    
    if (Math.abs(totalPaid - totalAmount) > 0.01) {
      throw new ApiError(400, `Paid amount mismatch. Total paid: ₹${totalPaid.toFixed(2)}, Expected: ₹${totalAmount.toFixed(2)}`);
    }
    
    // Verify all payers are group members
    for (const payer of paidBy) {
      if (!groupMembers.includes(payer.userId.toString())) {
        throw new ApiError(403, 'Payer must be a member of the group');
      }
    }
    
    // Validate splits
    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      throw new ApiError(400, 'At least one participant is required');
    }
    
    // ===== CALCULATE SPLITS BASED ON TYPE =====
    let calculatedSplits = [];
    
    if (splitType === 'equal') {
      const perHead = round(totalAmount / splits.length);
      
      calculatedSplits = splits.map((s, i) => ({
        userId: s.userId,
        amount: i === splits.length - 1
          ? round(totalAmount - perHead * (splits.length - 1))
          : perHead,
        paid: false,
      }));
    }
    
    else if (splitType === 'percentage') {
      const totalPercent = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
      
      if (totalPercent !== 100) {
        throw new ApiError(400, `Percentages must equal 100% (current: ${totalPercent}%)`);
      }
      
      calculatedSplits = splits.map(s => ({
        userId: s.userId,
        amount: round((s.percentage / 100) * totalAmount),
        paid: false,
      }));
    }
    
    else if (splitType === 'exact') {
      const totalExact = splits.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      
      if (Math.abs(totalExact - totalAmount) > 0.01) {
        throw new ApiError(400, `Exact amounts must equal ₹${totalAmount.toFixed(2)} (current: ₹${totalExact.toFixed(2)})`);
      }
      
      calculatedSplits = splits.map(s => ({
        userId: s.userId,
        amount: Number(s.amount),
        paid: false,
      }));
    }
    
    else if (splitType === 'shares') {
      const totalShares = splits.reduce((sum, s) => sum + (s.share || 1), 0);
      
      if (totalShares <= 0) {
        throw new ApiError(400, 'Total shares must be greater than zero');
      }
      
      calculatedSplits = splits.map(s => ({
        userId: s.userId,
        amount: round((s.share / totalShares) * totalAmount),
        paid: false,
      }));
      
      // Handle remainder
      const sum = calculatedSplits.reduce((acc, s) => acc + s.amount, 0);
      const remainder = round(totalAmount - sum);
      if (Math.abs(remainder) > 0.001) {
        calculatedSplits[calculatedSplits.length - 1].amount += remainder;
      }
    }
    
    // ===== CALCULATE BALANCES =====
    const balances = {};
    
    // Subtract what each person owes
    calculatedSplits.forEach(s => {
      balances[s.userId] = (balances[s.userId] || 0) - s.amount;
    });
    
    // Add what each person paid
    paidBy.forEach(p => {
      balances[p.userId] = (balances[p.userId] || 0) + p.amount;
    });
    
    // ===== MINIMIZE TRANSACTIONS =====
    const transactions = minimizeTransactions(balances);
    
    // ===== BUILD EXPENSE DATA =====
    const expenseData = {
      description: description.trim(),
      amount: totalAmount,
      category: category?.trim() || 'Other',
      date: date ? new Date(date) : new Date(),
      paidBy: paidBy.map(p => ({
        userId: p.userId,
        amount: Number(p.amount)
      })),
      paidByUserId: paidBy[0].userId,
      splitType,
      splitBetween: calculatedSplits,
      splits: calculatedSplits,
      groupId,
      createdBy: req.userId,
      transactions,
    };
    
    // ===== CREATE EXPENSE =====
    const expense = await Expense.create([expenseData], { session });
    
    // ===== UPDATE BALANCES =====
    await updateGroupBalancesWithTransactions(groupId, expense[0], session);
    
    await session.commitTransaction();
    
    // Populate and return
    const populatedExpense = await Expense.findById(expense[0]._id)
      .populate('paidByUserId', '_id name email imageUrl')
      .populate('paidBy.userId', '_id name email imageUrl')
      .populate('splitBetween.userId', '_id name email imageUrl')
      .populate('splits.userId', '_id name email imageUrl')
      .lean();
    
    // Emit socket event
    if (groupId) {
      req.ioEvent = {
        event: 'expense_added',
        roomId: `group:${groupId}`,
        data: populatedExpense,
      };
    }
    
    res.status(201).json({
      success: true,
      data: populatedExpense,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get expenses between two users
export const getExpensesBetweenUsers = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    
    // can't query expenses with yourself
    if (otherUserId === req.userId.toString()) {
      throw new ApiError(400, 'Cannot query expenses with yourself');
    }
    
    // get my expenses
    const myExpenses = await Expense.find({
      groupId: null,
      paidByUserId: req.userId,
    })
      .populate('paidByUserId', '_id name email imageUrl')
      .populate('splits.userId', '_id name email imageUrl')
      .lean();
    
    const theirExpenses = await Expense.find({
      groupId: null,
      paidByUserId: otherUserId,
    })
      .populate('paidByUserId', '_id name email imageUrl')
      .populate('splits.userId', '_id name email imageUrl')
      .lean();
    
    // filter to only shared expenses
    const allExpenses = [...myExpenses, ...theirExpenses];
    
    const expenses = allExpenses.filter((e) => {
      const payer = e.paidByUserId._id.toString();
      const meInSplits = e.splits.some((s) => s.userId._id.toString() === req.userId.toString());
      const themInSplits = e.splits.some((s) => s.userId._id.toString() === otherUserId);
      
      const meInvolved = payer === req.userId.toString() || meInSplits;
      const themInvolved = payer === otherUserId || themInSplits;
      
      return meInvolved && themInvolved;
    });
    
    // newest first
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // get settlements between us
    const settlements = await Settlement.find({
      groupId: null,
      $or: [
        { paidByUserId: req.userId, receivedByUserId: otherUserId },
        { paidByUserId: otherUserId, receivedByUserId: req.userId },
      ],
    })
      .populate('paidByUserId', '_id name email imageUrl')
      .populate('receivedByUserId', '_id name email imageUrl')
      .sort({ date: -1 })
      .lean();
    
    // calc balance
    const balanceData = await calculateBilateralBalance(req.userId.toString(), otherUserId);
    
    // get their info
    const otherUser = await User.findById(otherUserId)
      .select('_id name email imageUrl')
      .lean();
    
    if (!otherUser) {
      throw new ApiError(404, 'User not found');
    }
    
    res.status(200).json({
      success: true,
      data: {
        expenses,
        settlements,
        otherUser,
        balance: balanceData.balance,
        youAreOwed: balanceData.youAreOwed,
        youOwe: balanceData.youOwe,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete expense
export const deleteExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const expense = await Expense.findById(req.params.id).session(session);
    
    if (!expense) {
      throw new ApiError(404, 'Expense not found');
    }
    
    // only creator or payer can delete
    if (
      expense.createdBy.toString() !== req.userId.toString() &&
      expense.paidByUserId.toString() !== req.userId.toString()
    ) {
      throw new ApiError(403, 'You do not have permission to delete this expense');
    }
    
    // clean up related settlements
    const relatedSettlements = await Settlement.find({
      relatedExpenseIds: req.params.id,
    }).session(session);
    
    for (const settlement of relatedSettlements) {
      const updatedRelatedIds = settlement.relatedExpenseIds.filter(
        (id) => id.toString() !== req.params.id
      );
      
      if (updatedRelatedIds.length === 0) {
        await Settlement.findByIdAndDelete(settlement._id).session(session);
      } else {
        settlement.relatedExpenseIds = updatedRelatedIds;
        await settlement.save().session(session);
      }
    }
    
    // delete it
    await Expense.findByIdAndDelete(req.params.id).session(session);
    
    await session.commitTransaction();
    
    // Emit socket event
    if (expense.groupId) {
      req.ioEvent = {
        event: 'expense_deleted',
        roomId: `group:${expense.groupId}`,
        data: { expenseId: req.params.id },
      };
    }
    
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Helper: Round to 2 decimals
const round = (num) => Math.round(num * 100) / 100;

// Note: minimizeTransactions is imported from debt-optimization.service.js

// Update balances using transactions array
const updateGroupBalancesWithTransactions = async (groupId, expense, session) => {
  for (const tx of expense.transactions) {
    await Balance.findOneAndUpdate(
      {
        groupId,
        user: tx.from,
        owesTo: tx.to
      },
      {
        $inc: { amount: tx.amount }
      },
      {
        upsert: true,
        session
      }
    );
  }
};
