import express from 'express';
import { getUserProfile, searchUsers } from '../controllers/user.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateUser);

// Get current user profile
router.get('/me', getUserProfile);

// Search users
router.get('/search', searchUsers);

export default router;
