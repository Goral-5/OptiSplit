// Debt Optimization Service
// greedy algorithm to minimize transactions

import { roundTo2Decimals } from './expense-split.service.js';

// minimize transactions using greedy algorithm
export const minimizeTransactions = (balances) => {
  // Convert balance object to arrays if needed
  let creditors = [];
  let debtors = [];
  
  // Handle both object and array inputs
  if (typeof balances === 'object' && !Array.isArray(balances)) {
    // Object format: { userId: amount }
    for (const [userId, amount] of Object.entries(balances)) {
      if (amount > 0.01) {
        creditors.push({ user: userId, amount: roundTo2Decimals(amount) });
      } else if (amount < -0.01) {
        debtors.push({ user: userId, amount: roundTo2Decimals(Math.abs(amount)) });
      }
    }
  }
  
  // sort by amount (highest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  // greedy matching
  const transactions = [];
  let i = 0; // creditor index
  let j = 0; // debtor index
  
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    
    // settle the smaller amount
    const settlement = Math.min(credit.amount, debt.amount);
    
    // debtor pays creditor
    transactions.push({
      from: debt.user,
      to: credit.user,
      amount: roundTo2Decimals(settlement),
    });
    
    // update what's left
    credit.amount = roundTo2Decimals(credit.amount - settlement);
    debt.amount = roundTo2Decimals(debt.amount - settlement);
    
    // move to next when settled
    if (credit.amount <= 0.01) {
      i++;
    }
    
    if (debt.amount <= 0.01) {
      j++;
    }
  }
  
  return transactions;
};

// calc optimized settlements for group
export const optimizeGroupSettlements = (balances) => {
  // get net balances
  const netBalances = {};
  
  balances.forEach((balance) => {
    netBalances[balance.id] = balance.totalBalance;
  });
  
  // run optimizer
  const optimizedTransactions = minimizeTransactions(netBalances);
  
  // count original transactions
  const originalTransactions = [];
  
  balances.forEach((balance) => {
    balance.owes.forEach((owe) => {
      originalTransactions.push({
        from: balance.id,
        to: owe.to,
        amount: owe.amount,
      });
    });
  });
  
  // calc how much we reduced
  const originalCount = originalTransactions.length;
  const optimizedCount = optimizedTransactions.length;
  const reduction = originalCount > 0 
    ? ((originalCount - optimizedCount) / originalCount) * 100 
    : 0;
  
  return {
    originalTransactions,
    optimizedTransactions,
    reduction: {
      count: originalCount - optimizedCount,
      percentage: parseFloat(reduction.toFixed(2)),
    },
    summary: {
      totalDebtors: Object.values(netBalances).filter((b) => b < -0.01).length,
      totalCreditors: Object.values(netBalances).filter((b) => b > 0.01).length,
      totalAmount: optimizedTransactions.reduce((sum, t) => sum + t.amount, 0),
    },
  };
};

/**
 * Calculate optimized settlements between two users
 * @param {number} balance - Net balance (positive means user2 owes user1)
 * @param {string} user1Id - First user ID
 * @param {string} user2Id - Second user ID
 * @returns {Object} Settlement recommendation
 */
export const optimizeBilateralSettlement = (balance, user1Id, user2Id) => {
  if (Math.abs(balance) <= 0.01) {
    return {
      originalTransactions: [],
      optimizedTransactions: [],
      reduction: {
        count: 0,
        percentage: 0,
      },
      recommendation: null,
    };
  }
  
  const originalTransactions = [{
    from: balance > 0 ? user2Id : user1Id,
    to: balance > 0 ? user1Id : user2Id,
    amount: Math.abs(balance),
  }];
  
  // For bilateral case, optimization doesn't change anything
  const optimizedTransactions = originalTransactions;
  
  return {
    originalTransactions,
    optimizedTransactions,
    reduction: {
      count: 0,
      percentage: 0,
    },
    recommendation: {
      from: balance > 0 ? user2Id : user1Id,
      to: balance > 0 ? user1Id : user2Id,
      amount: Math.abs(balance),
    },
  };
};

/**
 * Compute optimal debt paths for an expense (NEW)
 * @param {Array} paidBy - Array of {userId, amount}
 * @param {Array} splitBetween - Array of {userId, amount}
 * @returns {Array} Optimized transactions
 */
export const computeOptimalDebtPaths = (paidBy, splitBetween) => {
  // Calculate net balance for each user
  const balanceMap = {};
  
  // Add what each person paid
  for (const payer of paidBy) {
    const userId = payer.userId.toString();
    balanceMap[userId] = (balanceMap[userId] || 0) + roundTo2Decimals(payer.amount);
  }
  
  // Subtract what each person owes
  for (const split of splitBetween) {
    const userId = split.userId.toString();
    balanceMap[userId] = (balanceMap[userId] || 0) - roundTo2Decimals(split.amount);
  }
  
  // Use greedy algorithm to minimize transactions
  return minimizeTransactions(balanceMap);
};

/**
 * Get settlement statistics
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Statistics about the transactions
 */
export const getSettlementStats = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalAmount: 0,
      averageAmount: 0,
      maxAmount: 0,
      minAmount: 0,
    };
  }
  
  const amounts = transactions.map((t) => t.amount);
  const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
  
  return {
    totalTransactions: transactions.length,
    totalAmount: roundTo2Decimals(totalAmount),
    averageAmount: roundTo2Decimals(totalAmount / transactions.length),
    maxAmount: Math.max(...amounts),
    minAmount: Math.min(...amounts),
  };
};
