import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

/**
 * @desc    Register a new user account with hashed password
 * @route   POST /auth/signup
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all required fields.' });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }]
    });

    if (existingUser) {
      const isEmailTaken = existingUser.email === normalizedEmail;
      res.status(400).json({
        success: false,
        message: isEmailTaken ? 'Email already exists.' : 'Username is already taken.'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during registration.' });
  }
};

/**
 * @desc    Authenticate user credentials and return a signed JWT token (7d expiry)
 * @route   POST /auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'Legacy account detected. Please create a new account — the DB schema has changed.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during login.' });
  }
};

/**
 * @desc    Return the authenticated user's profile data
 * @route   GET /auth/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const user = await User.findById(userId).select('id username email tier avatar');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    res.status(200).json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, tier: user.tier, avatar: user.avatar }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update the authenticated user's username and/or avatar (base64)
 * @route   PUT /auth/profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { username, avatar } = req.body;

    if (!username || username.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Username must be at least 2 characters.' });
      return;
    }

    const existing = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Username is already taken.' });
      return;
    }

    if (avatar && avatar.length > 700_000) {
      res.status(400).json({ success: false, message: 'Avatar image is too large. Max 500KB.' });
      return;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { username: username.trim(), ...(avatar !== undefined && { avatar }) },
      { new: true }
    ).select('id username email tier avatar');

    if (!updated) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: { id: updated.id, username: updated.username, email: updated.email, tier: updated.tier, avatar: updated.avatar }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Verify current password then replace it with a new bcrypt-hashed password
 * @route   PUT /auth/change-password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Please provide current and new password.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.password) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Downgrade the authenticated user's tier from PRO to FREE
 * @route   PUT /auth/cancel-pro
 * @access  Private
 */
export const cancelPro = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    await User.findByIdAndUpdate(userId, { tier: 'FREE' });

    res.status(200).json({ success: true, message: 'PRO subscription cancelled. You are now on the FREE plan.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
