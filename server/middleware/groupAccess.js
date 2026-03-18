import { ApiError } from './errorHandler.js';
import Group from '../models/Group.js';

/**
 * Middleware to verify user is a member of the group
 * Must be used after authenticateUser middleware
 */
export const verifyGroupMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return next(new ApiError(404, 'Group not found'));
    }
    
    // Check if user is a member
    const isMember = group.members.some(
      (m) => m.userId.toString() === req.userId.toString()
    );
    
    if (!isMember) {
      return next(new ApiError(403, 'You are not a member of this group'));
    }
    
    // Attach group to request for later use
    req.group = group;
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      console.error('Group access verification error:', error);
      next(new ApiError(500, 'Failed to verify group access'));
    }
  }
};
