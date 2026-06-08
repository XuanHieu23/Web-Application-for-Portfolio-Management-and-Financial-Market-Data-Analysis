import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // ĐÃ FIX: 401 Unauthorized thay vì 403
      res.status(401).json({ success: false, message: 'Access Denied. No Token Provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    const user = await User.findById(decoded.id).select('tier');
    if (!user) {
      // ĐÃ FIX: 401 Unauthorized
      res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
      return;
    }

    req.user = {
      id: user.id,
      tier: user.tier as 'FREE' | 'PRO'
    };

    next();
  } catch (error: any) {
    // ĐÃ FIX: 401 Unauthorized và tách biệt lỗi rõ ràng hơn
    const message = error.name === 'TokenExpiredError' 
      ? 'Session expired. Please log in again.' 
      : 'Invalid Token.';
      
    res.status(401).json({ success: false, message });
  }
};