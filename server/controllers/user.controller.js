import { ApiError } from '../middleware/errorHandler.js';
import User from '../models/User.js';

/**
 * Get current user profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('-__v')
      .lean();
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters');
    }
    
    // Use case-insensitive regex for partial matching
    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Search for users matching name or email
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      _id: { $ne: req.userId }
    })
      .limit(10)
      .select('_id name email imageUrl')
      .lean();
    
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
