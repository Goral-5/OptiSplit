import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import User from '../models/User.js';

// Helper function for precision rounding
const roundTo2Decimals = (value) => {
  return Math.round(value * 100) / 100;
};

// Balance Service
// calc balances on the fly instead of storing them

// calc group balances using pair-wise ledger
export const calculateGroupBalances = async (groupId, currentUserId) => {
  // grab all expenses
  const expenses = await Expense.find({ groupId }).lean();
  
  // grab all settlements
  const settlements = await Settlement.find({ groupId }).lean();
  
  // collect all member IDs from paidBy and splits
  const memberIds = new Set();
  expenses.forEach((exp) => {
    // Handle both single payer and multiple payers
    if (exp.paidBy && exp.paidBy.length > 0) {
      exp.paidBy.forEach(payer => memberIds.add(payer.userId.toString()));
    } else {
      memberIds.add(exp.paidByUserId.toString());
    }
    
    // Add split participants
    const splitsToUse = exp.splitBetween || exp.splits || [];
    splitsToUse.forEach((split) => memberIds.add(split.userId.toString()));
  });
  
  settlements.forEach((s) => {
    memberIds.add(s.paidByUserId.toString());
    memberIds.add(s.receivedByUserId.toString());
  });
  
  const memberIdsArray = Array.from(memberIds);
  
  // get member details
  const members = await User.find({ _id: { $in: memberIdsArray } })
    .select('_id name email imageUrl')
    .lean();
  
  // setup totals and ledger
  const totals = {};
  const ledger = {};
  
  memberIdsArray.forEach((id) => {
    totals[id] = 0;
    ledger[id] = {};
    memberIdsArray.forEach((otherId) => {
      if (id !== otherId) {
        ledger[id][otherId] = 0;
      }
    });
  });
  
  // Apply expenses using transactions if available
  for (const exp of expenses) {
    // Use transactions array if it exists (new format)
    if (exp.transactions && exp.transactions.length > 0) {
      for (const tx of exp.transactions) {
        const debtor = tx.from.toString();
        const creditor = tx.to.toString();
        const amount = roundTo2Decimals(tx.amount);
        
        // Update totals
        totals[creditor] += amount;
        totals[debtor] -= amount;
        
        // Record debt
        ledger[debtor][creditor] += amount;
      }
    } else {
      // Legacy format: use splits
      const payer = exp.paidByUserId.toString();
      const splitsToUse = exp.splitBetween || exp.splits || [];
      
      for (const split of splitsToUse) {
        const debtor = split.userId.toString();
        
        if (debtor === payer || split.paid) continue;
        
        const amount = roundTo2Decimals(split.amount);
        
        totals[payer] += amount;
        totals[debtor] -= amount;
        
        ledger[debtor][payer] += amount;
      }
    }
  }
  
  // apply settlements
  for (const s of settlements) {
    const payer = s.paidByUserId.toString();
    const receiver = s.receivedByUserId.toString();
    const amount = roundTo2Decimals(s.amount);
    
    totals[payer] += amount;
    totals[receiver] -= amount;
    
    ledger[payer][receiver] -= amount;
  }
  
  // net the ledger (avoid double counting)
  memberIdsArray.forEach((a) => {
    memberIdsArray.forEach((b) => {
      if (a >= b) return;
      
      const diff = ledger[a][b] - ledger[b][a];
      
      if (diff > 0) {
        ledger[a][b] = roundTo2Decimals(diff);
        ledger[b][a] = 0;
      } else if (diff < 0) {
        ledger[b][a] = roundTo2Decimals(Math.abs(diff));
        ledger[a][b] = 0;
      } else {
        ledger[a][b] = 0;
        ledger[b][a] = 0;
      }
    });
  });
  
  // build the response
  const balances = members.map((m) => {
    const memberId = m._id.toString();
    
    const owes = Object.entries(ledger[memberId])
      .filter(([, value]) => value > 0.01)
      .map(([to, amount]) => ({ to, amount: roundTo2Decimals(amount) }));
    
    const owedBy = memberIdsArray
      .filter((other) => ledger[other][memberId] > 0.01)
      .map((other) => ({ from: other, amount: roundTo2Decimals(ledger[other][memberId]) }));
    
    return {
      id: m._id,
      name: m.name,
      email: m.email,
      imageUrl: m.imageUrl,
      totalBalance: roundTo2Decimals(totals[memberId]),
      owes,
      owedBy,
    };
  });
  
  // user lookup map
  const userLookupMap = {};
  members.forEach((m) => {
    userLookupMap[m._id.toString()] = m;
  });
  
  return {
    members: balances,
    expenses,
    settlements,
    userLookupMap,
  };
};

/**
 * Calculate user balances for non-group (one-on-one) expenses
 * @param {string} currentUserId - Current user ID
 * @returns {Promise<Object>} Balance information
 */
export const calculateUserBalances = async (currentUserId) => {
  // Fetch all non-group expenses involving the user
  const expenses = await Expense.find({ groupId: null }).lean();
  
  // Filter expenses where user is involved (payer or in splits)
  const userExpenses = expenses.filter(
    (e) => {
      const payer = e.paidByUserId?.toString() || e.paidBy?.[0]?.userId?.toString();
      return (
        payer === currentUserId ||
        (e.splits || e.splitBetween || []).some((s) => s.userId.toString() === currentUserId)
      );
    }
  );
  
  let youOwe = 0;
  let youAreOwed = 0;
  const balanceByUser = {};
  
  for (const e of userExpenses) {
    const payer = e.paidByUserId?.toString() || e.paidBy?.[0]?.userId?.toString();
    const isPayer = payer === currentUserId;
    const splitsToUse = e.splitBetween || e.splits || [];
    const mySplit = splitsToUse.find((s) => s.userId.toString() === currentUserId);
    
    if (isPayer) {
      // User paid, others owe them
      for (const s of splitsToUse) {
        if (s.userId.toString() === currentUserId || s.paid) continue;
        
        const amount = roundTo2Decimals(s.amount);
        youAreOwed += amount;
        
        if (!balanceByUser[s.userId.toString()]) {
          balanceByUser[s.userId.toString()] = { owed: 0, owing: 0 };
        }
        balanceByUser[s.userId.toString()].owed += amount;
      }
    } else if (mySplit && !mySplit.paid) {
      // User owes money
      const amount = roundTo2Decimals(mySplit.amount);
      youOwe += amount;
      
      if (!balanceByUser[payer]) {
        balanceByUser[payer] = { owed: 0, owing: 0 };
      }
      balanceByUser[payer].owing += amount;
    }
  }
  
  // Apply settlements
  const settlements = await Settlement.find({ groupId: null }).lean();
  
  const userSettlements = settlements.filter(
    (s) =>
      s.paidByUserId.toString() === currentUserId ||
      s.receivedByUserId.toString() === currentUserId
  );
  
  for (const s of userSettlements) {
    if (s.paidByUserId.toString() === currentUserId) {
      const amount = roundTo2Decimals(s.amount);
      youOwe -= amount;
      if (balanceByUser[s.receivedByUserId.toString()]) {
        balanceByUser[s.receivedByUserId.toString()].owing -= amount;
      }
    } else {
      const amount = roundTo2Decimals(s.amount);
      youAreOwed -= amount;
      if (balanceByUser[s.paidByUserId.toString()]) {
        balanceByUser[s.paidByUserId.toString()].owed -= amount;
      }
    }
  }
  
  // Build lists
  const youOweList = [];
  const youAreOwedByList = [];
  
  for (const [uid, data] of Object.entries(balanceByUser)) {
    const net = roundTo2Decimals(data.owed - data.owing);
    
    if (Math.abs(net) <= 0.01) continue;
    
    const counterpart = await User.findById(uid).select('_id name email imageUrl').lean();
    
    const base = {
      userId: uid,
      name: counterpart?.name || 'Unknown',
      imageUrl: counterpart?.imageUrl,
      amount: Math.abs(net),
    };
    
    if (net > 0) {
      youAreOwedByList.push(base);
    } else {
      youOweList.push(base);
    }
  }
  
  // Sort by amount descending
  youOweList.sort((a, b) => b.amount - a.amount);
  youAreOwedByList.sort((a, b) => b.amount - a.amount);
  
  return {
    youOwe: roundTo2Decimals(youOwe),
    youAreOwed: roundTo2Decimals(youAreOwed),
    totalBalance: roundTo2Decimals(youAreOwed - youOwe),
    oweDetails: {
      youOwe: youOweList,
      youAreOwedBy: youAreOwedByList,
    },
  };
};

/**
 * Calculate bilateral balance between two users
 * @param {string} user1Id - First user ID
 * @param {string} user2Id - Second user ID
 * @returns {Promise<Object>} Balance information
 */
export const calculateBilateralBalance = async (user1Id, user2Id) => {
  // Fetch non-group expenses
  const expenses = await Expense.find({ groupId: null }).lean();
  
  // Filter expenses where both users are involved
  const relevantExpenses = expenses.filter((e) => {
    const payer = e.paidByUserId.toString();
    const involvesUser1 =
      payer === user1Id || e.splits.some((s) => s.userId.toString() === user1Id);
    const involvesUser2 =
      payer === user2Id || e.splits.some((s) => s.userId.toString() === user2Id);
    
    return involvesUser1 && involvesUser2;
  });
  
  let balance = 0; // Positive means user2 owes user1
  
  for (const e of relevantExpenses) {
    const payer = e.paidByUserId.toString();
    
    if (payer === user1Id) {
      const split = e.splits.find(
        (s) => s.userId.toString() === user2Id && !s.paid
      );
      if (split) balance += split.amount; // user2 owes user1
    } else if (payer === user2Id) {
      const split = e.splits.find(
        (s) => s.userId.toString() === user1Id && !s.paid
      );
      if (split) balance -= split.amount; // user1 owes user2
    }
  }
  
  // Apply settlements
  const settlements = await Settlement.find({
    groupId: null,
    $or: [
      { paidByUserId: user1Id, receivedByUserId: user2Id },
      { paidByUserId: user2Id, receivedByUserId: user1Id },
    ],
  }).lean();
  
  for (const s of settlements) {
    if (s.paidByUserId.toString() === user1Id) {
      balance += s.amount; // user1 paid user2 back
    } else {
      balance -= s.amount; // user2 paid user1 back
    }
  }
  
  return {
    balance,
    youAreOwed: balance > 0 ? balance : 0,
    youOwe: balance < 0 ? Math.abs(balance) : 0,
    netBalance: balance,
  };
};
