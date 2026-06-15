import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

// LẤY THÔNG TIN USER HIỆN TẠI TỪ DB (dùng để sync tier sau payment)
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

// CẬP NHẬT HỒ SƠ (username + avatar)
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { username, avatar } = req.body;

    if (!username || username.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Username must be at least 2 characters.' });
      return;
    }

    // Kiểm tra username đã được dùng bởi user khác chưa
    const existing = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Username is already taken.' });
      return;
    }

    // Giới hạn kích thước avatar base64 (~500KB)
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

// ĐỔI MẬT KHẨU
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

// HỦY GÓI PRO
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

// ĐĂNG KÝ (REGISTER)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all required fields.' });
      return;
    }

    // ĐÃ FIX: Chuẩn hóa email về chữ thường để tránh lỗi viết hoa/thường
    const normalizedEmail = email.toLowerCase();

    // 2. ĐÃ FIX: Kiểm tra xem Email HOẶC Username đã tồn tại chưa
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

    // 3. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Lưu vào Database (Lưu email chữ thường)
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

// ĐĂNG NHẬP (LOGIN)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    // ĐÃ FIX: Chuyển email người dùng nhập vào thành chữ thường để tìm kiếm
    const normalizedEmail = email.toLowerCase();

    // 1. Tìm user theo email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // 2. Chặn lỗi sập server do tài khoản cũ (Legacy Check)
    if (!user.password) {
      res.status(400).json({  
        success: false, 
        message: 'Legacy account error. Vui lòng tạo tài khoản mới do cấu trúc DB đã thay đổi!' 
      });
      return;
    }

    // 3. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    // 4. Tạo Token (Sống 7 ngày)
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' } 
    );

    // 5. Trả về thông tin
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