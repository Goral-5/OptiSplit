import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Balance from '../models/Balance.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import { calculateGroupBalances } from '../services/balance.service.js';
import { optimizeGroupSettlements } from '../services/debt-optimization.service.js';

// Create group
export const createGroup = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { name, description, members: memberIds = [] } = req.body;
    
    // need a group name
    if (!name || !name.trim()) {
      throw new ApiError(400, 'Group name is required');
    }
    
    // dedupe member IDs
    const uniqueMemberIds = [...new Set(memberIds)];
    
    // start with creator as admin
    const allMembers = [{
      userId: req.userId,
      role: 'admin',
      joinedAt: new Date(),
    }];
    
    // add other members (skip if already creator)
    for (const memberId of uniqueMemberIds) {
      if (memberId !== req.userId.toString()) {
        // make sure they exist
        const member = await User.findById(memberId).session(session);
        if (!member) {
          await session.abortTransaction();
          throw new ApiError(404, `User not found: ${memberId}`);
        }
        
        allMembers.push({
          userId: memberId,
          role: 'member',
          joinedAt: new Date(),
        });
      }
    }
    
    // need at least one other member
    if (allMembers.length < 2) {
      await session.abortTransaction();
      throw new ApiError(400, 'At least one additional member is required');
    }
    
    // create the group
    const groupData = {
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.userId,
      members: allMembers,
    };
    
    const group = await Group.create([groupData], { session });
    
    await session.commitTransaction();
    
    // populate member details for response
    const populatedGroup = await Group.findById(group[0]._id)
      .populate('members.userId', '_id name email imageUrl')
      .lean();
    
    res.status(201).json({
      success: true,
      data: populatedGroup,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get all groups for current user
export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.userId': req.userId,
    })
      .select('_id name description slug memberCount createdAt')
      .lean();
    
    // add member count and expense count
    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        const expenseCount = await Expense.countDocuments({ groupId: group._id });
        return {
          ...group,
          memberCount: group.memberCount || group.members?.length || 0,
          expenseCount,
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: enhancedGroups,
    });
  } catch (error) {
    next(error);
  }
};

// Get group by ID with full details
export const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.userId', '_id name email imageUrl')
      .lean();
    
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }
    
    // check if user is member
    const isMember = group.members.some(
      (m) => m.userId._id.toString() === req.userId.toString()
    );
    
    if (!isMember) {
      throw new ApiError(403, 'You are not a member of this group');
    }
    
    // get user's role
    const userMember = group.members.find(
      (m) => m.userId._id.toString() === req.userId.toString()
    );
    
    res.status(200).json({
      success: true,
      data: {
        ...group,
        userRole: userMember.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get group balances with pair-wise ledger
export const getGroupBalances = async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    
    // check group exists
    const group = await Group.findById(groupId).lean();
    
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
    
    // calc balances using service
    const balanceData = await calculateGroupBalances(groupId, req.userId.toString());
    
    res.status(200).json({
      success: true,
      data: {
        groupId,
        members: balanceData.members,
        expenses: balanceData.expenses,
        settlements: balanceData.settlements,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get optimized settlements for group
export const getOptimizedGroupSettlements = async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    
    // check group exists
    const group = await Group.findById(groupId).lean();
    
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
    const balanceData = await calculateGroupBalances(groupId, req.userId.toString());
    
    // optimize using greedy algorithm
    const optimization = optimizeGroupSettlements(balanceData.members);
    
    res.status(200).json({
      success: true,
      data: optimization,
    });
  } catch (error) {
    next(error);
  }
};

// Get group summary analytics
export const getGroupSummary = async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    
    // check group exists
    const group = await Group.findById(groupId).lean();
    
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
    
    // get all expenses
    const expenses = await Expense.find({ groupId }).lean();
    
    // calc totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // calc user's contribution
    const userPaid = expenses
      .filter(exp => exp.paidByUserId.toString() === req.userId.toString())
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // calc balances
    const balanceData = await calculateGroupBalances(groupId, req.userId.toString());
    
    const userBalance = balanceData.members.find(
      m => m.id.toString() === req.userId.toString()
    );
    
    const youOwe = userBalance?.owes.reduce((sum, o) => sum + o.amount, 0) || 0;
    const youAreOwed = userBalance?.owedBy.reduce((sum, ob) => sum + ob.amount, 0) || 0;
    
    res.status(200).json({
      success: true,
      data: {
        groupId,
        groupName: group.name,
        totalExpenses,
        yourPaid: userPaid,
        youOwe,
        youAreOwed,
        netBalance: youAreOwed - youOwe,
        memberCount: group.memberCount,
        expenseCount: expenses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get group expenses with balances
export const getGroupExpenses = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
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
    
    // calc balances using service
    const balanceData = await calculateGroupBalances(
      req.params.id,
      req.userId.toString()
    );
    
    // return all members with full details
    const groupMembers = group.members.map(m => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
    
    console.log('📋 Group members returned:', groupMembers.length);
    
    // format group data
    const groupData = {
      id: group._id,
      name: group.name,
      description: group.description,
      memberCount: group.members.length,
    };
    
    res.status(200).json({
      success: true,
      data: {
        group: groupData,
        members: groupMembers,
        expenses: balanceData.expenses,
        settlements: balanceData.settlements,
        balances: balanceData.members,
        userLookupMap: balanceData.userLookupMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add member to group
export const addMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }
    
    // only admins can add members
    const userMember = group.members.find(
      (m) => m.userId.toString() === req.userId.toString()
    );
    
    if (!userMember || userMember.role !== 'admin') {
      throw new ApiError(403, 'Only admins can add members');
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }
    
    // check if already a member
    const existingMember = group.members.find(
      (m) => m.userId.toString() === userId
    );
    
    if (existingMember) {
      throw new ApiError(400, 'User is already a member of this group');
    }
    
    // add them
    group.members.push({
      userId,
      role: 'member',
      joinedAt: new Date(),
    });
    
    await group.save();
    
    // notify clients
    req.ioEvent = {
      event: 'member_added',
      roomId: `group:${req.params.id}`,
      data: { groupId: req.params.id, userId },
    };
    
    res.status(200).json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from group
export const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }
    
    // admin or removing yourself
    const userMember = group.members.find(
      (m) => m.userId.toString() === req.userId.toString()
    );
    
    const isRemovingSelf = req.userId.toString() === req.params.userId;
    
    if (!userMember || (userMember.role !== 'admin' && !isRemovingSelf)) {
      throw new ApiError(403, 'Unauthorized to remove members');
    }
    
    // can't remove last admin
    const admins = group.members.filter((m) => m.role === 'admin');
    if (admins.length === 1 && admins[0].userId.toString() === req.params.userId) {
      throw new ApiError(400, 'Cannot remove the last admin');
    }
    
    // remove them
    group.members = group.members.filter(
      (m) => m.userId.toString() !== req.params.userId
    );
    
    await group.save();
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete group
export const deleteGroup = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const group = await Group.findById(req.params.id).session(session);
    
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }
    
    // only creator can delete
    if (group.createdBy.toString() !== req.userId.toString()) {
      throw new ApiError(403, 'Only the creator can delete this group');
    }
    
    // clean up expenses
    await Expense.deleteMany({ groupId: req.params.id }).session(session);
    
    // clean up settlements
    await Settlement.deleteMany({ groupId: req.params.id }).session(session);
    
    // delete group
    await Group.findByIdAndDelete(req.params.id).session(session);
    
    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
