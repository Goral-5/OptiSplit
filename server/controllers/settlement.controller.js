// Create settlement
export const createSettlement = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      amount,
      note,
      paidByUserId,
      receivedByUserId,
      groupId,
      relatedExpenseIds,
    } = req.body;
    
    // check required fields
    if (!amount || !paidByUserId || !receivedByUserId) {
      throw new ApiError(400, 'Amount, payer, and receiver are required');
    }
    
    // make sure amount is positive
    if (amount <= 0) {
      throw new ApiError(400, 'Amount must be positive');
    }
    
    // can't pay yourself
    if (paidByUserId === receivedByUserId) {
      throw new ApiError(400, 'Payer and receiver cannot be the same');
    }
    
    // verify user is involved
    if (
      paidByUserId.toString() !== req.userId.toString() &&
      receivedByUserId.toString() !== req.userId.toString()
    ) {
      throw new ApiError(403, 'You must be either the payer or receiver');
    }
    
    // check group membership if groupId provided
    if (groupId) {
      const group = await Group.findById(groupId).session(session);
      
      if (!group) {
        throw new ApiError(404, 'Group not found');
      }
      
      const isPayerMember = group.members.some(
        (m) => m.userId.toString() === paidByUserId
      );
      const isReceiverMember = group.members.some(
        (m) => m.userId.toString() === receivedByUserId
      );
      
      if (!isPayerMember || !isReceiverMember) {
        throw new ApiError(403, 'Both parties must be members of the group');
      }
    }
    
    // create settlement record
    const settlementData = {
      amount: parseFloat(amount),
      note: note?.trim() || '',
      date: new Date(),
      paidByUserId,
      receivedByUserId,
      groupId: groupId || null,
      relatedExpenseIds: relatedExpenseIds || [],
      createdBy: req.userId,
    };
    
    const settlement = await Settlement.create([settlementData], { session });
    
    // reduce debt in Balance model
    if (groupId) {
      // group settlement: reduce balance between these two users
      await Balance.findOneAndUpdate(
        {
          groupId,
          user: paidByUserId,
          owesTo: receivedByUserId
        },
        {
          $inc: { amount: -parseFloat(amount) }
        },
        {
          upsert: false,
          session
        }
      );
    }
    
    // mark expenses as paid if this settlement covers them
    if (relatedExpenseIds && relatedExpenseIds.length > 0) {
      for (const expenseId of relatedExpenseIds) {
        const expense = await Expense.findById(expenseId).session(session);
        
        if (expense) {
          // Find splits involving the receiver and mark as paid
          expense.splits.forEach((split) => {
            if (
              split.userId.toString() === paidByUserId &&
              !split.paid
            ) {
              split.paid = true;
            }
          });
          
          await expense.save().session(session);
        }
      }
    }
    
    await session.commitTransaction();
    
    // notify clients
    if (groupId) {
      req.ioEvent = {
        event: 'settlement_executed',
        roomId: `group:${groupId}`,
        data: settlement[0],
      };
    }
    
    res.status(201).json({
      success: true,
      data: settlement[0],
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get settlement data for user or group
export const getSettlementData = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'user') {
      // bilateral settlement
      const balanceData = await calculateBilateralBalance(req.userId.toString(), id);
      
      const otherUser = await User.findById(id)
        .select('_id name email imageUrl')
        .lean();
      
      if (!otherUser) {
        throw new ApiError(404, 'User not found');
      }
      
      res.status(200).json({
        success: true,
        data: {
          type: 'user',
          counterpart: otherUser,
          ...balanceData,
        },
      });
    } else if (type === 'group') {
      // group settlement
      const group = await Group.findById(id)
        .populate('members.userId', '_id name email imageUrl')
        .lean();
      
      if (!group) {
        throw new ApiError(404, 'Group not found');
      }
      
      // check membership
      const isMember = group.members.some(
        (m) => m.userId._id.toString() === req.userId.toString()
      );
      
      if (!isMember) {
        throw new ApiError(403, 'You are not a member of this group');
      }
      
      // calc balances
      const balanceData = await calculateGroupBalances(id, req.userId.toString());
      
      res.status(200).json({
        success: true,
        data: {
          type: 'group',
          group: {
            id: group._id,
            name: group.name,
            description: group.description,
          },
          balances: balanceData.members,
        },
      });
    } else {
      throw new ApiError(400, 'Invalid type. Must be "user" or "group"');
    }
  } catch (error) {
    next(error);
  }
};

// Get optimized settlements using greedy algorithm
export const getOptimizedSettlements = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'user') {
      // bilateral (no optimization needed for 2 people)
      const balanceData = await calculateBilateralBalance(req.userId.toString(), id);
      
      const optimization = optimizeBilateralSettlement(
        balanceData.balance,
        req.userId.toString(),
        id
      );
      
      res.status(200).json({
        success: true,
        data: optimization,
      });
    } else if (type === 'group') {
      // group optimization using greedy algorithm
      const group = await Group.findById(id).lean();
      
      if (!group) {
        throw new ApiError(404, 'Group not found');
      }
      
      // check membership
      const isMember = group.members.some(
        (m) => m.userId.toString() === req.userId.toString()
      );
      
      if (!isMember) {
        throw new ApiError(403, 'You are not a member of this group');
      }
      
      // calc balances
      const balanceData = await calculateGroupBalances(id, req.userId.toString());
      
      // optimize
      const optimization = optimizeGroupSettlements(balanceData.members);
      
      res.status(200).json({
        success: true,
        data: optimization,
      });
    } else {
      throw new ApiError(400, 'Invalid type. Must be "user" or "group"');
    }
  } catch (error) {
    next(error);
  }
};
