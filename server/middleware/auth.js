import { verifyToken } from '@clerk/backend';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { ApiError } from './errorHandler.js';
import User from '../models/User.js';

/**
 * Middleware to authenticate requests using Clerk JWT
 * Extracts user ID and attaches to request object
 */
export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    if (!payload) {
      throw new ApiError(401, 'Invalid token');
    }

    // Get user ID from payload
    const userId = payload.sub;
    
    if (!userId) {
      throw new ApiError(401, 'Invalid token payload');
    }

    // Find or create user in database using upsert to prevent race conditions
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // User doesn't exist, fetch details from Clerk first
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        
        // Properly extract email from Clerk OAuth (Google, etc.)
        const email =
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          clerkUser.externalAccounts?.[0]?.emailAddress ||
          null;
        
        // Extract name safely
        const name =
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
        
        // Extract image URL safely
        const imageUrl = clerkUser.imageUrl || clerkUser.profileImageUrl || null;
        
        const userData = {
          clerkId: userId,
          name,
          email,
          imageUrl,
        };
        
        // Use findOneAndUpdate with upsert to prevent race conditions
        user = await User.findOneAndUpdate(
          { clerkId: userId },
          {
            $setOnInsert: userData,
          },
          {
            upsert: true,
            new: true,
          }
        );
        
        console.log('✅ User authenticated:', user._id, user.email || '(no email)');
      } catch (clerkError) {
        console.error('Failed to fetch Clerk user details:', clerkError);
        throw new ApiError(500, 'Failed to create user profile');
      }
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      console.error('Authentication error:', error);
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public routes that need user context
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      if (payload) {
        const userId = payload.sub;
        const user = await User.findOne({ clerkId: userId });
        
        if (user) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};
