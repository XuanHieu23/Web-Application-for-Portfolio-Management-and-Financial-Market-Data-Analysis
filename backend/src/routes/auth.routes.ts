import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, cancelPro } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @desc    Register a new user account
 * @route   POST /auth/signup
 * @access  Public
 */
router.post('/signup', register);

/**
 * @desc    Sign in and receive a JWT token
 * @route   POST /auth/login
 * @access  Public
 */
router.post('/login', login);

/**
 * @desc    Get the authenticated user's profile
 * @route   GET /auth/me
 * @access  Private
 */
router.get('/me', verifyToken, getMe);

/**
 * @desc    Update personal information (username, avatar)
 * @route   PUT /auth/profile
 * @access  Private
 */
router.put('/profile', verifyToken, updateProfile);

/**
 * @desc    Change the authenticated user's password
 * @route   PUT /auth/change-password
 * @access  Private
 */
router.put('/change-password', verifyToken, changePassword);

/**
 * @desc    Cancel PRO subscription and downgrade to FREE tier
 * @route   PUT /auth/cancel-pro
 * @access  Private
 */
router.put('/cancel-pro', verifyToken, cancelPro);

export default router;
