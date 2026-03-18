import Group from '../models/Group.js';
import User from '../models/User.js';
import { ApiError } from './errorHandler.js';

/**
 * Middleware to validate expense creation data
 * Ensures security and prevents common edge cases
 */

export const validateExpenseCreation = async (req, res, next) => {
  try {
    const { groupId, paidBy, paidByUserId, splits, splitBetween } = req.body;
    
    // Only validate group expenses
    if (!groupId) {
      return next();
    }
    
    // 1. Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }
    
    // Extract member IDs
    const memberIds = group.members.map(m => m.userId.toString());
    
    // 2. Verify current user is a member of the group
    const isCurrentUserMember = memberIds.includes(req.userId.toString());
    if (!isCurrentUserMember) {
      throw new ApiError(403, 'You must be a member of this group to add expenses');
    }
    
    // 3. Validate paidBy users (if provided)
    if (paidBy && Array.isArray(paidBy)) {
      for (const payer of paidBy) {
        if (!payer.userId) {
          throw new ApiError(400, 'All payers must have a userId');
        }
        
        if (!memberIds.includes(payer.userId.toString())) {
          throw new ApiError(403, `Payer is not a member of this group`);
        }
        
        if (typeof payer.amount !== 'number' || payer.amount < 0) {
          throw new ApiError(400, 'Payment amounts must be non-negative numbers');
        }
      }
      
      // Check for duplicate payers
      const payerIds = paidBy.map(p => p.userId.toString());
      if (new Set(payerIds).size !== payerIds.length) {
        throw new ApiError(400, 'Duplicate payers are not allowed');
      }
    } else if (paidByUserId) {
      // Legacy single payer validation
      if (!memberIds.includes(paidByUserId.toString())) {
        throw new ApiError(403, 'Payer must be a member of this group');
      }
    }
    
    // 4. Validate splits/splitBetween participants
    const participantsToValidate = splitBetween || splits || [];
    
    if (participantsToValidate.length === 0) {
      throw new ApiError(400, 'At least one participant is required');
    }
    
    const participantIds = participantsToValidate.map(p => p.userId?.toString() || p.userId);
    
    // Check for duplicate participants
    if (new Set(participantIds).size !== participantIds.length) {
      throw new ApiError(400, 'Duplicate participants are not allowed in splits');
    }
    
    // Verify all participants are group members
    for (const participantId of participantIds) {
      if (!memberIds.includes(participantId)) {
        throw new ApiError(403, `Participant ${participantId} is not a member of this group`);
      }
    }
    
    // 5. Validate amounts are positive numbers
    for (const split of participantsToValidate) {
      if (split.amount !== undefined) {
        if (typeof split.amount !== 'number' || split.amount < 0) {
          throw new ApiError(400, 'Split amounts must be non-negative numbers');
        }
      }
      
      if (split.percentage !== undefined) {
        if (typeof split.percentage !== 'number' || split.percentage < 0 || split.percentage > 100) {
          throw new ApiError(400, 'Percentages must be between 0 and 100');
        }
      }
      
      if (split.share !== undefined) {
        if (typeof split.share !== 'number' || split.share < 0) {
          throw new ApiError(400, 'Shares must be non-negative numbers');
        }
      }
    }
    
    // All validations passed
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Sanitize expense input data
 * Removes potentially dangerous or invalid fields
 */
export const sanitizeExpenseData = (req, res, next) => {
  if (req.body.description) {
    req.body.description = req.body.description.trim();
  }
  
  if (req.body.category) {
    req.body.category = req.body.category.trim();
  }
  
  // Ensure amount is a valid number string before parsing
  if (req.body.amount) {
    const parsedAmount = parseFloat(req.body.amount);
    if (isNaN(parsedAmount)) {
      throw new ApiError(400, 'Amount must be a valid number');
    }
    req.body.amount = parsedAmount;
  }
  
  // Sanitize date
  if (req.body.date) {
    const dateObj = new Date(req.body.date);
    if (isNaN(dateObj.getTime())) {
      throw new ApiError(400, 'Invalid date format');
    }
    req.body.date = dateObj.toISOString();
  }
  
  next();
};
