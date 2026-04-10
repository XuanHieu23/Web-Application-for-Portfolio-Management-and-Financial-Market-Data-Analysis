import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access Denied. No Token Provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    // Lấy user từ DB, nhớ lấy thêm trường 'tier'
    const user = await User.findById(decoded.id).select('tier');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid User.' });
      return;
    }

    // Gắn vào request. Lúc này TypeScript hiểu 100% nhờ file index.d.ts
    req.user = {
      id: user.id,
      tier: user.tier as 'FREE' | 'PRO'
    };

    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or Expired Token.' });
  }
};