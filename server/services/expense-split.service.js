/**
 * Expense Split Service - Production Grade
 * Calculates how to split expenses with precision handling for all split types
 */

/**
 * Round to 2 decimal places with proper precision
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export const roundTo2Decimals = (value) => {
  return Math.round(value * 100) / 100;
};

/**
 * Handle remainder from division by assigning to last participant
 * @param {Array} splits - Array of split objects
 * @param {number} totalAmount - Original total amount
 * @returns {Array} Adjusted splits
 */
export const handleRemainder = (splits, totalAmount) => {
  if (splits.length === 0) return splits;
  
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  const remainder = roundTo2Decimals(totalAmount - sum);
  
  // Assign remainder to last split (could be positive or negative)
  if (Math.abs(remainder) > 0.001) {
    splits[splits.length - 1].amount = roundTo2Decimals(
      splits[splits.length - 1].amount + remainder
    );
  }
  
  return splits;
};

/**
 * Validate that sum matches expected amount within tolerance
 * @param {Array} splits - Array of splits with amount field
 * @param {number} expected - Expected total
 * @param {number} tolerance - Acceptable difference (default 0.01)
 * @returns {boolean} True if valid
 */
export const validateSum = (splits, expected, tolerance = 0.01) => {
  const total = splits.reduce((sum, split) => sum + split.amount, 0);
  return Math.abs(roundTo2Decimals(total) - roundTo2Decimals(expected)) <= tolerance;
};

/**
 * Detect duplicate users in array
 * @param {Array} items - Array of objects with userId
 * @returns {boolean} True if duplicates found
 */
export const hasDuplicateUsers = (items) => {
  const userIds = items.map(item => item.userId?.toString() || item.userId);
  return new Set(userIds).size !== userIds.length;
};

/**
 * Calculate equal split with precision handling
 * @param {number} totalAmount - Total expense amount
 * @param {Array} participants - Array of participant user IDs
 * @returns {Array} Array of splits with userId and amount
 */
export const calculateEqualSplit = (totalAmount, participants) => {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }
  
  const amountPerPerson = totalAmount / participants.length;
  const splits = participants.map((userId) => ({
    userId,
    amount: roundTo2Decimals(amountPerPerson),
    paid: false,
    share: 1,
  }));
  
  // Handle remainder from rounding
  return handleRemainder(splits, totalAmount);
};

/**
 * Calculate exact split (user-specified amounts)
 * @param {number} totalAmount - Total expense amount
 * @param {Object} amountsMap - Map of userId -> amount
 * @returns {Array} Array of splits
 */
export const calculateExactSplit = (totalAmount, amountsMap) => {
  if (!amountsMap || Object.keys(amountsMap).length === 0) {
    throw new Error('Amounts must be provided for each participant');
  }
  
  const splits = Object.entries(amountsMap).map(([userId, amount]) => ({
    userId,
    amount: roundTo2Decimals(amount),
    paid: false,
    share: 1,
  }));
  
  // Validate total
  if (!validateSum(splits, totalAmount)) {
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    throw new Error(
      `Exact amounts must add up to total. Current: ₹${roundTo2Decimals(total).toFixed(2)}, Expected: ₹${roundTo2Decimals(totalAmount).toFixed(2)}`
    );
  }
  
  return splits;
};

/**
 * Calculate percentage split
 * @param {number} totalAmount - Total expense amount
 * @param {Object} percentagesMap - Map of userId -> percentage
 * @returns {Array} Array of splits
 */
export const calculatePercentageSplit = (totalAmount, percentagesMap) => {
  if (!percentagesMap || Object.keys(percentagesMap).length === 0) {
    throw new Error('Percentages must be provided for each participant');
  }
  
  // Validate percentages sum to 100
  const totalPercentage = Object.values(percentagesMap).reduce(
    (sum, pct) => sum + Number(pct),
    0
  );
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(
      `Percentages must add up to 100% (current: ${totalPercentage.toFixed(2)}%)`
    );
  }
  
  const splits = Object.entries(percentagesMap).map(([userId, percentage]) => {
    const amount = (totalAmount * percentage) / 100;
    return {
      userId,
      amount: roundTo2Decimals(amount),
      paid: false,
      share: 1,
    };
  });
  
  // Handle remainder
  return handleRemainder(splits, totalAmount);
};

/**
 * Calculate shares/weights split (NEW)
 * @param {number} totalAmount - Total expense amount
 * @param {Object} sharesMap - Map of userId -> number of shares
 * @returns {Array} Array of splits
 */
export const calculateSharesSplit = (totalAmount, sharesMap) => {
  if (!sharesMap || Object.keys(sharesMap).length === 0) {
    throw new Error('Shares must be provided for each participant');
  }
  
  // Calculate total shares
  const totalShares = Object.values(sharesMap).reduce(
    (sum, shares) => sum + Number(shares),
    0
  );
  
  if (totalShares <= 0) {
    throw new Error('Total shares must be greater than zero');
  }
  
  // Calculate amount per share
  const amountPerShare = totalAmount / totalShares;
  
  const splits = Object.entries(sharesMap).map(([userId, shares]) => {
    const amount = amountPerShare * shares;
    return {
      userId,
      amount: roundTo2Decimals(amount),
      paid: false,
      share: Number(shares),
    };
  });
  
  // Handle remainder
  return handleRemainder(splits, totalAmount);
};

/**
 * Calculate split for multiple payers
 * @param {number} totalAmount - Total expense amount
 * @param {Array} paidByData - Array of {userId, amount}
 * @returns {Object} Validation result
 */
export const validateMultiplePayers = (totalAmount, paidByData) => {
  if (!paidByData || !Array.isArray(paidByData) || paidByData.length === 0) {
    throw new Error('At least one payer is required');
  }
  
  const totalPaid = paidByData.reduce(
    (sum, payer) => sum + roundTo2Decimals(payer.amount),
    0
  );
  
  if (!validateSum(paidByData, totalAmount)) {
    throw new Error(
      `Total paid must equal expense amount. Paid: ₹${roundTo2Decimals(totalPaid).toFixed(2)}, Expense: ₹${roundTo2Decimals(totalAmount).toFixed(2)}`
    );
  }
  
  // Check for negative amounts
  for (const payer of paidByData) {
    if (payer.amount < 0) {
      throw new Error('Payment amounts cannot be negative');
    }
  }
  
  return true;
};

/**
 * Main split calculation function (unified interface)
 * @param {number} totalAmount - Total expense amount
 * @param {string} splitType - Type of split
 * @param {Array} participants - Array of participant user IDs
 * @param {Object} metadata - Additional data for splits
 * @returns {Array} Array of splits
 */
export const calculateSplits = (totalAmount, splitType, participants, metadata = {}) => {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }
  
  // Check for duplicate participants
  const uniqueParticipants = [...new Set(participants)];
  if (uniqueParticipants.length !== participants.length) {
    throw new Error('Duplicate participants are not allowed');
  }
  
  switch (splitType) {
    case 'equal':
      return calculateEqualSplit(totalAmount, participants);
      
    case 'percentage':
      return calculatePercentageSplit(totalAmount, metadata.percentages || {});
      
    case 'exact':
      return calculateExactSplit(totalAmount, metadata.amounts || {});
      
    case 'shares':
      return calculateSharesSplit(totalAmount, metadata.shares || {});
      
    default:
      throw new Error(`Invalid split type: ${splitType}. Must be 'equal', 'percentage', 'exact', or 'shares'`);
  }
};

/**
 * Comprehensive validation for split data
 * @param {Object} expense - Expense data
 * @param {Array} splits - Array of splits
 * @param {Array} groupMembers - Array of group member IDs (for membership validation)
 * @returns {boolean} True if valid
 */
export const validateSplitData = (expense, splits, groupMembers = []) => {
  // Basic checks
  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    throw new Error('Splits must contain at least one participant');
  }
  
  // Check for duplicate users
  if (hasDuplicateUsers(splits)) {
    throw new Error('Duplicate participants are not allowed in splits');
  }
  
  // Validate each split
  for (const split of splits) {
    if (!split.userId) {
      throw new Error('All splits must have a userId');
    }
    
    if (typeof split.amount !== 'number' || split.amount < 0) {
      throw new Error('Split amounts must be non-negative numbers');
    }
    
    // Verify user is in group (if group members provided)
    if (groupMembers.length > 0 && !groupMembers.includes(split.userId.toString())) {
      throw new Error(`User ${split.userId} is not a member of this group`);
    }
  }
  
  // Validate sum
  if (!validateSum(splits, expense.amount)) {
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    throw new Error(
      `Split amounts must add up to the total expense amount. Split total: ₹${roundTo2Decimals(totalSplitAmount).toFixed(2)}, Expense: ₹${roundTo2Decimals(expense.amount).toFixed(2)}`
    );
  }
  
  // For single payer, ensure they're in splits
  if (expense.paidByUserId && splits.length === 1) {
    const payerInSplits = splits.some((split) => split.userId.toString() === expense.paidByUserId.toString());
    if (!payerInSplits) {
      throw new Error('The person who paid must be included in the splits');
    }
  }
  
  return true;
};

/**
 * Validate multiple payers data
 * @param {Object} expense - Expense data
 * @param {Array} paidBy - Array of {userId, amount}
 * @param {Array} groupMembers - Array of group member IDs
 * @returns {boolean} True if valid
 */
export const validateMultiplePayersData = (expense, paidBy, groupMembers = []) => {
  if (!paidBy || !Array.isArray(paidBy) || paidBy.length === 0) {
    throw new Error('At least one payer is required');
  }
  
  // Check for duplicate payers
  if (hasDuplicateUsers(paidBy)) {
    throw new Error('Duplicate payers are not allowed');
  }
  
  // Validate each payer
  for (const payer of paidBy) {
    if (!payer.userId) {
      throw new Error('All payers must have a userId');
    }
    
    if (typeof payer.amount !== 'number' || payer.amount < 0) {
      throw new Error('Payment amounts must be non-negative numbers');
    }
    
    // Verify payer is in group
    if (groupMembers.length > 0 && !groupMembers.includes(payer.userId.toString())) {
      throw new Error(`Payer ${payer.userId} is not a member of this group`);
    }
  }
  
  // Validate total paid equals expense amount
  return validateMultiplePayers(expense.amount, paidBy);
};
